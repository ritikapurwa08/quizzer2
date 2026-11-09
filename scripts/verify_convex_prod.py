import subprocess
import json

cmd = ['npx', 'convex', 'run', 'testSets:listByTopic', '{"topicId": "kh7evyak3fnbezm6w44661vbyx8ekmdw"}', '--prod']
res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
data = json.loads(res.stdout.strip())
print('Convex Prod Sets Count for Topic 2:', len(data))
print('First set:', data[0]['name'], data[0]['_id'])
print('Last set:', data[-1]['name'], data[-1]['_id'])
