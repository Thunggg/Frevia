/**
 * Generator: mxGraphModel (draw.io) UML Sequence Diagrams
 * Chuẩn theo file mẫu: umlActor / umlLifeline / activation (orthogonalPerimeter) /
 * alt-opt (umlFrame) / database (mxgraph.flowchart.database).
 *
 * Thứ tự lifeline: Actor -> View -> Route -> Controller -> Service -> Repo -> Model -> Database
 *
 * Run: node tools/generate.js
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..');

/* ------------------------- helpers ------------------------- */
const esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const M  = (label, from, to, type = 'call') => ({ label, from, to, type });
const Fs = (id, ftype, guard, inset = 0) => ({ frame: true, op: 'start',   frameId: id, ftype, guard, inset });
const Fe = (id)                            => ({ frame: true, op: 'end',     frameId: id });
const Fd = (id, guard)                     => ({ frame: true, op: 'divider', frameId: id, guard });

// Hops quay về theo chiều ngược: db->model->repo->service->controller->route->view
const HOPS = [
  ['db', 'model'], ['model', 'repo'], ['repo', 'service'],
  ['service', 'controller'], ['controller', 'route'], ['route', 'view'],
];
function back(nums, label = 'Return result') {
  return nums.map((n, i) => M(`${n}. ${label}`, HOPS[i][0], HOPS[i][1], 'ret'));
}
// Bước View kiểm tra dữ liệu nhập trước khi gửi request (như mẫu: "2. Check validate email")
const vcheck = (n, what) => M(`${n}. Check validate ${what}`, 'view', 'view', 'self');
const INVALID_MSG = 'Display message that required input valid fields';

// Bước Service kiểm tra kết quả query từ DB (như mẫu: "11. Check query database")
const check = (n) => M(`${n}. Check query database`, 'service', 'service', 'call');

// Một nhánh alt/opt: 4 message đi ngược về actor (3 hop + hiển thị / return cuối)
function branch(p, label, show) {
  return [
    M(`${p}.1. ${label}`, 'service', 'controller', 'ret'),
    M(`${p}.2. ${label}`, 'controller', 'route', 'ret'),
    M(`${p}.3. ${label}`, 'route', 'view', 'ret'),
    M(`${p}.4. ${show}`, 'view', 'actor', 'ret'),
  ];
}

/* ------------------------- layout ------------------------- */
const LIFE_Y = 240, FIRST_Y = 330;
const LIFE_H_STD = 1560; // chiều cao tối thiểu của lifeline

const KEY_LABEL = { view: 'View', route: 'Route', controller: 'Controller', service: 'Service', jwt: 'JwtService', repo: 'Repo', model: 'Model' };

// Bố cục lifeline: có cột :JwtService (diagram auth) hoặc không
function layoutFor(spec) {
  if (spec.jwt) {
    return {
      keys: ['view', 'route', 'controller', 'service', 'jwt', 'repo', 'model'],
      columns: {
        view: { x: 200, w: 150 }, route: { x: 420, w: 100 }, controller: { x: 620, w: 140 },
        service: { x: 830, w: 130 }, jwt: { x: 975, w: 110 }, repo: { x: 1140, w: 130 }, model: { x: 1350, w: 100 },
      },
      cx: { actor: 135, view: 275, route: 470, controller: 690, service: 895, jwt: 1030, repo: 1205, model: 1400, db: 1545 },
      dbX: 1515, actDbX: 1540, frameR: 1640,
    };
  }
  return {
    keys: ['view', 'route', 'controller', 'service', 'repo', 'model'],
    columns: {
      view: { x: 200, w: 150 }, route: { x: 420, w: 100 }, controller: { x: 620, w: 140 },
      service: { x: 830, w: 130 }, repo: { x: 1040, w: 130 }, model: { x: 1240, w: 100 },
    },
    cx: { actor: 135, view: 275, route: 470, controller: 690, service: 895, repo: 1105, model: 1290, db: 1450 },
    dbX: 1420, actDbX: 1445, frameR: 1530,
  };
}
const FRAME_L = 90;

const ST = {
  lifeline: 'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;newEdgeStyle={"curved":0,"rounded":0};',
  activation: 'html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;newEdgeStyle={"curved":0,"rounded":0};',
  actor: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;whiteSpace=wrap;',
  frame: 'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=80;height=30;',
  ref: 'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=110;height=30;fontSize=12;',
  refText: 'text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;fontSize=12;',
  text: 'text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;',
  db: 'strokeWidth=2;html=1;shape=mxgraph.flowchart.database;whiteSpace=wrap;',
  call: 'html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;',
  ret: 'html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;curved=0;rounded=0;',
  dashedLine: 'endArrow=none;dashed=1;html=1;rounded=0;',
};

function vertex(id, value, style, parent, x, y, w, h) {
  return `<mxCell id="${id}" value="${esc(value)}" style="${esc(style)}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}
function edge(id, label, style, source, target, srcPt, tgtPt, waypoints) {
  const s = source ? ` source="${source}"` : '';
  const t = target ? ` target="${target}"` : '';
  let geo = '<mxGeometry relative="1" as="geometry">';
  if (waypoints && waypoints.length) {
    geo += '<Array as="points">' + waypoints.map(p => `<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('') + '</Array>';
  }
  if (srcPt) geo += `<mxPoint x="${srcPt[0]}" y="${srcPt[1]}" as="sourcePoint"/>`;
  if (tgtPt) geo += `<mxPoint x="${tgtPt[0]}" y="${tgtPt[1]}" as="targetPoint"/>`;
  geo += '</mxGeometry>';
  return `<mxCell id="${id}" value="${esc(label)}" style="${esc(style)}" edge="1"${s}${t} parent="1">${geo}</mxCell>`;
}

