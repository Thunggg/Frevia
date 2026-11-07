# Business Rules: [Frevia - Freelancer] Job Alert Management (UC-23)

Tài liệu đặc tả toàn bộ quy tắc nghiệp vụ (**Business Rules**) cho module **Job Alert Management** (Quản lý thông báo việc làm mới) thuộc Use Case **UC-23** dành cho diễn viên **Freelancer**.

---

## 1. Bảng ma trận phân loại chức năng & Mức độ ưu tiên

### 1.1. Bắt buộc (Ưu tiên Cao)

| Use Case ID | Use Case | Chức năng bổ trợ | Mô tả chi tiết |
|:---:|---|---|---|
| **UC-23.01** | **View Job Alert List** | **Empty / Loading / Error State** | Hiển thị Skeleton khi tải danh sách; Empty state kèm nút "Tạo thông báo việc làm đầu tiên"; Error state kèm nút Thử lại. |
| | | **Trạng thái Bật/Tắt (Active / Paused)** | Hiển thị trực quan trạng thái đang hoạt động hoặc tạm dừng của từng alert kèm switch toggle thao tác nhanh. |
| **UC-23.02** | **View Job Alert Detail** | **Hiển thị thông số cấu hình** | Hiển thị chi tiết tiêu chí lọc (Từ khóa, Kỹ năng), Tần suất nhận thông báo và Kênh nhận thông báo. |
| **UC-23.03** | **Create Job Alert** | **Validate tên Alert** | Tên có độ dài 1–100 ký tự (sau khi trim). Nếu để trống, hệ thống tự sinh tên thông minh dựa trên từ khóa hoặc kỹ năng. |
| | | **Validate tiêu chí tìm kiếm** | Bắt buộc phải có ít nhất một Từ khóa (`keywords`) hoặc ít nhất một Kỹ năng (`skills`). Từ khóa ≤ 200 ký tự, tối đa 20 kỹ năng. |
| | | **Chọn tần suất (Frequency)** | Hỗ trợ 3 chế độ: `INSTANT` (Ngay khi có việc mới), `DAILY` (Hàng ngày - Mặc định), `WEEKLY` (Hàng tuần). |
| | | **Chọn kênh nhận (Channels)** | Hỗ trợ các kênh: `IN_APP` (Thông báo trên web Frevia) và `EMAIL` (Gửi qua email đăng ký). Bắt buộc chọn ít nhất 1 kênh. |
| | | **Giới hạn số lượng Alert** | Mỗi Freelancer chỉ được phép tạo tối đa **10 Job Alerts** (`MAX_JOB_ALERTS_PER_USER = 10`). Vượt quá sẽ bị chặn tạo mới. |
| **UC-23.04** | **Update Job Alert** | **Chỉnh sửa toàn diện** | Cho phép đổi tên alert, sửa từ khóa, cập nhật danh sách kỹ năng, thay đổi tần suất và kênh nhận thông báo. |
| | | **Bật/Tắt (Pause/Resume)** | Cho phép tạm dừng nhận thông báo mà không cần phải xóa cấu hình alert. |
| **UC-23.05** | **Delete Job Alert** | **Confirmation Dialog** | Bắt buộc hiển thị hộp thoại xác nhận (AlertDialog) cảnh báo thao tác xóa vĩnh viễn không thể hoàn tác. |
| | | **Xử lý Alert không tồn tại** | Xử lý an toàn khi alert đã bị xóa hoặc không thuộc quyền sở hữu (HTTP 404 `JobAlertNotFoundException`). |
| **Cross-cutting** | **Hệ thống gửi thông báo** | **Không gửi trùng Job** | Lưu lịch sử ID các Job đã gửi cho alert để đảm bảo không bao giờ gửi lặp lại cùng một công việc đến Freelancer. |

---

### 1.2. Nên có (Ưu tiên Trung bình)

