# Business Rules: [Frevia - Freelancer] Saved Search Management (UC-22)

Tài liệu đặc tả toàn bộ quy tắc nghiệp vụ (**Business Rules**) cho module **Saved Search Management** (Quản lý bộ lọc tìm kiếm việc làm đã lưu) thuộc Use Case **UC-22** dành cho diễn viên **Freelancer**.

---

## 1. Bảng ma trận tổng hợp chức năng theo Use Case

| Use Case ID | Tên Use Case | Mô tả chi tiết | Quyền truy cập (Actor) | Mức độ ưu tiên |
|:---:|---|---|:---:|:---:|
| **UC-22.01** | **View Saved Search List** | Lấy và hiển thị danh sách bộ lọc tìm kiếm mà Freelancer đã lưu kèm tóm tắt tiêu chí, hỗ trợ tìm kiếm, phân trang và sắp xếp. | Freelancer | **Cao** |
| **UC-22.02** | **View Saved Search Detail** | Xem chi tiết từng thông số và tiêu chí lọc cụ thể của một bộ lọc tìm kiếm đã lưu và thực thi tìm kiếm việc làm. | Freelancer (Chủ sở hữu) | **Cao** |
| **UC-22.03** | **Create Saved Search** | Lưu các tham số lọc tìm kiếm hiện tại thành một bộ lọc có tên để tái sử dụng nhanh chóng. | Freelancer | **Cao** |
| **UC-22.04** | **Update Saved Search** | Đổi tên hoặc chỉnh sửa các tiêu chí lọc của bộ lọc đã lưu. | Freelancer (Chủ sở hữu) | **Cao** |
| **UC-22.05** | **Delete Saved Search** | Xóa vĩnh viễn bộ lọc tìm kiếm đã lưu khỏi hệ thống với hộp thoại xác nhận. | Freelancer (Chủ sở hữu) | **Cao** |

---

## 2. Các chức năng nên bổ sung

| Use Case | Chức năng bổ trợ | Ưu tiên |
|---|---|:---:|
| **View Saved Search List** | **Pagination** | **Cao** |
| **View Saved Search List** | **Sorting (Newest / Oldest)** | **Cao** |
| **View Saved Search List** | **Search Saved Search by Name** | **Trung bình** |
| **View Saved Search List** | **Empty / Loading / Error State** | **Cao** |
| **View Saved Search Detail** | **Display Search Criteria** | **Cao** |
| **View Saved Search Detail** | **Run Saved Search** | **Cao** |
| **Create Saved Search** | **Validate Search Name** | **Cao** |
| **Create Saved Search** | **Validate Search Parameters** | **Cao** |
| **Create Saved Search** | **Prevent Duplicate Saved Search (nếu có quy định chống trùng)** | **Trung bình** |
| **Update Saved Search** | **Rename Saved Search** | **Cao** |
| **Update Saved Search** | **Edit Search Criteria** | **Trung bình** |
| **Delete Saved Search** | **Confirmation Dialog** | **Cao** |
| **Delete Saved Search** | **Handle Deleted / Not Found Saved Search** | **Cao** |

---

## 3. Quy tắc nghiệp vụ chi tiết theo từng Use Case

---

### UC-22.01: View Saved Search List (Xem danh sách tìm kiếm đã lưu)

1. **Phạm vi dữ liệu & Kiểm soát truy cập (Scope & Access Control)**:
   * Chỉ người dùng đã đăng nhập mang vai trò `FREELANCER` mới có quyền xem danh sách tìm kiếm đã lưu của chính mình.
   * Server luôn tự động ràng buộc điều kiện lọc theo `userId` của token đăng nhập hiện tại (`where: { userId = currentUserId }`). Tuyệt đối không cho phép xem danh sách của người dùng khác (chống rò rỉ dữ liệu).

2. **Chức năng bổ trợ: Sắp xếp (Sorting)**:
   * Hỗ trợ sắp xếp theo thời gian lưu:
     * **Mới nhất (Newest - Mặc định)**: `createdAt: 'desc'`.
     * **Cũ nhất (Oldest)**: `createdAt: 'asc'`.

3. **Chức năng bổ trợ: Tìm kiếm theo tên (Search by Name)**:
   * Cho phép Freelancer tìm kiếm bộ lọc đã lưu bằng cách nhập từ khóa tên (`name`).
   * So khớp tìm kiếm không phân biệt chữ hoa chữ thường (case-insensitive substring match).

4. **Chức năng bổ trợ: Phân trang (Pagination)**:
   * Hỗ trợ các tham số: `page` (mặc định 1) và `limit` (mặc định 10, hỗ trợ 5, 10, 20).
   * Backend trả về thông tin metadata phân trang đầy đủ:
     * `total`: Tổng số bộ lọc thỏa mãn điều kiện tìm kiếm.
     * `page`: Trang hiện tại.
     * `limit`: Số bản ghi mỗi trang.
     * `totalPages`: Tổng số trang (`Math.ceil(total / limit)`).

