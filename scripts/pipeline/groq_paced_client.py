import urllib.request
import urllib.error
import json
import time
import threading
import random
import uuid
import re

def parse_groq_wait_time(err_body):
    """Extracts exact wait time in seconds from Groq's error message (e.g. '2m44.16s' or '16.4s')."""
    m = re.search(r'Please try again in (?:(\d+)m)?(\d+(?:\.\d+)?)s', err_body)
    if m:
        mins = float(m.group(1)) if m.group(1) else 0.0
        secs = float(m.group(2))
        return mins * 60.0 + secs
    return None

# Diverse modern User-Agents for request diversification
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
]

LANGUAGES = [
    "hi,en-US;q=0.9,en;q=0.8",
    "en-US,en;q=0.9,hi;q=0.8",
    "en-IN,en;q=0.9,hi;q=0.8",
    "hi-IN,hi;q=0.9,en;q=0.8",
    "en-GB,en;q=0.9,hi;q=0.7",
]

class GroqKeyManager:
    def __init__(self, keys=None, min_interval_per_key=5.2):
        if keys is None:
            keys = self.load_keys_from_env()
        self.keys = keys
        # 5.2s interval per key ensures ~11.5 requests/min per key
        # ~11.5 req * 650 tokens = ~7,475 TPM, strictly under the 8,000 TPM limit!
        # With 15 keys, 15 / 5.2 = ~2.88 requests/second aggregate!
        self.min_interval_per_key = min_interval_per_key
        self.lock = threading.Lock()
        self.rr_cursor = 0

        # State tracking per key
        self.key_state = {}
        for k in self.keys:
            self.key_state[k] = {
                "active_requests": 0,
                "cooldown_until": 0.0,
                "last_used_time": 0.0,
                "total_calls": 0,
                "total_errors": 0
            }
        print(f"[GroqKeyManager] Initialized with {len(self.keys)} keys. Per-key pacing: {self.min_interval_per_key:.1f}s (~{len(self.keys)/self.min_interval_per_key:.1f} req/s aggregate).")

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

    def acquire_available_key(self, timeout=300.0):
        """Finds a key that is eligible (not in cooldown, active_requests == 0, and min_interval passed)."""
        start = time.time()
        while time.time() - start < timeout:
            chosen_key = None
            min_wait_needed = 999.0

            with self.lock:
                now = time.time()
                num_keys = len(self.keys)
                for i in range(num_keys):
                    idx = (self.rr_cursor + i) % num_keys
                    k = self.keys[idx]
                    state = self.key_state[k]

                    # Concurrency check
                    if state["active_requests"] > 0:
                        continue

                    # Cooldown check
                    if now < state["cooldown_until"]:
                        wait = state["cooldown_until"] - now
                        if wait < min_wait_needed:
                            min_wait_needed = wait
                        continue

                    # Rate pace check
                    time_since_used = now - state["last_used_time"]
                    if time_since_used < self.min_interval_per_key:
                        wait = self.min_interval_per_key - time_since_used
                        if wait < min_wait_needed:
                            min_wait_needed = wait
                        continue

                    # Key is ready!
                    state["active_requests"] = 1
                    state["last_used_time"] = now
                    self.rr_cursor = (idx + 1) % num_keys
                    chosen_key = k
                    break

            if chosen_key:
                return chosen_key

            # Sleep the minimum necessary wait time (with small jitter)
            sleep_duration = max(0.1, min(min_wait_needed + random.uniform(0.1, 0.3), 5.0))
            time.sleep(sleep_duration)

        raise TimeoutError("All Groq API keys are currently in cooldown or active.")

    def release_key(self, key, is_rate_limited=False, retry_after=None):
        with self.lock:
            now = time.time()
            state = self.key_state[key]
            state["active_requests"] = 0
            state["total_calls"] += 1

            if is_rate_limited:
                state["total_errors"] += 1
                # Respect actual wait time to guarantee keys never get blocked
                raw_cool = float(retry_after) if retry_after else 15.0
                cool_duration = max(3.0, raw_cool) + random.uniform(0.5, 1.5)
                state["cooldown_until"] = now + cool_duration
                print(f"⏳ [Cooldown] Key {key[:12]}... resting safely for {cool_duration:.1f}s.")

    def chat_completion(self, messages, model="qwen/qwen3.8-27b", temperature=0.1, max_tokens=320, max_retries=45):
        """Execute completion with automated round-robin, pacing, header rotation, and zero-stall cooling."""
        payload_dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        data = json.dumps(payload_dict).encode('utf-8')

        for attempt in range(max_retries):
            key = self.acquire_available_key(timeout=300.0)
            
            # Randomized realistic browser headers
            ua = random.choice(USER_AGENTS)
            lang = random.choice(LANGUAGES)
            req_id = uuid.uuid4().hex
            
            req = urllib.request.Request(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json',
                    'User-Agent': ua,
                    'Accept-Language': lang,
                    'X-Request-ID': req_id,
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                data=data
            )
            try:
                with urllib.request.urlopen(req, timeout=25) as resp:
                    body = json.loads(resp.read().decode('utf-8'))
                    self.release_key(key, is_rate_limited=False)
                    return body
            except urllib.error.HTTPError as e:
                headers = dict(e.headers)
                retry_after = headers.get('retry-after')
                if e.code == 429:
                    err_body = e.read().decode('utf-8', errors='ignore')
                    parsed_wait = parse_groq_wait_time(err_body)
                    wait_sec = parsed_wait if parsed_wait else (float(retry_after) if retry_after else 15.0)
                    self.release_key(key, is_rate_limited=True, retry_after=wait_sec)
                    time.sleep(0.05 + random.uniform(0.01, 0.05))
                else:
                    self.release_key(key, is_rate_limited=False)
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(0.2 * (attempt + 1))
            except Exception as e:
                self.release_key(key, is_rate_limited=False)
                if attempt == max_retries - 1:
                    raise e
                time.sleep(0.2 * (attempt + 1))

        raise RuntimeError("Chat completion failed after maximum retries across all keys.")

_manager_instance = None
def get_groq_manager():
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = GroqKeyManager()
    return _manager_instance