/* ------------------------- builder ------------------------- */
function build(spec) {
  let idc = 1;
  const nid = () => 'c' + (++idc);

  // 1. Tính tọa độ y cho từng message
  const lay = layoutFor(spec);
  const rows = spec.msgs.filter(m => !m.frame);
  const n = rows.length;
  const step = n <= 16 ? 60 : Math.max(38, Math.floor(1800 / (n - 1)));
  rows.forEach((r, i) => { r.y = FIRST_Y + i * step; });
  const lifeH = Math.max(LIFE_H_STD, rows[n - 1].y + 90 - LIFE_Y);

  // 2. Ghép frame (top/bottom/divider)
  const frames = {};
  let ri = 0;
  for (const it of spec.msgs) {
    if (it.frame) {
      if (it.op === 'start') {
        frames[it.frameId] = { type: it.ftype, guard: it.guard, inset: it.inset | 0, top: rows[ri].y - 25 };
      } else if (it.op === 'end') {
        frames[it.frameId].bottom = rows[ri - 1].y + 25;
      } else if (it.op === 'divider') {
        frames[it.frameId].dividerY = rows[ri] ? rows[ri].y - 22 : rows[ri - 1].y + step / 2;
        frames[it.frameId].guard2 = it.guard;
      }
    } else { ri++; }
  }

  const cells = [];
  cells.push('<mxCell id="0"/>', '<mxCell id="1" parent="0"/>');

  // 3. Frames (vẽ trước để nằm dưới cùng)
  for (const f of Object.values(frames)) {
    const fx = FRAME_L + f.inset * 28;
    const fw = (lay.frameR - FRAME_L) - f.inset * 56;
    cells.push(vertex(nid(), f.type, ST.frame, '1', fx, f.top, fw, f.bottom - f.top));
    cells.push(vertex(nid(), f.guard, ST.text, '1', fx + 150, f.top, 260, 30));
    if (f.dividerY != null) {
      cells.push(edge(nid(), '', ST.dashedLine, '', '', [fx, f.dividerY], [fx + fw, f.dividerY]));
      cells.push(vertex(nid(), f.guard2, ST.text, '1', fx + 150, f.dividerY, 260, 30));
    }
  }

  // 3b. Ref frames (như mẫu: umlFrame 'ref' chứa step number của flow verify JWT)
  // trả và được chèn tự động sau mỗi bước GET/POST/PUT/DELETE (chức năng cần đăng nhập)
  const refs = [];
  if (!spec.noRef) {
    const httpRe = /^\d+\.\s+(GET|POST|PUT|DELETE|PATCH)\b/;
    rows.forEach((r, i) => {
      if (httpRe.test(r.label)) {
        const next = rows[i + 1];
        const num = r.label.split('.')[0].trim();
        refs.push({ label: `${num}.1. Verify jwt`, y: (r.y + (next ? next.y : r.y + step)) / 2 });
      }
    });
  }
  for (const rf of refs) {
    cells.push(vertex(nid(), 'ref', ST.ref, '1', 420, rf.y - 25, 300, 50));
    cells.push(vertex(nid(), rf.label, ST.refText, '1', 435, rf.y - 9, 270, 18));
  }

  // 4. Lifelines + Actor + Database
  cells.push(vertex('lf_actor', spec.actor, ST.actor, '1', 120, 200, 30, 60));
  for (const k of lay.keys) {
    const col = lay.columns[k];
    const label = k === 'jwt' ? `:${KEY_LABEL.jwt}`
      : (k === 'model' && spec.model ? `:${spec.model}` : `:${spec.domain}${KEY_LABEL[k]}`);
    cells.push(vertex(`lf_${k}`, label, ST.lifeline, '1', col.x, LIFE_Y, col.w, lifeH));
  }
  cells.push(vertex('node_db', 'Database', ST.db, '1', lay.dbX, 220, 60, 70));
  cells.push(vertex('node_db_label2', 'Database', ST.text, '1', lay.dbX, 292, 60, 30));

  // 5. Activations — tính span trước, vẽ nét đứt dưới, rồi vẽ bar
  let actorTop = Infinity, actorBot = -Infinity, dbTop = Infinity, dbBot = -Infinity;
  for (const r of rows) {
    for (const p of [r.from, r.to]) {
      if (p === 'actor') { actorTop = Math.min(actorTop, r.y); actorBot = Math.max(actorBot, r.y); }
      if (p === 'db')    { dbTop = Math.min(dbTop, r.y); dbBot = Math.max(dbBot, r.y); }
    }
  }
  // Nét đứt vẽ TRƯỚC activation để nằm dưới bar như mẫu
  cells.push(edge('dash_actor', '', ST.dashedLine, '', '', [135, 260], [135, actorTop]));
  cells.push(edge('dash_db', '', ST.dashedLine, '', '', [lay.cx.db, 322], [lay.cx.db, LIFE_Y + lifeH - 30]));
  cells.push(vertex('act_actor', '', ST.activation, '1', 130, actorTop, 10, actorBot - actorTop + 40));
  for (const k of lay.keys) {
    const ys = rows.filter(r => r.from === k || r.to === k).map(r => r.y);
    if (!ys.length) continue;
    const top = Math.min(...ys) - 15, bot = Math.max(...ys) + 45;
    const col = lay.columns[k];
    cells.push(vertex(`act_${k}`, '', ST.activation, `lf_${k}`, col.w / 2 - 5, top - LIFE_Y, 10, bot - top));
  }
  cells.push(vertex('act_db', '', ST.activation, '1', lay.actDbX, dbTop - 15, 10, dbBot - dbTop + 60));

  // 6. Messages — KHÔNG dùng source/target refs (draw.io sẽ snap đầu mũi tên về
  //    perimeter của lifeline gây sai vị trí). Dùng điểm cố định như trong file mẫu.
  rows.forEach((m, i) => {
    const mid = `msg_${i + 1}`;
    const cx1 = lay.cx[m.from], cx2 = lay.cx[m.to];
    const style = m.type === 'ret' ? ST.ret : ST.call;
    if (m.from === m.to) { // self message
      cells.push(edge(mid, m.label, style, '', '', [cx1, m.y - 18], [cx1, m.y + 18], [[cx1 + 70, m.y - 18], [cx1 + 70, m.y + 18]]));
    } else {
      cells.push(edge(mid, m.label, style, '', '', [cx1, m.y], [cx2, m.y]));
    }
  });

  return `<mxGraphModel><root>${cells.join('')}</root></mxGraphModel>`;
}

