# Frevia – UML Sequence Diagrams (draw.io / mxGraphModel)

Thư mục chứa các sequence diagram dưới dạng XML `mxGraphModel`, import trực tiếp vào draw.io.

## Cách mở trong draw.io
- **Cách 1:** `File > Open...` và chọn file `.xml`.
- **Cách 2:** `Extras > Edit Diagram...` rồi dán toàn bộ nội dung file vào.

## Cấu trúc

| Thư mục | Nghiệp vụ | Các UC |
|---|---|---|
| `00-auth-jwt/` | Auth – JWT (Login + Verify token) | Nguồn cho các khung `ref "N.1. Verify jwt"` |
| `06-role-management/` | [Frevia - Admin] Role Management | UC-06.01 → UC-06.06 |
| `15-permission/` | [Frevia - Admin] Manage Permission | UC-15.01, UC-15.02 |
| `16-session-management/` | [Frevia - User] Session Management | UC-16.01 → UC-16.03 |
| `17-forum-category/` | Forum Category Management | UC-14.01, UC-14.02, UC-17.01, UC-17.02, UC-17.03, UC-17.06 |
| `28-user-management/` | [Frevia - Admin] User Management | UC-28.01 → UC-28.09 |
| `37-banner-management/` | [Frevia - Admin] Banners Management | UC-37.01 → UC-37.05 |
| `38-skill-management/` | [Frevia - Admin] Skill Management | UC-38.01 → UC-38.06 |
| `46-job-category-management/` | [Frevia - Admin] Job Category Management | UC-46.01 → UC-46.05 |

Danh sách file chi tiết:

```
00-auth-jwt/
└── jwt-flow.xml                            (Auth-JWT: Login phát access/refresh token, lưu
                                             session; verify Bearer token cho API protected —
                                             các diagram khác ref vào flow verify này)
06-role-management/
├── UC-06.01-view-role-list.xml             (Admin) Xem danh sách role + permissions
├── UC-06.02-view-role-detail.xml           (Admin) Xem chi tiết một role
├── UC-06.03-create-role.xml                (Admin) Tạo role mới (check trùng tên, validate)
├── UC-06.04-update-role.xml                (Admin) Cập nhật tên, mô tả, permissions
├── UC-06.05-delete-role.xml                (Admin) Xoá role
└── UC-06.06-update-role-permissions.xml    (Admin) Gán quyền truy cập routes cho role
15-permission/
├── UC-15.01-view-permission-list.xml       (Admin) Xem danh sách permission
└── UC-15.02-view-permission-detail.xml     (Admin) Xem chi tiết permission
16-session-management/
├── UC-16.01-view-session-list.xml          (User) Xem các phiên đăng nhập đang hoạt động
├── UC-16.02-view-session-detail.xml        (User) Xem thông tin phiên (thiết bị, IP, vị trí...)
└── UC-16.03-revoke-session.xml             (User) Đăng xuất một thiết bị từ xa
17-forum-category/
├── UC-14.01-view-forum-category-list.xml   (Admin) Xem danh sách danh mục diễn đàn
├── UC-14.02-view-forum-category-detail.xml (Admin) Xem chi tiết danh mục
├── UC-17.01-create-forum-category.xml      (Admin) Tạo danh mục mới (check trùng tên)
├── UC-17.02-update-forum-category.xml      (Admin) Cập nhật danh mục
├── UC-17.03-delete-forum-category.xml      (Admin) Xoá mềm danh mục (deletedAt)
└── UC-17.06-restore-forum-category.xml     (Admin) Khôi phục danh mục (deletedAt = null)
28-user-management/
├── UC-28.01-view-user-list.xml            (Admin) Xem danh sách user, search/filter/sort theo role
├── UC-28.02-view-user-detail.xml          (Admin) Xem info account + tab hồ sơ theo role
├── UC-28.03-create-user.xml               (Admin) Tạo user, chọn role khởi tạo (check trùng email)
├── UC-28.04-update-user.xml               (Admin) Sửa thông tin chung account (email, status...)
├── UC-28.05-update-client-profile.xml     (Admin) Sửa tab hồ sơ Client (:ClientProfile)
├── UC-28.06-update-freelancer-basic-info.xml (Admin) Sửa title, bio, languages/edu/certs (:FreelancerModel)
├── UC-28.07-update-freelancer-skills.xml  (Admin) Chọn skill từ catalog + level 1-10, thay toàn bộ list
├── UC-28.08-update-freelancer-portfolio.xml (Admin) Thêm/sửa/xoá mềm portfolio items (:PortfolioModel)
└── UC-28.09-update-expert-profile.xml     (Admin) Sửa profile chuyên gia (:Expert)
37-banner-management/
├── UC-37.01-view-banner-list.xml          (Admin) Xem danh sách banner quảng cáo
├── UC-37.02-view-banner-detail.xml        (Admin) Xem chi tiết banner theo ID
├── UC-37.03-create-banner.xml             (Admin) Tạo banner (title, image_url, link_url, dates)
├── UC-37.04-update-banner.xml             (Admin) Chỉnh sửa banner
└── UC-37.05-delete-banner.xml             (Admin) Xoá CỨNG banner (deleteOne)
38-skill-management/
├── UC-38.01-view-skill-list.xml           (Admin) Xem danh sách skill (search, filter active, phân trang)
├── UC-38.02-view-skill-detail.xml         (Admin) Xem chi tiết skill theo ID
├── UC-38.03-create-skill.xml              (Admin) Tạo skill (check trùng slug)
├── UC-38.04-update-skill.xml              (Admin) Sửa tên, slug, mô tả
├── UC-38.05-delete-skill.xml              (Admin) Xoá mềm skill (deletedAt)
└── UC-38.06-restore-skill.xml             (Admin) Khôi phục skill (deletedAt = null)
46-job-category-management/
├── UC-46.01-view-job-category-list.xml    (Admin) Xem và quản lý danh sách job category
├── UC-46.02-view-job-category-detail.xml  (Admin) Xem chi tiết + status + jobs liên quan
├── UC-46.03-create-job-category.xml       (Admin) Tạo job category (check trùng tên)
├── UC-46.04-update-job-category.xml       (Admin) Cập nhật thông tin + status
└── UC-46.05-delete-job-category.xml       (Admin) Check jobs liên quan → hard-delete hoặc
                                           deactivate (status = inactive)
```

