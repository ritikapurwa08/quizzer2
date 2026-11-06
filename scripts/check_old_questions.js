const { execSync } = require('child_process');

// Tree hash of topics in c69617e
const treeHash = 'a0d88402740e1b0ab8983b74140c49b19ac86ae0';
const filesOutput = execSync(`git ls-tree ${treeHash}`).toString();
const lines = filesOutput.split('\n').filter(Boolean);

console.log(`Found ${lines.length} files in old topics tree.`);

const targetIds = ['rg_013052', 'rg_004947', 'rg_004948', 'rg_004955', 'rg_004956', 'rg_012043'];

for (const line of lines) {
  const parts = line.split(/\s+/);
  const blobHash = parts[2];
  const fileName = parts.slice(3).join(' ');

  const content = execSync(`git cat-file -p ${blobHash}`).toString();
  const data = JSON.parse(content);
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (targetIds.includes(q.id)) {
      console.log(`\nFound in ${fileName}: ID=${q.id}`);
      console.log('Old Type:', q.type);
      console.log('Old Answer:', q.answer);
      console.log('Old Options:', q.options);
      console.log('Old Meta:', q.meta);
      console.log('Old Question/Text:', (q.questionText || q.question || '').slice(0, 100));
    }
  });
}

