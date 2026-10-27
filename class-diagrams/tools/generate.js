/**
 * Class Diagram Generator (draw.io mxGraphModel)
 * Style theo file mẫu Auth module:
 *  - Route class  : <<route>> swimlane (fontStyle=1, stackLayout) + dòng "+METHOD /path (Guards)"
 *  - Class        : swimlane tiêu đề thường, fields ($) -> line -> methods (+)
 *  - DTO/Type     : <<dto>> / <<type>> + attrs + line cuối
 *  - Schema       : <<schema>> + attrs + line cuối
 *  - Utility      : <<utility>> fields -> line -> methods
 *  - Edges: "calls"/"maps to" nét liền, "uses" nét đứt, curved, endArrow=open
 *
 * Run: node tools/generate.js
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..');

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/\n/g, '&#10;');

const SWIM = 'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=%START%;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fontSize=13;';
const ROW_TEXT = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=13;';
const ROW_LINE = 'line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;strokeColor=inherit;fontSize=13;';

const TYPES = {
  route:   { start: 56, rowH: 38, st: 'route' },
  class:   { start: 32, rowH: 30, st: '' },
  dto:     { start: 44, rowH: 30, st: 'dto' },
  type:    { start: 44, rowH: 40, st: 'type' },
  schema:  { start: 42, rowH: 28, st: 'schema' },
  utility: { start: 48, rowH: 32, st: 'utility' },
};

// Cột chuẩn: 0=Route(40) 1=Controller(340) 2=DTO(660) 3=Service(990) 4=Schema(1470)
const COL_X = { 0: 40, 1: 340, 2: 660, 3: 990, 4: 1470 };

const EX = {
  L: 'exitX=0;exitY=0.5;exitDx=0;exitDy=0;',
  R: 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;',
  T: 'exitX=0.5;exitY=0;exitDx=0;exitDy=0;',
  B: 'exitX=0.5;exitY=1;exitDx=0;exitDy=0;',
};
const EN = {
  L: 'entryX=0;entryY=0.5;entryDx=0;entryDy=0;',
  R: 'entryX=1;entryY=0.5;entryDx=0;entryDy=0;',
  T: 'entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
  B: 'entryX=0.5;entryY=1;entryDx=0;entryDy=0;',
};

const vertex = (id, value, style, parent, x, y, w, h) =>
  `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;

const edgeCell = (id, e, pts) => {
  const routed = !!pts;
  const st = (routed ? 'edgeStyle=orthogonalEdgeStyle;rounded=0;jettySize=auto;html=1;' : 'curved=1;')
    + 'startArrow=none;endArrow=open;endSize=12;fontSize=13;'
    + (e.dashed ? 'dashed=1;' : '')
    + (e.out ? EX[e.out] : '')
    + (e.in ? EN[e.in] : '');
  const geo = routed
    ? `<mxGeometry relative="1" as="geometry"><Array as="points">${pts.map(p => `<mxPoint x="${p.x}" y="${p.y}"/>`).join('')}</Array></mxGeometry>`
    : '<mxGeometry relative="1" as="geometry"/>';
  return `<mxCell id="${id}" value="${esc(e.label || '')}" style="${st}" edge="1" parent="1" source="${e.from}" target="${e.to}">${geo}</mxCell>`;
};

function buildModule(mod) {
  const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];

  // Tiêu đề module
  cells.push(vertex('ttl', mod.title || mod.file,
    'text;html=1;fontSize=15;fontStyle=1;align=left;verticalAlign=middle;whiteSpace=wrap;',
    '1', 40, 20, 700, 30));

  // Bố cục: x từng cột = tổng chiều rộng cột trước + kênh 100px (không bao giờ đè chữ)
  const colW = {};
  for (const c of mod.classes) colW[c.col] = Math.max(colW[c.col] || 0, c.w);
  const colX = {};
  let xrun = 40;
  for (const k of Object.keys(colW).map(Number).sort((a, b) => a - b)) {
    colX[k] = xrun;
    xrun += colW[k] + 100;
  }

  const yTop = {};
  const classIds = new Set();

  for (const c of mod.classes) {
    if (classIds.has(c.id)) throw new Error(`dup class id ${c.id} in ${mod.file}`);
    classIds.add(c.id);
    const t = TYPES[c.type];
    const rows = c.type === 'route'
      ? [...(c.entries || [])]
      : ['dto', 'schema', 'type'].includes(c.type)
        ? [...(c.fields || []), '__SEP__']
        : [...(c.fields || []), '__SEP__', ...(c.methods || [])];
    const h = t.start + rows.reduce((a, p) => a + (p === '__SEP__' ? 8 : t.rowH), 0);
    const x = colX[c.col];
    const y = yTop[c.col] || 160;
    yTop[c.col] = y + h + 70;
    c._x = x; c._y = y; c._h = h;
    const title = t.st ? `<<${t.st}>>\n${c.name}` : c.name;
    cells.push(vertex(c.id, title, SWIM.replace('%START%', String(t.start)), '1', x, y, c.w, h));
    let cy = t.start;
    rows.forEach((p, k) => {
      const rh = p === '__SEP__' ? 8 : t.rowH;
      cells.push(vertex(`${c.id}_r${k}`, p === '__SEP__' ? '' : p, p === '__SEP__' ? ROW_LINE : ROW_TEXT, c.id, 0, cy, c.w, rh));
      cy += rh;
    });
  }

  // Sanity check: không cho box đè lên nhau
  for (let i = 0; i < mod.classes.length; i++) {
    for (let j = i + 1; j < mod.classes.length; j++) {
      const a = mod.classes[i], b = mod.classes[j];
      if (a._x < b._x + b.w && b._x < a._x + a.w && a._y < b._y + b._h && b._y < a._y + a._h) {
        throw new Error(`boxes overlap: ${a.id} x ${b.id} in ${mod.file}`);
      }
    }
  }

  for (const [i, e] of (mod.edges || []).entries()) {
    if (!classIds.has(e.from) || !classIds.has(e.to)) {
      throw new Error(`edge ${i + 1} refs unknown class in ${mod.file}`);
    }
    const ca = mod.classes.find(c => c.id === e.from), cb = mod.classes.find(c => c.id === e.to);
    let pts;
    if (Math.abs(ca.col - cb.col) > 1) {
      // Edge nhảy cột -> đi vòng PHÍA TRÊN toàn bộ box của các cột bị nhảy qua
      const a = Math.min(ca.col, cb.col), b = Math.max(ca.col, cb.col);
      const skipped = mod.classes.filter(c => c.col > a && c.col < b);
      if (skipped.length) {
        const minX = Math.min(...skipped.map(c => c._x));
        const maxX = Math.max(...skipped.map(c => c._x + c.w));
        const topY = Math.max(80, Math.min(...skipped.map(c => c._y)) - 80);
        pts = [
          { x: minX - 45, y: ca._y + ca._h / 2 },
          { x: minX - 45, y: topY },
          { x: maxX + 45, y: topY },
          { x: maxX + 45, y: cb._y + cb._h / 2 },
        ];
      }
    }
    cells.push(edgeCell(`e${i + 1}`, e, pts));
  }

  return `<mxGraphModel><root>${cells.join('')}</root></mxGraphModel>`;
}

/* ------------------------- modules ------------------------- */
const guarded = s => `${s} (AdminGuard)`;