5. **Chức năng bổ trợ: Trạng thái giao diện (Empty / Loading / Error State)**:
   * **Loading State**: Hiển thị khung Skeleton cards tương ứng với số lượng đang tải trong quá trình fetch dữ liệu.
   * **Empty State (Chưa có bộ lọc)**: Khi Freelancer chưa lưu bộ lọc nào, hiển thị thông báo hướng dẫn cách lưu bộ lọc từ trang Tìm việc kèm nút chuyển hướng "Khám phá việc làm".
   * **Empty State (Không tìm thấy kết quả)**: Khi tìm kiếm theo tên không khớp với bộ lọc nào, hiển thị thông báo không có kết quả kèm nút "Đặt lại tìm kiếm".
   * **Error State**: Cung cấp giao diện `error.tsx` với thông báo lỗi thân thiện và nút "Thử lại" (Retry).

---

### UC-22.02: View Saved Search Detail (Xem chi tiết bộ lọc đã lưu)

1. **Quyền sở hữu nghiêm ngặt (Strict Ownership - Anti-IDOR)**:
   * Người dùng chỉ có quyền xem chi tiết bộ lọc do chính mình tạo ra (`savedSearch.userId === currentUserId`).
   * Nếu bộ lọc không tồn tại hoặc thuộc về tài khoản khác: Server trả về lỗi `SavedSearchNotFoundException` (HTTP 404) hoặc giao diện Next.js kích hoạt `notFound()`. Không tiết lộ sự tồn tại của bộ lọc thuộc người khác.

2. **Chức năng bổ trợ: Bóc tách và hiển thị tiêu chí (Display Search Criteria)**:
   * Toàn bộ tham số lưu trong trường JSON `searchParams` được bóc tách và phiên dịch thành nhãn ngôn ngữ (i18n) dễ đọc:
     * **Từ khóa (`keyword`)**: Hiển thị chuỗi tìm kiếm thực tế.
     * **Ngân sách (`budget`)**: Quy đổi ra nhãn ngữ nghĩa (ví dụ: *Dưới $100*, *$100 – $500*, *$500 – $1,000*, *Trên $1,000* hoặc khoảng giá tùy chỉnh).
     * **Thời gian đăng (`time`)**: Quy đổi thành nhãn (ví dụ: *24 giờ qua*, *3 ngày qua*, *7 ngày qua*, *1 tháng qua*).
     * **Thứ tự sắp xếp (`sort`)**: Quy đổi nhãn (ví dụ: *Mới nhất*, *Cũ nhất*, *Ngân sách cao nhất*, *Ngân sách thấp nhất*).
     * **Kỹ năng (`skills`) / Danh mục (`category`)**: Hiển thị dưới dạng các thẻ Badge trực quan.

3. **Chức năng bổ trợ: Thực thi tìm kiếm (Run Saved Search)**:
   * Màn hình chi tiết và danh sách cung cấp nút bấm "Xem việc làm phù hợp" / "Tìm kiếm công việc" (Run Search) chuyển hướng người dùng sang `/freelancer/find-work` kèm toàn bộ query parameters tương ứng.
   * Khi thực thi tìm kiếm từ bộ lọc đã lưu, hệ thống tự động áp dụng đầy đủ các quy tắc hiển thị Job:
     * **BR-J04**: Ẩn toàn bộ Job `DRAFT`.
     * **BR-J25**: Ẩn toàn bộ Job `CLOSED`.
     * **BR-J31, BR-J32**: Ẩn Job `COMPLETED` và `CANCELLED`.
     * **BR-J33**: Loại trừ Job đã bị xóa mềm (`deletedAt !== null`).
     * **BR-J45**: Loại trừ Job thuộc Client bị khóa tài khoản (`client.isBanned = true`).

---

### UC-22.03: Create Saved Search (Lưu bộ lọc tìm kiếm mới)

1. **Chức năng bổ trợ: Kiểm tra tính hợp lệ của tên (Validate Search Name)**:
   * Bắt buộc phải có, không được để trống hoặc chỉ chứa khoảng trắng (`trim().min(1)`).
   * Độ dài tối đa: **100 ký tự** (`max(100)`).
   * Nếu người dùng không nhập tên tùy chỉnh: Hệ thống tự động gán tên mặc định theo từ khóa tìm kiếm (`keyword`), hoặc mặc định là *"Tất cả dự án đang mở"* (*All Open Projects*).