## Khung `ref "N.1. Verify jwt"` (đã đăng nhập mới dùng được)

Mỗi chức năng yêu cầu đăng nhập đều có khung `ref` (giống mẫu `ref 3.3.1 Verify jwt`) đặt
**ngay sau bước HTTP request** (GET/POST/PUT/DELETE), trỏ tới flow verify token trong
`00-auth-jwt/jwt-flow.xml` (bước 30–35):
- 30. Send request with Bearer token
- 31. handler(req, res)
- 32. verifyAccessToken(bearer token)
- 33. Decode and check signature / expiry
- alt [token is missing, invalid or expired] → Return error + "Unauthorized"
- [token is valid] → Return payload {userId, roleId} → attach user & continue

## Quy ước chung theo mẫu sequence gốc

- **Thứ tự lifeline:** Actor → View → Route → Controller → Service → Repo → Model → Database
  (VD: `:RoleView` → `:RoleRoute` → `:RoleController` → `:RoleService` → `:RoleRepo` → `:RoleModel` → `Database`)
- **Style:**
  - Actor: `shape=umlActor`
  - Lifeline: `shape=umlLifeline;perimeter=lifelinePerimeter;...` (y=240, height=1560)
  - Activation: `perimeter=orthogonalPerimeter;...` đặt bên trong lifeline tương ứng
  - Gọi đồng bộ: `endArrow=block;...`
  - Trả về: `endArrow=open;dashed=1;endSize=8;...`
  - Khung opt/alt: `shape=umlFrame;...` + guard rõ ràng (vd. `[role is null]`, `[invalid data]`)
  - Database: `shape=mxgraph.flowchart.database`
- **Đánh số:** tin nhắn tăng dần, nhánh con dùng dạng `12.1`, `12.1.1`...; message trả về dùng `Return result` / `Return error`.

## Generator

Diagrams được sinh từ script (dễ sửa số, đổi label và regenerate đồng bộ):

```bash
node sequence-diagrams/tools/generate.js
```

Sửa luồng nghiệp vụ trong mảng `SPECS` của `sequence-diagrams/tools/generate.js` rồi chạy lại.
