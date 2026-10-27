# Frevia – UML Class Diagrams per Module (draw.io / mxGraphModel)

Class diagram cho từng module, style giống file mẫu Auth module (route/controller/service/DTO/schema/utility).

## Cách mở trong draw.io
- **Cách 1:** `File > Open...` và chọn file `.xml`.
- **Cách 2:** `Extras > Edit Diagram...` rồi dán toàn bộ nội dung file vào.

## Danh sách file

```
06-role-management/role-classes.xml        (13 classes) RoleRoutes, RoleController, Guards (Jwt/Admin),
                                           PaginationDto/PageMeta, Create/UpdateRoleDto,
                                           RoleService, RoleRepo, PermissionRepo, Role, Permission
15-permission/permission-classes.xml       (9 classes)  PermissionRoutes, PermissionController, Guards,
                                           PaginationDto/PageMeta, PermissionService, PermissionRepo,
                                           Permission
16-session-management/session-classes.xml  (8 classes)  SessionRoutes (JwtAuthGuard), SessionController,
                                           JwtAuthGuard, PaginationDto/PageMeta, SessionService,
                                           SessionRepo, Session
17-forum-category/forum-category-classes.xml (12)       ForumCategoryRoutes, Controller, Guards, Pagination,
                                           Create/UpdateForumCategoryDto, ForumCategoryService,
                                           ForumCategoryRepo, SlugUtil, ForumCategory
28-user-management/user-classes.xml        (24 classes) UserRoutes (9 endpoints), UserController, Guards,
                                           Pagination, 9 DTO/Type, UserService, UserRepo,
                                           ProfileRepo, PasswordUtil, 5 Schemas
37-banner-management/banner-classes.xml    (11)         BannerRoutes, Controller, Guards, Pagination,
                                           Create/UpdateBannerDto, BannerService, BannerRepo, Banner
38-skill-management/skill-classes.xml      (12)         SkillRoutes (restore), Controller, Guards, Pagination,
                                           Create/UpdateSkillDto, SkillService, SkillRepo,
                                           SlugUtil, Skill
46-job-category-management/job-category-classes.xml (13) JobCategoryRoutes, Controller, Guards, Pagination,
                                           Create/UpdateDto, JobCategoryService, JobCategoryRepo,
                                           JobRepo, JobCategory, Job
```

## Quy ước (theo mẫu)

- **Layout:**
  - 6 cột Route → Controller → DTO/Type → Service (+Utility) → Repo → Schema; **x từng cột tính tự động** = tổng chiều rộng cột trước + kênh 100px ⇒ box không bao giờ đè nhau.
  - Class xếp dọc trong cột, lùi xuống 70px; module có tiêu đề `UC-xx — Class Diagram` ở trên cùng.
  - Edge nối cột kề nhau đi thẳng qua kênh trống giữa 2 cột; edge **nhảy cột** (`Controller → Service` khi có cột DTO giữa) được **tự động đi vòng phía trên** (orthogonalEdgeStyle + waypoints), không cắt box nào.
  - Checker tự động: `node class-diagrams/tools/check-layout.js` (0 overlap + 0 edge-cross = pass).
- **Classes:**
  - `<<route>>`: swimlane, liệt kê endpoint `+METHOD /path (Guards)` — chức năng cần đăng nhập đánh dấu `(JwtAuthGuard)`, admin `(AdminGuard)`.
  - Controller/Service/Repo: fields `-xxxService: XService` / `-xxxRepo: XRepo` / `-xxxModel: Model<XDocument>` → line phân cách → methods `+method(...)`.
  - Guard (`JwtAuthGuard`/`AdminGuard`): `+canActivate(context)`.
  - `<<utility>>` (SlugUtil, PasswordUtil): helper class đặt dưới Service.
  - `<<dto>>` / `<<type>>` / `<<schema>>`: attrs + line cuối.
- **Edges:**
  - `maps to` nét đứt: Routes → Controller (route trỏ vào Controller), và Route → Guard.
  - `calls` nét liền: Controller → Service, Service → Repo (có label).
  - dashed không label: phụ thuộc DTO/Type/Utility (controller dùng DTO, service dùng query/page-meta/type).
  - `maps to` nét liền: Repo → Schema (Repo quản `Model<XxxDocument>` maps tới collection).
- Style swimlane `fontStyle=1;childLayout=stackLayout`, row `text;portConstraint=eastwest`, separator `line;...strokeColor=inherit`, fontSize 13.

## Generator

```bash
node class-diagrams/tools/generate.js
```

Sửa nội dung trong mảng `MODULES` của `class-diagrams/tools/generate.js` rồi chạy lại để regenerate đồng bộ cả 8 diagram.