2. **Chức năng bổ trợ: Kiểm tra và chuẩn hóa tham số (Validate Search Parameters)**:
   * Bắt buộc là một đối tượng JSON hợp lệ (`SavedSearchParamsSchema`).
   * **Chuẩn hóa dữ liệu (Normalization)**: Trước khi lưu, tự động loại bỏ các tham số không mang giá trị lọc thực tế:
     * Loại bỏ tham số phân trang tạm thời (`page`).
     * Loại bỏ các giá trị rỗng (`""`), giá trị mặc định (`"all"`, `"newest"`), và các trường `null`/`undefined`.
     * Sắp xếp các khóa theo thứ tự bảng chữ cái để đảm bảo tính nhất quán khi so sánh.

3. **Chức năng bổ trợ: Chống trùng lặp truy vấn (Prevent Duplicate Saved Search)**:
   * Hệ thống so khớp tập tham số chuẩn hóa hiện tại với danh sách các bộ lọc đã lưu của người dùng.
   * Nếu đã tồn tại bộ lọc có cùng tập tiêu chí lọc:
     * Giao diện hiển thị trạng thái đánh dấu nhận biết (icon đã lưu, nút "Đã lưu bộ lọc này").
     * Ngăn chặn thao tác tạo trùng lặp không cần thiết.

4. **Giới hạn số lượng tối đa (BR-SS01 - Maximum Saved Searches Limit)**:
   * Mỗi Freelancer chỉ được phép lưu tối đa **30 bộ lọc tìm kiếm** (`MAX_SAVED_SEARCHES = 30`).
   * **Kiểm tra tại Backend**: Trước khi tạo mới bản ghi, hệ thống đếm số lượng bộ lọc hiện tại của người dùng (`prisma.savedSearch.count({ where: { userId } })`). Nếu `count >= 30`, ném lỗi `SavedSearchLimitExceededException` (HTTP 400 - `Error.SavedSearchLimitExceeded`).
   * **Phản hồi giao diện**: Hiển thị badge số lượng (ví dụ `3/30`). Khi đạt giới hạn 30, vô hiệu hóa nút lưu mới kèm cảnh báo yêu cầu xóa bớt bộ lọc cũ.

5. **Xử lý bất đồng bộ & Phản hồi (Feedback)**:
   * Khi tạo thành công: Bản ghi được lưu vào bảng `SavedSearch`, hiển thị Toast thông báo thành công và cập nhật ngay danh sách bộ lọc mà không cần tải lại toàn trang.
   * Nếu có lỗi hệ thống: Báo lỗi `FailedToCreateSavedSearchException` (HTTP 500) hoặc lỗi vượt hạn mức (HTTP 400) và giữ nguyên form nhập liệu để người dùng thử lại.

---

### UC-22.04: Update Saved Search (Cập nhật bộ lọc đã lưu)

1. **Chức năng bổ trợ: Đổi tên bộ lọc (Rename Saved Search)**:
   * Cho phép Freelancer đổi tên bộ lọc (`name`) để dễ dàng quản lý và phân loại theo nhu cầu cá nhân.
   * Quy tắc kiểm tra tên: Bắt buộc từ **1 đến 100 ký tự** (sau khi trim).

2. **Chức năng bổ trợ: Chỉnh sửa tiêu chí lọc (Edit Search Criteria)**:
   * Cho phép cập nhật trường `searchParams` của bộ lọc với tập điều kiện lọc mới từ trang Tìm việc làm mà không cần phải xóa đi tạo lại bộ lọc mới.
   * Chuẩn hóa và validate các tiêu chí mới tương tự quy trình tạo mới.

3. **Kiểm tra quyền sở hữu khi cập nhật (Ownership Enforcement)**:
   * Backend thực hiện cập nhật bằng câu lệnh an toàn:
     ```typescript
     prisma.savedSearch.updateMany({
       where: { id, userId },
       data: { name, searchParams },
     })
     ```
   * Nếu không tìm thấy bản ghi khớp cả `id` và `userId` (hoặc số lượng bản ghi cập nhật bằng 0): Ném ngoại lệ `SavedSearchNotFoundException` (HTTP 404). Tuyệt đối ngăn chặn việc sửa đổi bộ lọc của tài khoản khác.

4. **Cập nhật giao diện tức thì (UI State Sync)**:
   * Cập nhật thông tin mới ngay lập tức trên danh sách và thông báo Toast thành công.

---

### UC-22.05: Delete Saved Search (Xóa bộ lọc đã lưu)

1. **Chức năng bổ trợ: Hộp thoại xác nhận an toàn (Confirmation Dialog)**:
   * Trước khi xóa: Bắt buộc hiển thị hộp thoại xác nhận (AlertDialog) cảnh báo thao tác không thể hoàn tác, hiển thị rõ tên bộ lọc sắp bị xóa.
   * Thao tác chỉ được thực thi khi người dùng bấm nút xác nhận "Xóa bộ lọc".

