/* eslint-disable */
const fs = require('fs');
const path = require('path');

const SCHEMA = 'apps/api/prisma/schema.prisma';
const DIR = process.env.ERD_OUT_DIR || 'database_design';

// ============================================================
// 1. Prisma parser
// ============================================================
function parsePrisma(src) {
  const models = {};
  const enums = {};
  const lines = src.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const mModel = line.match(/^\s*model\s+(\w+)\s*\{/);
    const mEnum = line.match(/^\s*enum\s+(\w+)\s*\{/);
    if (mModel || mEnum) {
      const isEnum = !!mEnum;
      const name = (mModel || mEnum)[1];
      const body = [];
      i++;
      while (i < lines.length && !/^\s*\}/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      if (isEnum) {
        enums[name] = body.map((l) => l.replace(/\/\/.*$/, '').trim()).filter(Boolean);
      } else {
        models[name] = parseModelBody(name, body);
      }
    }
    i++;
  }
  return { models, enums };
}

function parseModelBody(name, body) {
  const fields = [];
  const blocks = { id: [], unique: [], index: [], map: null };

  for (let raw of body) {
    raw = raw.replace(/\/\/.*$/, '').trim();
    if (!raw) continue;

    if (raw.startsWith('@@')) {
      const mId = raw.match(/^@@id\(\[([^\]]+)\]\)/);
      const mUniq = raw.match(/^@@unique\(\[([^\]]+)\]\)/);
      const mIdx = raw.match(/^@@index\(\[([^\]]+)\]\)/);
      const mMap = raw.match(/^@@map\("([^"]+)"\)/);
      if (mId) blocks.id = mId[1].split(',').map((s) => s.trim());
      if (mUniq) blocks.unique.push(mUniq[1].split(',').map((s) => s.trim()));
      if (mIdx) blocks.index.push(mIdx[1].split(',').map((s) => s.trim()));
      if (mMap) blocks.map = mMap[1];
      continue;
    }

    const m = raw.match(/^(\w+)\s+([\w]+)(\[\])?(\?)?\s*(.*)$/);
    if (!m) continue;
    const [, fname, ftype, list, opt, attrs] = m;

    let native = null;
    const mNative = attrs.match(/@db\.(\w+)(\(([^)]*)\))?/);
    if (mNative) native = mNative[1] + (mNative[3] ? '(' + mNative[3] + ')' : '');

    const mMap = attrs.match(/@map\("([^"]+)"\)/);
    const mRel = attrs.match(/@relation\(([^)]*)\)/);
    let relName = null,
      relFields = null,
      relRefs = null;
    if (mRel) {
      const rn = mRel[1].match(/"([^"]+)"/);
      if (rn) relName = rn[1];
      const rf = mRel[1].match(/fields:\s*\[([^\]]*)\]/);
      if (rf) relFields = rf[1].split(',').map((s) => s.trim()).filter(Boolean);
      const rr = mRel[1].match(/references:\s*\[([^\]]*)\]/);
      if (rr) relRefs = rr[1].split(',').map((s) => s.trim()).filter(Boolean);
    }

    fields.push({
      name: fname,
      type: ftype,
      isList: !!list,
      optional: !!opt,
      native,
      column: mMap ? mMap[1] : fname,
      isId: /@id\b/.test(attrs),
      isUnique: /@unique\b/.test(attrs),
      relation: mRel ? { name: relName, fields: relFields, references: relRefs } : null,
    });
  }

  for (const f of fields) {
    if (blocks.id.includes(f.name)) f.isId = true;
    if (blocks.unique.some((u) => u.length === 1 && u[0] === f.name)) f.isUnique = true;
  }

  return { name, table: blocks.map || name, fields, blocks };
}

// ============================================================
// 2. Type mapping (Prisma -> PostgreSQL)
// ============================================================
function nativeToSql(native) {
  const m = native.match(/^(\w+)(\(.*\))?$/);
  if (!m) return native.toLowerCase();
  const base = m[1].toLowerCase();
  const args = m[2] || '';
  const alias = { varchar: 'varchar', char: 'char', text: 'text', timestamptz: 'timestamptz', timestamp: 'timestamp', date: 'date', time: 'time', uuid: 'uuid', inet: 'inet', jsonb: 'jsonb', json: 'jsonb', decimal: 'decimal', numeric: 'numeric', citext: 'citext' };
  return (alias[base] || base) + args;
}

function sqlType(field, enums) {
  if (enums[field.type]) return field.type;
  if (field.native) return nativeToSql(field.native);
  switch (field.type) {
    case 'Int':
      return 'integer';
    case 'BigInt':
      return 'bigint';
    case 'Float':
      return 'double precision';
    case 'Decimal':
      return 'decimal(65,30)';
    case 'Boolean':
      return 'boolean';
    case 'String':
      return 'text';
    case 'DateTime':
      return 'timestamp(3)';
    case 'Json':
      return 'jsonb';
    case 'Bytes':
      return 'bytea';
    default:
      return field.type.toLowerCase();
  }
}

// ============================================================
// 3. Model -> table descriptor
// ============================================================
function buildTables(models, enums) {
  const tables = {};
  for (const [name, model] of Object.entries(models)) {
    const fkFields = new Set();
    for (const f of model.fields) {
      if (f.relation && f.relation.fields) f.relation.fields.forEach((x) => fkFields.add(x));
    }

    const uniqueSets = model.blocks.unique;
    const rows = model.fields
      .filter((f) => !models[f.type]) // skip relation (object/list) fields - not columns
      .map((f) => {
      const isPk = f.isId;
      const isFk = fkFields.has(f.name);
      let isAk = false;
      if (!isPk) {
        if (f.isUnique) isAk = true;
        if (uniqueSets.some((u) => u.length > 1 && u.includes(f.name))) isAk = true;
      }
      return {
        name: f.column,
        type: sqlType(f, enums) + (f.optional ? '' : ''),
        optional: f.optional,
        isPk,
        isFk,
        isAk,
        fieldName: f.name,
        prismaType: f.type,
      };
    });

    tables[name] = { name, table: model.table, rows, model };
  }
  return tables;
}

// ============================================================
// 4. Edges (FK -> referenced table)
// ============================================================
function buildEdges(models, tables) {
  const edges = [];
  for (const [name, model] of Object.entries(models)) {
    for (const f of model.fields) {
      if (!f.relation || !f.relation.fields) continue;
      const parent = f.type;
      if (!models[parent]) continue;

      const fkCols = f.relation.fields.map((n) => {
        const ff = model.fields.find((x) => x.name === n);
        return ff ? ff.column : n;
      });
      const refCols = (f.relation.references || []).map((n) => {
        const pf = models[parent].fields.find((x) => x.name === n);
        return pf ? pf.column : n;
      });

      const fkFieldObjs = f.relation.fields.map((n) => model.fields.find((x) => x.name === n));
      const nullable = fkFieldObjs.some((x) => x && x.optional);

      const uniqueSet = [f.relation.fields].map((s) => s.join(','));
      const isOneToOne =
        model.blocks.unique.some((u) => u.join(',') === f.relation.fields.join(',')) ||
        fkFieldObjs.every((x) => x && x.isUnique);

      edges.push({
        child: name,
        parent,
        fkCols,
        refCols,
        nullable,
        isOneToOne,
        id: 'e_' + name + '_' + fkCols.join('_') + '_' + parent,
      });
    }
  }
  return edges;
}

// ============================================================
// 5. Layout
// ============================================================
const CFG = {
  // CSS heights written into the HTML table
  HEADER_H: 28,
  ROW_H: 20,
  BORDER: 1,
  // Real rendered heights (calibrated from draw.io SVG/PNG export):
  //   header  = 28 css + 2 default td padding + 1 border = 31
  //   row     = 20 css + 2 default td padding + 1 border = 23
  HEADER_RENDER: 31,
  ROW_RENDER: 23,
  MIN_W: +(process.env.ERD_MIN_W || 200),
  MAX_W: +(process.env.ERD_MAX_W || 380),
  H_GAP: 130,
  V_GAP: 40,
  MARGIN: +(process.env.ERD_MARGIN || 36),
  W_PAD: +(process.env.ERD_W_PAD || 24),
};

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function measure(t) {
  const nameW = Math.max(6, ...t.rows.map((r) => r.name.length)) * 6.5;
  const typeW = Math.max(4, ...t.rows.map((r) => r.type.length)) * 6.0;
  let w = Math.round(38 + nameW + typeW + CFG.W_PAD);
  w = Math.max(CFG.MIN_W, Math.min(CFG.MAX_W, w));
  const h = CFG.HEADER_RENDER + t.rows.length * CFG.ROW_RENDER;
  return { w, h };
}

function tableHtml(t, widthPx) {
  const rows = [];
  rows.push(
    '<tr><td colspan="3" style="height:' +
      CFG.HEADER_H +
      'px;background:#d9d9d9;border-bottom:1px solid #000000;text-align:center;font-weight:bold;font-size:12px;">' +
      t.table +
      '</td></tr>'
  );

  t.rows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f2f2f2';
    const keys = [];
    if (r.isPk) keys.push('PK');
    if (r.isFk) keys.push('FK');
    const keyHtml = keys.length
      ? '<span style="font-size:8px;white-space:nowrap;">' + keys.join('/') + '</span>'
      : '&nbsp;';
    rows.push(
      '<tr style="background:' +
        bg +
        ';">' +
        '<td style="width:38px;height:' +
        CFG.ROW_H +
        'px;text-align:center;font-weight:bold;font-size:9px;border-bottom:1px solid #dcdcdc;vertical-align:middle;">' +
        keyHtml +
        '</td>' +
        '<td style="border-bottom:1px solid #dcdcdc;padding:0 6px;font-size:11px;white-space:nowrap;">' +
        r.name +
        '</td>' +
        '<td style="border-bottom:1px solid #dcdcdc;padding:0 8px 0 4px;font-size:10px;text-align:right;color:#333333;white-space:nowrap;">' +
        r.type +
        '</td>' +
        '</tr>'
    );
  });

  return (
    '<table style="border-collapse:collapse;width:' +
    widthPx +
    'px;table-layout:auto;font-family:Helvetica,Arial,sans-serif;color:#000000;">' +
    rows.join('') +
    '</table>'
  );
}