/* ------------------------- specs ------------------------- */
const SPECS = [
  /* ===== Auth - JWT (Login + Verify token) ===== */
  {
    folder: '00-auth-jwt', file: 'jwt-flow.xml',
    actor: 'User (Client/Expert/Freelancer/Admin)', domain: 'Auth', jwt: true, noRef: true,
    msgs: [
      M('1. Click "Login"', 'actor', 'view'),
      M('2. Display login form', 'view', 'actor', 'ret'),
      M('3. Fill in email, password', 'view', 'view', 'self'),
      vcheck(4, 'login data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /auth/login', 'view', 'route'),
      M('6. login(req, res)', 'route', 'controller'),
      M('7. login(dto)', 'controller', 'service'),
      M('8. findOne({email})', 'service', 'repo'),
      M('9. User.findOne(query)', 'repo', 'model'),
      M('10. Execute query to find account', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[account is null]'),
      ...branch('14.1', 'Return error', 'Show message "Invalid email or password"'),
      Fd('f2', '[account is not null]'),
      M('15. bcrypt.compare(password, hash)', 'service', 'service', 'self'),
      Fs('f3', 'alt', '[password is invalid]', 1),
      ...branch('15.1', 'Return error', 'Show message "Invalid email or password"'),
      Fd('f3', '[password is valid]'),
      M('16. sign(payload)', 'service', 'jwt'),
      M('17. Generate access & refresh token', 'jwt', 'jwt', 'self'),
      M('18. Return access / refresh token', 'jwt', 'service', 'ret'),
      M('19. create({userId, refreshToken, device, ip})', 'service', 'repo'),
      M('20. Session.create(data)', 'repo', 'model'),
      M('21. Execute insert query', 'model', 'db'),
      ...back([22, 23, 24]),
      M('25. Return success with tokens', 'service', 'controller', 'ret'),
      M('26. Return success with tokens', 'controller', 'route', 'ret'),
      M('27. Return success with tokens', 'route', 'view', 'ret'),
      M('28. Display "Login success" and store tokens', 'view', 'actor', 'ret'),
      Fe('f3'),
      Fe('f2'),
      M('29. Access protected feature', 'actor', 'view'),
      M('30. Send request with Bearer token', 'view', 'route'),
      M('31. handler(req, res)', 'route', 'controller'),
      M('32. verifyAccessToken(bearer token)', 'controller', 'jwt'),
      M('33. Decode and check signature / expiry', 'jwt', 'jwt', 'self'),
      M('34. Return payload {userId, roleId}', 'jwt', 'controller', 'ret'),
      Fs('f4', 'alt', '[token is missing, invalid or expired]'),
      ...branch('35', 'Return error', 'Show message "Unauthorized: Invalid or expired token"'),
      Fd('f4', '[token is valid]'),
      M('36. Attach user to req and continue', 'controller', 'controller', 'self'),
      Fe('f4'),
    ],
  },
  /* ===== UC-06: Role Management ===== */
  {
    folder: '06-role-management', file: 'UC-06.01-view-role-list.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "Role management"', 'actor', 'view'),
      M('2. GET /roles', 'view', 'route'),
      M('3. getRoleList(req, res)', 'route', 'controller'),
      M('4. getRoles(query)', 'controller', 'service'),
      M('5. find(query)', 'service', 'repo'),
      M('6. Role.find(filter)', 'repo', 'model'),
      M('7. Execute query to find all roles', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[roles list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No roles found"'),
      Fd('f1', '[roles list is not empty]'),
      ...branch('11.2', 'Return result', 'Display role list with assigned permissions'),
      Fe('f1'),
    ],
  },
  {
    folder: '06-role-management', file: 'UC-06.02-view-role-detail.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "View detail" on a role', 'actor', 'view'),
      M('2. GET /roles/:id', 'view', 'route'),
      M('3. getRoleDetail(req, res)', 'route', 'controller'),
      M('4. getRoleById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. Role.findById(id)', 'repo', 'model'),
      M('7. Execute query to find role by id', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[role is null]'),
      ...branch('11.1', 'Return error', 'Show message "Role not found"'),
      Fd('f1', '[role is not null]'),
      ...branch('11.2', 'Return result', 'Display role detail (name, description, permissions)'),
      Fe('f1'),
    ],
  },
  {
    folder: '06-role-management', file: 'UC-06.03-create-role.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "Create role"', 'actor', 'view'),
      M('2. Display create role form', 'view', 'actor', 'ret'),
      M('3. Fill in name, description, select permissions', 'view', 'view', 'self'),
      vcheck(4, 'role data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /roles', 'view', 'route'),
      M('6. createRole(req, res)', 'route', 'controller'),
      M('7. createRole(dto)', 'controller', 'service'),
      M('8. findByName(name)', 'service', 'repo'),
      M('9. Role.findOne({name})', 'repo', 'model'),
      M('10. Execute query to check role name', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[role name already exists]'),
      ...branch('14.1', 'Return error', 'Show message "Role name already exists"'),
      Fd('f2', '[role name is available]'),
      M('14.2.1. create(dto)', 'service', 'repo'),
      M('14.2.2. Role.create(data)', 'repo', 'model'),
      M('14.2.3. Execute insert query', 'model', 'db'),
      M('14.2.4. Return result', 'db', 'model', 'ret'),
      M('14.2.5. Return new role', 'model', 'repo', 'ret'),
      M('14.2.6. Return result', 'repo', 'service', 'ret'),
      check('14.2.7'),
      Fs('f3', 'alt', '[create role insuccess]', 1),
      ...branch('14.2.7.1', 'Return error', 'Show message "Create role not success"'),
      Fd('f3', '[create role success]'),
      ...branch('14.2.7.2', 'Return result', 'Show message "Create role success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '06-role-management', file: 'UC-06.04-update-role.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "Edit" on a role', 'actor', 'view'),
      M('2. GET /roles/:id', 'view', 'route'),
      M('3. getRoleDetail(req, res)', 'route', 'controller'),
      M('4. getRoleById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. Role.findById(id)', 'repo', 'model'),
      M('7. Execute query to find role by id', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f0', 'alt', '[role is null]'),
      ...branch('11.1', 'Return error', 'Show message "Role not found"'),
      Fd('f0', '[role is not null]'),
      ...branch('11.2', 'Return result', 'Display edit form with current data'),
      Fe('f0'),
      M('12. Edit name, description, permissions', 'view', 'view', 'self'),
      vcheck(13, 'role data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`13.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('14. PUT /roles/:id', 'view', 'route'),
      M('15. updateRole(req, res)', 'route', 'controller'),
      M('16. updateRole(id, dto)', 'controller', 'service'),
      M('17. update(id, dto)', 'service', 'repo'),
      M('18. Role.findOneAndUpdate({_id: id}, data)', 'repo', 'model'),
      M('19. Execute update query', 'model', 'db'),
      ...back([20]),
      M('21. Return updated role', 'model', 'repo', 'ret'),
      M('22. Return result', 'repo', 'service', 'ret'),
      check(23),
      Fs('f2', 'alt', '[update role insuccess]'),
      ...branch('23.1', 'Return error', 'Show message "Update role not success"'),
      Fd('f2', '[update role success]'),
      ...branch('23.2', 'Return result', 'Show message "Update role success" and refresh list'),
      Fe('f2'),
    ],
  },
  {
    folder: '06-role-management', file: 'UC-06.05-delete-role.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "Delete" on a role', 'actor', 'view'),
      M('2. Display confirmation dialog', 'view', 'actor', 'ret'),
      M('3. Click "Confirm delete"', 'actor', 'view'),
      M('4. DELETE /roles/:id', 'view', 'route'),
      M('5. deleteRole(req, res)', 'route', 'controller'),
      M('6. deleteRole(id)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. Role.findById(id)', 'repo', 'model'),
      M('9. Execute query to find role', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f1', 'alt', '[role is null]'),
      ...branch('13.1', 'Return error', 'Show message "Role not found"'),
      Fd('f1', '[role is not null]'),
      M('13.2.1. delete(id)', 'service', 'repo'),
      M('13.2.2. Role.deleteOne({_id: id})', 'repo', 'model'),
      M('13.2.3. Execute delete query', 'model', 'db'),
      ...back(['13.2.4', '13.2.5', '13.2.6']),
      check('13.2.7'),
      Fs('f2', 'alt', '[delete role insuccess]', 2),
      ...branch('13.2.7.1', 'Return error', 'Show message "Delete role not success"'),
      Fd('f2', '[delete role success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Role deleted successfully" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },
  {
    folder: '06-role-management', file: 'UC-06.06-update-role-permissions.xml',
    actor: 'Admin', domain: 'Role',
    msgs: [
      M('1. Click "Assign routes" on a role', 'actor', 'view'),
      M('2. GET /roles/:id/permissions', 'view', 'route'),
      M('3. getRolePermissions(req, res)', 'route', 'controller'),
      M('4. getPermissionsByRole(roleId)', 'controller', 'service'),
      M('5. findById(roleId)', 'service', 'repo'),
      M('6. Role.findById(roleId)', 'repo', 'model'),
      M('7. Execute query to find role', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[role is null]'),
      ...branch('11.1', 'Return error', 'Show message "Role not found"'),
      Fd('f1', '[role is not null]'),
      ...branch('11.2', 'Return result', 'Display current route permissions of role'),
      M('12. Select routes to assign', 'view', 'view', 'self'),
      vcheck(13, 'route permissions'),
      Fs('f2', 'opt', '[invalid data]'),
      M(`13.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f2'),
      M('14. PUT /roles/:id/permissions', 'view', 'route'),
      M('15. updateRolePermissions(req, res)', 'route', 'controller'),
      M('16. replacePermissions(roleId, routeIds)', 'controller', 'service'),
      M('17. update(roleId, {permissions: routeIds})', 'service', 'repo'),
      M('18. Role.findOneAndUpdate({_id: roleId}, data)', 'repo', 'model'),
      M('19. Execute update query', 'model', 'db'),
      ...back([20, 21, 22]),
      check(23),
      Fs('f3', 'alt', '[update permissions insuccess]', 1),
      ...branch('23.1', 'Return error', 'Show message "Update permissions not success"'),
      Fd('f3', '[update permissions success]'),
      ...branch('23.2', 'Return result', 'Show message "Permissions updated successfully"'),
      Fe('f3'),
      Fe('f1'),
    ],
  },

  /* ===== UC-15: Manage Permission ===== */
  {
    folder: '15-permission', file: 'UC-15.01-view-permission-list.xml',
    actor: 'Admin', domain: 'Permission',
    msgs: [
      M('1. Click "Permissions"', 'actor', 'view'),
      M('2. GET /permissions', 'view', 'route'),
      M('3. getPermissionList(req, res)', 'route', 'controller'),
      M('4. getPermissions()', 'controller', 'service'),
      M('5. find()', 'service', 'repo'),
      M('6. Permission.find(filter)', 'repo', 'model'),
      M('7. Execute query to find all permissions', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[permission list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No permissions found"'),
      Fd('f1', '[permission list is not empty]'),
      ...branch('11.2', 'Return result', 'Display permission list (id, name, path, method, module)'),
      Fe('f1'),
    ],
  },
  {
    folder: '15-permission', file: 'UC-15.02-view-permission-detail.xml',
    actor: 'Admin', domain: 'Permission',
    msgs: [
      M('1. Click "View detail" on a permission', 'actor', 'view'),
      M('2. GET /permissions/:id', 'view', 'route'),
      M('3. getPermissionDetail(req, res)', 'route', 'controller'),
      M('4. getPermissionById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. Permission.findById(id)', 'repo', 'model'),
      M('7. Execute query to find permission', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[permission is null]'),
      ...branch('11.1', 'Return error', 'Show message "Permission not found"'),
      Fd('f1', '[permission is not null]'),
      ...branch('11.2', 'Return result', 'Display permission detail (name, path, method, module)'),
      Fe('f1'),
    ],
  },

  /* ===== UC-16: Session Management ===== */
  {
    folder: '16-session-management', file: 'UC-16.01-view-session-list.xml',
    actor: 'User (Client/Expert/Freelancer/Admin)', domain: 'Session',
    msgs: [
      M('1. Click "Active sessions"', 'actor', 'view'),
      M('2. GET /auth/sessions', 'view', 'route'),
      M('3. getSessionList(req, res)', 'route', 'controller'),
      M('4. getSessionsByUser(userId)', 'controller', 'service'),
      M('5. find({userId, revokedAt: null})', 'service', 'repo'),
      M('6. Session.find(filter)', 'repo', 'model'),
      M('7. Execute query to find active sessions', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[active session list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No active sessions"'),
      Fd('f1', '[active session list is not empty]'),
      ...branch('11.2', 'Return result', 'Display list of active sessions (device, IP, login time)'),
      Fe('f1'),
    ],
  },
  {
    folder: '16-session-management', file: 'UC-16.02-view-session-detail.xml',
    actor: 'User (Client/Expert/Freelancer/Admin)', domain: 'Session',
    msgs: [
      M('1. Click "View" on a session', 'actor', 'view'),
      M('2. GET /auth/sessions/:id', 'view', 'route'),
      M('3. getSessionDetail(req, res)', 'route', 'controller'),
      M('4. getSessionById(sessionId, userId)', 'controller', 'service'),
      M('5. findOne({_id: sessionId, userId})', 'service', 'repo'),
      M('6. Session.findOne(query)', 'repo', 'model'),
      M('7. Execute query to find login session', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[session is null or not owned]'),
      ...branch('11.1', 'Return error', 'Show message "Session not found"'),
      Fd('f1', '[session is valid]'),
      ...branch('11.2', 'Return result', 'Display session info (device, IP address, login time, approximate location)'),
      Fe('f1'),
    ],
  },
  {
    folder: '16-session-management', file: 'UC-16.03-revoke-session.xml',
    actor: 'User (Client/Expert/Freelancer/Admin)', domain: 'Session',
    msgs: [
      M('1. Click "Revoke" on a session', 'actor', 'view'),
      M('2. Display "Revoke this device?" confirmation', 'view', 'actor', 'ret'),
      M('3. Click "Confirm revoke"', 'actor', 'view'),
      M('4. POST /auth/sessions/:id/revoke', 'view', 'route'),
      M('5. revokeSession(req, res)', 'route', 'controller'),
      M('6. revokeSession(sessionId, userId)', 'controller', 'service'),
      M('7. findOne({_id: sessionId, userId})', 'service', 'repo'),
      M('8. Session.findOne(query)', 'repo', 'model'),
      M('9. Execute query to find session', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f1', 'alt', '[session is null or already revoked]'),
      ...branch('13.1', 'Return error', 'Show message "Session not found"'),
      Fd('f1', '[session is valid]'),
      M('13.2.1. update(sessionId, {revokedAt: new Date()})', 'service', 'repo'),
      M('13.2.2. Session.findOneAndUpdate({_id: sessionId}, {revokedAt: now})', 'repo', 'model'),
      M('13.2.3. Execute update query to revoke session', 'model', 'db'),
      ...back(['13.2.4', '13.2.5', '13.2.6']),
      check('13.2.7'),
      Fs('f2', 'alt', '[revoke session insuccess]', 2),
      ...branch('13.2.7.1', 'Return error', 'Show message "Revoke session not success"'),
      Fd('f2', '[revoke session success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Device logged out remotely" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },

  /* ===== UC-17 / UC-14: Forum Category ===== */
  {
    folder: '17-forum-category', file: 'UC-14.01-view-forum-category-list.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "Forum categories"', 'actor', 'view'),
      M('2. GET /forum-categories', 'view', 'route'),
      M('3. getCategoryList(req, res)', 'route', 'controller'),
      M('4. getCategories()', 'controller', 'service'),
      M('5. find({deletedAt: null})', 'service', 'repo'),
      M('6. ForumCategory.find(filter)', 'repo', 'model'),
      M('7. Execute query to find active categories', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[category list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No categories found"'),
      Fd('f1', '[category list is not empty]'),
      ...branch('11.2', 'Return result', 'Display category list'),
      Fe('f1'),
    ],
  },
  {
    folder: '17-forum-category', file: 'UC-14.02-view-forum-category-detail.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "View detail" on a category', 'actor', 'view'),
      M('2. GET /forum-categories/:id', 'view', 'route'),
      M('3. getCategoryDetail(req, res)', 'route', 'controller'),
      M('4. getCategoryById(id)', 'controller', 'service'),
      M('5. findOne({_id: id, deletedAt: null})', 'service', 'repo'),
      M('6. ForumCategory.findOne(query)', 'repo', 'model'),
      M('7. Execute query to find category', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[category is null]'),
      ...branch('11.1', 'Return error', 'Show message "Category not found"'),
      Fd('f1', '[category is not null]'),
      ...branch('11.2', 'Return result', 'Display category detail (name, slug, description)'),
      Fe('f1'),
    ],
  },
  {
    folder: '17-forum-category', file: 'UC-17.01-create-forum-category.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "New category"', 'actor', 'view'),
      M('2. Display create category form', 'view', 'actor', 'ret'),
      M('3. Fill in name, slug, description', 'view', 'view', 'self'),
      vcheck(4, 'category data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /forum-categories', 'view', 'route'),
      M('6. createCategory(req, res)', 'route', 'controller'),
      M('7. createCategory(dto)', 'controller', 'service'),
      M('8. findByName(name)', 'service', 'repo'),
      M('9. ForumCategory.findOne({name})', 'repo', 'model'),
      M('10. Execute query to check category name', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[category name already exists]'),
      ...branch('14.1', 'Return error', 'Show message "Category name already exists"'),
      Fd('f2', '[category name is available]'),
      M('14.2.1. create(dto)', 'service', 'repo'),
      M('14.2.2. ForumCategory.create(data)', 'repo', 'model'),
      M('14.2.3. Execute insert query', 'model', 'db'),
      M('14.2.4. Return result', 'db', 'model', 'ret'),
      M('14.2.5. Return new category', 'model', 'repo', 'ret'),
      M('14.2.6. Return result', 'repo', 'service', 'ret'),
      check('14.2.7'),
      Fs('f3', 'alt', '[create category insuccess]', 1),
      ...branch('14.2.7.1', 'Return error', 'Show message "Create category not success"'),
      Fd('f3', '[create category success]'),
      ...branch('14.2.7.2', 'Return result', 'Show message "Create category success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '17-forum-category', file: 'UC-17.02-update-forum-category.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "Edit" on a category', 'actor', 'view'),
      M('2. Edit name, slug, description', 'view', 'view', 'self'),
      vcheck(3, 'category data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /forum-categories/:id', 'view', 'route'),
      M('5. updateCategory(req, res)', 'route', 'controller'),
      M('6. updateCategory(id, dto)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. ForumCategory.findById(id)', 'repo', 'model'),
      M('9. Execute query to find category', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[category is null]'),
      ...branch('13.1', 'Return error', 'Show message "Category not found"'),
      Fd('f2', '[category is not null]'),
      M('13.2.1. update(id, dto)', 'service', 'repo'),
      M('13.2.2. ForumCategory.findOneAndUpdate({_id: id}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated category', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update category insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update category not success"'),
      Fd('f3', '[update category success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update category success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '17-forum-category', file: 'UC-17.03-delete-forum-category.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "Delete" on a category', 'actor', 'view'),
      M('2. Display confirmation dialog', 'view', 'actor', 'ret'),
      M('3. Click "Confirm delete"', 'actor', 'view'),
      M('4. DELETE /forum-categories/:id', 'view', 'route'),
      M('5. deleteCategory(req, res)', 'route', 'controller'),
      M('6. deleteCategory(id)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. ForumCategory.findById(id)', 'repo', 'model'),
      M('9. Execute query to find category', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f1', 'alt', '[category is null]'),
      ...branch('13.1', 'Return error', 'Show message "Category not found"'),
      Fd('f1', '[category is not null]'),
      M('13.2.1. softDelete(id)', 'service', 'repo'),
      M('13.2.2. ForumCategory.findOneAndUpdate({_id: id}, {deletedAt: new Date()})', 'repo', 'model'),
      M('13.2.3. Execute update query to set deletedAt', 'model', 'db'),
      ...back(['13.2.4', '13.2.5', '13.2.6']),
      check('13.2.7'),
      Fs('f2', 'alt', '[delete category insuccess]', 2),
      ...branch('13.2.7.1', 'Return error', 'Show message "Delete category not success"'),
      Fd('f2', '[delete category success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Category deleted (soft delete)" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },
  {
    folder: '17-forum-category', file: 'UC-17.06-restore-forum-category.xml',
    actor: 'Admin', domain: 'ForumCategory',
    msgs: [
      M('1. Click "Restore" on a deleted category', 'actor', 'view'),
      M('2. PUT /forum-categories/:id/restore', 'view', 'route'),
      M('3. restoreCategory(req, res)', 'route', 'controller'),
      M('4. restoreCategory(id)', 'controller', 'service'),
      M('5. findOne({_id: id, deletedAt: {$ne: null}})', 'service', 'repo'),
      M('6. ForumCategory.findOne(query)', 'repo', 'model'),
      M('7. Execute query to find deleted category', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[category is null or not deleted]'),
      ...branch('11.1', 'Return error', 'Show message "Category not found or not deleted"'),
      Fd('f1', '[deleted category found]'),
      M('11.2.1. restore(id)', 'service', 'repo'),
      M('11.2.2. ForumCategory.findOneAndUpdate({_id: id}, {deletedAt: null})', 'repo', 'model'),
      M('11.2.3. Execute update query to set deletedAt: null', 'model', 'db'),
      M('11.2.4. Return result', 'db', 'model', 'ret'),
      M('11.2.5. Return restored category', 'model', 'repo', 'ret'),
      M('11.2.6. Return result', 'repo', 'service', 'ret'),
      check('11.2.7'),
      Fs('f2', 'alt', '[restore category insuccess]', 1),
      ...branch('11.2.7.1', 'Return error', 'Show message "Restore category not success"'),
      Fd('f2', '[restore category success]'),
      ...branch('11.2.7.2', 'Return result', 'Show message "Category restored successfully" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },

  /* ===== UC-28: [Frevia - Admin] User Management ===== */
  {
    folder: '28-user-management', file: 'UC-28.01-view-user-list.xml',
    actor: 'Admin', domain: 'User',
    msgs: [
      M('1. Click "User management"', 'actor', 'view'),
      M('2. GET /users?search=&role=&sort=', 'view', 'route'),
      M('3. getUserList(req, res)', 'route', 'controller'),
      M('4. getUsers(query)', 'controller', 'service'),
      M('5. find(query)', 'service', 'repo'),
      M('6. User.find(filter)', 'repo', 'model'),
      M('7. Execute query to find all users', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[user list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No users found"'),
      Fd('f1', '[user list is not empty]'),
      ...branch('11.2', 'Return result', 'Display user list (name, email, role, status) with search, filter, sort'),
      Fe('f1'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.02-view-user-detail.xml',
    actor: 'Admin', domain: 'User',
    msgs: [
      M('1. Click "View detail" on a user', 'actor', 'view'),
      M('2. GET /users/:id', 'view', 'route'),
      M('3. getUserDetail(req, res)', 'route', 'controller'),
      M('4. getUserById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. User.findById(id)', 'repo', 'model'),
      M('7. Execute query to find user by id', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[user is null]'),
      ...branch('11.1', 'Return error', 'Show message "User not found"'),
      Fd('f1', '[user is not null]'),
      ...branch('11.2', 'Return result', 'Display general account info and role profile tabs (Client/Freelancer/Custom role)'),
      Fe('f1'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.03-create-user.xml',
    actor: 'Admin', domain: 'User',
    msgs: [
      M('1. Click "Create user"', 'actor', 'view'),
      M('2. Display create user form', 'view', 'actor', 'ret'),
      M('3. Fill in email, password, status, select initial role(s) (Client/Freelancer/Custom role)', 'view', 'view', 'self'),
      vcheck(4, 'user data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /users', 'view', 'route'),
      M('6. createUser(req, res)', 'route', 'controller'),
      M('7. createUser(dto)', 'controller', 'service'),
      M('8. findByEmail(email)', 'service', 'repo'),
      M('9. User.findOne({email})', 'repo', 'model'),
      M('10. Execute query to check user email', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[user email already exists]'),
      ...branch('14.1', 'Return error', 'Show message "User email already exists"'),
      Fd('f2', '[user email is available]'),
      M('14.2.1. create(dto)', 'service', 'repo'),
      M('14.2.2. User.create(data)', 'repo', 'model'),
      M('14.2.3. Execute insert query', 'model', 'db'),
      ...back(['14.2.4', '14.2.5', '14.2.6']),
      check('14.2.7'),
      Fs('f3', 'alt', '[create user insuccess]', 1),
      ...branch('14.2.7.1', 'Return error', 'Show message "Create user not success"'),
      Fd('f3', '[create user success]'),
      ...branch('14.2.7.2', 'Return result', 'Show message "Create user success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.04-update-user.xml',
    actor: 'Admin', domain: 'User',
    msgs: [
      M('1. Click "Edit" on a user', 'actor', 'view'),
      M('2. Edit general account info (email, status, etc.)', 'view', 'view', 'self'),
      vcheck(3, 'user data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /users/:id', 'view', 'route'),
      M('5. updateUser(req, res)', 'route', 'controller'),
      M('6. updateUser(id, dto)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. User.findById(id)', 'repo', 'model'),
      M('9. Execute query to find user', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[user is null]'),
      ...branch('13.1', 'Return error', 'Show message "User not found"'),
      Fd('f2', '[user is not null]'),
      M('13.2.1. update(id, dto)', 'service', 'repo'),
      M('13.2.2. User.findOneAndUpdate({_id: id}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated user', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update user insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update user not success"'),
      Fd('f3', '[update user success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update user success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.05-update-client-profile.xml',
    actor: 'Admin', domain: 'User', model: 'ClientProfile',
    msgs: [
      M('1. Click "Edit" on Client profile tab', 'actor', 'view'),
      M('2. Edit company name, description, website', 'view', 'view', 'self'),
      vcheck(3, 'client profile data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /users/:id/client-profile', 'view', 'route'),
      M('5. updateClientProfile(req, res)', 'route', 'controller'),
      M('6. updateClientProfile(userId, dto)', 'controller', 'service'),
      M('7. findOne({userId})', 'service', 'repo'),
      M('8. ClientProfile.findOne(query)', 'repo', 'model'),
      M('9. Execute query to find client profile', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[client profile is null]'),
      ...branch('13.1', 'Return error', 'Show message "Client profile not found"'),
      Fd('f2', '[client profile is not null]'),
      M('13.2.1. update(userId, data)', 'service', 'repo'),
      M('13.2.2. ClientProfile.findOneAndUpdate({userId}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated profile', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update client profile insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update client profile not success"'),
      Fd('f3', '[update client profile success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update client profile success" and refresh tab'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.06-update-freelancer-basic-info.xml',
    actor: 'Admin', domain: 'User', model: 'Freelancer',
    msgs: [
      M('1. Click "Edit" on Freelancer basic info tab', 'actor', 'view'),
      M('2. Edit professional title, bio, languages/education/certifications', 'view', 'view', 'self'),
      vcheck(3, 'freelancer basic info'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /users/:id/freelancer-profile', 'view', 'route'),
      M('5. updateFreelancerProfile(req, res)', 'route', 'controller'),
      M('6. updateFreelancerBasicInfo(userId, dto)', 'controller', 'service'),
      M('7. findOne({userId})', 'service', 'repo'),
      M('8. Freelancer.findOne(query)', 'repo', 'model'),
      M('9. Execute query to find freelancer profile', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[freelancer profile is null]'),
      ...branch('13.1', 'Return error', 'Show message "Freelancer profile not found"'),
      Fd('f2', '[freelancer profile is not null]'),
      M('13.2.1. update(userId, data)', 'service', 'repo'),
      M('13.2.2. Freelancer.findOneAndUpdate({userId}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated profile', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update freelancer basic info insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update freelancer basic info not success"'),
      Fd('f3', '[update freelancer basic info success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update freelancer basic info success" and refresh tab'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.07-update-freelancer-skills.xml',
    actor: 'Admin', domain: 'User', model: 'Freelancer',
    msgs: [
      M('1. Click "Edit skills" on Freelancer skills tab', 'actor', 'view'),
      M('2. Select skill from catalog and set level 1-10 for each skill', 'view', 'view', 'self'),
      vcheck(3, 'selected skills'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /users/:id/skills', 'view', 'route'),
      M('5. updateUserSkills(req, res)', 'route', 'controller'),
      M('6. replaceSkills(userId, skillList)', 'controller', 'service'),
      M('7. findOne({userId})', 'service', 'repo'),
      M('8. Freelancer.findOne(query)', 'repo', 'model'),
      M('9. Execute query to find freelancer profile', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[freelancer profile is null]'),
      ...branch('13.1', 'Return error', 'Show message "Freelancer profile not found"'),
      Fd('f2', '[freelancer profile is not null]'),
      M('13.2.1. update(userId, {skills: skillList})', 'service', 'repo'),
      M('13.2.2. Freelancer.findOneAndUpdate({userId}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query to replace skill list', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated skills', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update skills insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update skills not success"'),
      Fd('f3', '[update skills success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update skills success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '28-user-management', file: 'UC-28.08-update-freelancer-portfolio.xml',
    actor: 'Admin', domain: 'User', model: 'Portfolio',
    msgs: [
      M('1. Click "Edit portfolio" on Portfolio tab', 'actor', 'view'),
      M('2. Add / edit portfolio items, select items to delete (soft-delete)', 'view', 'view', 'self'),
      vcheck(3, 'portfolio data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /users/:id/portfolio', 'view', 'route'),
      M('5. updatePortfolio(req, res)', 'route', 'controller'),
      M('6. savePortfolio(userId, items)', 'controller', 'service'),
      M('7. findOne({userId})', 'service', 'repo'),
      M('8. Portfolio.findOne(query)', 'repo', 'model'),
      M('9. Execute query to find portfolio', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[portfolio is null]'),
      ...branch('13.1', 'Return error', 'Show message "Portfolio not found"'),
      Fd('f2', '[portfolio is not null]'),
      M('13.2.1. upsertAndSoftDelete(userId, items)', 'service', 'repo'),
      M('13.2.2. Portfolio.bulkWrite(ops)', 'repo', 'model'),
      M('13.2.3. Execute upsert and soft-delete query (set deletedAt for removed items)', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated portfolio', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update portfolio insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update portfolio not success"'),
      Fd('f3', '[update portfolio success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update portfolio success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },

  /* ===== UC-37: [Frevia - Admin] Banners Management ===== */
  {
    folder: '37-banner-management', file: 'UC-37.01-view-banner-list.xml',
    actor: 'Admin', domain: 'Banner',
    msgs: [
      M('1. Click "Banners"', 'actor', 'view'),
      M('2. GET /banners', 'view', 'route'),
      M('3. getBannerList(req, res)', 'route', 'controller'),
      M('4. getBanners(query)', 'controller', 'service'),
      M('5. find(query)', 'service', 'repo'),
      M('6. Banner.find(filter)', 'repo', 'model'),
      M('7. Execute query to find all banners', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[banner list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No banners found"'),
      Fd('f1', '[banner list is not empty]'),
      ...branch('11.2', 'Return result', 'Display banner list (title, image_url, link_url, dates)'),
      Fe('f1'),
    ],
  },
  {
    folder: '37-banner-management', file: 'UC-37.02-view-banner-detail.xml',
    actor: 'Admin', domain: 'Banner',
    msgs: [
      M('1. Click "View detail" on a banner', 'actor', 'view'),
      M('2. GET /banners/:id', 'view', 'route'),
      M('3. getBannerDetail(req, res)', 'route', 'controller'),
      M('4. getBannerById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. Banner.findById(id)', 'repo', 'model'),
      M('7. Execute query to find banner by id', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[banner is null]'),
      ...branch('11.1', 'Return error', 'Show message "Banner not found"'),
      Fd('f1', '[banner is not null]'),
      ...branch('11.2', 'Return result', 'Display banner detail (title, image_url, link_url, dates)'),
      Fe('f1'),
    ],
  },
  {
    folder: '37-banner-management', file: 'UC-37.03-create-banner.xml',
    actor: 'Admin', domain: 'Banner',
    msgs: [
      M('1. Click "Create banner"', 'actor', 'view'),
      M('2. Display create banner form', 'view', 'actor', 'ret'),
      M('3. Fill in title, image_url, link_url, dates', 'view', 'view', 'self'),
      vcheck(4, 'banner data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /banners', 'view', 'route'),
      M('6. createBanner(req, res)', 'route', 'controller'),
      M('7. createBanner(dto)', 'controller', 'service'),
      M('8. create(dto)', 'service', 'repo'),
      M('9. Banner.create(data)', 'repo', 'model'),
      M('10. Execute insert query', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[create banner insuccess]'),
      ...branch('14.1', 'Return error', 'Show message "Create banner not success"'),
      Fd('f2', '[create banner success]'),
      ...branch('14.2', 'Return result', 'Show message "Create banner success" and refresh list'),
      Fe('f2'),
    ],
  },
  {
    folder: '37-banner-management', file: 'UC-37.04-update-banner.xml',
    actor: 'Admin', domain: 'Banner',
    msgs: [
      M('1. Click "Edit" on a banner', 'actor', 'view'),
      M('2. Edit title, image_url, link_url, dates', 'view', 'view', 'self'),
      vcheck(3, 'banner data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /banners/:id', 'view', 'route'),
      M('5. updateBanner(req, res)', 'route', 'controller'),
      M('6. updateBanner(id, dto)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. Banner.findById(id)', 'repo', 'model'),
      M('9. Execute query to find banner', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[banner is null]'),
      ...branch('13.1', 'Return error', 'Show message "Banner not found"'),
      Fd('f2', '[banner is not null]'),
      M('13.2.1. update(id, dto)', 'service', 'repo'),
      M('13.2.2. Banner.findOneAndUpdate({_id: id}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated banner', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update banner insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update banner not success"'),
      Fd('f3', '[update banner success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update banner success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '37-banner-management', file: 'UC-37.05-delete-banner.xml',
    actor: 'Admin', domain: 'Banner',
    msgs: [
      M('1. Click "Delete" on a banner', 'actor', 'view'),
      M('2. Display confirmation dialog', 'view', 'actor', 'ret'),
      M('3. Click "Confirm delete"', 'actor', 'view'),
      M('4. DELETE /banners/:id', 'view', 'route'),
      M('5. deleteBanner(req, res)', 'route', 'controller'),
      M('6. deleteBanner(id)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. Banner.findById(id)', 'repo', 'model'),
      M('9. Execute query to find banner', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f1', 'alt', '[banner is null]'),
      ...branch('13.1', 'Return error', 'Show message "Banner not found"'),
      Fd('f1', '[banner is not null]'),
      M('13.2.1. delete(id)', 'service', 'repo'),
      M('13.2.2. Banner.deleteOne({_id: id})', 'repo', 'model'),
      M('13.2.3. Execute delete query', 'model', 'db'),
      ...back(['13.2.4', '13.2.5', '13.2.6']),
      check('13.2.7'),
      Fs('f2', 'alt', '[delete banner insuccess]', 2),
      ...branch('13.2.7.1', 'Return error', 'Show message "Delete banner not success"'),
      Fd('f2', '[delete banner success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Banner deleted successfully" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },

  /* ===== UC-38: [Frevia - Admin] Skill Management ===== */
  {
    folder: '38-skill-management', file: 'UC-38.01-view-skill-list.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "Skills"', 'actor', 'view'),
      M('2. GET /skills?search=&active=&page=', 'view', 'route'),
      M('3. getSkillList(req, res)', 'route', 'controller'),
      M('4. getSkills(query)', 'controller', 'service'),
      M('5. find(query)', 'service', 'repo'),
      M('6. Skill.find(filter)', 'repo', 'model'),
      M('7. Execute query to find all skills', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[skill list is empty]'),
      ...branch('11.1', 'Return null', 'Show message "No skills found"'),
      Fd('f1', '[skill list is not empty]'),
      ...branch('11.2', 'Return result', 'Display skill list (name, slug, description, active) with search, filter, pagination'),
      Fe('f1'),
    ],
  },
  {
    folder: '38-skill-management', file: 'UC-38.02-view-skill-detail.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "View detail" on a skill', 'actor', 'view'),
      M('2. GET /skills/:id', 'view', 'route'),
      M('3. getSkillDetail(req, res)', 'route', 'controller'),
      M('4. getSkillById(id)', 'controller', 'service'),
      M('5. findById(id)', 'service', 'repo'),
      M('6. Skill.findById(id)', 'repo', 'model'),
      M('7. Execute query to find skill by id', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[skill is null]'),
      ...branch('11.1', 'Return error', 'Show message "Skill not found"'),
      Fd('f1', '[skill is not null]'),
      ...branch('11.2', 'Return result', 'Display skill detail (name, slug, description, active)'),
      Fe('f1'),
    ],
  },
  {
    folder: '38-skill-management', file: 'UC-38.03-create-skill.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "Create skill"', 'actor', 'view'),
      M('2. Display create skill form', 'view', 'actor', 'ret'),
      M('3. Fill in name, slug, description', 'view', 'view', 'self'),
      vcheck(4, 'skill data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`4.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('5. POST /skills', 'view', 'route'),
      M('6. createSkill(req, res)', 'route', 'controller'),
      M('7. createSkill(dto)', 'controller', 'service'),
      M('8. findBySlug(slug)', 'service', 'repo'),
      M('9. Skill.findOne({slug})', 'repo', 'model'),
      M('10. Execute query to check skill slug', 'model', 'db'),
      ...back([11, 12, 13]),
      check(14),
      Fs('f2', 'alt', '[skill slug already exists]'),
      ...branch('14.1', 'Return error', 'Show message "Skill slug already exists"'),
      Fd('f2', '[skill slug is available]'),
      M('14.2.1. create(dto)', 'service', 'repo'),
      M('14.2.2. Skill.create(data)', 'repo', 'model'),
      M('14.2.3. Execute insert query', 'model', 'db'),
      ...back(['14.2.4', '14.2.5', '14.2.6']),
      check('14.2.7'),
      Fs('f3', 'alt', '[create skill insuccess]', 1),
      ...branch('14.2.7.1', 'Return error', 'Show message "Create skill not success"'),
      Fd('f3', '[create skill success]'),
      ...branch('14.2.7.2', 'Return result', 'Show message "Create skill success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '38-skill-management', file: 'UC-38.04-update-skill.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "Edit" on a skill', 'actor', 'view'),
      M('2. Edit name, slug, description', 'view', 'view', 'self'),
      vcheck(3, 'skill data'),
      Fs('f1', 'opt', '[invalid data]'),
      M(`3.1. ${INVALID_MSG}`, 'view', 'actor', 'ret'),
      Fe('f1'),
      M('4. PUT /skills/:id', 'view', 'route'),
      M('5. updateSkill(req, res)', 'route', 'controller'),
      M('6. updateSkill(id, dto)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. Skill.findById(id)', 'repo', 'model'),
      M('9. Execute query to find skill', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f2', 'alt', '[skill is null]'),
      ...branch('13.1', 'Return error', 'Show message "Skill not found"'),
      Fd('f2', '[skill is not null]'),
      M('13.2.1. update(id, dto)', 'service', 'repo'),
      M('13.2.2. Skill.findOneAndUpdate({_id: id}, data)', 'repo', 'model'),
      M('13.2.3. Execute update query', 'model', 'db'),
      M('13.2.4. Return result', 'db', 'model', 'ret'),
      M('13.2.5. Return updated skill', 'model', 'repo', 'ret'),
      M('13.2.6. Return result', 'repo', 'service', 'ret'),
      check('13.2.7'),
      Fs('f3', 'alt', '[update skill insuccess]', 1),
      ...branch('13.2.7.1', 'Return error', 'Show message "Update skill not success"'),
      Fd('f3', '[update skill success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Update skill success" and refresh list'),
      Fe('f3'),
      Fe('f2'),
    ],
  },
  {
    folder: '38-skill-management', file: 'UC-38.05-delete-skill.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "Delete" on a skill', 'actor', 'view'),
      M('2. Display confirmation dialog', 'view', 'actor', 'ret'),
      M('3. Click "Confirm delete"', 'actor', 'view'),
      M('4. DELETE /skills/:id', 'view', 'route'),
      M('5. deleteSkill(req, res)', 'route', 'controller'),
      M('6. deleteSkill(id)', 'controller', 'service'),
      M('7. findById(id)', 'service', 'repo'),
      M('8. Skill.findById(id)', 'repo', 'model'),
      M('9. Execute query to find skill', 'model', 'db'),
      ...back([10, 11, 12]),
      check(13),
      Fs('f1', 'alt', '[skill is null]'),
      ...branch('13.1', 'Return error', 'Show message "Skill not found"'),
      Fd('f1', '[skill is not null]'),
      M('13.2.1. softDelete(id)', 'service', 'repo'),
      M('13.2.2. Skill.findOneAndUpdate({_id: id}, {deletedAt: new Date()})', 'repo', 'model'),
      M('13.2.3. Execute update query to set deletedAt', 'model', 'db'),
      ...back(['13.2.4', '13.2.5', '13.2.6']),
      check('13.2.7'),
      Fs('f2', 'alt', '[delete skill insuccess]', 2),
      ...branch('13.2.7.1', 'Return error', 'Show message "Delete skill not success"'),
      Fd('f2', '[delete skill success]'),
      ...branch('13.2.7.2', 'Return result', 'Show message "Skill deleted (soft delete)" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },
  {
    folder: '38-skill-management', file: 'UC-38.06-restore-skill.xml',
    actor: 'Admin', domain: 'Skill',
    msgs: [
      M('1. Click "Restore" on a deleted skill', 'actor', 'view'),
      M('2. PUT /skills/:id/restore', 'view', 'route'),
      M('3. restoreSkill(req, res)', 'route', 'controller'),
      M('4. restoreSkill(id)', 'controller', 'service'),
      M('5. findOne({_id: id, deletedAt: {$ne: null}})', 'service', 'repo'),
      M('6. Skill.findOne(query)', 'repo', 'model'),
      M('7. Execute query to find deleted skill', 'model', 'db'),
      ...back([8, 9, 10]),
      check(11),
      Fs('f1', 'alt', '[skill is null or not deleted]'),
      ...branch('11.1', 'Return error', 'Show message "Skill not found or not deleted"'),
      Fd('f1', '[deleted skill found]'),
      M('11.2.1. restore(id)', 'service', 'repo'),
      M('11.2.2. Skill.findOneAndUpdate({_id: id}, {deletedAt: null})', 'repo', 'model'),
      M('11.2.3. Execute update query to set deletedAt: null', 'model', 'db'),
      M('11.2.4. Return result', 'db', 'model', 'ret'),
      M('11.2.5. Return restored skill', 'model', 'repo', 'ret'),
      M('11.2.6. Return result', 'repo', 'service', 'ret'),
      check('11.2.7'),
      Fs('f2', 'alt', '[restore skill insuccess]', 1),
      ...branch('11.2.7.1', 'Return error', 'Show message "Restore skill not success"'),
      Fd('f2', '[restore skill success]'),
      ...branch('11.2.7.2', 'Return result', 'Show message "Skill restored successfully" and refresh list'),
      Fe('f2'),
      Fe('f1'),
    ],
  },
];

/* ------------------------- run ------------------------- */
for (const spec of SPECS) {
  const dir = path.join(OUT, spec.folder);
  fs.mkdirSync(dir, { recursive: true });
  const xml = build(spec);
  fs.writeFileSync(path.join(dir, spec.file), xml, 'utf8');
  const count = spec.msgs.filter(m => !m.frame).length;
  console.log(`OK  ${spec.folder}/${spec.file}  (${count} messages)`);
}
console.log(`\nTotal: ${SPECS.length} diagrams generated.`);
