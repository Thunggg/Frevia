# Business Rules: UC-32 Proposal Management

Tài liệu quy định toàn bộ quy tắc nghiệp vụ (Business Rules) cho Use Case **UC-32: Proposal Management (Quản lý Đề xuất chào thầu)** trong hệ thống Frevia, bao gồm cả 2 đối tượng người dùng: **Freelancer** và **Client**.

---

## Danh sách Use Cases (UC-32.01 đến UC-32.09)

| Mã Use Case | Tên chức năng | Tác nhân chính (Actor) | Mô tả tóm tắt |
| :--- | :--- | :--- | :--- |
| **UC-32.01** | View My Proposal List | Freelancer | Xem danh sách các đề xuất chào thầu của chính mình (phân trang, lọc theo trạng thái) |
| **UC-32.02** | View My Proposal Detail | Freelancer | Xem chi tiết một đề xuất chào thầu và thông tin việc làm liên quan |
| **UC-32.03** | Submit Proposal | Freelancer | Nộp chào thầu mới vào một bài đăng việc làm (hoặc gửi từ bản nháp) |
| **UC-32.04** | Update Proposal | Freelancer | Cập nhật nội dung bản nháp đề xuất (hoặc chỉnh sửa đề xuất trước khi được xử lý) |
| **UC-32.05** | Withdraw Proposal | Freelancer | Rút lại đề xuất đã nộp khi chưa được khách hàng chấp nhận hoặc từ chối |
| **UC-32.06** | Accept Proposal | Client | Khách hàng chấp nhận đề xuất chào thầu, kích hoạt hợp đồng và ghi nhận tuyển dụng |
| **UC-32.07** | Reject Proposal | Client | Khách hàng từ chối đề xuất chào thầu |
| **UC-32.08** | View Job Proposal List | Client | Khách hàng xem danh sách tất cả các đề xuất nộp vào một công việc của mình |
| **UC-32.09** | View Proposal Detail | Client | Khách hàng xem chi tiết một đề xuất của Freelancer gửi đến |

---

## Vòng đời trạng thái đề xuất (Proposal State Machine)

```
       ┌────────────────────────┐
       │         DRAFT          │
       └───────────┬────────────┘
                   │ submitDraft()
                   ▼
       ┌────────────────────────┐
──────▶│       SUBMITTED        │◀───── (createProposal)
       └─────┬────────────┬─────┘
             │            │
             │            ├──────────────────────────┐
             │ interview  │                          │
             ▼            │                          │
       ┌───────────┐      │                          │
       │INTERVIEWING      │                          │
       └─────┬─────┘      │                          │
             │            │                          │
             ├────────────┼─────────────┐            │
             │            │             │            │
             ▼            ▼             ▼            ▼
       ┌───────────┐┌───────────┐ ┌───────────┐┌───────────┐
       │   HIRED   ││ REJECTED  │ │ WITHDRAWN ││  EXPIRED  │
       │(ACCEPTED) ││           │ │           ││           │
       └───────────┘└───────────┘ └───────────┘└───────────┘
```

- **DRAFT**: Bản nháp, chỉ Freelancer nhìn thấy và có quyền chỉnh sửa.
- **SUBMITTED**: Đã nộp thành công cho Khách hàng. Đang chờ phản hồi.
- **INTERVIEWING**: Khách hàng đã mở trao đổi / liên hệ với Freelancer.
- **HIRED (ACCEPTED)**: Khách hàng chấp nhận đề xuất, tạo hợp đồng (Contract) tự động.
- **REJECTED**: Khách hàng từ chối đề xuất.
- **WITHDRAWN**: Freelancer chủ động rút đề xuất.
- **EXPIRED**: Đề xuất quá hạn (mặc định 30 ngày kể từ khi gửi mà không có hành động).

---

## Chi tiết các Business Rules (BR-PR01 đến BR-PR10)

### BR-PR01: Phân quyền & Vai trò người dùng (Role & Ownership Constraint)
- Các chức năng **UC-32.01, UC-32.02, UC-32.03, UC-32.04, UC-32.05** chỉ dành riêng cho tài khoản có vai trò **FREELANCER**.
- Các chức năng **UC-32.06, UC-32.07, UC-32.08, UC-32.09** chỉ dành riêng cho tài khoản có vai trò **CLIENT**.
- Freelancer chỉ có quyền xem, sửa, rút đề xuất do chính mình tạo ra (`freelancerId === currentUserId`).
- Client chỉ có quyền xem danh sách, chi tiết, phỏng vấn, từ chối, chấp nhận đề xuất thuộc các bài đăng việc làm do chính mình làm chủ (`job.clientId === currentUserId`).
- Khi vi phạm quyền truy cập: Hệ thống trả về mã lỗi `403 Forbidden` (`Error.ProposalForbidden` hoặc `Error.ProposalFreelancerOnly` / `Error.ProposalClientOnly`).

### BR-PR02: Quy tắc loại trừ việc làm tự tạo (Self-Job Exclusion)
- Freelancer **không được phép** nộp đề xuất chào thầu vào bài đăng việc làm do chính mình đăng tải (`job.clientId !== freelancerId`).
- Khi vi phạm: Ném lỗi `Error.CannotProposeOwnJob`.

