#!/usr/bin/env python3
"""
Generate draw.io class diagrams for the Frevia functional groups.

The output mirrors the existing hand-made diagrams in this folder:
  <<route>> -> Controller -> DTO/Type -> Service -> Repository -> <<schema>>/<<enum>>

Run:  python generate_class_diagrams.py
"""

from __future__ import annotations

import os

# --------------------------------------------------------------------------
# Style constants (copied from the existing diagrams in this folder)
# --------------------------------------------------------------------------

STYLE_CLASS = (
    "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
    "horizontal=1;startSize={start};horizontalStack=0;resizeParent=1;"
    "resizeParentMax=0;resizeLast=0;collapsible=0;marginBottom=0;fontSize=13;"
    "labelBackgroundColor=none;"
)
STYLE_ROW = (
    "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;"
    "spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;"
    "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontSize=13;"
    "labelBackgroundColor=none;"
)
STYLE_LINE = (
    "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;"
    "spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;"
    "points=[];portConstraint=eastwest;strokeColor=inherit;fontSize=13;"
    "labelBackgroundColor=none;"
)
STYLE_NOTE = (
    "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;"
    "fontSize=13;align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;"
    "spacingTop=6;"
)
EDGE_BASE = (
    "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;"
    "html=1;startArrow=none;endArrow=open;endSize=12;fontSize=13;"
    "labelBackgroundColor=none;"
)

# kind -> (header start size, member row height, trailing divider)
KINDS = {
    "class": (32, 30, False),
    "stereo": (44, 30, True),
    "schema": (42, 28, True),
    "route": (56, 38, False),
    "enum": (44, 30, True),
    "note": (0, 0, False),
}


# --------------------------------------------------------------------------
# Small spec helpers
# --------------------------------------------------------------------------


class Cls:
    def __init__(self, cid, name, attrs=None, methods=None, stereo=None, kind="class",
                 width=None, height=None):
        if stereo and kind == "class":
            kind = "stereo"
        self.id = cid
        self.name = name
        self.attrs = attrs or []
        self.methods = methods or []
        self.stereo = stereo
        self.kind = kind
        self.width = width
        self.height = height
        self.x = 0
        self.y = 0
        self.w = 0
        self.h = 0

    # --- geometry ---------------------------------------------------------
    def compute_size(self):
        start, row, trailing = KINDS[self.kind]
        if self.kind == "route":
            self.h = start + len(self.attrs) * row
        elif self.kind == "note":
            self.h = self.height or 150
        elif self.methods:
            self.h = start + len(self.attrs) * row + 8 + len(self.methods) * row
        else:
            self.h = start + len(self.attrs) * row + (8 if trailing else 0)

        longest = max(
            [len(self.name), len(self.stereo or "") + 4]
            + [len(line) for line in self.attrs]
            + [len(line) for line in self.methods]
        )
        if self.kind == "note":
            self.w = self.width or 380
        else:
            self.w = self.width or max(260, int(longest * 6.95) + 24)


def C(cid, name, attrs=None, methods=None, stereo=None, kind="class", width=None):
    return Cls(cid, name, attrs, methods, stereo, kind, width=width)


def NOTE(cid, text, width=430, height=150):
    return Cls(cid, text, kind="note", width=width, height=height)


