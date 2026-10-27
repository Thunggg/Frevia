# Frevia – UML Class Diagrams per Module (draw.io / mxGraphModel)

Class diagram cho từng module, style giống file mẫu Auth module (route/controller/service/DTO/schema/utility).

## Cách mở trong draw.io
- **Cách 1:** `File > Open...` và chọn file `.xml`.
- **Cách 2:** `Extras > Edit Diagram...` rồi dán toàn bộ nội dung file vào.

## Danh sách file

```
06-role-management/role-classes.xml        (7 classes)  RoleRoutes, RoleController, RoleService,
                                           CreateRoleDto, UpdateRoleDto, Role, Permission
15-permission/permission-classes.xml       (4 classes)  PermissionRoutes, PermissionController,
                                           PermissionService, Permission
16-session-management/session-classes.xml  (4 classes)  SessionRoutes (JwtAuthGuard), SessionController,
                                           SessionService, Session
17-forum-category/forum-category-classes.xml (6)        ForumCategoryRoutes (AdminGuard), Controller,
                                           Service, Create/UpdateForumCategoryDto, ForumCategory
28-user-management/user-classes.xml        (17 classes) UserRoutes (9 endpoints), UserController,
                                           UserService (User/ClientProfile/Freelancer/
                                           Portfolio/Expert models), 9 DTO/Type, 5 Schemas
37-banner-management/banner-classes.xml    (6)          BannerRoutes, Controller, Service,
                                           Create/UpdateBannerDto, Banner
38-skill-management/skill-classes.xml      (6)          SkillRoutes (restore), Controller, Service,
                                           Create/UpdateSkillDto, Skill
46-job-category-management/job-category-classes.xml (7)  JobCategoryRoutes, Controller, Service
                                           (JobCategory + Job models), Create/UpdateDto,
                                           JobCategory, Job
```

## Quy ước (theo mẫu)

- **Layout:**
  - 5 cột Route → Controller → DTO/Type → Service → Schema; **x từng cột tính tự động** = tổng chiều rộng cột trước + kênh 100px ⇒ box không bao giờ đè nhau.
  - Class xếp dọc trong cột, lùi xuống 70px; module có tiêu đề `UC-xx — Class Diagram` ở trên cùng.
  - Edge nối cột kề nhau đi thẳng qua kênh trống giữa 2 cột; edge **nhảy cột** (`Controller → Service` khi có cột DTO giữa) được **tự động đi vòng phía trên** (orthogonalEdgeStyle + waypoints), không cắt box nào.
  - Checker tự động: `node class-diagrams/tools/check-layout.js` (0 overlap + 0 edge-cross = pass).
- **Classes:**
  - `<<route>>`: swimlane, liệt kê endpoint `+METHOD /path (Guards)` — chức năng cần đăng nhập đánh dấu `(JwtAuthGuard)`, admin `(AdminGuard)`.
  - Controller/Service: fields `-xxxService: XService` / `-xxxModel: Model<XDocument>` → line phân cách → methods `+method(...)`.
  - `<<dto>>` / `<<type>>` / `<<schema>>`: attrs + line cuối.
- **Edges:**
  - `maps to` nét đứt: Routes → Controller (route trỏ vào Controller).
  - `calls` nét liền: Controller → Service (có label).
  - dashed không label: phụ thuộc DTO/Type.
  - `maps to` nét liền: Service → Schema (`Model<XxxDocument>` maps tới collection).
- Style swimlane `fontStyle=1;childLayout=stackLayout`, row `text;portConstraint=eastwest`, separator `line;...strokeColor=inherit`, fontSize 13.

## Generator

```bash
node class-diagrams/tools/generate.js
```

Sửa nội dung trong mảng `MODULES` của `class-diagrams/tools/generate.js` rồi chạy lại để regenerate đồng bộ cả 8 diagram.