// Guards & pagination dùng chung (như mẫu Auth: JwtAuthGuard có trên route logout)
const GUARDS_ADMIN = [
  { id: 'gJwt', type: 'class', name: 'JwtAuthGuard', col: 1, w: 300,
    fields: ['-jwtUtil: JwtUtil'],
    methods: ['+canActivate(context: ExecutionContext): boolean'] },
  { id: 'gAdmin', type: 'class', name: 'AdminGuard', col: 1, w: 300,
    fields: ['-reflector: Reflector'],
    methods: ['+canActivate(context: ExecutionContext): boolean'] },
];
const GUARDS_JWT = [GUARDS_ADMIN[0]];

const PAGINATION = [
  { id: 'dPage', type: 'dto', name: 'PaginationDto', col: 2, w: 300,
    fields: ['+page: number', '+limit: number', '+search?: string', '+sortBy?: string'] },
  { id: 'dMeta', type: 'type', name: 'PageMeta', col: 2, w: 300,
    fields: ['+page: number', '+limit: number', '+total: number', '+totalPages: number'] },
];

const REPO_METHODS = [
  '+find(filter)', '+findById(id: string)', '+create(data)', '+findOneAndUpdate(filter, data)', '+countDocuments(filter)',
];

/* Cột: 0=Route 1=Controller(+Guard, Pagination) 2=DTO/Type 3=Service(+Utility) 4=Repo 5=Schema */
const MODULES = [
  /* ===== UC-06: Role Management ===== */
  {
    folder: '06-role-management', file: 'role-classes.xml',
    title: 'UC-06 Role Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'RoleRoutes', col: 0, w: 250, entries: [
        guarded('+GET /roles'), guarded('+GET /roles/:id'), guarded('+POST /roles'),
        guarded('+PUT /roles/:id'), guarded('+DELETE /roles/:id'), guarded('+PUT /roles/:id/permissions'),
      ] },
      { id: 'ctrl', type: 'class', name: 'RoleController', col: 1, w: 340,
        fields: ['-roleService: RoleService'],
        methods: ['+getRoleList(req, res)', '+getRoleDetail(req, res)', '+createRole(dto: CreateRoleDto, res)',
          '+updateRole(id, dto: UpdateRoleDto, res)', '+deleteRole(id: string, res)', '+updateRolePermissions(roleId, routeIds, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'RoleService', col: 3, w: 430,
        fields: ['-roleRepo: RoleRepo', '-permissionRepo: PermissionRepo'],
        methods: ['+getRoles(query)', '+getRoleById(id)', '+createRole(dto: CreateRoleDto)',
          '+updateRole(id, dto)', '+deleteRole(id: string)', '+replacePermissions(roleId, permissionIds)'] },
      { id: 'd1', type: 'dto', name: 'CreateRoleDto', col: 2, w: 300,
        fields: ['+name: string', '+description: string'] },
      { id: 'd2', type: 'dto', name: 'UpdateRoleDto', col: 2, w: 300,
        fields: ['+name?: string', '+description?: string'] },
      { id: 'repo', type: 'class', name: 'RoleRepo', col: 4, w: 360,
        fields: ['-roleModel: Model<RoleDocument>'], methods: REPO_METHODS },
      { id: 'repoPerm', type: 'class', name: 'PermissionRepo', col: 4, w: 360,
        fields: ['-permissionModel: Model<PermissionDocument>'],
        methods: ['+find(filter)', '+findById(id: string)', '+countDocuments(filter)'] },
      { id: 's1', type: 'schema', name: 'Role', col: 5, w: 250,
        fields: ['+name: string', '+description: string', '+permissions: ObjectId[]', '+isDeleted: boolean', '+deletedAt: Date', '+createdAt: Date', '+updatedAt: Date'] },
      { id: 's2', type: 'schema', name: 'Permission', col: 5, w: 250,
        fields: ['+name: string', '+path: string', '+method: string', '+module: string', '+createdAt: Date', '+updatedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'svc', to: 'repoPerm', label: 'calls', out: 'B', in: 'L' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoPerm', to: 's2', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-15: Manage Permission ===== */
  {
    folder: '15-permission', file: 'permission-classes.xml',
    title: 'UC-15 Manage Permission — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'PermissionRoutes', col: 0, w: 250, entries: [
        guarded('+GET /permissions'), guarded('+GET /permissions/:id'),
      ] },
      { id: 'ctrl', type: 'class', name: 'PermissionController', col: 1, w: 340,
        fields: ['-permissionService: PermissionService'],
        methods: ['+getPermissionList(req, res)', '+getPermissionDetail(req, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'PermissionService', col: 3, w: 430,
        fields: ['-permissionRepo: PermissionRepo'],
        methods: ['+getPermissions(query)', '+getPermissionById(id: string)'] },
      { id: 'repo', type: 'class', name: 'PermissionRepo', col: 4, w: 360,
        fields: ['-permissionModel: Model<PermissionDocument>'], methods: REPO_METHODS },
      { id: 's1', type: 'schema', name: 'Permission', col: 5, w: 250,
        fields: ['+name: string', '+path: string', '+method: string', '+module: string', '+createdAt: Date', '+updatedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-16: Session Management ===== */
  {
    folder: '16-session-management', file: 'session-classes.xml',
    title: 'UC-16 Session Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'SessionRoutes', col: 0, w: 280, entries: [
        '+GET /auth/sessions (JwtAuthGuard)', '+GET /auth/sessions/:id (JwtAuthGuard)',
        '+POST /auth/sessions/:id/revoke (JwtAuthGuard)',
      ] },
      { id: 'ctrl', type: 'class', name: 'SessionController', col: 1, w: 340,
        fields: ['-sessionService: SessionService'],
        methods: ['+getSessionList(req, res)', '+getSessionDetail(req, res)', '+revokeSession(id: string, req, res)'] },
      ...GUARDS_JWT, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'SessionService', col: 3, w: 430,
        fields: ['-sessionRepo: SessionRepo'],
        methods: ['+getSessionsByUser(userId, query)', '+getSessionById(id: string)', '+revoke(id: string, userId: string)'] },
      { id: 'repo', type: 'class', name: 'SessionRepo', col: 4, w: 360,
        fields: ['-sessionModel: Model<SessionDocument>'],
        methods: ['+find(filter)', '+findById(id: string)', '+countDocuments(filter)', '+findOneAndUpdate(filter, data)'] },
      { id: 's1', type: 'schema', name: 'Session', col: 5, w: 250,
        fields: ['+userId: ObjectId', '+device: string', '+deviceModel: string', '+platformName: string', '+ipAddress: string', '+location: string', '+loginAt: Date', '+lastActiveAt: Date', '+revokedAt: Date', '+createdAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-14/17: Forum Category ===== */
  {
    folder: '17-forum-category', file: 'forum-category-classes.xml',
    title: 'UC-14 / UC-17 Forum Category — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'ForumCategoryRoutes', col: 0, w: 280, entries: [
        guarded('+GET /forum-categories'), guarded('+GET /forum-categories/:id'), guarded('+POST /forum-categories'),
        guarded('+PUT /forum-categories/:id'), guarded('+DELETE /forum-categories/:id'),
        guarded('+PUT /forum-categories/:id/restore'),
      ] },
      { id: 'ctrl', type: 'class', name: 'ForumCategoryController', col: 1, w: 340,
        fields: ['-forumCategoryService: ForumCategoryService'],
        methods: ['+getCategoryList(req, res)', '+getCategoryDetail(req, res)', '+createCategory(dto: CreateForumCategoryDto, res)',
          '+updateCategory(id, dto: UpdateForumCategoryDto, res)', '+deleteCategory(id: string, res)', '+restoreCategory(id: string, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'ForumCategoryService', col: 3, w: 430,
        fields: ['-forumCategoryRepo: ForumCategoryRepo', '-slugUtil: SlugUtil'],
        methods: ['+getCategories(query)', '+getCategoryById(id)', '+createCategory(dto)', '+updateCategory(id, dto)',
          '+softDeleteCategory(id)', '+restoreCategory(id)'] },
      { id: 'd1', type: 'dto', name: 'CreateForumCategoryDto', col: 2, w: 300,
        fields: ['+name: string', '+slug?: string', '+description: string'] },
      { id: 'd2', type: 'dto', name: 'UpdateForumCategoryDto', col: 2, w: 300,
        fields: ['+name?: string', '+slug?: string', '+description?: string'] },
      { id: 'repo', type: 'class', name: 'ForumCategoryRepo', col: 4, w: 360,
        fields: ['-forumCategoryModel: Model<ForumCategoryDocument>'], methods: REPO_METHODS },
      { id: 'u1', type: 'utility', name: 'SlugUtil', col: 3, w: 360,
        methods: ['+toSlug(input: string): string'] },
      { id: 's1', type: 'schema', name: 'ForumCategory', col: 5, w: 250,
        fields: ['+name: string', '+slug: string', '+description: string', '+status: string', '+isDeleted: boolean', '+deletedAt: Date', '+createdAt: Date', '+updatedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'svc', to: 'u1', label: '', dashed: true, out: 'B', in: 'T' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-28: User Management ===== */
  {
    folder: '28-user-management', file: 'user-classes.xml',
    title: 'UC-28 User Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'UserRoutes', col: 0, w: 280, entries: [
        guarded('+GET /users'), guarded('+GET /users/:id'), guarded('+POST /users'), guarded('+PUT /users/:id'),
        guarded('+PUT /users/:id/client-profile'), guarded('+PUT /users/:id/freelancer-profile'),
        guarded('+PUT /users/:id/skills'), guarded('+PUT /users/:id/portfolio'), guarded('+PUT /users/:id/expert-profile'),
      ] },
      { id: 'ctrl', type: 'class', name: 'UserController', col: 1, w: 340,
        fields: ['-userService: UserService'],
        methods: ['+getUserList(req, res)', '+getUserDetail(req, res)', '+createUser(dto: CreateUserDto, res)',
          '+updateUser(id, dto: UpdateUserDto, res)', '+updateClientProfile(userId, dto, res)',
          '+updateFreelancerBasicInfo(userId, dto, res)', '+updateUserSkills(userId, dto, res)',
          '+updatePortfolio(userId, dto, res)', '+updateExpertProfile(userId, dto, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'UserService', col: 3, w: 430,
        fields: ['-userRepo: UserRepo', '-profileRepo: ProfileRepo', '-passwordUtil: PasswordUtil'],
        methods: ['+getUsers(query)', '+getUserById(id)', '+createUser(dto)', '+updateUser(id, dto)',
          '+updateClientProfile(userId, dto)', '+updateFreelancerBasicInfo(userId, dto)',
          '+replaceSkills(userId, skillList)', '+savePortfolio(userId, items)', '+updateExpertProfile(userId, dto)'] },
      { id: 'd1', type: 'dto', name: 'CreateUserDto', col: 2, w: 300,
        fields: ['+email: string', '+password: string', '+status: string', '+initialRoleIds: ObjectId[]'] },
      { id: 'd2', type: 'dto', name: 'UpdateUserDto', col: 2, w: 300,
        fields: ['+email?: string', '+password?: string', '+status?: string'] },
      { id: 'd3', type: 'dto', name: 'UpdateClientProfileDto', col: 2, w: 300,
        fields: ['+companyName: string', '+description: string', '+website: string'] },
      { id: 'd4', type: 'dto', name: 'UpdateFreelancerDto', col: 2, w: 300,
        fields: ['+professionalTitle: string', '+bio: string', '+languages: string[]', '+educations: string[]', '+certifications: string[]'] },
      { id: 'd5', type: 'type', name: 'SkillEntry', col: 2, w: 300,
        fields: ['+skillId: ObjectId', '+level: number (1-10)'] },
      { id: 'd6', type: 'dto', name: 'UpdateSkillsDto', col: 2, w: 300,
        fields: ['+skills: SkillEntry[]'] },
      { id: 'd7', type: 'type', name: 'PortfolioItemDto', col: 2, w: 300,
        fields: ['+title: string', '+description: string', '+technologies: string[]', '+projectUrl: string?'] },
      { id: 'd8', type: 'dto', name: 'UpdatePortfolioDto', col: 2, w: 300,
        fields: ['+items: PortfolioItemDto[]'] },
      { id: 'd9', type: 'dto', name: 'UpdateExpertDto', col: 2, w: 300,
        fields: ['+professionalTitle: string', '+specialties: string[]'] },
      { id: 'repo', type: 'class', name: 'UserRepo', col: 4, w: 360,
        fields: ['-userModel: Model<UserDocument>'], methods: REPO_METHODS },
      { id: 'repoProf', type: 'class', name: 'ProfileRepo', col: 4, w: 360,
        fields: ['-clientProfileModel: Model<ClientProfileDocument>', '-freelancerModel: Model<FreelancerDocument>',
          '-portfolioModel: Model<PortfolioDocument>', '-expertModel: Model<ExpertDocument>'],
        methods: ['+findOne(filter)', '+find(filter)', '+upsert(filter, data)', '+bulkWrite(ops)', '+findOneAndUpdate(filter, data)'] },
      { id: 'u1', type: 'utility', name: 'PasswordUtil', col: 3, w: 360,
        methods: ['+hashPassword(plain: string, saltRounds: number)', '+comparePassword(plain: string, hash: string)'] },
      { id: 's1', type: 'schema', name: 'User', col: 5, w: 250,
        fields: ['+email: string', '+password: string', '+status: string', '+roleIds: ObjectId[]', '+lastLoginAt: Date', '+isDeleted: boolean', '+deletedAt: Date'] },
      { id: 's2', type: 'schema', name: 'ClientProfile', col: 5, w: 250,
        fields: ['+userId: ObjectId', '+companyName: string', '+description: string', '+website: string'] },
      { id: 's3', type: 'schema', name: 'Freelancer', col: 5, w: 250,
        fields: ['+userId: ObjectId', '+professionalTitle: string', '+bio: string', '+languages: string[]', '+educations: string[]', '+certifications: string[]', '+skills: SkillEntry[]'] },
      { id: 's4', type: 'schema', name: 'Portfolio', col: 5, w: 250,
        fields: ['+userId: ObjectId', '+title: string', '+description: string', '+technologies: string[]', '+projectUrl: string', '+deletedAt: Date'] },
      { id: 's5', type: 'schema', name: 'Expert', col: 5, w: 250,
        fields: ['+userId: ObjectId', '+professionalTitle: string', '+specialties: string[]'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd3', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd4', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd6', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd8', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd9', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'd5', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'd7', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'svc', to: 'repoProf', label: 'calls', out: 'B', in: 'L' },
      { from: 'svc', to: 'u1', label: '', dashed: true, out: 'B', in: 'T' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoProf', to: 's2', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoProf', to: 's3', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoProf', to: 's4', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoProf', to: 's5', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-37: Banners ===== */
  {
    folder: '37-banner-management', file: 'banner-classes.xml',
    title: 'UC-37 Banners Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'BannerRoutes', col: 0, w: 250, entries: [
        guarded('+GET /banners'), guarded('+GET /banners/:id'), guarded('+POST /banners'),
        guarded('+PUT /banners/:id'), guarded('+DELETE /banners/:id'),
      ] },
      { id: 'ctrl', type: 'class', name: 'BannerController', col: 1, w: 340,
        fields: ['-bannerService: BannerService'],
        methods: ['+getBannerList(req, res)', '+getBannerDetail(req, res)', '+createBanner(dto: CreateBannerDto, res)',
          '+updateBanner(id, dto: UpdateBannerDto, res)', '+deleteBanner(id: string, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'BannerService', col: 3, w: 430,
        fields: ['-bannerRepo: BannerRepo'],
        methods: ['+getBanners(query)', '+getBannerById(id)', '+createBanner(dto)', '+updateBanner(id, dto)', '+deleteBanner(id)'] },
      { id: 'd1', type: 'dto', name: 'CreateBannerDto', col: 2, w: 300,
        fields: ['+title: string', '+imageUrl: string', '+linkUrl: string', '+startDate: Date', '+endDate: Date'] },
      { id: 'd2', type: 'dto', name: 'UpdateBannerDto', col: 2, w: 300,
        fields: ['+title?: string', '+imageUrl?: string', '+linkUrl?: string', '+startDate?: Date', '+endDate?: Date'] },
      { id: 'repo', type: 'class', name: 'BannerRepo', col: 4, w: 360,
        fields: ['-bannerModel: Model<BannerDocument>'], methods: REPO_METHODS },
      { id: 's1', type: 'schema', name: 'Banner', col: 5, w: 250,
        fields: ['+title: string', '+imageUrl: string', '+linkUrl: string', '+startDate: Date', '+endDate: Date', '+createdAt: Date', '+updatedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-38: Skills ===== */
  {
    folder: '38-skill-management', file: 'skill-classes.xml',
    title: 'UC-38 Skill Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'SkillRoutes', col: 0, w: 250, entries: [
        guarded('+GET /skills'), guarded('+GET /skills/:id'), guarded('+POST /skills'),
        guarded('+PUT /skills/:id'), guarded('+DELETE /skills/:id'), guarded('+PUT /skills/:id/restore'),
      ] },
      { id: 'ctrl', type: 'class', name: 'SkillController', col: 1, w: 340,
        fields: ['-skillService: SkillService'],
        methods: ['+getSkillList(req, res)', '+getSkillDetail(req, res)', '+createSkill(dto: CreateSkillDto, res)',
          '+updateSkill(id, dto: UpdateSkillDto, res)', '+deleteSkill(id: string, res)', '+restoreSkill(id: string, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'SkillService', col: 3, w: 430,
        fields: ['-skillRepo: SkillRepo', '-slugUtil: SlugUtil'],
        methods: ['+getSkills(query)', '+getSkillById(id)', '+createSkill(dto)', '+updateSkill(id, dto)',
          '+softDeleteSkill(id)', '+restoreSkill(id)'] },
      { id: 'd1', type: 'dto', name: 'CreateSkillDto', col: 2, w: 300,
        fields: ['+name: string', '+slug?: string', '+description: string'] },
      { id: 'd2', type: 'dto', name: 'UpdateSkillDto', col: 2, w: 300,
        fields: ['+name?: string', '+slug?: string', '+description?: string'] },
      { id: 'repo', type: 'class', name: 'SkillRepo', col: 4, w: 360,
        fields: ['-skillModel: Model<SkillDocument>'], methods: REPO_METHODS },
      { id: 'u1', type: 'utility', name: 'SlugUtil', col: 3, w: 360,
        methods: ['+toSlug(input: string): string'] },
      { id: 's1', type: 'schema', name: 'Skill', col: 5, w: 250,
        fields: ['+name: string', '+slug: string', '+description: string', '+active: boolean', '+deletedAt: Date', '+createdAt: Date', '+updatedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'svc', to: 'u1', label: '', dashed: true, out: 'B', in: 'T' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
    ],
  },

  /* ===== UC-46: Job Categories ===== */
  {
    folder: '46-job-category-management', file: 'job-category-classes.xml',
    title: 'UC-46 Job Category Management — Class Diagram',
    classes: [
      { id: 'route', type: 'route', name: 'JobCategoryRoutes', col: 0, w: 280, entries: [
        guarded('+GET /job-categories'), guarded('+GET /job-categories/:id'), guarded('+POST /job-categories'),
        guarded('+PUT /job-categories/:id'), guarded('+DELETE /job-categories/:id'),
      ] },
      { id: 'ctrl', type: 'class', name: 'JobCategoryController', col: 1, w: 340,
        fields: ['-jobCategoryService: JobCategoryService'],
        methods: ['+getJobCategoryList(req, res)', '+getJobCategoryDetail(req, res)', '+createJobCategory(dto: CreateJobCategoryDto, res)',
          '+updateJobCategory(id, dto: UpdateJobCategoryDto, res)', '+deleteJobCategory(id: string, res)'] },
      ...GUARDS_ADMIN, ...PAGINATION,
      { id: 'svc', type: 'class', name: 'JobCategoryService', col: 3, w: 430,
        fields: ['-jobCategoryRepo: JobCategoryRepo', '-jobRepo: JobRepo'],
        methods: ['+getJobCategories(query)', '+getJobCategoryById(id)', '+createJobCategory(dto)',
          '+updateJobCategory(id, dto)', '+countJobs(categoryId)', '+deleteJobCategory(id)'] },
      { id: 'd1', type: 'dto', name: 'CreateJobCategoryDto', col: 2, w: 300,
        fields: ['+name: string', '+description: string', '+status: string'] },
      { id: 'd2', type: 'dto', name: 'UpdateJobCategoryDto', col: 2, w: 300,
        fields: ['+name?: string', '+description?: string', '+status?: string'] },
      { id: 'repo', type: 'class', name: 'JobCategoryRepo', col: 4, w: 360,
        fields: ['-jobCategoryModel: Model<JobCategoryDocument>'], methods: REPO_METHODS },
      { id: 'repoJob', type: 'class', name: 'JobRepo', col: 4, w: 360,
        fields: ['-jobModel: Model<JobDocument>'],
        methods: ['+find(filter)', '+findById(id: string)', '+countDocuments(filter)', '+findOneAndUpdate(filter, data)'] },
      { id: 's1', type: 'schema', name: 'JobCategory', col: 5, w: 250,
        fields: ['+name: string', '+description: string', '+status: string', '+createdAt: Date', '+updatedAt: Date'] },
      { id: 's2', type: 'schema', name: 'Job', col: 5, w: 250,
        fields: ['+title: string', '+categoryId: ObjectId', '+status: string', '+deletedAt: Date'] },
    ],
    edges: [
      { from: 'route', to: 'ctrl', label: 'maps to', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gJwt', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'route', to: 'gAdmin', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'svc', label: 'calls', out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd1', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'd2', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'ctrl', to: 'dPage', label: '', dashed: true, out: 'R', in: 'L' },
      { from: 'svc', to: 'dPage', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'dMeta', label: '', dashed: true, out: 'L', in: 'R' },
      { from: 'svc', to: 'repo', label: 'calls', out: 'R', in: 'L' },
      { from: 'svc', to: 'repoJob', label: 'calls', out: 'B', in: 'L' },
      { from: 'repo', to: 's1', label: 'maps to', out: 'R', in: 'L' },
      { from: 'repoJob', to: 's2', label: 'maps to', out: 'R', in: 'L' },
    ],
  },
];

/* ------------------------- run ------------------------- */
let total = 0;
for (const mod of MODULES) {
  const dir = path.join(OUT, mod.folder);
  fs.mkdirSync(dir, { recursive: true });
  const xml = buildModule(mod);
  fs.writeFileSync(path.join(dir, mod.file), xml, 'utf8');
  console.log(`OK  ${mod.folder}/${mod.file}  (${mod.classes.length} classes, ${(mod.edges || []).length} edges)`);
  total++;
}
console.log(`\nTotal: ${total} class diagrams generated.`);
