const { execSync } = require('child_process');

const treeHash = 'a0d88402740e1b0ab8983b74140c49b19ac86ae0';
const filesOutput = execSync(`git ls-tree ${treeHash}`).toString();
const topic3Line = filesOutput.split('\n').find(l => l.includes('जलवायु'));

if (topic3Line) {
  const blobHash = topic3Line.split(/\s+/)[2];
  const content = execSync(`git cat-file -p ${blobHash}`, { maxBuffer: 10 * 1024 * 1024 }).toString();
  const data = JSON.parse(content);
  const qList = Array.isArray(data) ? data : data.questions || [];
  ['rg_000356', 'rg_000416', 'rg_000430'].forEach(id => {
    const q = qList.find(x => x.id === id);
    if (q) {
      console.log(`\n=== ID ${id} in c69617e ===`);
      console.log('Answer:', q.answer);
      console.log('Options:', q.options);
      console.log('Question:', q.question || q.questionText);
    }
  });
}