def esc(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def header_value(cls: Cls) -> str:
    if cls.kind == "note":
        return esc(cls.name)
    if cls.stereo:
        return f"&lt;&lt;{esc(cls.stereo)}&gt;&gt;&#xa;{esc(cls.name)}"
    return esc(cls.name)


def cell(cid, value, style, parent="1", vertex=True, geometry=None, extra=""):
    geo = ""
    if geometry is not None:
        x, y, w, h = geometry
        geo = f'\n          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />'
    return (
        f'        <mxCell id="{cid}" value="{value}" style="{style}" parent="{parent}"'
        f'{" vertex=\"1\"" if vertex else ""}{extra}>{geo}\n        </mxCell>'
    )


# --------------------------------------------------------------------------
# Diagram builder
# --------------------------------------------------------------------------

COL_GAP = 95
TOP_Y = 95
STACK_GAP = 42
ROW_GAP = 105
EDGE_TOP_Y = 26


def _route_edges(placed, column_of, stack_index, row_of, row1_bottom, row2_top, edges):
    outgoing = {}
    incoming = {}
    for src_id, tgt_id, _label, _dashed, _mode in edges:
        outgoing.setdefault(src_id, []).append(tgt_id)
        incoming.setdefault(tgt_id, []).append(src_id)

    exit_frac = {}
    entry_frac = {}
    for src_id, targets in outgoing.items():
        targets = sorted(targets, key=lambda tid: (placed[tid].y, placed[tid].x))
        n = len(targets)
        for i, tid in enumerate(targets):
            exit_frac[(src_id, tid)] = 0.5 if n == 1 else 0.16 + 0.68 * i / (n - 1)
    for tgt_id, sources in incoming.items():
        sources = sorted(sources, key=lambda sid: (placed[sid].y, placed[sid].x))
        n = len(sources)
        for i, sid in enumerate(sources):
            entry_frac[(sid, tgt_id)] = 0.5 if n == 1 else 0.16 + 0.68 * i / (n - 1)

    top_lane = 0
    enum_lane = 0
    gap_lane = 0
    long_lane = 0
    vr_lane = 0
    corridor_lane = 0
    cross_lane = 0
    body = []

    for idx, (src_id, tgt_id, label, dashed, mode) in enumerate(edges):
        src = placed[src_id]
        tgt = placed[tgt_id]
        ef = exit_frac[(src_id, tgt_id)]
        nf = entry_frac[(src_id, tgt_id)]
        sy = src.y + src.h * ef
        ty = tgt.y + tgt.h * nf

        style = EDGE_BASE + ("dashed=1;" if dashed else "")
        points = []
        if mode == "v":
            same_col = (row_of.get(src_id), column_of.get(src_id)) == (
                row_of.get(tgt_id), column_of.get(tgt_id)
            )
            adjacent = same_col and abs(stack_index[src_id] - stack_index[tgt_id]) == 1
            if adjacent:
                if stack_index[tgt_id] > stack_index[src_id]:
                    style += "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
                else:
                    style += "exitX=0.5;exitY=0;entryX=0.5;entryY=1;"
            elif same_col:
                gx = src.x - 24 - 14 * long_lane
                long_lane += 1
                style += "exitX=0;exitY=0.5;entryX=0;entryY=0.5;"
                points = [
                    (gx, src.y + src.h / 2),
                    (gx, tgt.y + tgt.h / 2),
                ]
            else:
                if tgt.x >= src.x:
                    lane_x = src.x + src.w + 18 + 14 * gap_lane
                    gap_lane += 1
                    style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
                    points = [(lane_x, sy), (lane_x, ty)]
                else:
                    lane_x = tgt.x + tgt.w + 18 + 14 * gap_lane
                    gap_lane += 1
                    style += f"exitX=0;exitY={ef:.4f};entryX=1;entryY={nf:.4f};"
                    points = [(lane_x, sy), (lane_x, ty)]
        elif mode == "top":
            lane_y = EDGE_TOP_Y + 18 * top_lane
            x1 = src.x + src.w + 18 + 12 * top_lane
            x2 = tgt.x - 18 - 12 * top_lane
            top_lane += 1
            style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
            points = [(x1, sy), (x1, lane_y), (x2, lane_y), (x2, ty)]
        elif mode == "corridor":
            mid_y = row1_bottom + 36 + 18 * corridor_lane
            corridor_lane += 1
            if row_of[src_id] == 0 and row_of[tgt_id] == 1:
                style += f"exitX={ef:.4f};exitY=1;entryX={nf:.4f};entryY=0;"
                points = [
                    (src.x + src.w * ef, mid_y),
                    (tgt.x + tgt.w * nf, mid_y),
                ]
            elif row_of[src_id] == 1 and row_of[tgt_id] == 0:
                style += f"exitX={ef:.4f};exitY=0;entryX={nf:.4f};entryY=1;"
                points = [
                    (src.x + src.w * ef, mid_y),
                    (tgt.x + tgt.w * nf, mid_y),
                ]
            else:
                lane_y = row2_top - 26 - 18 * corridor_lane
                x1 = src.x + src.w + 18
                x2 = tgt.x - 18
                style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
                points = [(x1, sy), (x1, lane_y), (x2, lane_y), (x2, ty)]
        elif mode == "hl_col":
            style += f"exitX=0;exitY={ef:.4f};entryX=1;entryY={nf:.4f};"
        elif mode == "enum":
            lane_x = src.x + src.w + 18 + 11 * enum_lane
            enum_lane += 1
            style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
            points = [(lane_x, sy), (lane_x, ty)]
        elif mode == "hl":
            style += f"exitX=0;exitY={ef:.4f};entryX=1;entryY={nf:.4f};"
        elif mode == "vr":
            lane_x = src.x + src.w + 22 + 18 * vr_lane
            vr_lane += 1
            style += "exitX=1;exitY=0.5;entryX=1;entryY=0.5;"
            points = [
                (lane_x, src.y + src.h / 2),
                (lane_x, tgt.y + tgt.h / 2),
            ]
        else:  # horizontal
            if tgt.x > src.x + src.w + 140 and row_of.get(src_id) == row_of.get(tgt_id):
                lane_y = (
                    (EDGE_TOP_Y + 18 * cross_lane)
                    if row_of.get(src_id) == 0
                    else (row2_top - 26 - 18 * cross_lane)
                )
                x1 = src.x + src.w + 18
                x2 = tgt.x - 18
                cross_lane += 1
                style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
                points = [(x1, sy), (x1, lane_y), (x2, lane_y), (x2, ty)]
            else:
                if tgt.x >= src.x:
                    style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
                else:
                    style += f"exitX=0;exitY={ef:.4f};entryX=1;entryY={nf:.4f};"

        geo = '<mxGeometry relative="1" as="geometry">'
        if points:
            geo += "\n            <Array as=\"points\">"
            for px, py in points:
                geo += f'\n              <mxPoint x="{px}" y="{py}" />'
            geo += "\n            </Array>"
        geo += "\n          </mxGeometry>"

        edge = (
            f'        <mxCell id="e{idx}" value="{esc(label)}" style="{style}" '
            f'parent="1" source="{src_id}" target="{tgt_id}" edge="1">\n'
            f"          {geo}\n"
            f"        </mxCell>"
        )
        body.append(edge)
    return body


def build_grid(row1_cols, row2_cols, edges, path):
    """Arrange diagram in 2 compact horizontal bands (row1 above row2) for docs."""
    placed = {}
    column_of = {}
    stack_index = {}
    row_of = {}

    def place_row(cols, row_idx, start_y):
        x = 50
        max_bottom = start_y
        for ci, column in enumerate(cols):
            if not column:
                continue
            col_w = max((cls.compute_size() or cls.w) for cls in column)
            y = start_y
            for si, cls in enumerate(column):
                cls.x = x
                cls.y = y
                cls.compute_size()
                cls.w = col_w if cls.kind != "note" else cls.w
                y += cls.h + STACK_GAP
                placed[cls.id] = cls
                column_of[cls.id] = ci
                stack_index[cls.id] = si
                row_of[cls.id] = row_idx
                if cls.y + cls.h > max_bottom:
                    max_bottom = cls.y + cls.h
            x += col_w + COL_GAP
        return max_bottom

    row1_bottom = place_row(row1_cols, 0, TOP_Y)
    row2_top = row1_bottom + ROW_GAP
    place_row(row2_cols, 1, row2_top)

    body = []
    for row_cols in (row1_cols, row2_cols):
        for column in row_cols:
            for cls in column:
                body.append(render_class(cls))

    body.extend(
        _route_edges(placed, column_of, stack_index, row_of, row1_bottom, row2_top, edges)
    )

    xml = f'''<mxfile host="Electron" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/29.0.3 Chrome/140.0.7339.249 Electron/38.7.0 Safari/537.36" version="29.0.3">
  <diagram id="d" name="Class Diagram">
    <mxGraphModel dx="1737" dy="1043" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
{chr(10).join(body)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(xml)
    all_x = [c.x + c.w for c in placed.values()]
    all_y = [c.y + c.h for c in placed.values()]
    w = max(all_x) - 50
    h = max(all_y) - TOP_Y
    print(f"wrote {os.path.basename(path)}  ({w}x{h}, ratio={w/h:.2f}, {len(edges)} edges)")


def build(columns, edges, path):
    """Legacy wrapper if needed; splits 7-col flow into 2 compact rows."""
    row1 = columns[:3]
    row2 = columns[3:]
    build_grid(row1, row2, edges, path)


def render_class(cls: Cls) -> str:
    start, row, trailing = KINDS[cls.kind]

    if cls.kind == "note":
        return cell(cls.id, header_value(cls), STYLE_NOTE,
                    geometry=(cls.x, cls.y, cls.w, cls.h))

    style = STYLE_CLASS.format(start=start)
    out = [cell(cls.id, header_value(cls), style,
                geometry=(cls.x, cls.y, cls.w, cls.h))]

    offset = start
    for i, attr in enumerate(cls.attrs):
        out.append(
            cell(f"{cls.id}_r{i}", esc(attr), STYLE_ROW, parent=cls.id,
                 geometry=(0, offset, cls.w, row))
        )
        offset += row

    if cls.methods or trailing:
        out.append(
            cell(f"{cls.id}_sep", "", STYLE_LINE, parent=cls.id,
                 geometry=(0, offset, cls.w, 8))
        )
        offset += 8

    for j, method in enumerate(cls.methods):
        out.append(
            cell(f"{cls.id}_m{j}", esc(method), STYLE_ROW, parent=cls.id,
                 geometry=(0, offset, cls.w, row))
        )
        offset += row

    return "\n".join(out)


# --------------------------------------------------------------------------
# Reusable guard classes
# --------------------------------------------------------------------------

def auth_guard():
    return C(
        "gAuth", "AuthGuard",
        attrs=["-tokenService: TokenService", "-prisma: PrismaService",
               "-reflector: Reflector"],
        methods=[
            "+canActivate(context: ExecutionContext): Promise<boolean>",
            "-extractTokenFromHeader(request: Request): string | undefined",
        ],
    )


def permission_guard():
    return C(
        "gPerm", "PermissionGuard",
        attrs=["-reflector: Reflector",
               "-sharedPermissionRepository: SharedPermissionRepository"],
        methods=["+canActivate(context: ExecutionContext): Promise<boolean>"],
    )


# --------------------------------------------------------------------------
# Shared schema / enum definitions
# --------------------------------------------------------------------------

def schema_job():
    return C("sJob", "Job", kind="schema", stereo="schema", attrs=[
        "+id: number", "+clientId: number", "+title: string", "+slug: string",
        "+description: string | null", "+budgetMin: Decimal | null",
        "+budgetMax: Decimal | null", "+budgetType: BudgetType",
        "+deadline: Date | null", "+status: JobStatus",
        "+expiryDate: Date | null", "+hiringType: HiringType",
        "+positionsRequired: number", "+positionsFilled: number",
        "+createdAt: Date", "+updatedAt: Date", "+deletedAt: Date | null",
    ])


def schema_job_skill():
    return C("sJobSkill", "JobSkill", kind="schema", stereo="schema",
             attrs=["+jobId: number", "+skillId: number"])


def schema_skill():
    return C("sSkill", "Skill", kind="schema", stereo="schema", attrs=[
        "+id: number", "+name: string", "+slug: string",
        "+description: string | null", "+deletedAt: Date | null",
        "+createdAt: Date", "+updatedAt: Date",
    ])


def schema_job_category():
    return C("sJobCategory", "JobCategory", kind="schema", stereo="schema", attrs=[
        "+id: number", "+name: string", "+slug: string",
        "+description: string | null", "+status: JobCategoryStatus",
        "+deletedAt: Date | null", "+createdAt: Date", "+updatedAt: Date",
    ])


def schema_job_job_category():
    return C("sJobJobCategory", "JobJobCategory", kind="schema", stereo="schema",
             attrs=["+jobId: number", "+categoryId: number"])


def schema_user():
    return C("sUser", "User", kind="schema", stereo="schema", attrs=[
        "+id: number", "+email: string", "+isBanned: boolean",
        "+deletedAt: Date | null", "+createdAt: Date",
    ])


def schema_profile():
    return C("sProfile", "Profile", kind="schema", stereo="schema", attrs=[
        "+id: number", "+userId: number", "+displayName: string | null",
        "+avatarUrl: string | null", "+bio: string | null",
        "+availabilityStatus: AvailabilityStatus",
        "+profileCompletionPercent: number",
    ])


def schema_freelancer_profile():
    return C("sFreelancerProfile", "FreelancerProfile", kind="schema", stereo="schema", attrs=[
        "+id: number", "+profileId: number", "+title: string | null",
        "+experience: string[]", "+education: string[]",
        "+certifications: string[]", "+languages: string[]",
        "+cvUrl: string | null", "+idVerified: boolean",
    ])


def enum_job_status():
    return C("eJobStatus", "JobStatus", kind="enum",
             stereo="enum", attrs=["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED",
                                    "CLOSED", "CANCELLED"])


def enum_budget_type():
    return C("eBudgetType", "BudgetType", kind="enum",
             stereo="enum", attrs=["FIXED_PRICE"])


def enum_hiring_type():
    return C("eHiringType", "HiringType", kind="enum",
             stereo="enum", attrs=["SINGLE", "MULTIPLE"])


def enum_job_category_status():
    return C("eJobCategoryStatus", "JobCategoryStatus", kind="enum",
             stereo="enum", attrs=["ACTIVE", "INACTIVE"])


def enum_proposal_status():
    return C("eProposalStatus", "ProposalStatus", kind="enum",
             stereo="enum", attrs=["DRAFT", "SUBMITTED", "HIRED",
                                    "REJECTED", "WITHDRAWN", "EXPIRED"])


def enum_contract_status():
    return C("eContractStatus", "ContractStatus", kind="enum", stereo="enum",
             attrs=["AWAITING_PAYMENT", "PENDING_SIGN", "ACTIVE", "COMPLETED",
                    "DISPUTED", "CANCELLED", "REJECTED", "EXPIRED"])


def enum_notification_type():
    return C("eNotificationType", "NotificationType", kind="enum",
             stereo="enum", attrs=["NEW_FOLLOWER", "JOB_ALERT", "PROPOSAL_NEW",
                                    "PROPOSAL_ACCEPTED", "CONTRACT_CREATED",
                                    "PAYMENT_RELEASED", "DISPUTE_OPENED",
                                    "REVIEW_RECEIVED", "REVIEW_RESPONSE_RECEIVED",
                                    "SYSTEM_ANNOUNCEMENT", "MESSAGE_NEW",
                                    "POST_COMMENT", "POST_LIKE",
                                    "MILESTONE_COMPLETED", "TASK_OVERDUE"])


def enum_platform_fee_status():
    return C("ePlatformFeeStatus", "PlatformFeeStatus", kind="enum",
             stereo="enum", attrs=["UNPAID", "PAID", "WAIVED"])


def schema_job_bookmark():
    return C("sJobBookmark", "JobBookmark", kind="schema", stereo="schema",
             attrs=["+userId: number", "+jobId: number", "+createdAt: Date"])


# --------------------------------------------------------------------------
# 1. UC-10 — [Frevia - User] Job Browsing
# --------------------------------------------------------------------------

def diagram_job_browsing():
    row1 = [
        [C("route", "BrowseJobRoutes", kind="route", stereo="route", attrs=[
            "+GET /jobs (Public)",
            "+GET /jobs/:slug (Public)",
        ])],
        [C("ctrl", "BrowseJobController",
           attrs=["-browseJobService: BrowseJobService"],
           methods=[
               "+viewListJob(query: ViewListJobQueryDto)",
               "+viewJobDetail(slug: string)",
           ])],
        [
            C("d1", "ViewListJobQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
                "+status?: JobStatus", "+budgetType?: BudgetType",
                "+hiringType?: HiringType",
                "+budgetMin?: number", "+budgetMax?: number",
                "+createdAfter?: Date", "+skill?: string", "+category?: string",
                "+clientId?: number",
                '+sortBy: "createdAt" | "updatedAt" | ...',
                '+order: "asc" | "desc"',
            ]),
        ],
        [
            C("t1", "ViewListJobResponseType", stereo="type", attrs=[
                "+data: JobType[]", "+pagination: JobPaginationType",
            ]),
            C("t2", "JobPaginationType", stereo="type", attrs=[
                "+page: number", "+limit: number", "+total: number",
                "+totalPages: number",
            ]),
            C("t3", "ViewJobDetailResType", stereo="type", attrs=[
                "+skills: JobSkillType[]",
                "+jobCategories?: JobCategoryRefType[]",
                "+proposalsCount?: number",
            ]),
        ],
    ]
    row2 = [
        [C("svc", "BrowseJobService",
           attrs=["-browseJobRepository: BrowseJobRepository"],
           methods=[
               "+viewListJob(filter: ViewListJobParsedFilterType): ViewListJobResponseType",
               "+viewJobDetail(slug: string): ViewJobDetailResType",
           ])],
        [C("repo", "BrowseJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getJobLists(filter): { jobs: JobType[]; total: number }",
               "+viewJobDetail(slug: string): ViewJobDetailResType",
               "-normalizeJob<T>(job: T)",
           ])],
        [schema_user(), schema_job_skill(), schema_skill(), schema_job_job_category()],
        [schema_job(), schema_job_category()],
        [
            enum_job_status(), enum_budget_type(), enum_hiring_type(),
            enum_job_category_status(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "t1", "returns", True, "top"),
        ("ctrl", "t3", "returns", True, "top"),
        ("t1", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJob", "maps to", True, "corridor"),
        ("sUser", "sJob", "1..*", True, "v"),
        ("sJob", "sJobSkill", "1..*", True, "v"),
        ("sJobSkill", "sSkill", "*..1", True, "v"),
        ("sJob", "sJobJobCategory", "1..*", True, "v"),
        ("sJobJobCategory", "sJobCategory", "*..1", True, "v"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
        ("sJobCategory", "eJobCategoryStatus", "status", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-10_Job_Browsing_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 2. UC-11 — [Frevia - Client] Job Management
# --------------------------------------------------------------------------

def diagram_job_management():
    row1 = [
        [
            C("route", "ManageJobRoutes", kind="route", stereo="route", attrs=[
                "+GET /manage-jobs (AuthGuard, PermissionGuard)",
                "+GET /manage-jobs/skills (AuthGuard, PermissionGuard)",
                "+POST /manage-jobs/check-language (AuthGuard, PermissionGuard)",
                "+GET /manage-jobs/:id (AuthGuard, PermissionGuard)",
                "+POST /manage-jobs (AuthGuard, PermissionGuard)",
                "+PATCH /manage-jobs/:id (AuthGuard, PermissionGuard)",
                "+DELETE /manage-jobs/:id (AuthGuard, PermissionGuard)",
                "+PATCH /manage-jobs/:id/publish (AuthGuard, PermissionGuard)",
                "+PATCH /manage-jobs/:id/close (AuthGuard, PermissionGuard)",
                "+PATCH /manage-jobs/:id/reopen (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "ManageJobController",
              attrs=["-manageJobService: ManageJobService"],
              methods=[
                  "+searchSkills(roleName, search?)",
                  "+checkLanguage(userId, roleName, body: CheckLanguageBody)",
                  "+viewClientJobs(userId, roleName, query: ViewClientJobQueryDto)",
                  "+viewClientJobDetail(userId, roleName, id)",
                  "+createJob(userId, roleName, body: CreateJobBodyDto)",
                  "+updateJob(id, userId, roleName, body: UpdateJobBodyDto)",
                  "+deleteJob(id, userId, roleName)",
                  "+publishJob(id, userId, roleName)",
                  "+closeJob(id, userId, roleName)",
                  "+reopenJob(id, userId, roleName)",
              ]),
            C("d3", "ViewClientJobQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
                "+status?: JobStatus", "+budgetType?: BudgetType",
                "+hiringType?: HiringType",
                "+budgetMin?: number", "+budgetMax?: number",
                "+createdAfter?: Date", "+skill?: string", "+category?: string",
                "+clientId?: number",
                '+sortBy: "createdAt" | "updatedAt" | ...',
                '+order: "asc" | "desc"',
            ]),
        ],
        [
            C("d1", "CreateJobBodyDto", stereo="dto", attrs=[
                "+title: string", "+description: string",
                "+budgetMin: number", "+budgetMax: number",
                "+budgetType: BudgetType", "+deadline: Date",
                "+expiryDate: Date", "+skills: number[]",
                "+jobCategories: number[]", "+hiringType?: HiringType",
                "+positionsRequired?: number",
            ]),
            C("d2", "UpdateJobBodyDto", stereo="dto", attrs=[
                "+title: string", "+description: string",
                "+budgetMin: number", "+budgetMax: number",
                "+budgetType: BudgetType", "+deadline: Date",
                "+expiryDate: Date", "+skills: number[]",
                "+jobCategories: number[]", "+hiringType?: HiringType",
                "+positionsRequired?: number",
            ]),
        ],
        [
            C("t1", "JobType", stereo="type", attrs=[
                "+id: number", "+slug: string", "+clientId: number",
                "+title: string", "+description: string | null",
                "+budgetMin: number | null", "+budgetMax: number | null",
                "+budgetType: BudgetType", "+deadline: Date | null",
                "+status: JobStatus", "+expiryDate: Date | null",
                "+hiringType: HiringType", "+positionsRequired: number",
                "+positionsFilled: number", "+createdAt: Date", "+updatedAt: Date",
                "+skills?: JobSkillType[]",
                "+jobCategories?: JobCategoryRefType[]",
                "+proposalsCount?: number",
            ]),
            C("t2", "JobSkillType", stereo="type",
              attrs=["+jobId: number", "+skillId: number", "+skill: { name: string }"]),
            C("t3", "JobCategoryRefType", stereo="type",
              attrs=["+id: number", "+name: string", "+slug: string"]),
        ],
    ]
    row2 = [
        [
            C("svc", "ManageJobService",
              attrs=["-manageJobRepository: ManageJobRepository",
                     "-embeddingOutbox: EmbeddingOutboxService",
                     "-fastTextService: FastTextService",
                     "-cacheService?: CacheService"],
              methods=[
                  "+checkLanguage(title?, description?, userId?, roleName?, excludeJobId?)",
                  "+viewClientJobs(userId, roleName, filter): ViewListJobResponseType",
                  "+searchSkills(roleName, search?): { id: number; name: string }[]",
                  "+viewClientJobDetail(userId, roleName, jobId): ViewJobDetailResType",
                  "+createJob(userId, roleName, body: CreateJobBodyType): JobType",
                  "+updateJob(userId, roleName, jobId, body: UpdateJobBodyType): JobType",
                  "+deleteJob(userId, roleName, jobId): Promise<void>",
                  "+publishJob(userId, roleName, jobId): Promise<JobType>",
                  "+closeJob(userId, roleName, jobId): Promise<JobType>",
                  "+reopenJob(userId, roleName, jobId): Promise<JobType>",
                  "-validateJobLanguage(title?, description?): Promise<void>",
                  "-assertClientRole(roleName): void",
                  "-invalidateJobCategoryCache(): void",
              ]),
            C("outbox", "EmbeddingOutboxService", stereo="utility",
              attrs=["-prisma: PrismaService", "-index: RecommendationIndexService"],
              methods=[
                  "+enqueue(input: EmbeddingOutboxInput): Promise<void>",
                  "+enqueueAndProcess(input: EmbeddingOutboxInput): Promise<void>",
                  "+processPending(limit?: number): { processed: number; failed: number }",
              ]),
            C("fasttext", "FastTextService", stereo="utility",
              methods=[
                  "+detect(text: string): Promise<string>",
                  "+isEnglish(text: string): Promise<boolean>",
              ]),
        ],
        [C("repo", "ManageJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getClientJobLists(clientId, filter)",
               "+getClientJobDetail(clientId, jobId)",
               "+hasDuplicateTitle(clientId, title, excludeJobId?): boolean",
               "+createJob(clientId, data: CreateJobBodyType): JobType",
               "+updateJob(userId, jobId, data: UpdateJobBodyType): JobType",
               "+deleteJob(userId, jobId): Promise<void>",
               "+publishJob(userId, jobId): Promise<JobType>",
               "+closeJob(userId, jobId): Promise<JobType>",
               "+reopenJob(userId, jobId): Promise<JobType>",
               "+searchSkills(search?): Array<{ id: number; name: string }>",
               "-autoCloseExpiredJobs(clientId?): Promise<void>",
               "-checkJobOwner(userId, jobId)",
               "-replaceJobSkills(tx, jobId, skillIds)",
               "-replaceJobCategories(tx, jobId, categoryIds)",
               "-assertJobCategoriesUsable(tx, categoryIds)",
               "-normalizeJob<T>(job: T)",
               "-slugify(value): string",
               "-createJobSlug(title): string",
           ])],
        [schema_user(), schema_job_skill(), schema_skill(), schema_job_job_category()],
        [schema_job(), schema_job_category()],
        [
            enum_job_status(), enum_budget_type(), enum_hiring_type(),
            enum_job_category_status(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "d3", "", True, "v"),
        ("ctrl", "t1", "returns", True, "top"),
        ("t1", "t2", "uses", True, "v"),
        ("t1", "t3", "uses", True, "vr"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("svc", "outbox", "uses", False, "v"),
        ("svc", "fasttext", "uses", False, "v"),
        ("repo", "sJob", "maps to", True, "corridor"),
        ("sUser", "sJob", "1..*", True, "v"),
        ("sJob", "sJobSkill", "1..*", True, "v"),
        ("sJobSkill", "sSkill", "*..1", True, "v"),
        ("sJob", "sJobJobCategory", "1..*", True, "v"),
        ("sJobJobCategory", "sJobCategory", "*..1", True, "v"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
        ("sJobCategory", "eJobCategoryStatus", "status", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-11_Job_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 3. UC-12 — [Frevia - Freelancer] Bookmarked Jobs Management
# --------------------------------------------------------------------------

def diagram_bookmarked_jobs():
    row1 = [
        [
            C("route", "ManageJobRoutes", kind="route", stereo="route", attrs=[
                "+GET /manage-jobs/bookmarks (AuthGuard, PermissionGuard)",
                "+POST /manage-jobs/jobs/:slug/bookmark (AuthGuard, PermissionGuard)",
                "+GET /manage-jobs/jobs/:slug/bookmark (AuthGuard, PermissionGuard)",
                "+DELETE /manage-jobs/bookmarks/:slug (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "ManageJobController",
              attrs=["-manageJobService: ManageJobService"],
              methods=[
                  "+viewBookmarkedJob(userId, roleName, query: ViewBookmarkedJobQueryDto)",
                  "+bookmarkJob(userId, roleName, slug)",
                  "+getBookmarkStatus(userId, roleName, slug)",
                  "+removeBookmark(userId, slug)",
              ]),
        ],
        [
            C("d1", "ViewBookmarkedJobQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
                "+status?: JobStatus", "+budgetType?: BudgetType",
                "+budgetMin?: number", "+budgetMax?: number", "+skill?: string",
                '+sortBy: "createdAt" | "updatedAt" | ...',
                '+order: "asc" | "desc"',
            ]),
        ],
        [
            C("t1", "ViewBookmarkedJobResponseType", stereo="type", attrs=[
                "+data: ViewJobDetailResType[]",
                "+pagination: JobPaginationType",
            ]),
            C("t2", "JobBookmarkType", stereo="type", attrs=[
                "+userId: number", "+jobId: number", "+createdAt: Date",
            ]),
        ],
    ]
    row2 = [
        [C("svc", "ManageJobService",
           attrs=["-manageJobRepository: ManageJobRepository"],
           methods=[
               "+viewBookmarkedJob(userId, roleName, filter): ViewBookmarkedJobResponseType",
               "+bookmarkJob(userId, roleName, slug): Promise<void>",
               "+getBookmarkStatus(userId, roleName, slug): { isBookmarked: boolean }",
               "+removeBookmark(userId, slug): Promise<void>",
               "-assertFreelancerRole(roleName): void",
           ])],
        [C("repo", "ManageJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getBookmarkedJobLists(userId, filter)",
               "+findJobBySlug(slug): Pick<JobType, \"id\"> | null",
               "+findBookmark(userId, jobId): JobBookmarkType | null",
               "+bookmarkJob(userId, jobId): Promise<JobBookmarkType>",
               "+removeBookmark(userId, jobId): Promise<JobBookmarkType>",
               "-normalizeJob<T>(job: T)",
           ])],
        [schema_user(), schema_job_bookmark(), schema_job_skill(), schema_skill()],
        [schema_job()],
        [enum_job_status(), enum_budget_type(), enum_hiring_type()],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "t1", "returns", True, "top"),
        ("svc", "t2", "uses", True, "corridor"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJobBookmark", "maps to", True, "h"),
        ("sUser", "sJobBookmark", "1..*", True, "v"),
        ("sJob", "sJobBookmark", "1..*", True, "v"),
        ("sJob", "sJobSkill", "1..*", True, "v"),
        ("sJobSkill", "sSkill", "*..1", True, "v"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-12_Bookmarked_Jobs_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 4. UC-22 — [Frevia - Freelancer] Saved Search Management
# --------------------------------------------------------------------------

def diagram_saved_search():
    row1 = [
        [
            C("route", "SavedSearchRoutes", kind="route", stereo="route", attrs=[
                "+GET /saved-searches (AuthGuard, PermissionGuard)",
                "+GET /saved-searches/:id (AuthGuard, PermissionGuard)",
                "+POST /saved-searches (AuthGuard, PermissionGuard)",
                "+DELETE /saved-searches/:id (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "SavedSearchController",
              attrs=["-savedSearchService: SavedSearchService"],
              methods=[
                  "+getSavedSearches(userId, query: GetSavedSearchesQueryDto)",
                  "+getSavedSearchDetail(userId, id)",
                  "+createSavedSearch(userId, body: CreateSavedSearchBodyDto)",
                  "+deleteSavedSearch(userId, id)",
              ]),
        ],
        [
            C("d1", "GetSavedSearchesQueryDto", stereo="dto", attrs=[
                "+search?: string", '+order: "asc" | "desc"',
            ]),
            C("d2", "CreateSavedSearchBodyDto", stereo="dto", attrs=[
                "+name: string", "+searchParams: SavedSearchParamsType",
            ]),
            C("t1", "SavedSearchType", stereo="type", attrs=[
                "+id: number", "+userId: number", "+name: string",
                "+searchParams: SavedSearchParamsType", "+createdAt: Date",
            ]),
            C("t2", "SavedSearchParamsType", stereo="type",
              attrs=["+[key: string]: unknown"]),
        ],
    ]
    row2 = [
        [C("svc", "SavedSearchService",
           attrs=["-savedSearchRepository: SavedSearchRepository"],
           methods=[
               "+getSavedSearches(userId, query?): Promise<SavedSearchType[]>",
               "+getSavedSearchDetail(userId, id): Promise<SavedSearchType>",
               "+createSavedSearch(userId, body: CreateSavedSearchBodyType): SavedSearchType",
               "+deleteSavedSearch(userId, id): Promise<void>",
           ])],
        [C("repo", "SavedSearchRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findAllByUserId(userId, query?): Promise<SavedSearchType[]>",
               "+countByUserId(userId): Promise<number>",
               "+findByIdAndUserId(id, userId): SavedSearchType | null",
               "+create(userId, data: CreateSavedSearchBodyType): SavedSearchType",
               "+delete(id, userId): Promise<boolean>",
           ])],
        [
            C("sSavedSearch", "SavedSearch", kind="schema", stereo="schema", attrs=[
                "+id: number", "+userId: number", "+name: string",
                "+searchParams: Json", "+createdAt: Date",
            ]),
            schema_user(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("t1", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sSavedSearch", "maps to", True, "h"),
        ("sUser", "sSavedSearch", "1..*", True, "v"),
    ]
    build_grid(row1, row2, edges, "UC-22_Saved_Search_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 5. UC-23 — [Frevia - Freelancer] Job Alert Management
# --------------------------------------------------------------------------

def diagram_job_alert():
    row1 = [
        [
            C("route", "JobAlertRoutes", kind="route", stereo="route", attrs=[
                "+GET /job-alerts (AuthGuard, PermissionGuard)",
                "+GET /job-alerts/:id/matching-jobs (AuthGuard, PermissionGuard)",
                "+GET /job-alerts/:id (AuthGuard, PermissionGuard)",
                "+POST /job-alerts (AuthGuard, PermissionGuard)",
                "+PATCH /job-alerts/:id (AuthGuard, PermissionGuard)",
                "+DELETE /job-alerts/:id (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "JobAlertController",
              attrs=["-jobAlertService: JobAlertService"],
              methods=[
                  "+getJobAlerts(userId, roleName)",
                  "+getMatchingJobs(userId, roleName, id)",
                  "+getJobAlertDetail(userId, roleName, id)",
                  "+createJobAlert(userId, roleName, body: CreateJobAlertBodyDto)",
                  "+updateJobAlert(userId, roleName, id, body: UpdateJobAlertBodyDto)",
                  "+deleteJobAlert(userId, roleName, id)",
              ]),
        ],
        [
            C("d1", "CreateJobAlertBodyDto", stereo="dto", attrs=[
                "+name?: string", "+keywords?: string | null",
                "+skills: string[]", "+frequency: JobAlertFrequency",
                "+channels: NotificationChannel[]",
            ]),
            C("d2", "UpdateJobAlertBodyDto", stereo="dto", attrs=[
                "+name?: string", "+keywords?: string | null",
                "+skills?: string[]", "+frequency?: JobAlertFrequency",
                "+channels?: NotificationChannel[]", "+isActive?: boolean",
            ]),
        ],
        [
            C("t1", "JobAlertType", stereo="type", attrs=[
                "+id: number", "+userId: number", "+name?: string | null",
                "+keywords?: string | null", "+skills: string[]",
                "+frequency: JobAlertFrequency",
                "+channels: NotificationChannel[]", "+isActive: boolean",
                "+lastSentAt?: Date | null", "+createdAt: Date",
                "+updatedAt: Date",
            ]),
            C("t2", "MatchingJobItemType", stereo="type", attrs=[
                "+id: number", "+title: string", "+slug: string",
                "+budgetMin?: number | null", "+budgetMax?: number | null",
                "+budgetType: string", "+createdAt: Date",
            ]),
            C("t3", "DeleteJobAlertResponseType", stereo="type", attrs=[
                "+success: boolean",
            ]),
        ],
    ]
    row2 = [
        [C("svc", "JobAlertService",
           attrs=["-jobAlertRepository: JobAlertRepository"],
           methods=[
               "+getJobAlerts(userId, roleName): Promise<JobAlertType[]>",
               "+getJobAlertDetail(userId, roleName, id): Promise<JobAlertType>",
               "+createJobAlert(userId, roleName, body: CreateJobAlertBodyType): JobAlertType",
               "+updateJobAlert(userId, roleName, id, body: UpdateJobAlertBodyType): JobAlertType",
               "+deleteJobAlert(userId, roleName, id): DeleteJobAlertResponseType",
               "+getMatchingJobs(userId, roleName, id): Promise<MatchingJobItemType[]>",
               "-assertFreelancerRole(roleName): void",
               "-normalizeCriteria(keywords?, skills?)",
           ])],
        [C("repo", "JobAlertRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+countByUserId(userId): Promise<number>",
               "+findAllByUserId(userId): Promise<JobAlertType[]>",
               "+findByIdAndUserId(id, userId): JobAlertType | null",
               "+findDuplicate(userId, keyword, skills, excludeId?): JobAlertType | null",
               "+create(userId, data: CreateJobAlertBodyType): JobAlertType",
               "+update(id, userId, data: UpdateJobAlertBodyType): JobAlertType | null",
               "+delete(id, userId): Promise<boolean>",
               "+findMatchingJobs(userId, keywords, skills, limit?): MatchingJobItemType[]",
           ])],
        [
            C("sJobAlert", "JobAlert", kind="schema", stereo="schema", attrs=[
                "+id: number", "+userId: number", "+name: string | null",
                "+keywords: string | null", "+skills: string[]",
                "+frequency: JobAlertFrequency",
                "+channels: NotificationChannel[]", "+isActive: boolean",
                "+lastSentAt: Date | null", "+createdAt: Date",
                "+updatedAt: Date",
            ]),
            schema_job(),
            schema_user(),
        ],
        [
            C("eFrequency", "JobAlertFrequency", kind="enum", stereo="enum",
              attrs=["INSTANT", "DAILY", "WEEKLY"]),
            C("eChannel", "NotificationChannel", kind="enum", stereo="enum",
              attrs=["IN_APP", "EMAIL"]),
            enum_job_status(),
            enum_budget_type(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t1", "returns", True, "top"),
        ("ctrl", "t2", "returns", True, "top"),
        ("ctrl", "t3", "returns", True, "top"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJobAlert", "maps to", True, "h"),
        ("repo", "sJob", "queries", True, "h"),
        ("sUser", "sJobAlert", "1..*", True, "v"),
        ("sUser", "sJob", "1..*", True, "v"),
        ("sJobAlert", "eFrequency", "frequency", True, "enum"),
        ("sJobAlert", "eChannel", "channels", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-23_Job_Alert_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 6. UC-32 — [Frevia - Freelancer] Proposal Management
# --------------------------------------------------------------------------

def diagram_freelancer_proposal():
    row1 = [
        [
            C("route", "ProposalRoutes", kind="route", stereo="route", attrs=[
                "+GET /proposals/my (AuthGuard, PermissionGuard)",
                "+GET /proposals/jobs/:jobId/mine (AuthGuard, PermissionGuard)",
                "+GET /proposals/:id (AuthGuard, PermissionGuard)",
                "+POST /proposals/jobs/:jobId (AuthGuard, PermissionGuard)",
                "+POST /proposals/jobs/:jobId/drafts (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/draft (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/submit (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/withdraw (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "ProposalController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getMyProposals(userId, roleName, query: MyProposalsQueryDto)",
                  "+getMyActiveProposalForJob(userId, roleName, jobId)",
                  "+getProposalDetail(userId, roleName, proposalId)",
                  "+createProposal(userId, roleName, jobId, body: CreateProposalBodyDto)",
                  "+saveDraft(userId, roleName, jobId, body: SaveProposalDraftBodyDto)",
                  "+updateDraft(userId, roleName, proposalId, body: SaveProposalDraftBodyDto)",
                  "+submitDraft(userId, roleName, proposalId)",
                  "+withdrawProposal(userId, roleName, proposalId)",
                  "+updateProposal(userId, roleName, proposalId, body: UpdateProposalBodyDto)",
              ]),
        ],
        [
            C("d1", "CreateProposalBodyDto", stereo="dto", attrs=[
                "+coverLetter: string", "+bidAmount: number",
                "+deliveryDays: number",
            ]),
            C("d2", "SaveProposalDraftBodyDto", stereo="dto", attrs=[
                "+coverLetter?: string", "+bidAmount?: number",
                "+deliveryDays?: number",
            ]),
            C("d3", "UpdateProposalBodyDto", stereo="dto", attrs=[
                "+coverLetter?: string", "+bidAmount?: number",
                "+deliveryDays?: number",
            ]),
            C("d4", "MyProposalsQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+jobId?: number",
                "+status?: ProposalStatus",
            ]),
        ],
        [
            C("t1", "ProposalType", stereo="type", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: number | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+createdAt: Date", "+submittedAt: Date | null",
                "+acceptedAt: Date | null", "+rejectedAt: Date | null",
                "+withdrawnAt: Date | null", "+expiresAt: Date | null",
                "+updatedAt: Date",
            ]),
            C("t2", "ProposalDetailType", stereo="type", attrs=[
                "+job: ProposalJobType", "+client: ProposalClientType",
            ]),
            C("t3", "MyProposalsResponseType", stereo="type", attrs=[
                "+data: ProposalDetailType[]", "+totalItems: number",
                "+totalPages: number", "+page: number", "+limit: number",
            ]),
        ],
    ]
    row2 = [
        [C("svc", "ProposalService",
           attrs=["-proposalRepository: ProposalRepository"],
           methods=[
               "+getMyProposals(userId, roleName, query): MyProposalsResponseType",
               "+getMyActiveProposalForJob(userId, roleName, jobId): ProposalType | null",
               "+getProposalDetail(userId, roleName, proposalId): ProposalDetailType",
               "+createProposal(userId, roleName, jobId, body): Promise<ProposalType>",
               "+saveDraft(userId, roleName, jobId, body): Promise<ProposalType>",
               "+updateDraft(userId, roleName, proposalId, body): Promise<ProposalType>",
               "+updateProposal(userId, roleName, proposalId, body): Promise<ProposalType>",
               "+submitDraft(userId, roleName, proposalId): Promise<ProposalType>",
               "+withdrawProposal(userId, roleName, proposalId): Promise<ProposalType>",
               "-assertFreelancer(roleName): void",
               "-assertActionable(status: ProposalStatusType): void",
               "-assertCanPropose(userId, roleName, jobId, ignoredId?): Promise<void>",
               "-assertBidSafeguard(bidAmount, budgetMin?, budgetMax?): void",
               "-assertDeliveryDaysSafeguard(deliveryDays, deadline?): void",
               "-getOwnedDraft(userId, proposalId)",
               "-expireStaleProposals(): Promise<void>",
           ])],
        [C("repo", "ProposalRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findJobForProposal(jobId)",
               "+findFreelancerStatus(userId)",
               "+countProposalsByFreelancerAndJob(freelancerId, jobId): number",
               "+findActiveProposal(jobId, freelancerId, ignoredId?)",
               "+findMyActiveProposal(jobId, freelancerId)",
               "+findProposal(proposalId)",
               "+createDraft(jobId, freelancerId, data): Promise<ProposalType>",
               "+createSubmitted(jobId, freelancerId, data): Promise<ProposalType>",
               "+updateDraft(proposalId, data): Promise<ProposalType>",
               "+submitDraft(proposalId): Promise<ProposalType>",
               "+withdrawProposal(proposalId): Promise<ProposalType>",
               "+expireOverdueProposals(jobId?): Promise<number>",
               "+getMyProposals(freelancerId, query): MyProposalsResponseType",
               "+getProposalDetail(proposalId): ProposalDetailType | null",
               "-normalize(proposal): ProposalType",
               "-normalizeDetail(proposal): ProposalDetailType",
           ])],
        [schema_user(), schema_profile(), schema_freelancer_profile()],
        [
            C("sProposal", "Proposal", kind="schema", stereo="schema", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: Decimal | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+createdAt: Date", "+submittedAt: Date | null",
                "+acceptedAt: Date | null", "+rejectedAt: Date | null",
                "+withdrawnAt: Date | null", "+expiresAt: Date | null",
                "+updatedAt: Date", "+deletedAt: Date | null",
            ]),
            schema_job(),
        ],
        [
            enum_proposal_status(), enum_job_status(), enum_hiring_type(),
            enum_budget_type(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "d3", "", True, "h"),
        ("ctrl", "d4", "", True, "h"),
        ("ctrl", "t1", "returns", True, "top"),
        ("ctrl", "t2", "returns", True, "top"),
        ("ctrl", "t3", "returns", True, "top"),
        ("t3", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sProposal", "maps to", True, "corridor"),
        ("sJob", "sProposal", "1..*", True, "v"),
        ("sUser", "sProposal", "1..*", True, "v"),
        ("sUser", "sProfile", "1..1", True, "v"),
        ("sProfile", "sFreelancerProfile", "1..1", True, "v"),
        ("sProposal", "eProposalStatus", "status", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-32_Freelancer_Proposal_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 7. UC-32 — [Frevia - Client] Proposal Management
# --------------------------------------------------------------------------

def diagram_client_proposal():
    row1 = [
        [
            C("route", "ProposalRoutes", kind="route", stereo="route", attrs=[
                "+GET /proposals/jobs/:jobId/submitted (AuthGuard, PermissionGuard)",
                "+GET /proposals/:id/client (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/reject (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/accept (AuthGuard, PermissionGuard)",
            ]),
            C("route2", "ClientJobProposalsRoutes", kind="route", stereo="route", attrs=[
                "+GET /jobs/:jobId/proposals (AuthGuard, PermissionGuard)",
            ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("ctrl", "ProposalController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getSubmittedProposalsForClientJob(userId, roleName, jobId)",
                  "+getProposalDetailForClient(userId, roleName, proposalId)",
                  "+rejectProposal(userId, roleName, proposalId)",
                  "+acceptProposal(userId, roleName, proposalId)",
              ]),
            C("ctrl2", "ClientJobProposalsController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getSubmittedProposals(userId, roleName, jobId, query)",
              ]),
        ],
        [
            C("d1", "ClientJobProposalsQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number",
                "+status?: SubmittedProposalStatus",
            ]),
            C("t1", "ClientJobProposalType", stereo="type", attrs=[
                "+freelancer: ProposalFreelancerType",
            ]),
            C("t2", "ClientJobProposalsPageType", stereo="type", attrs=[
                "+data: ClientJobProposalType[]", "+totalItems: number",
                "+totalPages: number", "+page: number", "+limit: number",
            ]),
        ],
        [
            C("t3", "ClientProposalDetailType", stereo="type", attrs=[
                "+job: ProposalJobType", "+freelancer: ProposalFreelancerType",
            ]),
            C("t4", "ProposalType", stereo="type", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: number | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+createdAt: Date", "+submittedAt: Date | null",
                "+acceptedAt: Date | null", "+rejectedAt: Date | null",
                "+withdrawnAt: Date | null", "+expiresAt: Date | null",
                "+updatedAt: Date",
            ]),
        ],
    ]
    row2 = [
        [C("svc", "ProposalService",
           attrs=["-proposalRepository: ProposalRepository"],
           methods=[
               "+getSubmittedProposalsForClientJob(userId, roleName, jobId)",
               "+getSubmittedProposalsPageForClientJob(userId, roleName, jobId, query)",
               "+getProposalDetailForClient(userId, roleName, proposalId)",
               "+rejectProposal(userId, roleName, proposalId): Promise<ProposalType>",
               "+acceptProposal(userId, roleName, proposalId): Promise<ProposalType>",
               "-assertActionable(status: ProposalStatusType): void",
               "-expireStaleProposals(): Promise<void>",
           ])],
        [C("repo", "ProposalRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findJobForClientProposals(jobId)",
               "+findSubmittedProposalsForClientJob(jobId)",
               "+findSubmittedProposalsPageForClientJob(jobId, query)",
               "+findProposalForClientDecision(proposalId)",
               "+findProposalDetailForClient(proposalId)",
               "+rejectProposal(proposalId): Promise<ProposalType>",
               "+hireProposal(params: HireProposalParams): Promise<ProposalType>",
               "+expireOverdueProposals(jobId?): Promise<number>",
               "+cancelPendingProposalsForJob(jobId): Promise<number>",
               "-normalize(proposal): ProposalType",
           ])],
        [schema_user(), schema_profile(), schema_freelancer_profile()],
        [
            C("sProposal", "Proposal", kind="schema", stereo="schema", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: Decimal | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+submittedAt: Date | null", "+acceptedAt: Date | null",
                "+rejectedAt: Date | null", "+expiresAt: Date | null",
                "+deletedAt: Date | null",
            ]),
            schema_job(),
            C("sContract", "Contract", kind="schema", stereo="schema", attrs=[
                "+id: number", "+slug: string", "+jobId: number", "+proposalId: number",
                "+clientId: number", "+freelancerId: number",
                "+totalAmount: Decimal", "+status: ContractStatus",
                "+signedByClient: boolean", "+signedByFreelancer: boolean",
                "+platformFee: Decimal", "+platformFeeStatus: PlatformFeeStatus",
                "+createdAt: Date", "+signedAt: Date | null",
            ]),
            C("sNotification", "Notification", kind="schema", stereo="schema", attrs=[
                "+id: number", "+userId: number", "+type: NotificationType",
                "+title: string | null", "+message: string | null",
                "+data: Json | null", "+isRead: boolean", "+createdAt: Date",
            ]),
        ],
        [
            enum_proposal_status(), enum_job_status(), enum_hiring_type(),
            enum_contract_status(), enum_platform_fee_status(),
            enum_notification_type(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route2", "ctrl2", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "v"),
        ("route", "gPerm", "uses", True, "v"),
        ("route2", "gAuth", "uses", True, "v"),
        ("route2", "gPerm", "uses", True, "v"),
        ("ctrl2", "d1", "", True, "h"),
        ("ctrl2", "t2", "returns", True, "h"),
        ("ctrl", "t3", "returns", True, "top"),
        ("ctrl", "t4", "returns", True, "top"),
        ("t2", "t1", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("ctrl2", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sProposal", "maps to", True, "corridor"),
        ("sJob", "sProposal", "1..*", True, "v"),
        ("sProposal", "sContract", "1..1", True, "v"),
        ("sUser", "sContract", "1..*", True, "v"),
        ("sUser", "sNotification", "1..*", True, "v"),
        ("sUser", "sProfile", "1..1", True, "v"),
        ("sProfile", "sFreelancerProfile", "1..1", True, "v"),
        ("sProposal", "eProposalStatus", "status", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
        ("sContract", "eContractStatus", "status", True, "enum"),
        ("sContract", "ePlatformFeeStatus", "platformFeeStatus", True, "enum"),
        ("sNotification", "eNotificationType", "type", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-32_Client_Proposal_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 8. UC-46.07 / UC-46.08 — [Frevia - Freelancer] Job Category
# --------------------------------------------------------------------------

def diagram_job_category_browse():
    row1 = [
        [C("route", "JobCategoriesRoutes", kind="route", stereo="route", attrs=[
            "+GET /job-categories (Public)",
            "+GET /job-categories/:slug (Public)",
        ])],
        [C("ctrl", "JobCategoriesController",
           attrs=["-service: JobCategoriesService"],
           methods=[
               "+viewJobCategoryList(query: JobCategoryBrowseQueryDto)",
               "+viewJobCategoryDetail(slug, query: JobCategoryDetailQueryDto)",
           ])],
        [
            C("d1", "JobCategoryBrowseQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
            ]),
            C("d2", "JobCategoryDetailQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number",
            ]),
        ],
        [
            C("t1", "JobCategoryBrowseItemType", stereo="type", attrs=[
                "+id: number", "+name: string", "+slug: string",
                "+description: string | null", "+jobCount: number",
            ]),
            C("t2", "JobCategoryBrowseListResponseType", stereo="type", attrs=[
                "+jobCategories: JobCategoryBrowseItemType[]",
                "+pagination: PaginationType",
            ]),
            C("t3", "ViewJobCategoryDetailResponseType", stereo="type", attrs=[
                "+id: number", "+name: string", "+slug: string",
                "+description: string | null", "+jobCount: number",
                "+jobs: ViewJobDetailResType[]", "+pagination: PaginationType",
            ]),
        ],
    ]
    row2 = [
        [
            C("svc", "JobCategoriesService",
              attrs=["-repository: JobCategoriesRepository",
                     "-cacheService?: CacheService"],
              methods=[
                  "+viewJobCategoryList(query): JobCategoryBrowseListResponseType",
                  "+viewJobCategoryDetail(slug, page, limit): ViewJobCategoryDetailResponseType",
              ]),
            C("cache", "CacheService", stereo="utility",
              methods=[
                  "+get<T>(key: string): T | undefined",
                  "+set<T>(key: string, value: T, ttlSeconds: number): void",
                  "+wrap<T>(key: string, fn, ttlSeconds): Promise<T>",
              ]),
        ],
        [C("repo", "JobCategoriesRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+listJobCategories(query): JobCategoryBrowseListResponseType",
               "+getJobCategoryDetail(slug, page, limit): ViewJobCategoryDetailResponseType",
               "-toItem(row: JobCategoryRow): JobCategoryBrowseItemType",
               "-normalizeJob(job: BrowseJobRow)",
           ])],
        [schema_job_job_category(), schema_job_skill(), schema_skill()],
        [schema_job_category(), schema_job()],
        [enum_job_category_status(), enum_job_status(), enum_budget_type(),
         enum_hiring_type()],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t2", "returns", True, "top"),
        ("ctrl", "t3", "returns", True, "top"),
        ("t2", "t1", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "corridor"),
        ("svc", "repo", "calls", False, "h"),
        ("svc", "cache", "uses", False, "v"),
        ("repo", "sJobCategory", "maps to", True, "corridor"),
        ("sJobCategory", "sJobJobCategory", "1..*", True, "v"),
        ("sJobJobCategory", "sJob", "*..1", True, "v"),
        ("sJob", "sJobSkill", "1..*", True, "v"),
        ("sJobSkill", "sSkill", "*..1", True, "v"),
        ("sJobCategory", "eJobCategoryStatus", "status", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
    ]
    build_grid(row1, row2, edges, "UC-46_Freelancer_Job_Category_Class_Diagram.drawio")


# --------------------------------------------------------------------------

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    diagram_job_browsing()
    diagram_job_management()
    diagram_bookmarked_jobs()
    diagram_saved_search()
    diagram_job_alert()
    diagram_freelancer_proposal()
    diagram_client_proposal()
    diagram_job_category_browse()