function layoutGraph(names, edges, measureMap) {
  const parents = {};
  const children = {};
  names.forEach((n) => {
    parents[n] = [];
    children[n] = [];
  });
  edges.forEach((e) => {
    if (e.child === e.parent) return;
    if (!parents[e.child] || !parents[e.parent]) return;
    parents[e.child].push(e.parent);
    children[e.parent].push(e.child);
  });

  // --- cycle break + topological order (parents first) ---
  const color = {};
  const back = new Set();
  const topo = [];
  function dfs(n) {
    color[n] = 1;
    for (const p of parents[n]) {
      if (color[p] === 1) back.add(n + '>' + p);
      else if (!color[p]) dfs(p);
    }
    color[n] = 2;
    topo.push(n);
  }
  names.forEach((n) => {
    if (!color[n]) dfs(n);
  });

  const layer = {};
  names.forEach((n) => (layer[n] = 0));
  for (const n of topo) {
    for (const p of parents[n]) {
      if (back.has(n + '>' + p)) continue;
      layer[n] = Math.max(layer[n], layer[p] + 1);
    }
  }

  const maxLayer = Math.max(0, ...Object.values(layer));
  const layers = [];
  for (let l = 0; l <= maxLayer; l++) layers[l] = [];
  names.forEach((n) => layers[layer[n]].push(n));

  // initial order = topological order
  const topoIndex = {};
  topo.forEach((n, i) => (topoIndex[n] = i));
  layers.forEach((arr) => arr.sort((a, b) => topoIndex[a] - topoIndex[b]));

  // --- barycenter ordering ---
  function positionsIndex() {
    const idx = {};
    layers.forEach((arr) => arr.forEach((n, i) => (idx[n] = i)));
    return idx;
  }
  for (let iter = 0; iter < 12; iter++) {
    if (iter % 2 === 0) {
      for (let l = 1; l <= maxLayer; l++) {
        const idx = positionsIndex();
        const key = {};
        layers[l].forEach((n, i) => {
          const nb = parents[n].map((p) => idx[p]).filter((x) => x !== undefined);
          key[n] = nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : i;
        });
        layers[l].sort((a, b) => key[a] - key[b] || idx[a] - idx[b]);
      }
    } else {
      for (let l = maxLayer - 1; l >= 0; l--) {
        const idx = positionsIndex();
        const key = {};
        layers[l].forEach((n, i) => {
          const nb = children[n].map((c) => idx[c]).filter((x) => x !== undefined);
          key[n] = nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : i;
        });
        layers[l].sort((a, b) => key[a] - key[b] || idx[a] - idx[b]);
      }
    }
  }

  // --- coordinates (layered columns, wrapped to keep a sane aspect ratio) ---
  const gap = CFG.V_GAP;
  const pos = {};
  names.forEach((n) => {
    pos[n] = { x: 0, y: 0, w: measureMap[n].w, h: measureMap[n].h };
  });

  const area = names.reduce((a, n) => a + (measureMap[n].w + 80) * (measureMap[n].h + gap), 0);

  function splitBalanced(arr, k) {
    if (k <= 1) return [arr];
    const total = arr.reduce((a, n) => a + measureMap[n].h + gap, 0) - gap;
    const target = total / k;
    const chunks = [];
    let cur = [],
      curH = 0;
    for (const n of arr) {
      const h = measureMap[n].h;
      const add = cur.length ? h + gap : h;
      if (cur.length && curH + add > target && chunks.length < k - 1) {
        chunks.push(cur);
        cur = [n];
        curH = h;
      } else {
        cur.push(n);
        curH += add;
      }
    }
    if (cur.length) chunks.push(cur);
    return chunks;
  }

  const colGap = 55;

  function place(targetH) {
    names.forEach((n) => {
      pos[n].x = 0;
      pos[n].y = 0;
    });

    let x = 0;
    const blocks = [];

    for (let l = 0; l <= maxLayer; l++) {
      const arr = layers[l];
      const natural = arr.reduce((a, n) => a + measureMap[n].h + gap, 0) - gap;
      let k = natural > targetH * 1.02 ? Math.ceil(natural / targetH) : 1;
      k = Math.max(1, Math.min(arr.length, k));
      const chunks = splitBalanced(arr, k);

      const chunkW = chunks.map((c) => Math.max(...c.map((n) => measureMap[n].w)));
      const chunkX = [];
      let cx = x;
      for (const w of chunkW) {
        chunkX.push(cx);
        cx += w + colGap;
      }
      const layerW = cx - colGap - x;

      const chunkH = [];
      chunks.forEach((c, ci) => {
        let y = 0;
        for (const n of c) {
          pos[n].x = chunkX[ci];
          pos[n].y = y;
          y += measureMap[n].h + gap;
        }
        chunkH.push(y - gap);
      });

      const blockH = Math.max(...chunkH);
      chunks.forEach((c, ci) => {
        const off = (blockH - chunkH[ci]) / 2;
        for (const n of c) pos[n].y += off;
      });

      blocks.push({ h: blockH, nodes: arr });
      x += layerW + CFG.H_GAP;
    }

    const maxBlockH = Math.max(...blocks.map((b) => b.h));
    for (const b of blocks) {
      const off = (maxBlockH - b.h) / 2;
      for (const n of b.nodes) pos[n].y += off;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    names.forEach((n) => {
      minX = Math.min(minX, pos[n].x);
      minY = Math.min(minY, pos[n].y);
      maxX = Math.max(maxX, pos[n].x + pos[n].w);
      maxY = Math.max(maxY, pos[n].y + pos[n].h);
    });

    return {
      w: maxX - minX,
      h: maxY - minY,
      dx: CFG.MARGIN - minX,
      dy: CFG.MARGIN - minY,
    };
  }

  let targetH = Math.min(2200, Math.max(480, Math.sqrt(area / 1.6)));
  let res = place(targetH);
  for (let i = 0; i < 4; i++) {
    const a = res.h / res.w;
    let next = targetH;
    if (a > 1.45) next = targetH * 0.7;
    else if (a < 0.62) next = targetH * 1.35;
    else break;
    if (Math.abs(next - targetH) < 1) break;
    targetH = next;
    res = place(targetH);
  }
  names.forEach((n) => {
    pos[n].x += res.dx;
    pos[n].y += res.dy;
  });

  return { pos, width: res.w + CFG.MARGIN * 2, height: res.h + CFG.MARGIN * 2, layers, layer };
}

// ============================================================
// 5b. Hub layout (ERD-ALL only)
//     User sits in the middle. Every module becomes a radial fan:
//     the tables that hang off User form the innermost layer and
//     the block grows outward from there, so a module's own tables
//     never sit between another table and User. Module titles are
//     placed outside the ring.
// ============================================================
const HUB = {
  BLOCK_GAP: +(process.env.HUB_BLOCK_GAP || 28), // gap between two tables of the same module
  LAYER_GAP: +(process.env.HUB_LAYER_GAP || 40), // radial gap between two layers of one module
  CLUSTER_GAP: +(process.env.HUB_CLUSTER_GAP || 56), // clearance between two module blocks
  INNER_GAP: +(process.env.HUB_INNER_GAP || 140), // clearance between User and the ring
  CORRIDOR: +(process.env.HUB_CORRIDOR || 20),
  CORRIDOR_STEP: +(process.env.HUB_CORRIDOR_STEP || 8),
  ASPECT_MAX: +(process.env.HUB_ASPECT_MAX || 1.4),
  CROSS_W: +(process.env.HUB_CROSS_W || 260),
  CC_WEIGHT: +(process.env.HUB_CC_WEIGHT || 120),
  ORDER_CC: +(process.env.HUB_ORDER_CC || 200),
  ORDER_ITER: +(process.env.HUB_ORDER_ITER || 1200),
  LABEL_H: 20,
  LABEL_OFF: 14,
  LABEL_W: 380,
};

// Lay one module out in a local frame: u = distance from the inner edge
// (the side that faces User), t = tangential offset, centred on 0.
function radialBlockLayout(local, localEdges, userLinked, measureMap) {
  const adj = {};
  local.forEach((n) => (adj[n] = new Set()));
  localEdges.forEach((e) => {
    if (e.child === e.parent) return;
    if (!adj[e.child] || !adj[e.parent]) return;
    adj[e.child].add(e.parent);
    adj[e.parent].add(e.child);
  });

  // depth = hops from the tables that connect straight to User
  const depth = {};
  const seeds = local.filter((n) => userLinked.has(n));
  const src = seeds.length ? seeds : [local[0]];
  src.forEach((n) => (depth[n] = 0));
  const queue = src.slice();
  while (queue.length) {
    const n = queue.shift();
    for (const m of adj[n]) {
      if (depth[m] === undefined) {
        depth[m] = depth[n] + 1;
        queue.push(m);
      }
    }
  }
  const maxD = Math.max(0, ...Object.values(depth));
  local.forEach((n) => {
    if (depth[n] === undefined) depth[n] = maxD + 1;
  });

  const layers = [];
  local.forEach((n) => {
    const d = depth[n];
    (layers[d] = layers[d] || []).push(n);
  });
  for (let d = 0; d < layers.length; d++) if (!layers[d]) layers[d] = [];

  // barycenter ordering inside each layer to keep the fan tidy
  const index = () => {
    const idx = {};
    layers.forEach((arr) => arr.forEach((n, i) => (idx[n] = i)));
    return idx;
  };
  layers.forEach((arr) => arr.sort());
  for (let it = 0; it < 8; it++) {
    const forward = it % 2 === 0;
    const ds = [];
    if (forward) for (let d = 1; d < layers.length; d++) ds.push(d);
    else for (let d = layers.length - 2; d >= 0; d--) ds.push(d);
    for (const d of ds) {
      const idx = index();
      const arr = layers[d];
      const key = {};
      arr.forEach((n) => {
        const want = forward ? d - 1 : d + 1;
        const nb = [...adj[n]].filter((m) => depth[m] === want).map((m) => idx[m]);
        key[n] = nb.length ? nb.reduce((a, b) => a + b, 0) / nb.length : idx[n];
      });
      arr.sort((a, b) => key[a] - key[b] || (a < b ? -1 : 1));
    }
  }

  // A block can end up on a horizontal side of the ring (layers grow along x,
  // tables stack vertically) or on a vertical side (layers grow along y,
  // tables stack horizontally). Pack both ways so the two never get mixed up.
  function pack(horiz) {
    const layerExtent = layers.map((arr) =>
      Math.max(0, ...arr.map((n) => (horiz ? measureMap[n].w : measureMap[n].h)))
    );
    const uOff = [];
    let u = 0;
    layers.forEach((arr, d) => {
      uOff[d] = u;
      u += layerExtent[d] + HUB.LAYER_GAP;
    });
    const radial = Math.max(0, u - HUB.LAYER_GAP);

    const pos = {};
    let tangential = 0;
    layers.forEach((arr, d) => {
      const sizes = arr.map((n) => (horiz ? measureMap[n].h : measureMap[n].w));
      const total = sizes.reduce((a, b) => a + b, 0) + HUB.BLOCK_GAP * (arr.length - 1);
      tangential = Math.max(tangential, total);
      let t = -total / 2;
      arr.forEach((n, i) => {
        pos[n] = { u: uOff[d], t, w: measureMap[n].w, h: measureMap[n].h };
        t += sizes[i] + HUB.BLOCK_GAP;
      });
    });
    return { pos, radial, tangential };
  }

  return { packH: pack(true), packV: pack(false), depth };
}

// which module "owns" a table (first Report 3 page that introduces it)
function primaryModules(names) {
  const primary = {};
  for (const [g, arr] of Object.entries(GROUPS)) {
    for (const n of arr) {
      if (n === 'User') continue;
      if (!primary[n]) primary[n] = g;
    }
  }
  const out = {};
  names.forEach((n) => {
    if (n === 'User') return;
    const g = primary[n] || 'ERD1';
    (out[g] = out[g] || []).push(n);
  });
  return out;
}

function layoutHub(names, tables, edges, measureMap) {
  const groups = primaryModules(names);
  const ids = Object.keys(groups).sort((a, b) => +a.slice(3) - +b.slice(3));

  // tables that hang directly off User
  const userLinked = new Set();
  edges.forEach((e) => {
    if (e.child === e.parent) return;
    if (e.parent === 'User') userLinked.add(e.child);
    if (e.child === 'User') userLinked.add(e.parent);
  });

  // cross-module links (everything that is not routed through User)
  const ownerOf = {};
  ids.forEach((g) => groups[g].forEach((n) => (ownerOf[n] = g)));
  const crossEdges = [];
  const aff = {};
  edges.forEach((e) => {
    if (e.child === e.parent) return;
    if (e.child === 'User' || e.parent === 'User') return;
    const a = ownerOf[e.child];
    const b = ownerOf[e.parent];
    if (!a || !b || a === b) return;
    crossEdges.push([a, b]);
    (aff[a] = aff[a] || {})[b] = (aff[a][b] || 0) + 1;
    (aff[b] = aff[b] || {})[a] = (aff[b][a] || 0) + 1;
  });

  // tables that must sit on the inner edge: everything that hangs off User
  // plus every table taking part in a cross-module link, so those lines can
  // leave the block without running over a neighbour
  const innerSeeds = new Set(userLinked);
  edges.forEach((e) => {
    if (e.child === e.parent) return;
    if (e.child === 'User' || e.parent === 'User') return;
    const a = ownerOf[e.child];
    const b = ownerOf[e.parent];
    if (!a || !b || a === b) return;
    innerSeeds.add(e.child);
    innerSeeds.add(e.parent);
  });

  // build every module block first (its size does not depend on the order)
  const byId = {};
  ids.forEach((id) => {
    const local = groups[id];
    const set = new Set(local);
    const localEdges = edges.filter((e) => e.child !== e.parent && set.has(e.child) && set.has(e.parent));
    const lay = radialBlockLayout(local, localEdges, innerSeeds, measureMap);
    byId[id] = {
      id,
      label: id + ' \u00b7 ' + MODULE_TITLES[id],
      lay,
      radial: Math.max(lay.packH.radial, lay.packV.radial),
      tangential: Math.max(lay.packH.tangential, lay.packV.tangential),
      side: 'R',
      w: 0,
      h: 0,
    };
  });

  // cyclic order: greedy chain, then 2-opt on the ring distance of the
  // cross-module links so that connected modules end up side by side
  const order = [];
  const used = new Set();
  let cur = ids.includes('ERD1') ? 'ERD1' : ids[0];
  while (order.length < ids.length) {
    order.push(cur);
    used.add(cur);
    let best = null;
    let bw = -1;
    for (const id of ids) {
      if (used.has(id)) continue;
      const w = (aff[cur] && aff[cur][id]) || 0;
      if (w > bw) {
        bw = w;
        best = id;
      }
    }
    if (!best) best = ids.find((id) => !used.has(id));
    cur = best;
  }

  const ringCost = (ord) => {
    let acc = 0;
    const at = {};
    ord.forEach((id) => {
      at[id] = acc + (byId[id].tangential + HUB.CLUSTER_GAP) / 2;
      acc += byId[id].tangential + HUB.CLUSTER_GAP;
    });
    let cost = 0;
    for (const [a, b] of crossEdges) {
      const d = Math.abs(at[a] - at[b]);
      cost += Math.min(d, acc - d);
    }
    return cost;
  };

  let bestOrder = order.slice();
  let bestCost = ringCost(bestOrder);
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let it = 0; it < 6000; it++) {
    const cand = bestOrder.slice();
    const n = cand.length;
    const i = Math.floor(rnd() * n);
    const j = Math.floor(rnd() * n);
    if (i === j) continue;
    if (rnd() < 0.6) {
      const lo = Math.min(i, j);
      const hi = Math.max(i, j);
      const seg = cand.slice(lo, hi + 1).reverse();
      cand.splice(lo, hi - lo + 1, ...seg);
    } else {
      const moved = cand.splice(i, 1)[0];
      cand.splice(j, 0, moved);
    }
    const c = ringCost(cand);
    if (c < bestCost) {
      bestCost = c;
      bestOrder = cand;
    }
  }

  if (process.env.HUB_DEBUG) {
    console.log('cross-module links: ' + crossEdges.length + '  ring cost ' + Math.round(bestCost));
    console.log('order: ' + bestOrder.join(' '));
  }

  const userM = measureMap['User'];
  const userHalf = Math.max(userM.w, userM.h) / 2;
  const N = ids.length;

  // --- rectangular ring packing -------------------------------------
  // The modules form one ring around User: a contiguous run on each of
  // the four sides. Inside a side the blocks are stacked tangentially
  // and their inner faces all sit on the same rectangle, so a block's
  // own tables never block the way to User.
  const runLoad = (arr) => arr.reduce((a, b) => a + b.tanUsed, 0) + HUB.CLUSTER_GAP * Math.max(0, arr.length - 1);
  const K = 4;

  // split a cyclic sequence into four contiguous runs, minimising the
  // longest run (dynamic programming over the cut points)
  function splitRuns(seq) {
    const pre = [0];
    seq.forEach((b) => pre.push(pre[pre.length - 1] + b.tangential));
    const loadOf = (i, j) => pre[j] - pre[i] + HUB.CLUSTER_GAP * Math.max(0, j - i - 1);
    const dp = Array.from({ length: K + 1 }, () => new Array(N + 1).fill(Infinity));
    const cut = Array.from({ length: K + 1 }, () => new Array(N + 1).fill(-1));
    dp[0][0] = 0;
    for (let k = 1; k <= K; k++) {
      for (let i = k; i <= N; i++) {
        for (let j = k - 1; j < i; j++) {
          const v = Math.max(dp[k - 1][j], loadOf(j, i));
          if (v < dp[k][i]) {
            dp[k][i] = v;
            cut[k][i] = j;
          }
        }
      }
    }
    const parts = [];
    let idx = N;
    for (let k = K; k >= 1; k--) {
      const j = cut[k][idx];
      parts.unshift(seq.slice(j, idx));
      idx = j;
    }
    return parts;
  }

  // perimeter order: right (top -> bottom), bottom (right -> left),
  // left (bottom -> top), top (left -> right)
  const sides = ['R', 'D', 'L', 'U'];
  const minInner = 2 * (userHalf + HUB.INNER_GAP);
  const PIN = process.env.HUB_PINWHEEL !== '0';
  const packOf = (b, side) => (side === 'R' || side === 'L' ? b.lay.packH : b.lay.packV);
  const runLoadOf = (arr, side) =>
    arr.reduce((a, b) => a + packOf(b, side).tangential, 0) + HUB.CLUSTER_GAP * Math.max(0, arr.length - 1);
  const runOutOf = (arr, side) => Math.max(0, ...arr.map((b) => packOf(b, side).radial));

  // A pinwheel ring does not force the four sides onto one shared rectangle.
  // A side only collides with the next one when the two runs overlap in both
  // axes, so a short run may sit much closer to User as long as the
  // perpendicular run is pushed out past its end. Search the 16 ways of
  // resolving those four corner constraints and keep the tightest result.
  function offsetsFor(load, out) {
    const G = HUB.CLUSTER_GAP;
    const minD = userHalf + HUB.INNER_GAP;
    const LR = load[0];
    const LD = load[1];
    const LL = load[2];
    const LU = load[3];
    const cons = [
      ['R', LD / 2, 'D', LR / 2],
      ['R', LU / 2, 'U', LR / 2],
      ['L', LD / 2, 'D', LL / 2],
      ['L', LU / 2, 'U', LL / 2],
    ];
    let pick = null;
    for (let mask = 0; mask < 16; mask++) {
      const d = { R: minD, L: minD, U: minD, D: minD };
      for (let q = 0; q < 4; q++) {
        const c = cons[q];
        if (mask & (1 << q)) d[c[0]] = Math.max(d[c[0]], c[1] + G);
        else d[c[2]] = Math.max(d[c[2]], c[3] + G);
      }
      const x0 = Math.min(-d.L - out.L, -LU / 2, -LD / 2);
      const x1 = Math.max(d.R + out.R, LU / 2, LD / 2);
      const y0 = Math.min(-d.U - out.U, -LR / 2, -LL / 2);
      const y1 = Math.max(d.D + out.D, LR / 2, LL / 2);
      const w = x1 - x0;
      const h = y1 - y0;
      const aspect = Math.max(w / h, h / w);
      const score = w * h * (aspect > HUB.ASPECT_MAX ? 6 : 1);
      if (!pick || score < pick.score) pick = { d, W: d.L + d.R, H: d.U + d.D, width: w, height: h, score };
    }
    return pick;
  }

  // footprint of a candidate ring, without moving anything
  function ringMetrics(runs) {
    const load = runs.map((arr, si) => runLoadOf(arr, sides[si]));
    const out = { R: 0, D: 0, L: 0, U: 0 };
    runs.forEach((arr, si) => (out[sides[si]] = runOutOf(arr, sides[si])));
    if (PIN) return offsetsFor(load, out);
    const W = Math.max(minInner, load[1], load[3]);
    const H = Math.max(minInner, load[0], load[2]);
    return { d: null, W, H, width: W + out.L + out.R, height: H + out.U + out.D };
  }

  const BALANCE = +(process.env.HUB_BALANCE || 3);
  function measureRing(runs) {
    const m = ringMetrics(runs);
    const aspect = Math.max(m.width / m.height, m.height / m.width);
    let bal = 1;
    if (PIN && BALANCE) {
      const loads = runs.map((arr, si) => runLoadOf(arr, sides[si]));
      const total = loads.reduce((a, b) => a + b, 0);
      const ideal = total / 4;
      bal = 1 + BALANCE * Math.max(0, Math.max(...loads) / ideal - 1);
    }
    return { W: m.W, H: m.H, width: m.width, height: m.height, d: m.d, area: m.width * m.height * (aspect > HUB.ASPECT_MAX ? 6 : 1) * bal };
  }

  // place one candidate ring: `runs` is the four contiguous groups in
  // perimeter order, `flip` reverses the direction inside every run
  function applyRing(runs, flip) {
    runs.forEach((arr, si) => {
      const side = sides[si];
      arr.forEach((b) => {
        b.side = side;
        const pk = packOf(b, side);
        b.pos = pk.pos;
        b.radial = pk.radial;
        b.tanUsed = pk.tangential;
      });
    });
    const m = ringMetrics(runs);
    const W = m.W;
    const H = m.H;
    const d = m.d || { R: W / 2, L: W / 2, D: H / 2, U: H / 2 };
    runs.forEach((arr, si) => {
      const side = sides[si];
      const load = runLoad(arr);
      const sign = (side === 'D' ? -1 : 1) * (flip ? -1 : 1);
      let cur = (-sign * load) / 2;
      arr.forEach((b) => {
        const mid = cur + (sign * b.tanUsed) / 2;
        if (side === 'R') {
          b.cx = d.R + b.radial / 2;
          b.cy = mid;
          b.w = b.radial;
          b.h = b.tanUsed;
        } else if (side === 'L') {
          b.cx = -d.L - b.radial / 2;
          b.cy = mid;
          b.w = b.radial;
          b.h = b.tanUsed;
        } else if (side === 'D') {
          b.cx = mid;
          b.cy = d.D + b.radial / 2;
          b.w = b.tanUsed;
          b.h = b.radial;
        } else {
          b.cx = mid;
          b.cy = -d.U - b.radial / 2;
          b.w = b.tanUsed;
          b.h = b.radial;
        }
        cur += sign * (b.tanUsed + HUB.CLUSTER_GAP);
      });
    });
    return { W, H, width: m.width, height: m.height, d: m.d };
  }

  const blocks = bestOrder.map((id) => byId[id]);

  // The ring order is cyclic and its start point is free, so enumerate every
  // way of cutting it into four contiguous runs and every rotation/flip of
  // those runs, then keep the tightest footprint. Among near-equal footprints
  // prefer the one whose cross-module lines are shortest.
  let bestArea = Infinity;
  const evalCandidates = (visit) => {
    for (let start = 0; start < N; start++) {
      const seq = blocks.slice(start).concat(blocks.slice(0, start));
      for (let i = 1; i <= N - 3; i++) {
        for (let j = i + 1; j <= N - 2; j++) {
          for (let k = j + 1; k <= N - 1; k++) {
            const parts = [seq.slice(0, i), seq.slice(i, j), seq.slice(j, k), seq.slice(k)];
            for (let r = 0; r < 4; r++) {
              const runs = [0, 1, 2, 3].map((q) => parts[(q + r) % 4]);
              visit(runs, start, r);
            }
          }
        }
      }
    }
  };

  evalCandidates((runs) => {
    const m = measureRing(runs);
    if (m.area < bestArea) bestArea = m.area;
  });

  const tol = +(process.env.HUB_AREA_TOL || 0.16);
  const limit = bestArea * (1 + tol);
  let best = null;
  evalCandidates((runs, start, r) => {
    if (measureRing(runs).area > limit) return;
    for (const flip of [false, true]) {
      applyRing(runs, flip);
      let cost = 0;
      for (const [a, b] of crossEdges) {
        const A = byId[a];
        const B = byId[b];
        cost += Math.abs(A.cx - B.cx) + Math.abs(A.cy - B.cy);
      }
      if (!best || cost < best.cost) best = { cost, start, r, flip, runs };
    }
  });

  const ring = applyRing(best.runs, best.flip);
  const W = ring.W;
  const H = ring.H;
  if (process.env.HUB_DEBUG) {
    console.log(
      'ring: start=' + best.start + ' rot=' + best.r + ' flip=' + best.flip +
      ' footprint=' + Math.round(ring.width) + 'x' + Math.round(ring.height) +
      ' crossCost=' + Math.round(best.cost)
    );
    console.log(
      'blocks: ' +
        sides
          .map((sd) => sd + '[' + blocks.filter((b) => b.side === sd).map((b) => b.id.slice(3) + ':' + Math.round(b.tanUsed) + 'x' + Math.round(b.radial)).join(' ') + ']')
          .join(' ')
    );
  }

  // --- place ---------------------------------------------------------
  const pos = {};
  pos['User'] = { x: -userM.w / 2, y: -userM.h / 2, w: userM.w, h: userM.h };

  blocks.forEach((b) => {
    const left = b.cx - b.w / 2;
    const right = b.cx + b.w / 2;
    const top = b.cy - b.h / 2;
    const bottom = b.cy + b.h / 2;
    b.box = { x: left, y: top, w: b.w, h: b.h };

    let X0;
    let Y0;
    if (b.side === 'R') {
      X0 = left;
      Y0 = b.cy;
    } else if (b.side === 'L') {
      X0 = right;
      Y0 = b.cy;
    } else if (b.side === 'D') {
      X0 = b.cx;
      Y0 = top;
    } else {
      X0 = b.cx;
      Y0 = bottom;
    }

    Object.keys(b.pos).forEach((n) => {
      const p = b.pos[n];
      let x;
      let y;
      if (b.side === 'R') {
        x = X0 + p.u;
        y = Y0 + p.t;
      } else if (b.side === 'L') {
        x = X0 - p.u - p.w;
        y = Y0 + p.t;
      } else if (b.side === 'D') {
        x = X0 + p.t;
        y = Y0 + p.u;
      } else {
        x = X0 + p.t;
        y = Y0 - p.u - p.h;
      }
      pos[n] = { x, y, w: p.w, h: p.h };
    });

    // module title just outside the ring
    if (b.side === 'R') {
      b.labelBox = { x: right + HUB.LABEL_OFF, y: b.cy - HUB.LABEL_H / 2, w: HUB.LABEL_W, h: HUB.LABEL_H, align: 'left' };
    } else if (b.side === 'L') {
      b.labelBox = { x: left - HUB.LABEL_OFF - HUB.LABEL_W, y: b.cy - HUB.LABEL_H / 2, w: HUB.LABEL_W, h: HUB.LABEL_H, align: 'right' };
    } else if (b.side === 'D') {
      b.labelBox = { x: b.cx - b.tanUsed / 2, y: bottom + HUB.LABEL_OFF, w: b.tanUsed, h: HUB.LABEL_H, align: 'center' };
    } else {
      b.labelBox = { x: b.cx - b.tanUsed / 2, y: top - HUB.LABEL_OFF - HUB.LABEL_H, w: b.tanUsed, h: HUB.LABEL_H, align: 'center' };
    }
  });

  if (process.env.HUB_DEBUG) {
    console.log('User', userM.w + 'x' + userM.h, ' inner=' + Math.round(W) + 'x' + Math.round(H));
    blocks.forEach((b) => {
      console.log(
        'block ' + b.id.padEnd(6) + ' ' + b.side +
        ' radial=' + Math.round(b.radial).toString().padStart(4) +
        ' tan=' + Math.round(b.tanUsed).toString().padStart(4) +
        ' tables=' + Object.keys(b.pos).length
      );
    });
  }

  // --- normalise to the page margin ---------------------------------
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x, y, w, h) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  };
  names.forEach((n) => grow(pos[n].x, pos[n].y, pos[n].w, pos[n].h));

  const dx = CFG.MARGIN - minX;
  const dy = CFG.MARGIN - minY;
  names.forEach((n) => {
    pos[n].x += dx;
    pos[n].y += dy;
  });
  blocks.forEach((b) => {
    b.cx += dx;
    b.cy += dy;
    b.box.x += dx;
    b.box.y += dy;
    b.labelBox.x += dx;
    b.labelBox.y += dy;
  });

  const tableInfo = {};
  blocks.forEach((b) => {
    Object.keys(b.pos).forEach((n) => {
      tableInfo[n] = { block: b.id, side: b.side, depth: b.lay.depth[n] };
    });
  });

  return {
    pos,
    blocks,
    tableInfo,
    width: maxX - minX + CFG.MARGIN * 2,
    height: maxY - minY + CFG.MARGIN * 2,
  };
}

