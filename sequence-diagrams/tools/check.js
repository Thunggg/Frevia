/** Pretty-print + validate một file mxGraphModel để soát lỗi */
const fs = require('fs');

const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');

// Pretty print
fs.writeFileSync(file + '.pretty.txt', raw.replace(/></g, '>\n<'), 'utf8');

const errors = [];

// Lấy toàn bộ phần tử mxCell (từ <mxCell ...> đến </mxCell> hoặc tự đóng)
const cells = [];
const re = /<mxCell\b[^>]*?(?:\/>|>[\s\S]*?<\/mxCell>)/g;
let m;
while ((m = re.exec(raw))) cells.push(m[0]);

const byId = {};
for (const c of cells) {
  const id = (c.match(/id="([^"]+)"/) || [])[1];
  if (!id) { errors.push('CELL WITH NO ID'); continue; }
  if (byId[id]) errors.push(`DUPLICATE id: ${id}`);
  byId[id] = c;
}

for (const [id, c] of Object.entries(byId)) {
  for (const attr of ['parent', 'source', 'target']) {
    const v = (c.match(new RegExp(`${attr}="([^"]*)"`)) || [])[1];
    if (v && v !== '' && !byId[v]) errors.push(`${id}: ${attr}="${v}" NOT FOUND`);
  }
  const isVertex = /vertex="1"/.test(c);
  const isEdge = /edge="1"/.test(c);
  if (isVertex) {
    const g = c.match(/<mxGeometry([^>]*)>/);
    if (!g) { errors.push(`${id}: NO GEOMETRY`); continue; }
    const num = a => parseFloat(((g[1].match(new RegExp(`${a}="(-?[\\d.e]+)"`)) || [])[1]) ?? 'NaN');
    const [x, y, w, h] = [num('x'), num('y'), num('width'), num('height')];
    if (!(w > 0) || !(h > 0)) errors.push(`${id}: bad size w=${w} h=${h}`);
    if (Number.isNaN(x) || Number.isNaN(y)) errors.push(`${id}: NaN coords x=${x} y=${y}`);
  }
}

// Lifeline & activation sanity
const framesSane = [...raw.matchAll(/<mxGeometry x="(90)"/g)].length;
if (!(cells.length > 10)) errors.push('too few cells: ' + cells.length);
console.log(`cells: ${cells.length}` + (errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nALL OK'));

// Danh sách tham chiếu message edges để人对
const edgeRefs = [];
for (const [id, c] of Object.entries(byId)) {
  if (/edge="1"/.test(c) && /source=/.test(c)) {
    const s = (c.match(/source="([^"]*)"/) || [])[1];
    const t = (c.match(/target="([^"]*)"/) || [])[1];
    edgeRefs.push(`${id}: ${s} -> ${t}`);
  }
}
console.log('edges with refs: ' + edgeRefs.length);
