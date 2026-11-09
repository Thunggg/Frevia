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

---

### 1.3. Có thể làm sau (Ưu tiên Thấp)

| Chức năng | Ghi chú & Định hướng tương lai |
|---|---|
| **Pagination / Sorting danh sách** | Vì số lượng alert tối đa chỉ là 10, danh sách hiển thị đầy đủ và sắp xếp theo ngày tạo mới nhất (`createdAt DESC`). |
| **Quiet Hours (Giờ không làm phiền)** | Cấu hình khung giờ ngưng gửi email (ví dụ từ 22:00 đến 07:00 sáng) để bảo vệ trải nghiệm của người dùng. |
| **Archive trước khi Delete** | Lưu trữ alert đã tắt vào mục Lưu trữ theo mô hình USAJOBS thay vì xóa ngay. |
| **Tự hết hạn và gia hạn Alert** | Tự động tạm dừng alert sau 6 tháng nếu người dùng không tương tác để tiết kiệm tài nguyên hệ thống. |

---

## 2. Quy tắc nghiệp vụ cốt lõi chi tiết

### BR-JA01: Giới hạn số lượng tối đa (Maximum Limit)
* Ngưỡng tối đa: **10 Job Alerts / Freelancer** (`MAX_JOB_ALERTS_PER_USER = 10`).
* Backend kiểm tra: `prisma.jobAlert.count({ where: { userId } }) >= 10` $\rightarrow$ Ném lỗi `JobAlertLimitExceededException` (HTTP 400).
* Giao diện hiển thị counter trực quan `[x/10]`. Khi chạm mốc 10, vô hiệu hóa nút tạo mới và nhắc xóa bớt alert cũ.

### BR-JA02: Chống trùng lặp tiêu chí (Duplicate Prevention)
* Trước khi tạo mới hoặc cập nhật, hệ thống chuẩn hóa chuỗi `keywords` (lowercase, trim) và sắp xếp mảng `skills`.
* So khớp với các alert hiện có của người dùng. Nếu phát hiện trùng lặp hoàn toàn, báo lỗi `JobAlertDuplicateCriteriaException` (HTTP 400) để ngăn việc gửi nhiều thông báo giống hệt nhau cho cùng một công việc.

### BR-JA03: Quyền truy cập & Bảo mật (Strict Ownership & Role Enforcement)
* Chỉ người dùng có vai trò `FREELANCER` mới được tạo và quản lý Job Alert (`roleName === 'FREELANCER'`).
* Ràng buộc quyền sở hữu chặt chẽ: Mọi thao tác xem, sửa, bật/tắt, xóa đều phải khớp `userId = currentUserId`. Trả về 404 nếu không khớp (Anti-IDOR).

### BR-JA04: Điều kiện lọc Job hợp lệ gửi thông báo
Khi quét việc làm mới để gửi thông báo, chỉ lấy các Job thỏa mãn toàn bộ điều kiện:
* Trạng thái `status === 'OPEN'`.
* Chưa bị xóa mềm (`deletedAt === null`).
* Chưa hết hạn ứng tuyển (`expiryDate === null || expiryDate > now()`).
* Client đăng việc không bị khóa tài khoản (`client.isBanned === false`).

### BR-JA05: Không gửi trùng Job (Idempotency)
* Hệ thống ghi nhận các Job ID đã gửi cho từng alert. Khi quét job mới, loại trừ các job ID đã từng thông báo trước đó để đảm bảo mỗi công việc chỉ được gửi thông báo duy nhất một lần.

### BR-JA06: Không gửi thông báo Job của chính mình (Self-Job Exclusion Rule)
* **Quy tắc**: Tuyệt đối không gửi thông báo Job Alert cho người dùng nếu chính người dùng đó là Client tạo ra công việc (`job.clientId !== alert.userId`).
* **Lý do**: Frevia hỗ trợ chuyển đổi vai trò (Role Switching). Người dùng vừa có thể đăng việc với tư cách Client, vừa tìm việc với tư cách Freelancer. Gửi thông báo tìm việc cho chính bài đăng của mình là phi logic.

### BR-JA07: Loại trừ Job mà Freelancer đã ứng tuyển (Already Applied Exclusion Rule)
* **Quy tắc**: Khi quét việc làm để gửi thông báo (đặc biệt là Daily/Weekly digest), hệ thống tự động loại trừ các Job mà Freelancer đã nộp đề xuất ứng tuyển (`Proposal.freelancerId === alert.userId && Proposal.jobId === job.id`).
* **Lý do**: Tránh gửi thông báo nhắc nhở ứng tuyển cho công việc mà ứng viên đã nộp hồ sơ thành công.

### BR-JA08: Khống chế số lượng Job tối đa trong 1 thông báo (Batch Size Limit: Top 5)
* **Quy tắc**: Trong một thông báo In-App hoặc Email Digest, hệ thống **chỉ gửi tối đa Top 5 công việc phù hợp nhất** (ưu tiên Job mới nhất và có ngân sách tốt nhất).
* Kèm theo đường dẫn: *"Xem tất cả việc làm phù hợp"* dẫn thẳng sang trang `/freelancer/find-work` với bộ lọc tương ứng để người dùng xem tiếp.
* **Lý do**: Chống spam, tránh quá tải giao diện thông báo và bảo vệ hộp thư của Freelancer.

### BR-JA09: Hành vi khi không có Job nào khớp (Zero-match Silent Rule)
* **Quy tắc**: Nếu trong chu kỳ quét (ngày hoặc tuần) không có bất kỳ việc làm mới nào khớp với tiêu chí của alert, hệ thống **hoàn toàn im lặng, không gửi thông báo rỗng**.
* **Lý do**: Không làm phiền người dùng bằng những thông báo vô nghĩa (*"Hôm nay không có việc làm nào"*), đồng thời tiết kiệm tài nguyên gửi mail.

### BR-JA10: Ràng buộc trạng thái tài khoản (Account Status Constraint)
* **Tài khoản bị khóa (`user.isBanned === true`)**: Tự động vô hiệu hóa toàn bộ Job Alerts của user đó (`isActive = false`), worker không quét gửi thông báo cho tài khoản vi phạm.
* **Chưa kích hoạt Email (`user.emailVerified === false`)**: Nếu Freelancer chưa xác thực địa chỉ email, hệ thống chỉ cho phép gửi qua kênh `IN_APP`, tạm khóa kênh `EMAIL` cho đến khi xác thực xong.
* **Lý do**: Bảo vệ danh tiếng gửi thư (Email Sender Reputation) và tuân thủ chính sách bảo mật.

### BR-JA11: Dọn dẹp dữ liệu khi xóa tài khoản (Cascade Delete Lifecycle)
* **Quy tắc**: Khi một tài khoản người dùng bị xóa vĩnh viễn khỏi hệ thống (`Hard Delete`), toàn bộ các bản ghi `JobAlert` của người đó phải được xóa tự động (`onDelete: Cascade`).
* **Lý do**: Đảm bảo toàn vẹn dữ liệu, không để lại bản ghi rác mồ côi trong cơ sở dữ liệu.