// ============================================================
// 6. XML generation
// ============================================================
function anchorY(t, rowIndex) {
  const h = CFG.HEADER_RENDER + t.rows.length * CFG.ROW_RENDER;
  const y = CFG.HEADER_RENDER + rowIndex * CFG.ROW_RENDER + CFG.ROW_RENDER / 2;
  return Math.max(0.02, Math.min(0.98, y / h));
}

// ============================================================
// 6a. Obstacle-avoiding orthogonal router (module ERDs)
// ============================================================
// Every relation leaves its FK row on the child face and enters the
// referenced row on the parent face. The route is searched on a
// visibility grid built from every table edge offset by CLEAR px, so
// no segment can run through a table. Cost = length + bends +
// crossings/overlaps against already routed edges.

function segHitsRect(a, b, r, pad) {
  const x0 = r.x + pad;
  const x1 = r.x + r.w - pad;
  const y0 = r.y + pad;
  const y1 = r.y + r.h - pad;
  if (x0 >= x1 || y0 >= y1) return false;
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const pp = [-dx, dx, -dy, dy];
  const qq = [a.x - x0, x1 - a.x, a.y - y0, y1 - a.y];
  for (let i = 0; i < 4; i++) {
    if (pp[i] === 0) {
      if (qq[i] < 0) return false;
    } else {
      const t = qq[i] / pp[i];
      if (pp[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t1 > t0 + 1e-6;
}

function segCross(a, b, c, d) {
  const eps = 0.01;
  const aH = Math.abs(a.y - b.y) < eps;
  const cH = Math.abs(c.y - d.y) < eps;
  if (aH === cH) return false;
  const h0 = aH ? a : c;
  const h1 = aH ? b : d;
  const v0 = aH ? c : a;
  const v1 = aH ? d : b;
  const hx0 = Math.min(h0.x, h1.x);
  const hx1 = Math.max(h0.x, h1.x);
  const vy0 = Math.min(v0.y, v1.y);
  const vy1 = Math.max(v0.y, v1.y);
  return v0.x > hx0 + eps && v0.x < hx1 - eps && h0.y > vy0 + eps && h0.y < vy1 - eps;
}

function segOverlap(a, b, c, d) {
  const eps = 0.5;
  if (Math.abs(a.y - b.y) < eps && Math.abs(c.y - d.y) < eps && Math.abs(a.y - c.y) < eps) {
    const lo1 = Math.min(a.x, b.x);
    const hi1 = Math.max(a.x, b.x);
    const lo2 = Math.min(c.x, d.x);
    const hi2 = Math.max(c.x, d.x);
    return Math.min(hi1, hi2) - Math.max(lo1, lo2) > 2;
  }
  if (Math.abs(a.x - b.x) < eps && Math.abs(c.x - d.x) < eps && Math.abs(a.x - c.x) < eps) {
    const lo1 = Math.min(a.y, b.y);
    const hi1 = Math.max(a.y, b.y);
    const lo2 = Math.min(c.y, d.y);
    const hi2 = Math.max(c.y, d.y);
    return Math.min(hi1, hi2) - Math.max(lo1, lo2) > 2;
  }
  return false;
}

function routeModuleEdges(names, tables, usedEdges, pos, W, H) {
  const CLEAR = +(process.env.ERD_CLEAR || 12);
  // negative pad inflates every unrelated table by CLEAR-1 px, so a line
  // must keep a real gap from the table border (not just miss its centre)
  const PAD = -(CLEAR - 1);
  const BEND = 26;
  const CROSS = +(process.env.ERD_CROSS || 1500);
  const OVERLAP = +(process.env.ERD_OVERLAP || 1200);
  const MID_BIAS = 0.01;
  const STUBS = [14, 24, 36, 52, 72];

  const rects = names.map((n) => ({ n, x: pos[n].x, y: pos[n].y, w: pos[n].w, h: pos[n].h }));
  const byName = {};
  rects.forEach((r) => (byName[r.n] = r));

  const rowFrac = (t, row) => anchorY(t, row < 0 ? 0 : row);
  const rowOf = (t, name) => t.rows.findIndex((r) => r.name === name);
  const dirOf = (s) => (s === 'L' ? [-1, 0] : s === 'R' ? [1, 0] : s === 'T' ? [0, -1] : [0, 1]);
  const opp = (s) => ({ L: 'R', R: 'L', T: 'B', B: 'T' }[s]);
  const di = { R: 0, L: 1, D: 2, U: 3 };

  function faceAnchor(p, side, rowF, crossF) {
    if (side === 'L') return { x: p.x, y: p.y + rowF * p.h, ex: 0, ey: rowF };
    if (side === 'R') return { x: p.x + p.w, y: p.y + rowF * p.h, ex: 1, ey: rowF };
    if (side === 'T') return { x: p.x + crossF * p.w, y: p.y, ex: crossF, ey: 0 };
    return { x: p.x + crossF * p.w, y: p.y + p.h, ex: crossF, ey: 1 };
  }

  const plans = usedEdges.map((e) => {
    const ct = tables[e.child];
    const pt = tables[e.parent];
    const fkRow = rowOf(ct, e.fkCols[0]);
    const refRow = rowOf(pt, e.refCols[0]);
    const self = e.child === e.parent;
    let exitSide, entrySide;
    if (self) {
      exitSide = 'R';
      entrySide = 'R';
    } else {
      const childLeft = pos[e.child].x <= pos[e.parent].x;
      exitSide = childLeft ? 'R' : 'L';
      entrySide = childLeft ? 'L' : 'R';
    }
    return {
      e,
      ct,
      pt,
      fkRow,
      refRow,
      self,
      exitSide,
      entrySide,
      fkF: rowFrac(ct, fkRow),
      refF: rowFrac(pt, refRow),
    };
  });

  // several FKs may point at the same row (e.g. User.id); spread their
  // entry points so the arrowheads do not stack on one pixel
  const groups = {};
  plans.forEach((p) => {
    if (p.self) return;
    const k = p.e.parent + '|' + p.refRow + '|' + p.entrySide;
    (groups[k] = groups[k] || []).push(p);
  });
  Object.values(groups).forEach((arr) => {
    if (arr.length < 2) return;
    arr.sort((a, b) => pos[a.e.child].y - pos[b.e.child].y || (a.e.id < b.e.id ? -1 : 1));
    arr.forEach((p, i) => {
      const pr = byName[p.e.parent];
      const off = (i - (arr.length - 1) / 2) * 9;
      const y = Math.max(pr.y + 6, Math.min(pr.y + pr.h - 6, pr.y + p.refF * pr.h + off));
      p.refF = (y - pr.y) / pr.h;
    });
  });

  plans.forEach((p) => {
    p.fkF = +p.fkF.toFixed(3);
    p.refF = +p.refF.toFixed(3);
    p.A = faceAnchor(pos[p.e.child], p.exitSide, p.fkF, 0.5);
    p.B = faceAnchor(pos[p.e.parent], p.entrySide, p.refF, 0.5);
  });

  const padFor = (r, child, parent) => (r.n === child || r.n === parent ? 0.5 : PAD);
  function blocked(a, b, child, parent) {
    for (const r of rects) if (segHitsRect(a, b, r, padFor(r, child, parent))) return true;
    return false;
  }
  function pointFree(pt, child, parent) {
    for (const r of rects) {
      const pad = padFor(r, child, parent);
      if (pt.x > r.x + pad && pt.x < r.x + r.w - pad && pt.y > r.y + pad && pt.y < r.y + r.h - pad) return false;
    }
    return true;
  }

  function directPts(A, B, exitSide, entrySide) {
    const pts = [{ x: A.x, y: A.y }];
    const hx = exitSide === 'L' || exitSide === 'R';
    const hy = entrySide === 'L' || entrySide === 'R';
    if (hx && hy) {
      const mx = (A.x + B.x) / 2;
      pts.push({ x: mx, y: A.y }, { x: mx, y: B.y });
    } else if (!hx && !hy) {
      const my = (A.y + B.y) / 2;
      pts.push({ x: A.x, y: my }, { x: B.x, y: my });
    } else if (hx) {
      pts.push({ x: B.x, y: A.y });
    } else {
      pts.push({ x: A.x, y: B.y });
    }
    pts.push({ x: B.x, y: B.y });
    return pts;
  }
  function polyBlocked(pts, child, parent) {
    for (let i = 0; i + 1 < pts.length; i++) if (blocked(pts[i], pts[i + 1], child, parent)) return true;
    return false;
  }

  plans.forEach((p) => {
    p.direct = directPts(p.A, p.B, p.exitSide, p.entrySide);
    p.hard = p.self || polyBlocked(p.direct, p.e.child, p.e.parent) ? 1 : 0;
    p.span = Math.abs(p.A.x - p.B.x) + Math.abs(p.A.y - p.B.y);
  });
  // route the easy (already clear) relations first, so the hard ones have
  // to dodge a settled picture instead of the other way round
  const order = plans.slice().sort((a, b) => a.hard - b.hard || a.span - b.span || (a.e.id < b.e.id ? -1 : 1));

  const placed = [];

  function chooseStub(p) {
    const da = dirOf(p.exitSide);
    const db = dirOf(p.entrySide);
    for (const st of STUBS) {
      const A2 = { x: p.A.x + da[0] * st, y: p.A.y + da[1] * st };
      const B2 = { x: p.B.x + db[0] * st, y: p.B.y + db[1] * st };
      if (A2.x < 4 || A2.x > W - 4 || A2.y < 4 || A2.y > H - 4) continue;
      if (B2.x < 4 || B2.x > W - 4 || B2.y < 4 || B2.y > H - 4) continue;
      if (!pointFree(A2, p.e.child, p.e.parent)) continue;
      if (!pointFree(B2, p.e.child, p.e.parent)) continue;
      if (blocked(p.A, A2, p.e.child, p.e.parent)) continue;
      if (blocked(B2, p.B, p.e.child, p.e.parent)) continue;
      return { A2, B2, stub: st };
    }
    const st = STUBS[0];
    return {
      A2: { x: p.A.x + da[0] * st, y: p.A.y + da[1] * st },
      B2: { x: p.B.x + db[0] * st, y: p.B.y + db[1] * st },
      stub: st,
    };
  }

  function idxNear(arr, v) {
    let best = 0;
    for (let i = 1; i < arr.length; i++) if (Math.abs(arr[i] - v) < Math.abs(arr[best] - v)) best = i;
    return best;
  }

  function buildGrid(p, A2, B2) {
    const xs = [4, W - 4, p.A.x, A2.x, p.B.x, B2.x, (A2.x + B2.x) / 2];
    const ys = [4, H - 4, p.A.y, A2.y, p.B.y, B2.y, (A2.y + B2.y) / 2];
    // second lane just outside each stub: lets a later edge run parallel to
    // an earlier one instead of sharing its line
    const da = dirOf(p.exitSide);
    const db = dirOf(p.entrySide);
    xs.push(A2.x + da[0] * 6, B2.x + db[0] * 6);
    ys.push(A2.y + da[1] * 6, B2.y + db[1] * 6);
    for (const r of rects) {
      xs.push(r.x - CLEAR, r.x + r.w + CLEAR);
      ys.push(r.y - CLEAR, r.y + r.h + CLEAR);
    }
    const uniq = (arr) => {
      arr.sort((a, b) => a - b);
      const out = [];
      for (const v of arr) if (!out.length || Math.abs(v - out[out.length - 1]) > 0.01) out.push(v);
      return out;
    };
    const X = uniq(xs);
    const Y = uniq(ys);
    const nx = X.length;
    const ny = Y.length;
    const nodeAt = new Int32Array(nx * ny).fill(-1);
    const coords = [];
    for (let xi = 0; xi < nx; xi++) {
      for (let yi = 0; yi < ny; yi++) {
        const pt = { x: X[xi], y: Y[yi] };
        if (!pointFree(pt, p.e.child, p.e.parent)) continue;
        nodeAt[xi * ny + yi] = coords.length;
        coords.push({ x: pt.x, y: pt.y, xi, yi });
      }
    }
    return { X, Y, nx, ny, nodeAt, coords };
  }

  class Heap {
    constructor() {
      this.a = [];
    }
    get size() {
      return this.a.length;
    }
    push(x) {
      const a = this.a;
      a.push(x);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        const c = a[p];
        if (c.f < x.f || (c.f === x.f && c.seq <= x.seq)) break;
        a[i] = c;
        i = p;
      }
      a[i] = x;
    }
    pop() {
      const a = this.a;
      const top = a[0];
      const last = a.pop();
      if (a.length === 0) return top;
      a[0] = last;
      let i = 0;
      const n = a.length;
      const less = (u, v) => u.f < v.f || (u.f === v.f && u.seq < v.seq);
      while (true) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < n && less(a[l], a[m])) m = l;
        if (r < n && less(a[r], a[m])) m = r;
        if (m === i) break;
        const t = a[i];
        a[i] = a[m];
        a[m] = t;
        i = m;
      }
      return top;
    }
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  function astar(grid, sNode, gNode, startDir, endDir, stub, midX, midY, child, parent) {
    const { nx, ny, nodeAt, coords } = grid;
    const nStates = coords.length * 4;
    const gScore = new Float64Array(nStates).fill(Infinity);
    const prev = new Int32Array(nStates).fill(-1);
    const closed = new Uint8Array(nStates);
    const gp = coords[gNode];
    const h = (n) => Math.abs(coords[n].x - gp.x) + Math.abs(coords[n].y - gp.y);
    const startState = sNode * 4 + di[startDir];
    gScore[startState] = stub;
    const open = new Heap();
    let seq = 0;
    open.push({ f: stub + h(sNode), seq: seq++, state: startState });
    let best = Infinity;
    let bestState = -1;
    while (open.size) {
      const cur = open.pop();
      if (cur.f >= best) break;
      if (closed[cur.state]) continue;
      closed[cur.state] = 1;
      const node = cur.state >> 2;
      const d0 = cur.state & 3;
      if (node === gNode) {
        const fin = gScore[cur.state] + stub + (d0 !== di[endDir] ? BEND : 0);
        if (fin < best) {
          best = fin;
          bestState = cur.state;
        }
        continue;
      }
      const c = coords[node];
      for (let d = 0; d < 4; d++) {
        if (d === (d0 ^ 1)) continue;
        const xi = c.xi + dirs[d][0];
        const yi = c.yi + dirs[d][1];
        if (xi < 0 || xi >= nx || yi < 0 || yi >= ny) continue;
        const m = nodeAt[xi * ny + yi];
        if (m < 0) continue;
        const q = coords[m];
        if (blocked(c, q, child, parent)) continue;
        const len = Math.abs(q.x - c.x) + Math.abs(q.y - c.y);
        if (len < 1e-9) continue;
        const ns = m * 4 + d;
        if (closed[ns]) continue;
        let extra = d !== d0 ? BEND : 0;
        for (const sg of placed) {
          if (segCross(c, q, sg[0], sg[1])) extra += CROSS;
          else if (segOverlap(c, q, sg[0], sg[1])) extra += OVERLAP;
        }
        extra += MID_BIAS * (d === 0 || d === 1 ? Math.abs(c.y - midY) : Math.abs(c.x - midX));
        const ng = gScore[cur.state] + len + extra;
        if (ng + 1e-9 < gScore[ns]) {
          gScore[ns] = ng;
          prev[ns] = cur.state;
          open.push({ f: ng + h(m), seq: seq++, state: ns });
        }
      }
    }
    if (bestState < 0) return null;
    const path = [];
    let st = bestState;
    while (st >= 0) {
      path.push(coords[st >> 2]);
      st = prev[st];
    }
    path.reverse();
    return path;
  }

  const routes = new Map();
  let failed = 0;
  for (const p of order) {
    const { A2, B2, stub } = chooseStub(p);
    const grid = buildGrid(p, A2, B2);
    const sxi = idxNear(grid.X, A2.x);
    const syi = idxNear(grid.Y, A2.y);
    const gxi = idxNear(grid.X, B2.x);
    const gyi = idxNear(grid.Y, B2.y);
    const sNode = grid.nodeAt[sxi * grid.ny + syi];
    const gNode = grid.nodeAt[gxi * grid.ny + gyi];
    let path = null;
    if (sNode >= 0 && gNode >= 0) {
      path = astar(grid, sNode, gNode, p.exitSide, opp(p.entrySide), stub, (A2.x + B2.x) / 2, (A2.y + B2.y) / 2, p.e.child, p.e.parent);
    }
    let pts;
    if (path) {
      pts = [p.A].concat(path, [p.B]);
    } else {
      failed++;
      pts = p.direct;
    }
    // collapse duplicates and remember the segments
    const clean = [];
    for (const q of pts) {
      const last = clean[clean.length - 1];
      if (!last || Math.abs(last.x - q.x) > 0.01 || Math.abs(last.y - q.y) > 0.01) clean.push(q);
    }
    for (let i = 0; i + 1 < clean.length; i++) placed.push([clean[i], clean[i + 1]]);
    routes.set(p.e.id, {
      e: p.e,
      A: p.A,
      B: p.B,
      pts: clean.slice(1, -1),
    });
  }
  if (process.env.ERD_DEBUG) {
    console.log('    router: edges=' + plans.length + ' failed=' + failed + ' placedSegs=' + placed.length);
  }
  return usedEdges.map((e) => routes.get(e.id));
}

function buildDiagram(names, tables, edges, opts) {
  const measureMap = {};
  names.forEach((n) => (measureMap[n] = measure(tables[n])));
  const usedEdges = edges.filter((e) => names.includes(e.child) && names.includes(e.parent));
  const { pos, width, height } = layoutGraph(names, usedEdges, measureMap);
  // the table cells are written at integer coordinates; snap the layout so
  // the router uses exactly the same rectangles the renderer will draw
  names.forEach((n) => {
    pos[n].x = Math.round(pos[n].x);
    pos[n].y = Math.round(pos[n].y);
  });

  const cells = [];

  for (const n of names) {
    const t = tables[n];
    const p = pos[n];
    cells.push(
      '<mxCell id="t_' +
        n +
        '" value="' +
        esc(tableHtml(t, p.w)) +
        '" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;strokeWidth=0;align=center;verticalAlign=top;spacing=0;spacingTop=-5;spacingLeft=0;spacingRight=0;spacingBottom=0;container=0;collapsible=0;" vertex="1" parent="1">' +
        '<mxGeometry x="' +
        Math.round(p.x) +
        '" y="' +
        Math.round(p.y) +
        '" width="' +
        p.w +
        '" height="' +
        p.h +
        '" as="geometry"/></mxCell>'
    );
  }

  const routes = routeModuleEdges(names, tables, usedEdges, pos, width, height);
  for (const r of routes) {
    if (!r) throw new Error('missing route for an edge in ' + opts.id);
    const startArrow = r.e.isOneToOne ? (r.e.nullable ? 'ERzeroToOne' : 'ERone') : r.e.nullable ? 'ERzeroToMany' : 'ERmany';
    const pts =
      r.pts && r.pts.length
        ? '<Array as="points">' +
          r.pts
            .map((q) => '<mxPoint x="' + String(Math.round(q.x * 1000) / 1000) + '" y="' + String(Math.round(q.y * 1000) / 1000) + '"/>')
            .join('') +
          '</Array>'
        : '';
    cells.push(
      '<mxCell id="' +
        r.e.id +
        '" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1;startArrow=' +
        startArrow +
        ';startFill=0;startSize=8;endArrow=ERmandOne;endFill=0;endSize=8;exitX=' +
        r.A.ex.toFixed(3) +
        ';exitY=' +
        r.A.ey.toFixed(3) +
        ';exitDx=0;exitDy=0;entryX=' +
        r.B.ex.toFixed(3) +
        ';entryY=' +
        r.B.ey.toFixed(3) +
        ';entryDx=0;entryDy=0;" edge="1" parent="1" source="t_' +
        r.e.child +
        '" target="t_' +
        r.e.parent +
        '">' +
        '<mxGeometry relative="1" as="geometry">' +
        pts +
        '</mxGeometry></mxCell>'
    );
  }

  const W = Math.round(width);
  const H = Math.round(height);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<mxfile host="app.diagrams.net" modified="2026-11-01T00:00:00.000Z" agent="5.0" version="24.0.0" etag="erd" type="device">\n' +
    '  <diagram id="' +
    opts.id +
    '" name="' +
    esc(opts.name) +
    '">\n' +
    '    <mxGraphModel dx="1600" dy="1000" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="' +
    W +
    '" pageHeight="' +
    H +
    '" background="#ffffff" math="0" shadow="0">\n' +
    '      <root>\n        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n        ' +
    cells.join('\n        ') +
    '\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n'
  );
}

// ============================================================
// 6b. Hub diagram emitter (ERD-ALL)
// ============================================================
function buildHubDiagram(names, tables, edges, opts) {
  const measureMap = {};
  names.forEach((n) => (measureMap[n] = measure(tables[n])));
  const usedEdges = edges.filter((e) => names.includes(e.child) && names.includes(e.parent));
  const { pos, blocks, tableInfo, width, height } = layoutHub(names, tables, usedEdges, measureMap);

  const cells = [];

  for (const n of names) {
    const t = tables[n];
    const p = pos[n];
    cells.push(
      '<mxCell id="t_' +
        n +
        '" value="' +
        esc(tableHtml(t, p.w)) +
        '" style="rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=none;strokeWidth=0;align=center;verticalAlign=top;spacing=0;spacingTop=-5;spacingLeft=0;spacingRight=0;spacingBottom=0;container=0;collapsible=0;" vertex="1" parent="1">' +
        '<mxGeometry x="' +
        Math.round(p.x) +
        '" y="' +
        Math.round(p.y) +
        '" width="' +
        p.w +
        '" height="' +
        p.h +
        '" as="geometry"/></mxCell>'
    );
  }

  const centreOf = (p) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 });
  function sideFrom(a, b) {
    const ca = centreOf(a);
    const cb = centreOf(b);
    const dx = cb.x - ca.x;
    const dy = cb.y - ca.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'R' : 'L';
    return dy > 0 ? 'B' : 'T';
  }

  // spread the (many) User entries along the side they arrive on so they do
  // not all converge on the single User.id row
  const PIN_MODE = process.env.HUB_PINWHEEL !== '0';
  // Which face of User an edge arrives on. The default uses the side of the
  // child's module block: a block on the top band enters User from the top,
  // and so on. That keeps every line inside its own quadrant and avoids the
  // crossings the ray-projection rule created between neighbouring sides.
  const naturalFace = { R: 'R', L: 'L', D: 'B', U: 'T' };
  const USER_FACE = process.env.HUB_USER_FACE || 'side';
  const userSide = (e) => {
    if (!PIN_MODE || !tableInfo[e.child]) return sideFrom(pos['User'], pos[e.child]);
    if (USER_FACE === 'side') return naturalFace[tableInfo[e.child].side];
    const p = pos[e.child];
    const u = pos['User'];
    const dx = p.x + p.w / 2 - (u.x + u.w / 2);
    const dy = p.y + p.h / 2 - (u.y + u.h / 2);
    const tx = u.w / 2 / (Math.abs(dx) || 1e-9);
    const ty = u.h / 2 / (Math.abs(dy) || 1e-9);
    if (tx <= ty) return dx > 0 ? 'R' : 'L';
    return dy > 0 ? 'B' : 'T';
  };
  const bySide = { L: [], R: [], T: [], B: [] };
  usedEdges.forEach((e) => {
    if (e.parent === 'User' && e.child !== 'User') bySide[userSide(e)].push(e);
  });
  const entryFrac = {};
  Object.entries(bySide).forEach(([side, arr]) => {
    const horiz = side === 'L' || side === 'R';
    arr.sort((a, b) => {
      const ca = centreOf(pos[a.child]);
      const cb = centreOf(pos[b.child]);
      return horiz ? ca.y - cb.y : ca.x - cb.x;
    });
    arr.forEach((e, i) => {
      entryFrac[e.id] = arr.length === 1 ? 0.5 : 0.06 + (0.88 * i) / (arr.length - 1);
    });
  });

  // --- routing --------------------------------------------------------
  // Lines stay inside their own module block whenever possible. When a
  // line would have to run over another table it is re-routed: either
  // radially inside its block, or through the empty middle of the ring.
  const innerSide = { R: 'L', L: 'R', D: 'T', U: 'B' };
  const inVec = { R: [-1, 0], L: [1, 0], D: [0, -1], U: [0, 1] };
  const outVec = { R: [1, 0], L: [-1, 0], D: [0, 1], U: [0, -1] };

  function faceAnchor(p, side, rowF, crossF) {
    if (side === 'L') return { x: p.x, y: p.y + rowF * p.h, ex: 0, ey: rowF };
    if (side === 'R') return { x: p.x + p.w, y: p.y + rowF * p.h, ex: 1, ey: rowF };
    if (side === 'T') return { x: p.x + crossF * p.w, y: p.y, ex: crossF, ey: 0 };
    return { x: p.x + crossF * p.w, y: p.y + p.h, ex: crossF, ey: 1 };
  }

  const rowFrac = (t, row) => anchorY(t, row < 0 ? 0 : row);
  const rowOf = (t, name) => t.rows.findIndex((r) => r.name === name);

  function emit(e, a, b, points) {
    const startArrow = e.isOneToOne ? (e.nullable ? 'ERzeroToOne' : 'ERone') : e.nullable ? 'ERzeroToMany' : 'ERmany';
    let geo = '<mxGeometry relative="1" as="geometry"/>';
    if (points && points.length) {
      geo =
        '<mxGeometry relative="1" as="geometry"><Array as="points">' +
        points.map((p) => '<mxPoint x="' + Math.round(p.x) + '" y="' + Math.round(p.y) + '"/>').join('') +
        '</Array></mxGeometry>';
    }
    cells.push(
      '<mxCell id="' +
        e.id +
        '" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1;startArrow=' +
        startArrow +
        ';startFill=0;startSize=8;endArrow=ERmandOne;endFill=0;endSize=8;exitX=' +
        a.ex.toFixed(3) +
        ';exitY=' +
        a.ey.toFixed(3) +
        ';exitDx=0;exitDy=0;entryX=' +
        b.ex.toFixed(3) +
        ';entryY=' +
        b.ey.toFixed(3) +
        ';entryDx=0;entryDy=0;" edge="1" parent="1" source="t_' +
        e.child +
        '" target="t_' +
        e.parent +
        '">' +
        geo +
        '</mxCell>'
    );
  }

  // --- collision test --------------------------------------------------
  const rects = names.map((n) => ({ n, x: pos[n].x, y: pos[n].y, w: pos[n].w, h: pos[n].h }));
  function segHits(a, b, r, pad) {
    const x0 = r.x + pad;
    const x1 = r.x + r.w - pad;
    const y0 = r.y + pad;
    const y1 = r.y + r.h - pad;
    if (x0 >= x1 || y0 >= y1) return false;
    let t0 = 0;
    let t1 = 1;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const pp = [-dx, dx, -dy, dy];
    const qq = [a.x - x0, x1 - a.x, a.y - y0, y1 - a.y];
    for (let i = 0; i < 4; i++) {
      if (pp[i] === 0) {
        if (qq[i] < 0) return false;
      } else {
        const t = qq[i] / pp[i];
        if (pp[i] < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }
    return t1 > t0 + 1e-6;
  }
  function polyHits(pts, skip) {
    // negative pad = keep a few px of clearance around every table, so a line
    // may not graze a table border either
    for (let i = 0; i + 1 < pts.length; i++) {
      for (const r of rects) {
        if (skip.indexOf(r.n) >= 0) continue;
        if (segHits(pts[i], pts[i + 1], r, -6)) return true;
      }
    }
    return false;
  }
  function orthogonalRoute(A, B, exitSide, entrySide) {
    const pts = [{ x: A.x, y: A.y }];
    const hx = exitSide === 'L' || exitSide === 'R';
    const hy = entrySide === 'L' || entrySide === 'R';
    if (hx && hy) {
      const mx = (A.x + B.x) / 2;
      pts.push({ x: mx, y: A.y }, { x: mx, y: B.y });
    } else if (!hx && !hy) {
      const my = (A.y + B.y) / 2;
      pts.push({ x: A.x, y: my }, { x: B.x, y: my });
    } else if (hx) {
      pts.push({ x: B.x, y: A.y });
    } else {
      pts.push({ x: A.x, y: B.y });
    }
    pts.push({ x: B.x, y: B.y });
    return pts;
  }

  // --- plan ------------------------------------------------------------
  const holePlan = [];
  const localPlan = [];
  const gutterPlan = [];
  const directPlan = [];
  const userPlan = [];

  for (const e of usedEdges) {
    const ci = tableInfo[e.child];
    const pi = tableInfo[e.parent];
    const ct = tables[e.child];
    const pt = tables[e.parent];
    const fkF = rowFrac(ct, rowOf(ct, e.fkCols[0]));
    const refF = rowFrac(pt, rowOf(pt, e.refCols[0]));

    // links to the shared User table always leave a block radially, so they
    // can never run along the inside of the ring
    if (e.parent === 'User' && ci) {
      const A = faceAnchor(pos[e.child], innerSide[ci.side], fkF, 0.5);
      const us = userSide(e);
      const frac = entryFrac[e.id];
      const B = faceAnchor(pos['User'], us, frac !== undefined ? frac : 0.5, frac !== undefined ? frac : 0.5);
      userPlan.push({ e, A, B, exitSide: innerSide[ci.side], entrySide: us });
      continue;
    }

    const exitSide = sideFrom(pos[e.child], pos[e.parent]);
    const entrySide = sideFrom(pos[e.parent], pos[e.child]);
    const A = faceAnchor(pos[e.child], exitSide, fkF, 0.5);
    const B = faceAnchor(pos[e.parent], entrySide, refF, 0.5);
    const pts = orthogonalRoute(A, B, exitSide, entrySide);

    if (!polyHits(pts, [e.child, e.parent])) {
      directPlan.push({ e, A, B, exitSide, entrySide });
      continue;
    }

    if (ci && pi) {
      if (ci.depth === 0 && pi.depth === 0) holePlan.push({ e, ci, pi, ct, pt, fkF, refF });
      else if (ci.block === pi.block && ci.depth > pi.depth)
        localPlan.push({ e, ci, pi, ct, pt, fkF, refF, childSide: innerSide[ci.side], parentSide: pi.side });
      else if (ci.block === pi.block && ci.depth < pi.depth)
        localPlan.push({ e, ci, pi, ct, pt, fkF, refF, childSide: ci.side, parentSide: innerSide[pi.side] });
      else if (ci.block === pi.block) gutterPlan.push({ e, ci, pi, ct, pt, fkF, refF });
      else holePlan.push({ e, ci, pi, ct, pt, fkF, refF });
    } else {
      directPlan.push({ e, A, B, exitSide, entrySide });
    }
  }

  // spread the anchors when several lines share one edge of a table
  const touch = {};
  holePlan.forEach((h) => {
    touch[h.e.child] = (touch[h.e.child] || 0) + 1;
    touch[h.e.parent] = (touch[h.e.parent] || 0) + 1;
  });
  const slot = {};
  function nextCross(n) {
    const total = touch[n] || 1;
    const k = slot[n] || 0;
    slot[n] = k + 1;
    return total <= 1 ? 0.5 : 0.2 + (0.6 * k) / (total - 1);
  }

  holePlan.forEach((h) => {
    const a = pos[h.e.child];
    const b = pos[h.e.parent];
    h.span = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  });
  holePlan.sort((a, b) => a.span - b.span);
  holePlan.forEach((h, i) => (h.depth = HUB.CORRIDOR + HUB.CORRIDOR_STEP * i));

  const gutterUse = {};
  const nextGutter = (key) => {
    const k = gutterUse[key] || 0;
    gutterUse[key] = k + 1;
    return 40 + 20 * k;
  };

  // --- routing helpers -------------------------------------------------
  const dirOf = (side) => (side === 'L' ? [-1, 0] : side === 'R' ? [1, 0] : side === 'T' ? [0, -1] : [0, 1]);
  function segCross(a, b, c, d) {
    const aH = a.y === b.y;
    const cH = c.y === d.y;
    if (aH === cH) return false;
    const h0 = aH ? a : c;
    const h1 = aH ? b : d;
    const v0 = aH ? c : a;
    const v1 = aH ? d : b;
    const hx0 = Math.min(h0.x, h1.x);
    const hx1 = Math.max(h0.x, h1.x);
    const vy0 = Math.min(v0.y, v1.y);
    const vy1 = Math.max(v0.y, v1.y);
    return v0.x > hx0 && v0.x < hx1 && h0.y > vy0 && h0.y < vy1;
  }
  const segLen = (p, q) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y);

  const placedSegs = [];
  const routes = [];
  function routeScore(pts) {
    let len = 0;
    let cross = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      len += segLen(pts[k], pts[k + 1]);
      for (const sg of placedSegs) if (segCross(pts[k], pts[k + 1], sg[0], sg[1])) cross++;
    }
    return len + HUB.CROSS_W * cross;
  }
  function remember(pts) {
    for (let k = 0; k + 1 < pts.length; k++) placedSegs.push([pts[k], pts[k + 1]]);
  }
  // orthogonal elbows between two anchors: two plain L shapes, three
  // mid-line variants, and (when given) one route through forced waypoints
  function elbows(A, B, exitSide, entrySide, forced) {
    const da = dirOf(exitSide);
    const db = dirOf(entrySide);
    const out = [];
    const base = 14;
    const A2 = { x: A.x + da[0] * base, y: A.y + da[1] * base };
    const B2 = { x: B.x + db[0] * base, y: B.y + db[1] * base };
    if (forced && forced.length) out.push([A, A2].concat(forced, [B2, B]));
    for (const st of [base, 44, 96]) {
      const a2 = { x: A.x + da[0] * st, y: A.y + da[1] * st };
      const b2 = { x: B.x + db[0] * st, y: B.y + db[1] * st };
      out.push([A, a2, { x: b2.x, y: a2.y }, b2, B]);
      out.push([A, a2, { x: a2.x, y: b2.y }, b2, B]);
      for (const f of [0.5, 0.3, 0.7]) {
        const mx = a2.x + (b2.x - a2.x) * f;
        out.push([A, a2, { x: mx, y: a2.y }, { x: mx, y: b2.y }, b2, B]);
        const my = a2.y + (b2.y - a2.y) * f;
        out.push([A, a2, { x: a2.x, y: my }, { x: b2.x, y: my }, b2, B]);
      }
    }
    return out;
  }
  // last resort: slide the middle of the route along every free corridor
  // between table edges, so a line that cannot use a short elbow still gets
  // around the table that blocks it instead of cutting straight through
  function corridorRoutes(A, B, exitSide, entrySide) {
    const da = dirOf(exitSide);
    const db = dirOf(entrySide);
    const st = 14;
    const A2 = { x: A.x + da[0] * st, y: A.y + da[1] * st };
    const B2 = { x: B.x + db[0] * st, y: B.y + db[1] * st };
    const xs = [A2.x, B2.x];
    const ys = [A2.y, B2.y];
    for (const r of rects) {
      xs.push(r.x - 8, r.x + r.w + 8);
      ys.push(r.y - 8, r.y + r.h + 8);
    }
    const out = [];
    for (const x of xs) out.push([A, A2, { x, y: A2.y }, { x, y: B2.y }, B2, B]);
    for (const y of ys) out.push([A, A2, { x: A2.x, y }, { x: B2.x, y }, B2, B]);
    return out;
  }
  function routeSmart(e, A, B, exitSide, entrySide, forced) {
    let pick = null;
    for (const pts of elbows(A, B, exitSide, entrySide, forced)) {
      if (polyHits(pts, [e.child, e.parent])) continue;
      const sc = routeScore(pts);
      if (!pick || sc < pick.sc) pick = { pts, sc };
    }
    if (!pick) {
      for (const pts of corridorRoutes(A, B, exitSide, entrySide)) {
        if (polyHits(pts, [e.child, e.parent])) continue;
        const sc = routeScore(pts);
        if (!pick || sc < pick.sc) pick = { pts, sc };
      }
    }
    if (!pick) pick = { pts: orthogonalRoute(A, B, exitSide, entrySide) };
    remember(pick.pts);
    routes.push({ e, A, B, pts: pick.pts.slice(1, -1) });
  }

  if (!PIN_MODE) {
    // --- classic plans ---------------------------------------------------
    for (const d of directPlan) emit(d.e, d.A, d.B, d.pts || null);
    for (const u of userPlan) emit(u.e, u.A, u.B, null);
    for (const l of localPlan) {
      const A = faceAnchor(pos[l.e.child], l.childSide, l.fkF, 0.5);
      const B = faceAnchor(pos[l.e.parent], l.parentSide, l.refF, 0.5);
      emit(l.e, A, B, null);
    }
    for (const g of gutterPlan) {
      const side = g.ci.side;
      const off = nextGutter(g.ci.block + ':' + side);
      const A = faceAnchor(pos[g.e.child], side, g.fkF, 0.3);
      const B = faceAnchor(pos[g.e.parent], side, g.refF, 0.7);
      const v = outVec[side];
      emit(g.e, A, B, [
        { x: A.x + v[0] * off, y: A.y + v[1] * off },
        { x: B.x + v[0] * off, y: B.y + v[1] * off },
      ]);
    }
    for (const h of holePlan) {
      const A = faceAnchor(pos[h.e.child], innerSide[h.ci.side], h.fkF, nextCross(h.e.child));
      const B = faceAnchor(pos[h.e.parent], innerSide[h.pi.side], h.refF, nextCross(h.e.parent));
      const va = inVec[h.ci.side];
      const vb = inVec[h.pi.side];
      emit(h.e, A, B, [
        { x: A.x + va[0] * h.depth, y: A.y + va[1] * h.depth },
        { x: B.x + vb[0] * h.depth, y: B.y + vb[1] * h.depth },
      ]);
    }
  } else {
    // --- pinwheel plans --------------------------------------------------
    // Cross-module lines first (least freedom), then the User lines, so the
    // latter can dodge whatever is already on the page.
    for (const d of directPlan) routeSmart(d.e, d.A, d.B, d.exitSide, d.entrySide);
    for (const l of localPlan) {
      const A = faceAnchor(pos[l.e.child], l.childSide, l.fkF, 0.5);
      const B = faceAnchor(pos[l.e.parent], l.parentSide, l.refF, 0.5);
      routeSmart(l.e, A, B, l.childSide, l.parentSide);
    }
    for (const g of gutterPlan) {
      const side = g.ci.side;
      const off = nextGutter(g.ci.block + ':' + side);
      const A = faceAnchor(pos[g.e.child], side, g.fkF, 0.3);
      const B = faceAnchor(pos[g.e.parent], side, g.refF, 0.7);
      const v = outVec[side];
      routeSmart(g.e, A, B, side, side, [
        { x: A.x + v[0] * off, y: A.y + v[1] * off },
        { x: B.x + v[0] * off, y: B.y + v[1] * off },
      ]);
    }
    for (const h of holePlan) {
      const A = faceAnchor(pos[h.e.child], innerSide[h.ci.side], h.fkF, nextCross(h.e.child));
      const B = faceAnchor(pos[h.e.parent], innerSide[h.pi.side], h.refF, nextCross(h.e.parent));
      const va = inVec[h.ci.side];
      const vb = inVec[h.pi.side];
      routeSmart(h.e, A, B, innerSide[h.ci.side], innerSide[h.pi.side], [
        { x: A.x + va[0] * h.depth, y: A.y + va[1] * h.depth },
        { x: B.x + vb[0] * h.depth, y: B.y + vb[1] * h.depth },
      ]);
    }
    userPlan.sort((a, b) => segLen(a.A, a.B) - segLen(b.A, b.B));
    for (const u of userPlan) routeSmart(u.e, u.A, u.B, u.exitSide, u.entrySide);
    for (const r of routes) emit(r.e, r.A, r.B, r.pts.length ? r.pts : null);
  }

  if (process.env.HUB_DEBUG) {
    console.log(
      'edges: direct=' + directPlan.length + ' hole=' + holePlan.length + ' local=' + localPlan.length + ' gutter=' + gutterPlan.length
    );
  }

  const W = Math.round(width);
  const H = Math.round(height);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<mxfile host="app.diagrams.net" modified="2026-11-01T00:00:00.000Z" agent="5.0" version="24.0.0" etag="erd" type="device">\n' +
    '  <diagram id="' +
    opts.id +
    '" name="' +
    esc(opts.name) +
    '">\n' +
    '    <mxGraphModel dx="1600" dy="1000" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="' +
    W +
    '" pageHeight="' +
    H +
    '" background="#ffffff" math="0" shadow="0">\n' +
    '      <root>\n        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n        ' +
    cells.join('\n        ') +
    '\n      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n'
  );
}