### BR-PR03: Điều kiện hợp lệ của bài đăng việc làm (Job Eligibility Constraint)
Để Freelancer có thể nộp đề xuất hoặc nộp bản nháp (`createProposal`, `submitDraft`), bài đăng việc làm liên quan phải thỏa mãn đồng thời:
1. Trạng thái việc làm phải là `OPEN` (`job.status === 'OPEN'`).
2. Việc làm chưa bị xóa mềm (`job.deletedAt IS NULL`).
3. Việc làm chưa quá hạn nộp (`job.expiryDate IS NULL` hoặc `job.expiryDate > NOW()`).
4. Số lượng vị trí tuyển dụng chưa đủ (`job.positionsFilled < job.positionsRequired`).
- Khi vi phạm một trong các điều kiện trên: Hệ thống từ chối và thông báo lỗi tương ứng (`Error.ProposalJobUnavailable`, `Error.ProposalJobExpired`, `Error.ProposalJobPositionsFilled`).

### BR-PR04: Ràng buộc duy nhất đề xuất hoạt động (Single Active Proposal per Job)
- Mỗi Freelancer chỉ được phép có **tối đa 1 đề xuất đang hoạt động** (`DRAFT`, `SUBMITTED`, `INTERVIEWING`) cho cùng một bài đăng việc làm.
- Nếu đề xuất trước đó đã ở trạng thái kết thúc (`REJECTED`, `WITHDRAWN`, `EXPIRED`), Freelancer có thể nộp đề xuất mới nếu việc làm vẫn còn mở.
- Khi vi phạm: Ném lỗi `Error.ActiveProposalExists`.

### BR-PR05: Ràng buộc dữ liệu chào thầu (Bid & Content Validation)
Khi nộp đề xuất chính thức (`createProposal` hoặc `submitDraft`):
1. **Giá chào thầu (`bidAmount`)**:
   - Phải là số dương $> 0$.
   - Bắt buộc phải có khi submit chính thức.
2. **Thời gian thực hiện (`deliveryDays`)**:
   - Phải là số nguyên dương $\ge 1$ ngày.
   - Bắt buộc phải có khi submit chính thức.
3. **Thư ứng tuyển (`coverLetter`)**:
   - Bắt buộc không được để trống (`trim().length > 0`).
   - Độ dài tối đa 5000 ký tự.
- Đối với bản nháp (`saveDraft`, `updateDraft`): Cho phép lưu từng phần nhưng phải có ít nhất 1 trường có giá trị (`DRAFT_CONTENT_REQUIRED`).

### BR-PR06: Khả năng thao tác với đề xuất (Actionable Proposal Rule)
- Client chỉ có thể thực hiện `interviewProposal`, `rejectProposal`, hoặc `acceptProposal` khi đề xuất đang ở trạng thái **Actionable**: `SUBMITTED` hoặc `INTERVIEWING`.
- Freelancer chỉ có thể thực hiện `withdrawProposal` khi đề xuất đang ở trạng thái **Actionable**: `SUBMITTED` hoặc `INTERVIEWING`.
- Nếu đề xuất đã `HIRED`, `REJECTED`, `WITHDRAWN`, hoặc `EXPIRED`: Không cho phép thực hiện các thao tác trên (ném lỗi `Error.ProposalNotSubmitted`).

### BR-PR07: Quy tắc tuyển dụng & Đóng việc làm (Hiring & Auto-Close Rule)
Khi Client chấp nhận đề xuất (`UC-32.06: acceptProposal`):
1. **Đối với việc làm tuyển 1 người (`hiringType === 'SINGLE'`)**:
   - Trạng thái đề xuất được chọn chuyển thành `HIRED`, lưu thời điểm `acceptedAt`.
   - Tạo hợp đồng làm việc (`Contract`) liên kết giữa Client và Freelancer với số tiền `totalAmount = proposal.bidAmount`.
   - Cập nhật số vị trí `positionsFilled = 1`.
   - Tự động đóng việc làm: `job.status = 'CLOSED'`.
   - Tự động chuyển tất cả các đề xuất còn lại đang ở `SUBMITTED` hoặc `INTERVIEWING` của công việc đó sang `REJECTED` (vì đã tìm được người).
   - Gửi thông báo đến Freelancer được chọn và các Freelancer bị từ chối.
2. **Đối với việc làm tuyển nhiều người (`hiringType === 'MULTIPLE'`)**:
   - Trạng thái đề xuất được chọn chuyển thành `HIRED`, lưu `acceptedAt`.
   - Tạo hợp đồng làm việc (`Contract`).
   - Tăng `positionsFilled` thêm 1 đơn vị.
   - Các đề xuất khác vẫn giữ nguyên trạng thái.
   - Nếu `positionsFilled >= positionsRequired`: Tự động chuyển `job.status = 'CLOSED'`.

### BR-PR08: Tự động hết hạn đề xuất tồn đọng (Stale Proposals Expiry Rule)
- Trước khi thực hiện các truy vấn danh sách hoặc xử lý quyết định, hệ thống tự động quét và cập nhật các đề xuất đang ở trạng thái `SUBMITTED` hoặc `INTERVIEWING` có `expiresAt < NOW()` sang trạng thái `EXPIRED`.

### BR-PR09: Phân trang & Sắp xếp (Pagination & Sorting)
- Danh sách đề xuất của Freelancer (`UC-32.01`) và của Client (`UC-32.08`) đều hỗ trợ phân trang với `page` (mặc định 1) và `limit` (mặc định 10, tối đa 50).
- Thứ tự sắp xếp mặc định: Mới nhất lên đầu (`createdAt: 'desc'`).
- Hỗ trợ lọc theo trạng thái (`status`).

### BR-PR10: Tính toàn vẹn dữ liệu khi xóa mềm (Soft-Delete Preservation)
- Khi một đề xuất bị xóa mềm (`deletedAt IS NOT NULL`), đề xuất đó không xuất hiện trong các danh sách và không thể thực hiện bất kỳ hành động nào.

