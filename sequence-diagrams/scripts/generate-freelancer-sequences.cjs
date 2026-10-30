// Run from the repository root: node sequence-diagrams/scripts/generate-freelancer-sequences.cjs
// Editable draw.io diagrams and matching, portable SVG previews; no dependencies.
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const xs = [90, 330, 590, 850, 1130, 1430, 1730, 1990];
const W = 2110;
const wrap = (text, max = 38) => {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    lines.push(line);
  }
  return lines;
};
class Diagram {
  constructor(id, slug, title, domain, write = false) {
    Object.assign(this, { id, slug, title, domain, write });
    this.events = []; this.y = 300; this.n = 0;
  }
  msg(a, b, label, ret = false, number) {
    const num = number || String(++this.n);
    if (!/^\d+(\.\d+)*$/.test(num) || typeof label !== 'string' || /\bundefined\b/.test(label)) {
      throw new Error(`Invalid message in ${this.id}: ${num}. ${label}`);
    }
    this.events.push({ type: 'msg', a, b, label: `${num}. ${label}`, ret, y: this.y });
    this.y += Math.max(88, wrap(`${num}. ${label}`, a === b ? 38 : 34).length * 17 + 38);
    return num;
  }
  frame(kind, condition, fn) {
    const start = this.y - 24;
    this.y += 54;
    fn();
    this.events.push({ type: 'frame', kind, condition, y: start, h: this.y - start - 28 });
    this.y += 32;
  }
  alternative(condition, first, otherwise, second) {
    const start = this.y - 24;
    this.y += 54;
    first();
    this.events.push({ type: 'divider', y: this.y - 12, condition: otherwise });
    this.y += 58;
    second();
    this.events.push({ type: 'frame', kind: 'alt', condition, y: start, h: this.y - start - 28 });
    this.y += 32;
  }
  stop(condition, error) {
    const p = String(++this.n);
    this.frame('break', condition, () => {
      this.msg(4, 3, error, true, `${p}.1`);
      this.msg(3, 2, 'Propagate HTTP error', true, `${p}.2`);
      this.msg(2, 1, 'Return error response', true, `${p}.3`);
      this.msg(1, 0, 'Display error message', true, `${p}.4`);
    });
  }
  query(method, prisma, sql, result = 'Return result') {
    this.msg(4, 5, method);
    this.msg(5, 6, prisma);
    this.msg(6, 7, sql);
    this.msg(7, 6, result, true);
    this.msg(6, 5, result, true);
    this.msg(5, 4, result, true);
  }
  start(method, endpoint, action, body = false) {
    this.msg(0, 1, action);
    this.msg(1, 2, `${endpoint}${body ? '\n(body)' : ''}`);
    this.msg(2, 3, method);
    if (this.write) {
      this.frame('ref', '3.1 Verify jwt', () => { this.y += 30; });
      this.frame('break', '[invalid token / session / role permission]', () => {
        this.msg(2, 1, '401 / 403 error response', true, '3.1.1');
        this.msg(1, 0, 'Display authentication / permission error', true, '3.1.2');
      });
      this.frame('ref', '3.2. PermissionGuard: roleHasPermission(roleId, method, path)', () => { this.y += 30; });
    }
    if (body) {
      this.frame('break', '[request DTO / id validation fails]', () => {
        this.msg(2, 1, '400 validation error', true, '3.3.1');
        this.msg(1, 0, 'Display validation message', true, '3.3.2');
      });
    }
    this.msg(3, 4, method);
  }
  profile() {
    this.query('findFreelancerProfileById(profileId)', this.domain === 'Profile' ? 'profile.findFirst(id); fallback findFirst(userId)' : 'profile.findFirst(id OR userId)', 'SELECT Profile + FreelancerProfile + User roles; user.deletedAt IS NULL', 'Profile or null');
    this.stop('[profile missing OR user has no FREELANCER role]', '404 FreelancerProfileNotFoundException');
  }
  owner(skill = false) {
    this.stop('[stored owner userId != currentUserId]', skill ? '403 SkillForbiddenException' : `403 ${this.domain === 'Profile' ? 'Profile' : 'Portfolio'}ForbiddenException`);
  }
  finish(result, display, status = '200 OK') {
    this.msg(4, 3, result, true);
    this.msg(3, 2, 'Return controller result', true);
    this.msg(2, 1, `${status}: ${result}`, true);
    this.msg(1, 0, display, true);
  }
  portfolioFailure(error) {
    this.frame('ref', `On non-HttpException in PortfolioService: 500 ${error}; existing HttpException is rethrown`, () => { this.y += 36; });
  }
  save() {
    const H = this.y + 110;
    const names = this.names || [this.write ? 'Freelancer' : 'Visitor / Freelancer', `:${this.domain}View`, `:${this.domain}Route`, `:${this.domain}Controller`, `:${this.domain}Service`, `:${this.domain}Repository`, ':PrismaService', 'Database'];
    let cells = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
    let seq = 0;
    const vertex = (value, style, x, y, w, h, parent = '1') => {
      const id = `v${++seq}`;
      cells += `<mxCell id="${id}" value="${esc(value)}" style="${esc(style)}" parent="${parent}" vertex="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
      return id;
    };
    const edge = (value, a, b, y, ret = false, plain = false, y2 = y) => {
      cells += `<mxCell id="e${++seq}" value="${esc(value)}" style="html=1;verticalAlign=bottom;align=center;rounded=0;endArrow=${plain ? 'none' : ret ? 'open' : 'block'};${ret || plain ? 'dashed=1;' : ''}fontSize=13;" parent="1" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${a}" y="${y}" as="sourcePoint"/><mxPoint x="${b}" y="${y2}" as="targetPoint"/>${a === b ? `<Array as="points"><mxPoint x="${a + 55}" y="${y}"/><mxPoint x="${a + 55}" y="${y + 32}"/></Array>` : ''}</mxGeometry></mxCell>`;
    };
    const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><marker id="call" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#111"/></marker><marker id="reply" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="#111"/></marker></defs><rect width="100%" height="100%" fill="white"/><g font-family="Arial,sans-serif" font-size="13" fill="#111">`];
    const text = (x, y, lines, size = 13) => svg.push(`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? 17 : 0}">${esc(l)}</tspan>`).join('')}</text>`);
    vertex(`${this.id} — ${this.title}`, 'text;html=1;align=center;fontSize=24;fontStyle=1;', 130, 35, W - 260, 45);
    text(W / 2, 65, [`${this.id} — ${this.title}`], 24);
    text(W / 2, 102, [this.write ? 'Authenticated owner action • return arrows are dashed • break terminates the interaction' : 'Public endpoint (@IsPublic) • no JWT required • return arrows are dashed']);
    for (let i = 0; i < names.length; i++) {
      if (i === 0) {
        vertex(names[i], 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;', xs[i] - 20, 155, 40, 70);
        edge('', xs[i], xs[i], 250, false, true, H - 40);
        svg.push(`<circle cx="${xs[i]}" cy="169" r="11" fill="white" stroke="#111"/><path d="M${xs[i]} 180v30m-22-19h44m-22 19l-20 25m20-25l20 25" stroke="#111" fill="none"/>`);
        text(xs[i], 253, wrap(names[i], 21));
      } else if (i === names.length - 1) {
        vertex('', 'strokeWidth=2;html=1;shape=mxgraph.flowchart.database;whiteSpace=wrap;', xs[i] - 30, 155, 60, 70);
        vertex('Database', 'text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=13;', xs[i] - 50, 227, 100, 30);
        edge('', xs[i], xs[i], 260, false, true, H - 40);
        vertex('', 'html=1;fillColor=#ffffff;strokeColor=#000000;', xs[i] - 5, 300 + i * 12, 10, H - 420 - i * 12);
        svg.push(`<path d="M${xs[i] - 30} 165v50a30 10 0 0 0 60 0v-50" fill="white" stroke="#111" stroke-width="2"/><ellipse cx="${xs[i]}" cy="165" rx="30" ry="10" fill="white" stroke="#111" stroke-width="2"/>`);
        text(xs[i], 247, ['Database']);
      } else {
        const lid = vertex(names[i], 'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;fontSize=13;', xs[i] - 112, 180, 224, H - 220);
        vertex('', 'html=1;fillColor=#ffffff;strokeColor=#000000;', 107, 120 + i * 12, 10, H - 420 - i * 12, lid);
        svg.push(`<rect x="${xs[i] - 112}" y="180" width="224" height="45" fill="white" stroke="#111"/>`);
        text(xs[i], 207, [names[i]]);
      }
      svg.push(`<line x1="${xs[i]}" y1="${i === names.length - 1 ? 260 : i ? 225 : 280}" x2="${xs[i]}" y2="${H - 40}" stroke="#555" stroke-dasharray="7 5"/>`);
      if (i) svg.push(`<rect x="${xs[i] - 5}" y="${300 + i * 12}" width="10" height="${H - 420 - i * 12}" fill="white" stroke="#111"/>`);
    }
    for (const f of this.events.filter(e => e.type === 'frame')) {
      vertex(f.kind, 'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=28;fillColor=none;', 35, f.y, W - 70, f.h);
      vertex(f.condition, 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=13;', 120, f.y + 8, W - 180, 45);
      svg.push(`<rect x="35" y="${f.y}" width="${W - 70}" height="${f.h}" fill="none" stroke="#111"/><path d="M35 ${f.y + 28}h60l10-10v-18" fill="none" stroke="#111"/>`);
      text(68, f.y + 19, [f.kind]);
      text(W / 2 + 35, f.y + 22, wrap(f.condition, 175));
    }
    for (const e of this.events.filter(e => e.type === 'msg')) {
      const lines = wrap(e.label, e.a === e.b ? 38 : Math.max(30, Math.floor(Math.abs(xs[e.a] - xs[e.b]) / 7)));
      edge(lines.map(esc).join('<br>'), xs[e.a], xs[e.b], e.y, e.ret, false, e.a === e.b ? e.y + 32 : e.y);
      const dash = e.ret ? 'stroke-dasharray="7 5"' : '';
      svg.push(e.a === e.b ? `<path d="M${xs[e.a]} ${e.y}h55v32h-55" fill="none" stroke="#111" marker-end="url(#call)"/>` : `<line x1="${xs[e.a]}" y1="${e.y}" x2="${xs[e.b]}" y2="${e.y}" stroke="#111" ${dash} marker-end="url(#${e.ret ? 'reply' : 'call'})"/>`);
      text(e.a === e.b ? xs[e.a] + 135 : (xs[e.a] + xs[e.b]) / 2, e.y - 10 - (lines.length - 1) * 17, lines);
    }
    for (const e of this.events.filter(e => e.type === 'divider')) {
      edge('', 35, W - 35, e.y, false, true);
      vertex(e.condition, 'text;html=1;align=left;verticalAlign=top;fontSize=13;', 120, e.y + 8, W - 180, 30);
      svg.push(`<line x1="35" y1="${e.y}" x2="${W - 35}" y2="${e.y}" stroke="#111" stroke-dasharray="7 5"/>`);
      text(W / 2, e.y + 22, [e.condition]);
    }
    const name = `${this.id}-${this.slug}`;
    fs.writeFileSync(path.join(out, `${name}.drawio`), `<mxfile host="app.diagrams.net" version="29.0.3"><diagram id="${name}" name="${esc(this.title)}"><mxGraphModel grid="1" gridSize="10" page="1" pageScale="1" pageWidth="${W}" pageHeight="${H}"><root>${cells}</root></mxGraphModel></diagram></mxfile>\n`);
    fs.mkdirSync(path.join(out, 'previews'), { recursive: true });
    fs.writeFileSync(path.join(out, 'previews', `${name}.svg`), svg.join('') + '</g></svg>\n');
    console.log(`${name}: ${this.events.filter(e => e.type === 'msg').length} messages, ${W} x ${H}`);
  }
}
const diagrams = [];
const make = (...args) => { const d = new Diagram(...args); diagrams.push(d); return d; };
let d = make('UC-07.01', 'view-freelancer-profile', 'View Freelancer Profile', 'Profile');
d.start('viewProfile(id)', 'GET /profiles/:id', 'Open freelancer profile'); d.profile();
d.finish('FreelancerProfileDetailDto', 'Display profile information');
d = make('UC-07.02', 'update-freelancer-profile', 'Update Freelancer Profile', 'Profile', true);
d.start('updateProfile(id, currentUserId, body)', 'PUT /profiles/:id', 'Edit profile; validate required fields; Save', true); d.profile(); d.owner();
d.msg(4, 4, 'requiresManualReview(profileCompletionPercent) via ProfileRevisionService');
const p = String(++d.n);
d.alternative('[profileCompletionPercent < 20]', () => {
  d.frame('ref', `${p}.1. submitFreelancer(userId, profile.id, update, strength) — ProfileRevisionService`, () => {
    d.msg(4, 5, 'ProfileRevisionService delegates to ProfileRevisionRepository', false, `${p}.1.1`);
    d.msg(5, 6, 'PrismaService: profile.findFirst; $transaction(profileRevision.findFirst / update / create)', false, `${p}.1.2`);
    d.msg(6, 7, 'Read snapshot; update latest PENDING revision or create PENDING revision', false, `${p}.1.3`);
    d.msg(7, 6, 'Revision saved; live profile unchanged', true, `${p}.1.4`);
    d.msg(6, 5, 'Return saved revision', true, `${p}.1.5`);
    d.msg(5, 4, 'reviewRequired: true, revision, profileStrength', true, `${p}.1.6`);
  });
}, '[else: profileCompletionPercent >= 20]', () => {
  d.query('updateFreelancerProfile(profile.id, update)', '$transaction: count skills / active portfolio; calculate profile strength', 'UPDATE Profile; UPSERT FreelancerProfile; SELECT updated profile', 'Updated profile + completion percent');
  d.msg(4, 4, 'ProfileRevisionService.directUpdateResult(strength): reviewRequired false, revision null');
});
d.finish('ProfileRevisionSubmissionDto', 'Close editor; show submitted / updated message; update local profile only if reviewRequired=false');
d = make('UC-08.01', 'view-freelancer-skill-list', 'View Freelancer Skill List', 'Profile');
d.start('getSkills(id)', 'GET /profiles/:id/skills', 'Open profile skills section'); d.profile();
d.query('findSkillsByProfileId(profileId)', 'freelancerProfile.findUnique(profileId); fallback findFirst(userId)', 'SELECT FreelancerProfile; if absent return []', 'FreelancerProfile or null');
d.frame('opt', '[FreelancerProfile exists]', () => d.query('Continue findSkillsByProfileId(profileId)', 'freelancerSkill.findMany(include skill; orderBy skill.name asc)', 'SELECT skills WHERE freelancerProfileId AND skill.deletedAt IS NULL', 'FreelancerSkill[]'));
d.finish('FreelancerSkill[] (possibly empty)', 'Display skill list or empty state');
d = make('UC-08.02', 'add-freelancer-skill', 'Add Freelancer Skill', 'Profile', true);
d.frame('ref', 'UI preflight: searchSkillSuggestions(name); require catalog match, integer proficiency, no local duplicate. API independently supports new catalog names.', () => { d.y += 38; });
d.start('addSkill(id, currentUserId, body)', 'POST /profiles/:id/skills', 'Choose catalog skill and proficiency; Add', true); d.profile(); d.owner();
d.query('findOrCreateCatalogSkill(dto.skillName)', 'skill.findFirst(trimmed name; case insensitive; deletedAt null)', 'SELECT active catalog skill by name', 'Catalog skill or null');
d.frame('opt', '[catalog skill does not exist — direct API request]', () => d.query('generateUniqueSlug(trimmed); create catalog skill', 'skill.findFirst(slug) until unique; skill.create', 'CHECK slug uniqueness; INSERT Skill', 'Catalog skill'));
d.query('findSkillByProfileIdAndSkillId(profileId, catalogSkill.id)', 'freelancerProfile.findUnique; freelancerSkill.findFirst', 'SELECT existing freelancer skill by profile and catalog skill', 'Existing skill or null');
d.stop('[freelancer skill already exists]', '400 FreelancerSkillDuplicateException');
d.query('addSkillToProfile(profileId, skillId, proficiencyLevel)', 'freelancerProfile.findUnique; create if absent; freelancerSkill.create(include skill)', 'INSERT FreelancerProfile if absent; INSERT FreelancerSkill', 'Created freelancer skill');
d.finish('AddFreelancerSkillResponseDto', 'Insert skill into local list sorted by name; close editor', '201 Created');
d = make('UC-08.03', 'delete-freelancer-skill', 'Delete Freelancer Skill', 'Profile', true);
d.start('deleteSkill(id, currentUserId)', 'DELETE /profiles/skills/:id', 'Choose skill; confirm Delete');
d.query('findSkillById(skillId)', 'freelancerSkill.findUnique(include freelancerProfile.profile)', 'SELECT FreelancerSkill + owner', 'FreelancerSkill or null');
d.stop('[freelancer skill missing]', '404 FreelancerSkillNotFoundException'); d.owner(true);
d.query('deleteSkill(skillId)', 'freelancerSkill.delete({ id: skillId })', 'DELETE FreelancerSkill (catalog Skill remains)', 'Deleted FreelancerSkill');
d.finish('Deleted FreelancerSkill', 'Remove skill from local list; show success');
d = make('UC-09.01', 'view-portfolio-list', 'View Portfolio List', 'Portfolio');
d.start('getPortfolios(id)', 'GET /profiles/:id/portfolios', 'Open profile portfolio section'); d.profile();
d.frame('opt', '[profile.freelancerProfile exists; otherwise return []]', () => d.query('findPortfoliosByFreelancerProfileId(freelancerProfile.id)', 'portfolioItem.findMany(deletedAt null; createdAt desc)', 'SELECT active portfolio items newest first', 'PortfolioItem[]'));
d.finish('PortfolioItemListResponseDto (possibly empty)', 'Display portfolio cards or empty state'); d.portfolioFailure('UnableToLoadPortfoliosException');
d = make('UC-09.02', 'add-portfolio', 'Add Portfolio', 'Portfolio', true);
d.start('addPortfolio(id, currentUserId, body)', 'POST /profiles/:id/portfolios', 'Open Add Portfolio; enter title, description, technologies, URL; Save', true); d.profile(); d.owner();
d.query('addPortfolioToProfile(profileId, data)', '$transaction: freelancerProfile.findUnique; create if absent; portfolioItem.create', 'INSERT FreelancerProfile if absent; INSERT PortfolioItem; COMMIT', 'Created PortfolioItem');
d.finish('AddPortfolioResponseDto', 'Prepend portfolio to local list; close editor; show success', '201 Created'); d.portfolioFailure('UnableToLoadPortfoliosException');
d = make('UC-09.03', 'view-portfolio-detail', 'View Portfolio Detail', 'Portfolio');
d.start('getPortfolioDetail(id)', 'GET /profiles/portfolios/:id', 'Open portfolio card; display cached card while loading detail');
d.query('findPortfolioById(portfolioId)', 'portfolioItem.findFirst(id; deletedAt null)', 'SELECT active PortfolioItem by id', 'PortfolioItem or null');
d.stop('[portfolio not found or soft-deleted]', '404 PortfolioNotFoundException');
d.finish('PortfolioItemResponseDto', 'Display title, description, technologies and project link'); d.portfolioFailure('UnableToLoadPortfoliosException');
for (const action of ['update', 'delete']) {
  const update = action === 'update';
  d = make(update ? 'UC-09.04' : 'UC-09.05', `${action}-portfolio`, update ? 'Update Portfolio' : 'Delete Portfolio', 'Portfolio', true);
  d.start(`${action}Portfolio(id, currentUserId${update ? ', body' : ''})`, `${update ? 'PUT' : 'DELETE'} /profiles/portfolios/:id`, update ? 'Edit existing portfolio; validate title; Save' : 'Choose portfolio; confirm Delete', update);
  d.query('findPortfolioWithProfile(portfolioId)', 'portfolioItem.findFirst(id; deletedAt null; include freelancerProfile.profile)', 'SELECT active PortfolioItem + owner', 'PortfolioItem or null');
  d.stop('[portfolio not found or soft-deleted]', '404 PortfolioNotFoundException'); d.owner();
  d.query(`${action}Portfolio(portfolioId${update ? ', data' : ''})`, update ? 'portfolioItem.update(title; provided optional fields)' : 'portfolioItem.update({ deletedAt: new Date() })', update ? 'UPDATE title, description, technologies, projectUrl' : 'UPDATE PortfolioItem.deletedAt (soft delete)', update ? 'Updated PortfolioItem' : 'Soft-deleted PortfolioItem');
  d.finish(update ? 'UpdatePortfolioResponseDto' : '{ message: PortfolioMessage.PORTFOLIO_DELETED }', update ? 'Replace item in local list and open detail; close editor; show success' : 'Remove local item; close matching detail and confirmation; show success');
  d.portfolioFailure(update ? 'UnableToUpdatePortfolioException' : 'UnableToDeletePortfolioException');
}
if (require.main === module) for (const diagram of diagrams) diagram.save();
module.exports = { Diagram, diagrams };