// ============================================================
// 7. Run
// ============================================================
const src = fs.readFileSync(SCHEMA, 'utf8');
const { models, enums } = parsePrisma(src);
const tables = buildTables(models, enums);
const edges = buildEdges(models, tables);

// Grouping is taken verbatim from Report 3 (docs/Report 3/image/ERD), extracted from the
// embedded diagram source. Each page of Report 3 shows the module tables plus the shared
// "User" context table; every one of the 64 Prisma models is covered at least once.
const GROUPS = {
  ERD1: ['User', 'Session', 'OauthAccount', 'TwoFactorAuth', 'UserSetting', 'VerificationCode'],
  ERD2: ['User', 'Role', 'UserRole', 'Permission', 'RolePermission'],
  ERD3: ['User', 'Profile', 'FreelancerProfile', 'ClientProfile', 'Expert'],
  ERD4: ['User', 'Profile', 'ProfileRevision', 'SocialLink'],
  ERD5: ['User', 'IdVerificationDocument', 'ProfileVisitLog'],
  ERD6: ['User', 'FreelancerProfile', 'FreelancerSkill', 'Skill', 'PortfolioItem', 'PortfolioLike'],
  ERD7: ['User', 'FavoriteFreelancer', 'FollowFreelancer'],
  ERD8: ['User', 'Job', 'JobCategory', 'JobJobCategory', 'JobSkill', 'Skill'],
  ERD9: ['User', 'Job', 'JobBookmark', 'RecentlyViewedJob', 'SavedSearch', 'JobAlert'],
  ERD10: ['Job', 'User', 'Proposal', 'ProposalAttachment'],
  ERD11: ['Job', 'Proposal', 'User', 'Contract', 'ContractTermTemplate'],
  ERD12: ['User', 'Contract', 'Milestone', 'MilestoneFile', 'ProjectProgressUpdate'],
  ERD13: ['User', 'Milestone', 'MilestoneFile', 'MilestoneSubmission', 'MilestoneSubmissionFile'],
  ERD14: ['User', 'Contract', 'Invoice', 'Transaction', 'Certificate'],
  ERD15: ['Contract', 'Milestone', 'User', 'SharedFile', 'Dispute'],
  ERD16: ['User', 'Dispute', 'DisputeFee', 'DisputeEvidence', 'SharedFile', 'DisputeDecisionReview'],
  ERD17: ['Contract', 'User', 'Review', 'ReviewResponse'],
  ERD18: ['ForumCategory', 'ForumPost', 'User', 'ForumComment'],
  ERD19: ['User', 'ForumPost', 'ForumComment', 'ForumLike'],
  ERD20: ['User', 'ForumPost', 'ForumComment', 'ForumReport'],
  ERD21: ['User', 'Conversation', 'DirectMessage', 'Notification'],
  ERD22: ['User', 'ModerationQueue', 'BannedKeyword', 'AnnouncementBanner', 'AdvertisementBanner', 'SystemSetting'],
};

