const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
for (const d of fs.readdirSync(ROOT).filter(x => fs.statSync(path.join(ROOT, x)).isDirectory() && /^\d/.test(x))) {
  for (const f of fs.readdirSync(path.join(ROOT, d)).filter(x => x.endsWith('.xml'))) {
    const raw = fs.readFileSync(path.join(ROOT, d, f), 'utf8');
    const refs = [...raw.matchAll(/<mxCell id="[^"]+" value="ref"/g)].length;
    const labels = [...raw.matchAll(/<mxCell id="[^"]+" value="(\d+\.1\. Verify jwt)"/g)].map(m => m[1]);
    const hasJwtLifeline = raw.includes(':JwtService');
    console.log(`${d}/${f}: refs=${refs} [${labels.join(', ')}]${hasJwtLifeline ? ' :JwtService' : ''}`);
  }
}
