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
            self.w = self.width or max(300, min(640, int(longest * 7.45) + 26))


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

COL_GAP = 110
TOP_Y = 160
STACK_GAP = 80
EDGE_TOP_Y = 90


def build(columns, edges, path):
    """columns: list[list[Cls]] (one list per layer, left to right)."""
    x = 40
    placed = {}
    for column in columns:
        if not column:
            continue
        col_w = max(cls.compute_size() or cls.w for cls in column)
        y = TOP_Y
        for cls in column:
            cls.x = x
            cls.y = y
            cls.compute_size()
            cls.w = col_w if cls.kind != "note" else cls.w
            y += cls.h + STACK_GAP
            placed[cls.id] = cls
        x += col_w + COL_GAP

    # Fan out multiple edges leaving / entering the same class.
    outgoing = {}
    incoming = {}
    for src_id, tgt_id, _label, _dashed, _mode in edges:
        outgoing.setdefault(src_id, []).append(tgt_id)
        incoming.setdefault(tgt_id, []).append(src_id)

    exit_frac = {}
    entry_frac = {}
    for src_id, targets in outgoing.items():
        targets = sorted(targets, key=lambda tid: placed[tid].y)
        n = len(targets)
        for i, tid in enumerate(targets):
            exit_frac[(src_id, tid)] = 0.5 if n == 1 else 0.16 + 0.68 * i / (n - 1)
    for tgt_id, sources in incoming.items():
        sources = sorted(sources, key=lambda sid: placed[sid].y)
        n = len(sources)
        for i, sid in enumerate(sources):
            entry_frac[(sid, tgt_id)] = 0.5 if n == 1 else 0.16 + 0.68 * i / (n - 1)

    body = []
    for column in columns:
        for cls in column:
            body.append(render_class(cls))

    column_of = {}
    stack_index = {}
    for ci, column in enumerate(columns):
        for si, cls in enumerate(column):
            column_of[cls.id] = ci
            stack_index[cls.id] = si

    top_lane = 0
    enum_lane = 0
    long_lane = 0
    vr_lane = 0

    for idx, (src_id, tgt_id, label, dashed, mode) in enumerate(edges):
        src = placed[src_id]
        tgt = placed[tgt_id]
        ef = exit_frac[(src_id, tgt_id)]
        nf = entry_frac[(src_id, tgt_id)]

        style = EDGE_BASE + ("dashed=1;" if dashed else "")
        points = []
        if mode == "v":
            same_col = column_of[src_id] == column_of[tgt_id]
            adjacent = same_col and abs(stack_index[src_id] - stack_index[tgt_id]) == 1
            if adjacent:
                if stack_index[tgt_id] > stack_index[src_id]:  # target below
                    style += "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
                else:  # target above
                    style += "exitX=0.5;exitY=0;entryX=0.5;entryY=1;"
            elif same_col:
                # Long relation: route around the left side of the stack.
                gx = src.x - 40 - 30 * long_lane
                long_lane += 1
                style += "exitX=0;exitY=0.5;entryX=0;entryY=0.5;"
                points = [
                    (gx, src.y + src.h / 2),
                    (gx, tgt.y + tgt.h / 2),
                ]
            else:
                style += "exitX=0.5;exitY=1;entryX=0.5;entryY=0;"
        elif mode == "top":
            lane_y = EDGE_TOP_Y - 30 * top_lane
            off = 12 * top_lane
            top_lane += 1
            style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
            points = [
                (src.x + src.w + 40 + off, lane_y),
                (tgt.x - 40 - off, lane_y),
            ]
        elif mode == "enum":
            # Schema -> enum: keep each link in its own vertical lane.
            lane_x = src.x + src.w + 22 + 15 * enum_lane
            enum_lane += 1
            style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"
            points = [
                (lane_x, src.y + src.h * ef),
                (lane_x, tgt.y + tgt.h * nf),
            ]
        elif mode == "hl":
            # Right-to-left link (service -> type) through the column gap.
            style += f"exitX=0;exitY={ef:.4f};entryX=1;entryY={nf:.4f};"
        elif mode == "vr":
            # Same-column link routed down the right-hand gap.
            lane_x = src.x + src.w + 35 + 25 * vr_lane
            vr_lane += 1
            style += "exitX=1;exitY=0.5;entryX=1;entryY=0.5;"
            points = [
                (lane_x, src.y + src.h / 2),
                (lane_x, tgt.y + tgt.h / 2),
            ]
        else:  # horizontal
            style += f"exitX=1;exitY={ef:.4f};entryX=0;entryY={nf:.4f};"

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
    print(f"wrote {os.path.basename(path)}  ({len(columns)} layers, {len(edges)} edges)")


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
    return C("sJob", "Job", kind="schema", attrs=[
        "+id: number", "+clientId: number", "+title: string", "+slug: string",
        "+description: string | null", "+budgetMin: Decimal | null",
        "+budgetMax: Decimal | null", "+budgetType: BudgetType",
        "+deadline: Date | null", "+status: JobStatus", "+featured: boolean",
        "+expiryDate: Date | null", "+hiringType: HiringType",
        "+positionsRequired: number", "+positionsFilled: number",
        "+createdAt: Date", "+updatedAt: Date", "+deletedAt: Date | null",
    ])


def schema_job_skill():
    return C("sJobSkill", "JobSkill", kind="schema",
             attrs=["+jobId: number", "+skillId: number"])