| Use Case ID | Use Case | Chức năng bổ trợ | Mô tả chi tiết |
|:---:|---|---|---|
| **UC-23.02** | **View Job Alert Detail** | **Xem các Job khớp gần đây** | Truy vấn xem trước 3–5 công việc `OPEN` khớp với tiêu chí của alert để Freelancer kiểm tra độ chính xác của bộ lọc. |
| **UC-23.03** | **Create Job Alert** | **Chống trùng Alert (Duplicate Prevention)** | Cùng một Freelancer không được tạo 2 alert có cùng tập tiêu chí (`keywords` và danh sách `skills` giống hệt nhau). |
| **UC-23.03** | **Create Job Alert** | **Tạo Alert từ Saved Search có sẵn** | Tích hợp nút "Tạo Job Alert từ bộ lọc này" trong Saved Search, tự động bóc tách từ khóa và kỹ năng sang form Job Alert. |

---

### 1.3. Có thể làm sau (Ưu tiên Thấp)

| Chức năng | Ghi chú & Định hướng tương lai |
|---|---|
| **Pagination / Sorting danh sách** | Vì số lượng alert tối đa chỉ là 10, danh sách hiển thị đầy đủ và sắp xếp theo ngày tạo mới nhất (`createdAt DESC`). |
| **Quiet Hours (Giờ không làm phiền)** | Cấu hình khung giờ ngưng gửi email (ví dụ từ 22:00 đến 07:00 sáng) để bảo vệ trải nghiệm của người dùng. |
| **Archive trước khi Delete** | Lưu trữ alert đã tắt vào mục Lưu trữ theo mô hình USAJOBS thay vì xóa ngay. |
| **Tự hết hạn và gia hạn Alert** | Tự động tạm dừng alert sau 6 tháng nếu người dùng không tương tác để tiết kiệm tài nguyên hệ thống. |

---

## 2. Quy tắc nghiệp vụ cốt lõi đã chốt

1. **BR-JA01 (Giới hạn số lượng - Maximum Limit)**:
   * Ngưỡng tối đa: **10 Job Alerts / Freelancer**.
   * Backend kiểm tra: `prisma.jobAlert.count({ where: { userId } }) >= 10` -> Ném `JobAlertLimitExceededException` (HTTP 400).
   * Giao diện hiển thị counter trực quan `[x/10]`. Khi chạm mốc 10, vô hiệu hóa nút tạo mới và nhắc xóa bớt alert cũ.

2. **BR-JA02 (Chống trùng lặp tiêu chí - Duplicate Prevention)**:
   * Trước khi tạo mới hoặc cập nhật, hệ thống chuẩn hóa chuỗi `keywords` (lowercase, trim) và sắp xếp mảng `skills`.
   * So khớp với các alert hiện có của người dùng. Nếu phát hiện trùng lặp hoàn toàn, báo lỗi `JobAlertDuplicateCriteriaException` (HTTP 400) để ngăn việc gửi nhiều thông báo giống hệt nhau cho cùng một công việc.

3. **BR-JA03 (Quyền truy cập & Bảo mật - Strict Ownership & Role Enforcement)**:
   * Chỉ người dùng có vai trò `FREELANCER` mới được tạo và quản lý Job Alert (`roleName === 'FREELANCER'`).
   * Ràng buộc quyền sở hữu chặt chẽ: Mọi thao tác xem, sửa, bật/tắt, xóa đều phải khớp `userId = currentUserId`. Trả về 404 nếu không khớp (Anti-IDOR).

4. **BR-JA04 (Quy tắc lọc Job gửi thông báo)**:
   * Khi quét việc làm mới để gửi thông báo, chỉ lấy các Job thỏa mãn toàn bộ điều kiện:
     * Trạng thái `status === 'OPEN'`.
     * Chưa bị xóa mềm (`deletedAt === null`).
     * Chưa hết hạn ứng tuyển (`expiryDate === null || expiryDate > now()`).
     * Client đăng việc không bị khóa tài khoản (`client.isBanned === false`).

5. **BR-JA05 (Không gửi trùng Job - Idempotency)**:
   * Hệ thống ghi nhận các Job ID đã gửi cho từng alert. Khi quét job mới, loại trừ các job ID đã từng thông báo trước đó.
