import urllib.request
import urllib.error
import json
import time
import threading
import random

class GroqKeyManager:
    def __init__(self, keys=None, max_concurrent_per_key=1, inter_request_delay=0.20):
        if keys is None:
            keys = self.load_keys_from_env()
        self.keys = keys
        self.max_concurrent_per_key = max_concurrent_per_key
        self.inter_request_delay = inter_request_delay
        self.lock = threading.Lock()
        self.last_dispatch_time = 0.0

        # State tracking per key: key -> dict
        self.key_state = {}
        for k in self.keys:
            self.key_state[k] = {
                "active_requests": 0,
                "cooldown_until": 0.0,
                "remaining_tokens": None,
                "remaining_requests": None,
                "total_calls": 0,
                "total_errors": 0
            }
        print(f"[GroqKeyManager] Initialized with {len(self.keys)} keys. Inter-request pacing: {self.inter_request_delay*1000:.0f}ms.")

    @staticmethod
    def load_keys_from_env():
        keys = []
        try:
            with open('.env.local', 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('GROQ_API_KEYS='):
                        keys = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
                        break
        except Exception:
            pass
        return keys

    def acquire_available_key(self, timeout=60.0):
        """Finds a key that is not in cooldown and has concurrency < max_concurrent_per_key."""
        start = time.time()
        while time.time() - start < timeout:
            with self.lock:
                now = time.time()
                # Enforce pacing between sequential dispatches
                time_since_last = now - self.last_dispatch_time
                if time_since_last < self.inter_request_delay:
                    time.sleep(self.inter_request_delay - time_since_last)
                    now = time.time()

                # Find candidate key
                for k in self.keys:
                    state = self.key_state[k]
                    # Check cooldown
                    if now < state["cooldown_until"]:
                        continue
                    # Check remaining tokens threshold (< 15% remaining -> cooldown)
                    if state["remaining_tokens"] is not None and state["remaining_tokens"] < 150:
                        print(f"⚠️ Key {k[:12]}... tokens low ({state['remaining_tokens']}), entering cooling state.")
                        state["cooldown_until"] = now + 45.0
                        continue
                    # Check concurrency
                    if state["active_requests"] < self.max_concurrent_per_key:
                        state["active_requests"] += 1
                        self.last_dispatch_time = time.time()
                        return k

            # All keys busy or in cooldown, wait with small jitter
            time.sleep(0.5 + random.uniform(0.1, 0.4))

        raise TimeoutError("All Groq API keys are currently in cooldown or maxed out.")

    def release_key(self, key, headers=None, status_code=200, is_rate_limited=False, retry_after=None):
        with self.lock:
            now = time.time()
            state = self.key_state[key]
            state["active_requests"] = max(0, state["active_requests"] - 1)
            state["total_calls"] += 1

            if is_rate_limited or status_code == 429:
                state["total_errors"] += 1
                # 60s cooldown or retry-after header + jitter
                cool_duration = float(retry_after) if retry_after else 60.0
                cool_duration += random.uniform(1.0, 5.0)
                state["cooldown_until"] = now + cool_duration
                print(f"🚫 [429 RateLimit] Key {key[:12]}... put into cooldown for {cool_duration:.1f}s.")
            elif headers:
                # Parse x-ratelimit headers
                for h, val in headers.items():
                    hl = h.lower()
                    if hl == 'x-ratelimit-remaining-tokens':
                        try: state["remaining_tokens"] = int(val)
                        except: pass
                    elif hl == 'x-ratelimit-remaining-requests':
                        try: state["remaining_requests"] = int(val)
                        except: pass

    def chat_completion(self, messages, model="qwen/qwen3.8-27b", temperature=0.0, max_tokens=1000, response_format=None, max_retries=4):
        """Execute completion with automated round-robin, pacing, header reading, and cooling."""
        payload_dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if response_format:
            payload_dict["response_format"] = response_format

        data = json.dumps(payload_dict).encode('utf-8')
        base_delay = 1.5

        for attempt in range(max_retries):
            key = self.acquire_available_key()
            req = urllib.request.Request(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Groq-Client/1.0'
                },
                data=data
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    headers = dict(resp.headers)
                    body = json.loads(resp.read().decode('utf-8'))
                    self.release_key(key, headers=headers, status_code=200)
                    return body
            except urllib.error.HTTPError as e:
                headers = dict(e.headers)
                retry_after = headers.get('retry-after')
                if e.code == 429:
                    self.release_key(key, headers=headers, status_code=429, is_rate_limited=True, retry_after=retry_after)
                    # Backoff with jitter before retrying on another key
                    wait_time = float(retry_after) if retry_after else (base_delay * (2 ** attempt))
                    wait_time += random.uniform(0.2, 0.8)
                    time.sleep(wait_time)
                else:
                    self.release_key(key, headers=headers, status_code=e.code)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(base_delay * (attempt + 1))
            except Exception as e:
                self.release_key(key, status_code=500)
                if attempt == max_retries - 1:
                    raise e
                time.sleep(base_delay * (attempt + 1))

        raise RuntimeError("Chat completion failed after maximum retries.")

# Global singleton
_manager_instance = None
def get_groq_manager():
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = GroqKeyManager()
    return _manager_instance