def schema_skill():
    return C("sSkill", "Skill", kind="schema", attrs=[
        "+id: number", "+name: string", "+slug: string",
        "+description: string | null", "+deletedAt: Date | null",
        "+createdAt: Date", "+updatedAt: Date",
    ])


def schema_job_category():
    return C("sJobCategory", "JobCategory", kind="schema", attrs=[
        "+id: number", "+name: string", "+slug: string",
        "+description: string | null", "+status: JobCategoryStatus",
        "+deletedAt: Date | null", "+createdAt: Date", "+updatedAt: Date",
    ])


def schema_job_job_category():
    return C("sJobJobCategory", "JobJobCategory", kind="schema",
             attrs=["+jobId: number", "+categoryId: number"])


def schema_user():
    return C("sUser", "User", kind="schema", attrs=[
        "+id: number", "+email: string", "+isBanned: boolean",
        "+deletedAt: Date | null", "+createdAt: Date",
    ])


def schema_profile():
    return C("sProfile", "Profile", kind="schema", attrs=[
        "+id: number", "+userId: number", "+displayName: string | null",
        "+avatarUrl: string | null", "+bio: string | null",
        "+availabilityStatus: AvailabilityStatus",
        "+profileCompletionPercent: number",
    ])


def schema_freelancer_profile():
    return C("sFreelancerProfile", "FreelancerProfile", kind="schema", attrs=[
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
             stereo="enum", attrs=["DRAFT", "SUBMITTED", "INTERVIEWING", "HIRED",
                                    "REJECTED", "WITHDRAWN", "EXPIRED"])


def enum_contract_status():
    return C("eContractStatus", "ContractStatus", kind="enum", stereo="enum",
             attrs=["PENDING_SIGN", "ACTIVE", "COMPLETED", "DISPUTED",
                    "CANCELLED"])


def enum_notification_type():
    return C("eNotificationType", "NotificationType", kind="enum",
             stereo="enum", attrs=["NEW_FOLLOWER", "JOB_ALERT", "PROPOSAL_NEW",
                                    "PROPOSAL_ACCEPTED", "CONTRACT_CREATED",
                                    "PAYMENT_RELEASED", "DISPUTE_OPENED",
                                    "REVIEW_RECEIVED", "REVIEW_RESPONSE_RECEIVED",
                                    "SYSTEM_ANNOUNCEMENT", "MESSAGE_NEW",
                                    "MILESTONE_COMPLETED", "TASK_OVERDUE"])


def enum_platform_fee_status():
    return C("ePlatformFeeStatus", "PlatformFeeStatus", kind="enum",
             stereo="enum", attrs=["UNPAID", "PAID", "WAIVED"])


def schema_job_bookmark():
    return C("sJobBookmark", "JobBookmark", kind="schema",
             attrs=["+userId: number", "+jobId: number", "+createdAt: Date"])


# --------------------------------------------------------------------------
# 1. UC-10 — [Frevia - User] Job Browsing
# --------------------------------------------------------------------------

def diagram_job_browsing():
    columns = [
        [C("route", "BrowseJobRoutes", kind="route", attrs=[
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
                "+budgetMin?: number", "+budgetMax?: number",
                "+createdAfter?: Date", "+skill?: string", "+category?: string",
                "+featured?: boolean", "+clientId?: number",
                '+sortBy: "createdAt" | "updatedAt" | "title" | "budgetMin" | "budgetMax" | "deadline" | "expiryDate"',
                '+order: "asc" | "desc"',
            ]),
            C("t1", "ViewListJobResponseType", stereo="type", attrs=[
                "+data: JobType[]", "+pagination: JobPaginationType",
            ]),
            C("t2", "JobPaginationType", stereo="type", attrs=[
                "+page: number", "+limit: number", "+total: number",
                "+totalPages: number",
            ]),
            C("t3", "ViewJobDetailResType", stereo="type",
              attrs=["+skills: JobSkillType[]", "+jobCategories: JobCategoryRefType[]"]),
        ],
        [C("svc", "BrowseJobService",
           attrs=["-browseJobRepository: BrowseJobRepository"],
           methods=[
               "+viewListJob(filter: ViewListJobParsedFilterType): Promise<ViewListJobResponseType>",
               "+viewJobDetail(slug: string): Promise<ViewJobDetailResType>",
           ])],
        [C("repo", "BrowseJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getJobLists(filter: ViewListJobParsedFilterType): Promise<{ jobs: JobType[]; total: number }>",
               "+viewJobDetail(slug: string): Promise<ViewJobDetailResType>",
               "-normalizeJob<T>(job: T)",
           ])],
        [
            schema_job(), schema_job_skill(), schema_skill(),
            schema_job_category(), schema_job_job_category(), schema_user(),
        ],
        [
            enum_job_status(), enum_budget_type(), enum_hiring_type(),
            enum_job_category_status(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("ctrl", "t3", "returns", True, "h"),
        ("t1", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJob", "maps to", True, "h"),
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
    build(columns, edges, "UC-10_Job_Browsing_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 2. UC-11 — [Frevia - Client] Job Management
# --------------------------------------------------------------------------

def diagram_job_management():
    columns = [
        [C("route", "ManageJobRoutes", kind="route", attrs=[
            "+GET /manage-jobs (AuthGuard, PermissionGuard)",
            "+GET /manage-jobs/skills (AuthGuard, PermissionGuard)",
            "+GET /manage-jobs/:id (AuthGuard, PermissionGuard)",
            "+POST /manage-jobs (AuthGuard, PermissionGuard)",
            "+PATCH /manage-jobs/:id (AuthGuard, PermissionGuard)",
            "+DELETE /manage-jobs/:id (AuthGuard, PermissionGuard)",
            "+PATCH /manage-jobs/:id/status (AuthGuard, PermissionGuard)",
        ])],
        [
            C("ctrl", "ManageJobController",
              attrs=["-manageJobService: ManageJobService"],
              methods=[
                  "+searchSkills(roleName: string, search?: string)",
                  "+viewClientJobs(userId: number, roleName: string, query: ViewClientJobQueryDto)",
                  "+viewClientJobDetail(userId: number, roleName: string, id: number)",
                  "+createJob(userId: number, body: CreateJobBodyDto)",
                  "+updateJob(userId: number, id: number, body: UpdateJobBodyDto)",
                  "+deleteJob(userId: number, id: number)",
                  "+changeJobStatus(userId: number, id: number, body: ChangeJobStatusBodyDto)",
              ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("d1", "CreateJobBodyDto", stereo="dto", attrs=[
                "+title: string", "+description?: string | null",
                "+budgetMin?: number | null", "+budgetMax?: number | null",
                "+budgetType: BudgetType", "+deadline?: Date | null",
                "+expiryDate?: Date | null", "+skills: number[]",
                "+jobCategories?: number[]", "+hiringType: HiringType",
                "+positionsRequired: number",
            ]),
            C("d2", "UpdateJobBodyDto", stereo="dto", attrs=[
                "+title: string", "+description?: string | null",
                "+budgetMin?: number | null", "+budgetMax?: number | null",
                "+budgetType: BudgetType", "+deadline?: Date | null",
                "+expiryDate?: Date | null", "+skills: number[]",
                "+jobCategories?: number[]", "+hiringType: HiringType",
                "+positionsRequired: number",
            ]),
            C("d3", "ChangeJobStatusBodyDto", stereo="dto",
              attrs=["+status: JobStatus"]),
            C("d4", "ViewClientJobQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
                "+status?: JobStatus", "+budgetType?: BudgetType",
                "+budgetMin?: number", "+budgetMax?: number",
                "+createdAfter?: Date", "+skill?: string", "+category?: string",
                "+featured?: boolean", "+clientId?: number",
                '+sortBy: "createdAt" | "updatedAt" | "title" | "budgetMin" | "budgetMax" | "deadline" | "expiryDate"',
                '+order: "asc" | "desc"',
            ]),
            C("t1", "JobType", stereo="type", attrs=[
                "+id: number", "+slug: string", "+clientId: number",
                "+title: string", "+description: string | null",
                "+budgetMin: number | null", "+budgetMax: number | null",
                "+budgetType: BudgetType", "+deadline: Date | null",
                "+status: JobStatus", "+featured: boolean",
                "+expiryDate: Date | null", "+hiringType: HiringType",
                "+positionsRequired: number", "+positionsFilled: number",
                "+skills?: JobSkillType[]",
                "+jobCategories?: JobCategoryRefType[]",
            ]),
            C("t2", "JobSkillType", stereo="type",
              attrs=["+jobId: number", "+skillId: number", "+skill: { name: string }"]),
            C("t3", "JobCategoryRefType", stereo="type",
              attrs=["+id: number", "+name: string", "+slug: string"]),
        ],
        [
            C("svc", "ManageJobService",
              attrs=["-manageJobRepository: ManageJobRepository",
                     "-embeddingOutbox: EmbeddingOutboxService"],
              methods=[
                  "+viewClientJobs(userId: number, roleName: string, filter: ViewListJobParsedFilterType): Promise<ViewListJobResponseType>",
                  "+searchSkills(roleName: string, search?: string): Promise<{ id: number; name: string }[]>",
                  "+viewClientJobDetail(userId: number, roleName: string, jobId: number): Promise<ViewJobDetailResType>",
                  "+createJob(userId: number, body: CreateJobBodyType): Promise<JobType>",
                  "+updateJob(userId: number, jobId: number, body: UpdateJobBodyType): Promise<JobType>",
                  "+deleteJob(userId: number, jobId: number): Promise<void>",
                  "+changeJobStatus(userId: number, jobId: number, body: ChangeJobStatusBodyType): Promise<ChangeJobStatusResponseType>",
              ]),
            C("outbox", "EmbeddingOutboxService",
              attrs=["-prisma: PrismaService"],
              methods=[
                  "+enqueueAndProcess(input: EmbeddingOutboxInput): Promise<void>",
                  "+processPending(limit: number): Promise<void>",
              ]),
        ],
        [C("repo", "ManageJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getClientJobLists(clientId: number, filter: ViewListJobParsedFilterType)",
               "+getClientJobDetail(clientId: number, jobId: number)",
               "+createJob(clientId: number, data: CreateJobBodyType)",
               "+updateJob(userId: number, jobId: number, data: UpdateJobBodyType)",
               "+deleteJob(userId: number, jobId: number)",
               "+changeJobStatus(userId: number, jobId: number, status: JobStatus)",
               "+searchSkills(search?: string): Promise<Array<{ id: number; name: string }>>",
               "-checkJobOwner(userId: number, jobId: number): Promise<void>",
               "-replaceJobSkills(tx, jobId: number, skillIds: number[])",
               "-replaceJobCategories(tx, jobId: number, categoryIds: number[])",
               "-assertJobCategoriesUsable(tx, categoryIds: number[])",
               "-normalizeJob<T>(job: T)",
               "-slugify(value: string): string",
               "-createJobSlug(title: string): string",
           ])],
        [
            schema_job(), schema_job_skill(), schema_skill(),
            schema_job_job_category(), schema_job_category(), schema_user(),
        ],
        [
            enum_job_status(), enum_budget_type(), enum_hiring_type(),
            enum_job_category_status(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "d3", "", True, "h"),
        ("ctrl", "d4", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("t1", "t2", "uses", True, "v"),
        ("t1", "t3", "uses", True, "vr"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("svc", "outbox", "uses", False, "v"),
        ("repo", "sJob", "maps to", True, "h"),
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
    build(columns, edges, "UC-11_Job_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 3. UC-12 — [Frevia - Freelancer] Bookmarked Jobs Management
# --------------------------------------------------------------------------

def diagram_bookmarked_jobs():
    columns = [
        [C("route", "ManageJobRoutes", kind="route", attrs=[
            "+GET /manage-jobs/bookmarks (AuthGuard, PermissionGuard)",
            "+POST /manage-jobs/jobs/:slug/bookmark (AuthGuard, PermissionGuard)",
            "+GET /manage-jobs/jobs/:slug/bookmark (AuthGuard, PermissionGuard)",
            "+DELETE /manage-jobs/bookmarks/:slug (AuthGuard, PermissionGuard)",
        ])],
        [
            C("ctrl", "ManageJobController",
              attrs=["-manageJobService: ManageJobService"],
              methods=[
                  "+viewBookmarkedJob(userId: number, roleName: string, query: ViewBookmarkedJobQueryDto)",
                  "+bookmarkJob(userId: number, roleName: string, slug: string)",
                  "+getBookmarkStatus(userId: number, roleName: string, slug: string)",
                  "+removeBookmark(userId: number, slug: string)",
              ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("d1", "ViewBookmarkedJobQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
                "+status?: JobStatus", "+budgetType?: BudgetType",
                "+budgetMin?: number", "+budgetMax?: number", "+skill?: string",
                "+featured?: boolean",
                '+sortBy: "createdAt" | "updatedAt" | "title" | "budgetMin" | "budgetMax" | "deadline" | "expiryDate"',
                '+order: "asc" | "desc"',
            ]),
            C("t1", "ViewBookmarkedJobResponseType", stereo="type", attrs=[
                "+data: ViewJobDetailResType[]",
                "+pagination: JobPaginationType",
            ]),
            C("t2", "JobBookmarkType", stereo="type", attrs=[
                "+userId: number", "+jobId: number", "+createdAt: Date",
            ]),
        ],
        [C("svc", "ManageJobService",
           attrs=["-manageJobRepository: ManageJobRepository"],
           methods=[
               "+viewBookmarkedJob(userId: number, roleName: string, filter: ViewBookmarkedJobParsedFilterType): Promise<ViewBookmarkedJobResponseType>",
               "+bookmarkJob(userId: number, roleName: string, slug: string): Promise<void>",
               "+getBookmarkStatus(userId: number, roleName: string, slug: string): Promise<{ isBookmarked: boolean }>",
               "+removeBookmark(userId: number, slug: string): Promise<void>",
               "-assertFreelancerRole(roleName: string): void",
           ])],
        [C("repo", "ManageJobRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getBookmarkedJobLists(userId: number, filter: ViewBookmarkedJobParsedFilterType)",
               "+findJobBySlug(slug: string): Promise<Pick<JobType, \"id\"> | null>",
               "+findBookmark(userId: number, jobId: number): Promise<JobBookmarkType | null>",
               "+bookmarkJob(userId: number, jobId: number): Promise<JobBookmarkType>",
               "+removeBookmark(userId: number, jobId: number): Promise<JobBookmarkType>",
               "-normalizeJob<T>(job: T)",
           ])],
        [schema_job_bookmark(), schema_job(), schema_job_skill(), schema_skill(),
         schema_user()],
        [enum_job_status(), enum_budget_type(), enum_hiring_type()],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("svc", "t2", "uses", True, "hl"),
        ("ctrl", "svc", "calls", False, "top"),
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
    build(columns, edges, "UC-12_Bookmarked_Jobs_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 4. UC-22 — [Frevia - Freelancer] Saved Search Management
# --------------------------------------------------------------------------

def diagram_saved_search():
    columns = [
        [C("route", "SavedSearchRoutes", kind="route", attrs=[
            "+GET /saved-searches (AuthGuard, PermissionGuard)",
            "+GET /saved-searches/:id (AuthGuard, PermissionGuard)",
            "+POST /saved-searches (AuthGuard, PermissionGuard)",
            "+PATCH /saved-searches/:id (AuthGuard, PermissionGuard)",
            "+DELETE /saved-searches/:id (AuthGuard, PermissionGuard)",
        ])],
        [
            C("ctrl", "SavedSearchController",
              attrs=["-savedSearchService: SavedSearchService"],
              methods=[
                  "+getSavedSearches(userId: number)",
                  "+getSavedSearchDetail(userId: number, id: number)",
                  "+createSavedSearch(userId: number, body: CreateSavedSearchBodyDto)",
                  "+updateSavedSearch(userId: number, id: number, body: UpdateSavedSearchBodyDto)",
                  "+deleteSavedSearch(userId: number, id: number)",
              ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("d1", "CreateSavedSearchBodyDto", stereo="dto", attrs=[
                "+name: string", "+searchParams: SavedSearchParamsType",
            ]),
            C("d2", "UpdateSavedSearchBodyDto", stereo="dto",
              attrs=["+name: string"]),
            C("t1", "SavedSearchType", stereo="type", attrs=[
                "+id: number", "+userId: number", "+name: string",
                "+searchParams: SavedSearchParamsType", "+createdAt: Date",
            ]),
            C("t2", "SavedSearchParamsType", stereo="type",
              attrs=["+[key: string]: unknown"]),
        ],
        [C("svc", "SavedSearchService",
           attrs=["-savedSearchRepository: SavedSearchRepository"],
           methods=[
               "+getSavedSearches(userId: number): Promise<SavedSearchType[]>",
               "+getSavedSearchDetail(userId: number, id: number): Promise<SavedSearchType>",
               "+createSavedSearch(userId: number, body: CreateSavedSearchBodyType): Promise<SavedSearchType>",
               "+updateSavedSearch(userId: number, id: number, body: UpdateSavedSearchBodyType): Promise<SavedSearchType>",
               "+deleteSavedSearch(userId: number, id: number): Promise<void>",
           ])],
        [C("repo", "SavedSearchRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findAllByUserId(userId: number): Promise<SavedSearchType[]>",
               "+findByIdAndUserId(id: number, userId: number): Promise<SavedSearchType | null>",
               "+create(userId: number, data: CreateSavedSearchBodyType): Promise<SavedSearchType>",
               "+update(id: number, userId: number, data: UpdateSavedSearchBodyType): Promise<SavedSearchType | null>",
               "+delete(id: number, userId: number): Promise<boolean>",
           ])],
        [
            C("sSavedSearch", "SavedSearch", kind="schema", attrs=[
                "+id: number", "+userId: number", "+name: string",
                "+searchParams: Json", "+createdAt: Date",
            ]),
            schema_user(),
        ],
        [],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("t1", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sSavedSearch", "maps to", True, "h"),
        ("sUser", "sSavedSearch", "1..*", True, "v"),
    ]
    build(columns, edges, "UC-22_Saved_Search_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 5. UC-23 — [Frevia - Freelancer] Job Alert Management
# --------------------------------------------------------------------------

def diagram_job_alert():
    columns = [
        [C("route", "JobAlertRoutes", kind="route", attrs=[
            "+GET /job-alerts (AuthGuard, PermissionGuard)",
            "+GET /job-alerts/:id (AuthGuard, PermissionGuard)",
            "+POST /job-alerts (AuthGuard, PermissionGuard)",
            "+PATCH /job-alerts/:id (AuthGuard, PermissionGuard)",
            "+DELETE /job-alerts/:id (AuthGuard, PermissionGuard)",
        ])],
        [
            C("ctrl", "JobAlertController",
              attrs=["-jobAlertService: JobAlertService"],
              methods=[
                  "+viewJobAlerts(userId: number)",
                  "+getJobAlertDetail(userId: number, id: number)",
                  "+createJobAlert(userId: number, payload: CreateJobAlertBodyDto)",
                  "+updateJobAlert(userId: number, id: number, payload: UpdateJobAlertBodyDto)",
                  "+deleteJobAlert(userId: number, id: number)",
              ]),
            auth_guard(), permission_guard(),
        ],
        [
            C("d1", "CreateJobAlertBodyDto", stereo="dto", attrs=[
                "+keywords?: string", "+skills: string[]",
                "+frequency: AlertFrequency", "+channel: AlertChannel",
                "+isActive: boolean",
            ]),
            C("d2", "UpdateJobAlertBodyDto", stereo="dto", attrs=[
                "+keywords?: string", "+skills?: string[]",
                "+frequency?: AlertFrequency", "+channel?: AlertChannel",
                "+isActive?: boolean",
            ]),
            C("t1", "JobAlertType", stereo="type", attrs=[
                "+id: number", "+userId: number", "+keywords: string | null",
                "+skills: string[]", "+frequency: AlertFrequency",
                "+channel: AlertChannel", "+isActive: boolean",
                "+createdAt: Date",
            ]),
        ],
        [C("svc", "JobAlertService",
           attrs=["-jobAlertRepository: JobAlertRepository"],
           methods=[
               "+getJobAlertLists(userId: number): Promise<JobAlertType[]>",
               "+getJobAlertDetail(userId: number, id: number): Promise<JobAlertType>",
               "+createJobAlert(userId: number, payload: CreateJobAlertBodyType): Promise<JobAlertType>",
               "+updateJobAlert(userId: number, id: number, payload: UpdateJobAlertBodyType): Promise<JobAlertType>",
               "+deleteJobAlert(userId: number, id: number): Promise<void>",
           ])],
        [C("repo", "JobAlertRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+getJobAlertLists(userId: number): Promise<JobAlertType[]>",
               "+findJobAlertById(id: number, userId: number): Promise<JobAlertType | null>",
               "+createJobAlert(userId: number, data: CreateJobAlertBodyType): Promise<JobAlertType>",
               "+updateJobAlert(id: number, userId: number, data: UpdateJobAlertBodyType): Promise<JobAlertType | null>",
               "+deleteJobAlert(id: number, userId: number): Promise<boolean>",
           ])],
        [
            C("sJobAlert", "JobAlert", kind="schema", attrs=[
                "+id: number", "+userId: number", "+keywords: string | null",
                "+skills: string[]", "+createdAt: Date",
            ]),
            schema_user(),
        ],
        [
            C("eFrequency", "AlertFrequency", kind="enum", stereo="enum",
              attrs=["DAILY", "WEEKLY", "INSTANT"]),
            C("eChannel", "AlertChannel", kind="enum", stereo="enum",
              attrs=["EMAIL", "IN_APP", "PUSH"]),
            NOTE("note1",
                 "NOTE: No job-alert module exists yet - the route, controller, "
                 "service and repository above follow the UC-23 sequence design. "
                 "That design stores criteria, frequency (daily / weekly / "
                 "instant), delivery channel and an active flag, while "
                 "schema.prisma currently declares only keywords, skills and "
                 "createdAt; frequency, channel and isActive still need a "
                 "migration.",
                 width=430, height=170),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJobAlert", "maps to", True, "h"),
        ("sUser", "sJobAlert", "1..*", True, "v"),
    ]
    build(columns, edges, "UC-23_Job_Alert_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 6. UC-32 — [Frevia - Freelancer] Proposal Management
# --------------------------------------------------------------------------

def diagram_freelancer_proposal():
    columns = [
        [C("route", "ProposalRoutes", kind="route", attrs=[
            "+GET /proposals/my (AuthGuard, PermissionGuard)",
            "+GET /proposals/jobs/:jobId/mine (AuthGuard, PermissionGuard)",
            "+GET /proposals/:id (AuthGuard, PermissionGuard)",
            "+POST /proposals/jobs/:jobId (AuthGuard, PermissionGuard)",
            "+POST /proposals/jobs/:jobId/drafts (AuthGuard, PermissionGuard)",
            "+PATCH /proposals/:id/draft (AuthGuard, PermissionGuard)",
            "+PATCH /proposals/:id/submit (AuthGuard, PermissionGuard)",
            "+PATCH /proposals/:id/withdraw (AuthGuard, PermissionGuard)",
        ])],
        [
            C("ctrl", "ProposalController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getMyProposals(userId: number, roleName: string, query: MyProposalsQueryDto)",
                  "+getMyActiveProposalForJob(userId: number, roleName: string, jobId: number)",
                  "+getProposalDetail(userId: number, roleName: string, proposalId: number)",
                  "+createProposal(userId: number, roleName: string, jobId: number, body: CreateProposalBodyDto)",
                  "+saveDraft(userId: number, roleName: string, jobId: number, body: SaveProposalDraftBodyDto)",
                  "+updateDraft(userId: number, roleName: string, proposalId: number, body: SaveProposalDraftBodyDto)",
                  "+submitDraft(userId: number, roleName: string, proposalId: number)",
                  "+withdrawProposal(userId: number, roleName: string, proposalId: number)",
              ]),
            auth_guard(), permission_guard(),
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
            C("d3", "MyProposalsQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+jobId?: number",
                "+status?: ProposalStatus",
            ]),
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
        [C("svc", "ProposalService",
           attrs=["-proposalRepository: ProposalRepository"],
           methods=[
               "+getMyProposals(userId: number, roleName: string, query: MyProposalsQueryType): Promise<MyProposalsResponseType>",
               "+getMyActiveProposalForJob(userId: number, roleName: string, jobId: number): Promise<ProposalType | null>",
               "+getProposalDetail(userId: number, roleName: string, proposalId: number): Promise<ProposalDetailType>",
               "+createProposal(userId: number, roleName: string, jobId: number, body: CreateProposalBodyType): Promise<ProposalType>",
               "+saveDraft(userId: number, roleName: string, jobId: number, body: SaveProposalDraftBodyType): Promise<ProposalType>",
               "+updateDraft(userId: number, roleName: string, proposalId: number, body: SaveProposalDraftBodyType): Promise<ProposalType>",
               "+submitDraft(userId: number, roleName: string, proposalId: number): Promise<ProposalType>",
               "+withdrawProposal(userId: number, roleName: string, proposalId: number): Promise<ProposalType>",
               "-assertFreelancer(roleName: string): void",
               "-assertActionable(status: ProposalStatusType): void",
               "-assertCanPropose(userId: number, roleName: string, jobId: number, ignoredProposalId?: number): Promise<void>",
               "-getOwnedDraft(userId: number, proposalId: number)",
               "-expireStaleProposals(): Promise<void>",
           ])],
        [C("repo", "ProposalRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findJobForProposal(jobId: number)",
               "+findActiveProposal(jobId: number, freelancerId: number, ignoredProposalId?: number)",
               "+findMyActiveProposal(jobId: number, freelancerId: number)",
               "+findProposal(proposalId: number)",
               "+createDraft(jobId: number, freelancerId: number, data: SaveProposalDraftBodyType): Promise<ProposalType>",
               "+createSubmitted(jobId: number, freelancerId: number, data: CreateProposalBodyType): Promise<ProposalType>",
               "+updateDraft(proposalId: number, data: SaveProposalDraftBodyType): Promise<ProposalType>",
               "+submitDraft(proposalId: number): Promise<ProposalType>",
               "+withdrawProposal(proposalId: number): Promise<ProposalType>",
               "+expireOverdueProposals(jobId?: number): Promise<number>",
               "+getMyProposals(freelancerId: number, query: MyProposalsQueryType): Promise<MyProposalsResponseType>",
               "+getProposalDetail(proposalId: number): Promise<ProposalDetailType | null>",
               "-normalize(proposal: ProposalRow): ProposalType",
               "-normalizeDetail(proposal: ProposalDetailRow): ProposalDetailType",
           ])],
        [
            C("sProposal", "Proposal", kind="schema", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: Decimal | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+createdAt: Date", "+submittedAt: Date | null",
                "+acceptedAt: Date | null", "+rejectedAt: Date | null",
                "+withdrawnAt: Date | null", "+expiresAt: Date | null",
                "+updatedAt: Date", "+deletedAt: Date | null",
            ]),
            schema_job(), schema_user(), schema_profile(),
            schema_freelancer_profile(),
        ],
        [
            enum_proposal_status(), enum_job_status(), enum_hiring_type(),
            enum_budget_type(),
        ],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "d3", "", True, "h"),
        ("ctrl", "t1", "returns", True, "h"),
        ("ctrl", "t2", "returns", True, "h"),
        ("ctrl", "t3", "returns", True, "h"),
        ("t3", "t2", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sProposal", "maps to", True, "h"),
        ("sJob", "sProposal", "1..*", True, "v"),
        ("sUser", "sProposal", "1..*", True, "v"),
        ("sUser", "sProfile", "1..1", True, "v"),
        ("sProfile", "sFreelancerProfile", "1..1", True, "v"),
        ("sProposal", "eProposalStatus", "status", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
    ]
    build(columns, edges, "UC-32_Freelancer_Proposal_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 7. UC-32 — [Frevia - Client] Proposal Management
# --------------------------------------------------------------------------

def diagram_client_proposal():
    columns = [
        [
            C("route", "ProposalRoutes", kind="route", attrs=[
                "+GET /proposals/jobs/:jobId/submitted (AuthGuard, PermissionGuard)",
                "+GET /proposals/:id/client (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/interview (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/reject (AuthGuard, PermissionGuard)",
                "+PATCH /proposals/:id/accept (AuthGuard, PermissionGuard)",
            ]),
            C("route2", "ClientJobProposalsRoutes", kind="route", attrs=[
                "+GET /jobs/:jobId/proposals (AuthGuard, PermissionGuard)",
            ]),
        ],
        [
            C("ctrl", "ProposalController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getSubmittedProposalsForClientJob(userId: number, roleName: string, jobId: number)",
                  "+getProposalDetailForClient(userId: number, roleName: string, proposalId: number)",
                  "+interviewProposal(userId: number, roleName: string, proposalId: number)",
                  "+rejectProposal(userId: number, roleName: string, proposalId: number)",
                  "+acceptProposal(userId: number, roleName: string, proposalId: number)",
              ]),
            C("ctrl2", "ClientJobProposalsController",
              attrs=["-proposalService: ProposalService"],
              methods=[
                  "+getSubmittedProposals(userId: number, roleName: string, jobId: number, query: ClientJobProposalsQueryDto)",
              ]),
            auth_guard(), permission_guard(),
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
        [C("svc", "ProposalService",
           attrs=["-proposalRepository: ProposalRepository"],
           methods=[
               "+getSubmittedProposalsForClientJob(userId: number, roleName: string, jobId: number): Promise<ClientJobProposalsResponseType>",
               "+getSubmittedProposalsPageForClientJob(userId: number, roleName: string, jobId: number, query: ClientJobProposalsQueryType): Promise<ClientJobProposalsPageType>",
               "+getProposalDetailForClient(userId: number, roleName: string, proposalId: number): Promise<ClientProposalDetailType>",
               "+interviewProposal(userId: number, roleName: string, proposalId: number): Promise<ProposalType>",
               "+rejectProposal(userId: number, roleName: string, proposalId: number): Promise<ProposalType>",
               "+acceptProposal(userId: number, roleName: string, proposalId: number): Promise<ProposalType>",
               "-assertActionable(status: ProposalStatusType): void",
               "-expireStaleProposals(): Promise<void>",
           ])],
        [C("repo", "ProposalRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+findJobForClientProposals(jobId: number)",
               "+findSubmittedProposalsForClientJob(jobId: number): Promise<ClientJobProposalsResponseType>",
               "+findSubmittedProposalsPageForClientJob(jobId: number, query: ClientJobProposalsQueryType): Promise<ClientJobProposalsPageType>",
               "+findProposalForClientDecision(proposalId: number)",
               "+findProposalDetailForClient(proposalId: number): Promise<ClientProposalDetailType | null>",
               "+interviewProposal(proposalId: number): Promise<ProposalType>",
               "+rejectProposal(proposalId: number): Promise<ProposalType>",
               "+hireProposal(params: HireProposalParams): Promise<ProposalType>",
               "+expireOverdueProposals(jobId?: number): Promise<number>",
               "-normalize(proposal: ProposalRow): ProposalType",
           ])],
        [
            C("sProposal", "Proposal", kind="schema", attrs=[
                "+id: number", "+jobId: number", "+freelancerId: number",
                "+coverLetter: string | null", "+bidAmount: Decimal | null",
                "+deliveryDays: number | null", "+status: ProposalStatus",
                "+submittedAt: Date | null", "+acceptedAt: Date | null",
                "+rejectedAt: Date | null", "+expiresAt: Date | null",
                "+deletedAt: Date | null",
            ]),
            schema_job(),
            C("sContract", "Contract", kind="schema", attrs=[
                "+id: number", "+jobId: number", "+proposalId: number",
                "+clientId: number", "+freelancerId: number",
                "+totalAmount: Decimal", "+status: ContractStatus",
                "+signedByClient: boolean", "+signedByFreelancer: boolean",
                "+platformFee: Decimal", "+platformFeeStatus: PlatformFeeStatus",
                "+createdAt: Date", "+signedAt: Date | null",
            ]),
            C("sNotification", "Notification", kind="schema", attrs=[
                "+id: number", "+userId: number", "+type: NotificationType",
                "+title: string | null", "+message: string | null",
                "+data: Json | null", "+isRead: boolean", "+createdAt: Date",
            ]),
            schema_user(), schema_profile(), schema_freelancer_profile(),
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
        ("route", "gAuth", "uses", True, "h"),
        ("route", "gPerm", "uses", True, "h"),
        ("ctrl2", "d1", "", True, "h"),
        ("ctrl2", "t2", "returns", True, "h"),
        ("ctrl", "t3", "returns", True, "h"),
        ("ctrl", "t4", "returns", True, "h"),
        ("t2", "t1", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "top"),
        ("ctrl2", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sProposal", "maps to", True, "h"),
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
    build(columns, edges, "UC-32_Client_Proposal_Management_Class_Diagram.drawio")


# --------------------------------------------------------------------------
# 8. UC-46.06 / UC-46.07 — [Frevia - Freelancer] Job Category
# --------------------------------------------------------------------------

def diagram_job_category_browse():
    columns = [
        [C("route", "JobCategoriesRoutes", kind="route", attrs=[
            "+GET /job-categories (Public)",
            "+GET /job-categories/:slug (Public)",
        ])],
        [C("ctrl", "JobCategoriesController",
           attrs=["-service: JobCategoriesService"],
           methods=[
               "+viewJobCategoryList(query: JobCategoryBrowseQueryDto)",
               "+viewJobCategoryDetail(slug: string, query: JobCategoryDetailQueryDto)",
           ])],
        [
            C("d1", "JobCategoryBrowseQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number", "+search?: string",
            ]),
            C("d2", "JobCategoryDetailQueryDto", stereo="dto", attrs=[
                "+page: number", "+limit: number",
            ]),
            C("t1", "JobCategoryBrowseItemType", stereo="type", attrs=[
                "+id: number", "+name: string", "+slug: string",
                "+description: string | null", "+jobCount: number",
            ]),
            C("t2", "JobCategoryBrowseListResponseType", stereo="type", attrs=[
                "+jobCategories: JobCategoryBrowseItemType[]",
                "+pagination: PaginationType",
            ]),
            C("t3", "ViewJobCategoryDetailResponseType", stereo="type", attrs=[
                "+jobs: ViewJobDetailResType[]", "+pagination: PaginationType",
            ]),
        ],
        [C("svc", "JobCategoriesService",
           attrs=["-repository: JobCategoriesRepository"],
           methods=[
               "+viewJobCategoryList(query: JobCategoryBrowseParsedQueryType): Promise<JobCategoryBrowseListResponseType>",
               "+viewJobCategoryDetail(slug: string, page: number, limit: number): Promise<ViewJobCategoryDetailResponseType>",
           ])],
        [C("repo", "JobCategoriesRepository",
           attrs=["-prisma: PrismaService"],
           methods=[
               "+listJobCategories(query: JobCategoryBrowseParsedQueryType): Promise<JobCategoryBrowseListResponseType>",
               "+getJobCategoryDetail(slug: string, page: number, limit: number): Promise<ViewJobCategoryDetailResponseType>",
               "-toItem(row: JobCategoryRow): JobCategoryBrowseItemType",
               "-normalizeJob(job: BrowseJobRow)",
           ])],
        [
            schema_job_category(), schema_job_job_category(), schema_job(),
            schema_job_skill(), schema_skill(),
        ],
        [enum_job_category_status(), enum_job_status(), enum_budget_type(),
         enum_hiring_type()],
    ]
    edges = [
        ("route", "ctrl", "maps to", True, "h"),
        ("ctrl", "d1", "", True, "h"),
        ("ctrl", "d2", "", True, "h"),
        ("ctrl", "t2", "returns", True, "h"),
        ("ctrl", "t3", "returns", True, "h"),
        ("t2", "t1", "uses", True, "v"),
        ("ctrl", "svc", "calls", False, "top"),
        ("svc", "repo", "calls", False, "h"),
        ("repo", "sJobCategory", "maps to", True, "h"),
        ("sJobCategory", "sJobJobCategory", "1..*", True, "v"),
        ("sJobJobCategory", "sJob", "*..1", True, "v"),
        ("sJob", "sJobSkill", "1..*", True, "v"),
        ("sJobSkill", "sSkill", "*..1", True, "v"),
        ("sJobCategory", "eJobCategoryStatus", "status", True, "enum"),
        ("sJob", "eJobStatus", "status", True, "enum"),
        ("sJob", "eBudgetType", "budgetType", True, "enum"),
        ("sJob", "eHiringType", "hiringType", True, "enum"),
    ]
    build(columns, edges, "UC-46.06_Job_Category_Class_Diagram.drawio")


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