2. **Chức năng bổ trợ: Xử lý bộ lọc không tồn tại / đã xóa (Handle Deleted / Not Found Saved Search)**:
   * Backend bắt lỗi `SavedSearchNotFoundException` (HTTP 404) nếu `id` không tồn tại hoặc không thuộc `userId` hiện tại.
   * Frontend: Xử lý an toàn khi API trả về 404, tự động cập nhật lại danh sách bộ lọc để loại bỏ bản ghi không còn hợp lệ, không để ứng dụng rơi vào trạng thái crash.

3. **Quy tắc xóa vĩnh viễn & Cập nhật tức thì (Hard Delete & Optimistic UI)**:
   * Gửi yêu cầu xóa, gỡ bỏ bộ lọc khỏi danh sách giao diện ngay lập tức (optimistic update), giảm số đếm tổng số bộ lọc và hiển thị thông báo thành công.
   * Nếu thao tác thất bại: Giữ nguyên bộ lọc trong danh sách và hiển thị thông báo lỗi.

---

## 4. Bài học thiết kế UX & Trải nghiệm thực tế (Đúc kết từ Upwork)

Dựa trên phân tích hành vi và phản hồi thực tế từ người dùng trên các nền tảng Freelance hàng đầu (đặc biệt là Upwork):

### 4.1. Nên học (Best Practices to Adopt)
1. **Giới hạn số lượng lưu tối đa (30 bộ lọc)**:
   * Thiết lập ngưỡng cứng **30 bộ lọc tìm kiếm** cho mỗi tài khoản Freelancer.
   * *Mục đích*: Tránh tình trạng tích tụ bộ lọc rác gây phình to cơ sở dữ liệu, giảm áp lực truy vấn và thúc đẩy Freelancer duy trì danh sách bộ lọc chất lượng, phù hợp với định hướng tìm việc hiện tại.
2. **Chạy lại bằng một cú bấm (One-click Re-run)**:
   * Nhấp chuột trực tiếp vào tên bộ lọc tại thanh công cụ hoặc thẻ danh sách sẽ lập tức áp dụng và điều hướng sang trang kết quả tìm việc với các query params tương ứng mà không yêu cầu thêm thao tác xác nhận rườm rà.
3. **Quản lý tập trung tại một nơi (Unified "Manage" Hub)**:
   * Gom toàn bộ hành vi: Đổi tên (Rename), Xóa (Delete), Cập nhật tiêu chí (Update Criteria) và Kiểm tra thông số vào một modal / trung tâm quản lý "Manage" trực quan, minh bạch.

### 4.2. Nên tránh (Pitfalls to Avoid)
1. **Không giấu nút Quản lý ("Manage") trong menu con khó thấy**:
   * *Vấn đề Upwork thường bị phàn nàn*: Người dùng khó tìm thấy vị trí quản lý hoặc chỉnh sửa khi bộ lọc bị giấu sâu trong dropdown menu phụ.
   * *Giải pháp Frevia*: Đặt nút Quản lý ("Tìm kiếm đã lưu" / "Manage") trực tiếp trên thanh công cụ chính của trang Tìm việc (`Find Work`), hiển thị rõ ràng cùng counter badge (ví dụ: `3/30`) để người dùng luôn biết mình có bao nhiêu bộ lọc và truy cập quản lý chỉ với 1 cú click.
2. **Không thiếu nút lưu rõ ràng khi sửa tiêu chí lọc**:
   * *Vấn đề Upwork thường bị phàn nàn*: Khi người dùng đang duyệt việc làm theo một bộ lọc đã lưu và điều chỉnh một vài tiêu chí (ví dụ: thay đổi khoảng ngân sách), giao diện không cung cấp nút lưu rõ ràng khiến người dùng bối rối không biết làm thế nào để lưu đè lên bộ lọc cũ.
   * *Giải pháp Frevia*: Cung cấp nút thao tác rõ ràng:
     * Nút **"Cập nhật tiêu chí vào bộ lọc này"** (Update criteria) để ghi đè tập tham số mới.
     * Nút **"Lưu thành bộ lọc mới"** (Save as new) để tạo thêm một bộ lọc độc lập.

### 4.3. Đề xuất tính năng cộng thêm (Nice-to-have / Enhanced Features)
* **Kéo thả sắp xếp thứ tự (Drag & Drop Reordering)**:
  * Cho phép Freelancer tự do kéo thả để đưa những bộ lọc tìm kiếm thường xuyên sử dụng nhất lên vị trí đầu tiên, cá nhân hóa tối đa trải nghiệm tìm việc hàng ngày.

