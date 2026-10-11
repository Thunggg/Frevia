# Project Rules: Frevia Clone

This file contains the guidelines and rules specific to the **frevia-clone** project. The agent must strictly follow these rules during code review and code generation.

## 1. Quy trình phát triển (Development Process)
Mỗi chức năng phải thực hiện theo quy trình sau:
1. Tạo branch theo Use Case.
2. Phát triển chức năng.
3. Tự kiểm tra code.
4. Build Docker và chạy test.
5. Chỉ được xem là hoàn thành khi toàn bộ kiểm tra đều thành công.

## 2. Quy tắc đặt tên (Naming Conventions)
* **Branch**: `uc-[id]-[action-name]` (ví dụ: `uc-01-login`, `uc-02-register`, `uc-10-create-job`)
* **Folder**: Chữ thường hoặc kebab-case (ví dụ: `users/`, `job-posts/`, `payment/`)
* **File**: Chữ thường phân tách bằng dấu chấm (ví dụ: `user.service.ts`, `user.controller.ts`, `job.repo.ts`)
* **Variable**: `camelCase` (ví dụ: `userId`, `jobList`, `isDeleted`, `hasPermission`)
* **Function**: `camelCase`, bắt đầu bằng động từ (ví dụ: `createUser()`, `updateUser()`, `deleteJob()`, `findById()`)
* **Class / Interface / Enum / DTO**: `PascalCase` (ví dụ: `UserService`, `UserResponse`, `UserRole`, `CreateJobDto`)
* **Constant**: `UPPER_SNAKE_CASE` (ví dụ: `JWT_SECRET`, `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE`)

## 3. Coding Convention
* Không sử dụng `any` nếu có thể.
* Không hardcode dữ liệu nhạy cảm (JWT Secret, API Key, Password…).
* Không để code bị comment hoặc code thừa.
* Đặt tên rõ nghĩa, tránh dùng: `data`, `temp`, `test`, `abc`.
* Controller chỉ xử lý Request/Response, business logic phải đặt trong Service.
* Validate toàn bộ dữ liệu đầu vào.

## 4. Definition of Done (DoD)
Một chức năng chỉ được xem là hoàn thành khi:
* Hoạt động đúng theo Use Case.
* `docker compose build` thành công.
* `docker compose up -d` chạy thành công.
* `pnpm lint` không có lỗi.
* `pnpm typecheck` / `pnpm check-types` không có lỗi.
* `pnpm test` pass.
* Không làm ảnh hưởng đến chức năng khác.
