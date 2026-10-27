/**
 * Layout checker: đọc XML class diagram, kiểm tra:
 *  1. Không có box (swimlane class) nào đè lên box khác
 *  2. Edge có waypoints (orthogonal) không cắt xuyên box nào
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let problems = 0;

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}
function segCrossesBox(x1, y1, x2, y2, b, pad = 2) {
  if (y1 === y2) {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    return lo < b.x + b.w - pad && hi > b.x + pad && y1 > b.y + pad && y1 < b.y + b.h - pad;
  }
  if (x1 === x2) {
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    return lo < b.y + b.h - pad && hi > b.y + pad && x1 > b.x + pad && x1 < b.x + b.w - pad;
  }
  return false;
}

for (const d of fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && /^\d/.test(d.name))) {
  for (const f of fs.readdirSync(path.join(ROOT, d.name)).filter(f => f.endsWith('.xml'))) {
    const file = path.join(ROOT, d.name, f);
    const raw = fs.readFileSync(file, 'utf8');

    const boxes = new Map();
    const edges = [];
    for (const m of raw.matchAll(/<mxCell\b[^>]*>/g)) {
      const tag = m[0];
      if (attr(tag, 'edge') === '1') {
        if (tag.includes('/>') || /<\/mxCell>/.test(tag)) {
          // edge có geometry bên trong hoặc self-closing — lấy target tag body riêng
        }
        edges.push({
          id: attr(tag, 'id'), src: attr(tag, 'source'), tgt: attr(tag, 'target'),
        });
        continue;
      }
      const id = attr(tag, 'id');
      if (attr(tag, 'vertex') !== '1' || !(attr(tag, 'style') || '').startsWith('swimlane')) continue;
      const geoM = raw.slice(m.index)
        .match(/<mxGeometry[^>]*x="(-?[\d.]+)"[^>]*y="(-?[\d.]+)"[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);
      if (!geoM) continue;
      boxes.set(id, { x: +geoM[1], y: +geoM[2], w: +geoM[3], h: +geoM[4] });
    }
    // geometry của edge (points) nằm trong tag edge -> lấy từ tag tới </mxCell> tương ứng
    for (const e of edges) {
      const idx = raw.indexOf(`id="${e.id}"`);
      if (idx < 0) continue;
      const end = raw.indexOf('</mxCell>', idx);
      const chunk = end > idx ? raw.slice(idx, end) : raw.slice(idx, idx + 1200);
      e.pts = [...chunk.matchAll(/<mxPoint x="(-?[\d.]+)" y="(-?[\d.]+)"\/>/g)].map(p => ({ x: +p[1], y: +p[2] }));
    }

    const list = [...boxes.entries()].map(([id, b]) => ({ id, ...b }));

    // 1. overlap
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
          problems++; console.log(`OVERLAP ${d.name}/${f}: ${a.id} x ${b.id}`);
        }
      }
    }
    console.log(`${d.name}/${f}: ${list.length} classes, ${edges.length} edges`);

    // 2. edge waypoints cắt box
    for (const e of edges) {
      if (!e.pts || e.pts.length < 2) continue;
      const sb = boxes.get(e.src), tb = boxes.get(e.tgt);
      if (!sb || !tb) continue;
      const path = [
        { x: sb.x + sb.w, y: sb.y + sb.h / 2 },
        ...e.pts,
        { x: tb.x, y: tb.y + tb.h / 2 },
      ];
      for (let i = 0; i < path.length - 1; i++) {
        for (const b of list) {
          if ([e.src, e.tgt].includes(b.id)) continue;
          if (segCrossesBox(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y, b)) {
            problems++; console.log(`EDGE-CROSS ${d.name}/${f}: ${e.id} segment ${i} crosses ${b.id}`);
          }
        }
      }
    }
  }
}
console.log(problems === 0 ? '\nALL LAYOUT OK — no overlaps, no edge crossing boxes' : `\n${problems} PROBLEM(S)`);
