const fs = require('fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
fs.writeFileSync(process.argv[2] + '.pretty.txt', raw.replace(/></g, '>\n<'), 'utf8');
console.log('written');