// Module titles as used by Report 3 (\paragraph headings of section 3.1.5).
const MODULE_TITLES = {
  ERD1: 'Authentication & Sessions',
  ERD2: 'Role-Based Access Control',
  ERD3: 'Profile Core',
  ERD4: 'Profile History & Social Links',
  ERD5: 'Identity Verification & Profile Visits',
  ERD6: 'Portfolio & Skills',
  ERD7: 'Favorites & Follows',
  ERD8: 'Job Posting',
  ERD9: 'Job Discovery & Alerts',
  ERD10: 'Proposal',
  ERD11: 'Contract',
  ERD12: 'Milestone & Project Progress',
  ERD13: 'Milestone Submission',
  ERD14: 'Escrow, Payments & Certificates',
  ERD15: 'Dispute Core',
  ERD16: 'Dispute Resolution',
  ERD17: 'Reviews & Reputation',
  ERD18: 'Forum Posts & Comments',
  ERD19: 'Forum Likes',
  ERD20: 'Forum Reports & Moderation',
  ERD21: 'Messaging & Notifications',
  ERD22: 'Administration & System',
};

// sanity
for (const [g, arr] of Object.entries(GROUPS)) {
  arr.forEach((n) => {
    if (!tables[n]) throw new Error(g + ' unknown table ' + n);
  });
}

for (const [g, arr] of Object.entries(GROUPS)) {
  const label = g + ' - ' + MODULE_TITLES[g];
  const xml = buildDiagram(arr, tables, edges, { id: 'erd-' + g.toLowerCase(), name: label });
  fs.writeFileSync(path.join(DIR, 'ERD-' + g + '.drawio'), xml);
  const { width, height } = { width: xml.match(/pageWidth="(\d+)"/)[1], height: xml.match(/pageHeight="(\d+)"/)[1] };
  console.log(g + ': ' + arr.length + ' tables, ' + width + 'x' + height);
}

// ALL
if (process.env.ERD_SKIP_ALL === '1') {
  console.log('ALL: skipped (ERD_SKIP_ALL=1)');
} else {
  const allNames = Object.keys(models);
  const allXml = buildHubDiagram(allNames, tables, edges, { id: 'erd-all', name: 'ERD-ALL - Overall Entity Relationship Diagram' });
  fs.writeFileSync(path.join(DIR, 'ERD-ALL.drawio'), allXml);
  console.log('ALL: ' + allNames.length + ' tables, ' + allXml.match(/pageWidth="(\d+)"/)[1] + 'x' + allXml.match(/pageHeight="(\d+)"/)[1]);
}
