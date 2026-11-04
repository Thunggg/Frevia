# Business Rule - Job (BR-J01 – BR-J46)

Business rule quản lý Job theo **thực tế thông dụng của các nền tảng freelance** (Upwork, Freelancer.com, Fiverr, Toptal). Mỗi rule giữ nguyên ID BR-Jxx để đối chiếu.

## Trạng thái Job

| Trạng thái | Ý nghĩa |
|---|---|
| `DRAFT` | Nháp — chưa công khai. |
| `OPEN` | Đang đăng — nhận proposal. |
| `IN_PROGRESS` | Đã tuyển đủ chỗ, đang thực hiện (có Contract). |
| `COMPLETED` | Hoàn thành (Contract hoàn tất). |
| `CLOSED` | Đóng sớm / tự hết hạn. |
| `CANCELLED` | Bị hủy. |

```
DRAFT ──publish──► OPEN ──hire (tuyển đủ chỗ)──► IN_PROGRESS ──contract done──► COMPLETED
  │                 │ └──close/expiry──► CLOSED ──reopen (nếu hỗ trợ)──► OPEN
  │                 │                    ▲        (proposal cũ không hồi sinh)
  └──cancel─────────┴──cancel──► CANCELLED ◄──contract cancelled──┘
```

## Thuê nhiều vị trí (BR-J37)

| Trường | Ý nghĩa | Mặc định |
|---|---|---|
| `hiring_type` | `SINGLE` (1 người) hoặc `MULTIPLE` (nhiều người). | `SINGLE` |
| `positions_required` | Số chỗ cần tuyển; `SINGLE` luôn = 1. | `1` |
| `positions_filled` | Số chỗ đã tuyển (chỉ tăng trong transaction hire). | `0` |

Job `MULTIPLE` vẫn giữ `OPEN` khi mới tuyển 1 phần — đến khi `positions_filled == positions_required` mới chuyển `IN_PROGRESS`.

## A. Tạo & Nháp (BR-J01 – BR-J05)

<details>
<summary><strong>BR-J01: Chỉ Client được tạo Job trong luồng người dùng thông thường</strong></summary>

Chỉ tài khoản có vai trò `CLIENT` mới gọi được API tạo Job. Freelancer, Guest, Expert không có quyền tạo Job.

</details>

<details>
<summary><strong>BR-J02: Job mới tạo luôn có trạng thái DRAFT</strong></summary>

Job được tạo với `status = DRAFT`, không nhận tham số trạng thái từ client. Không có đường tắt nào để tạo Job thẳng ra `OPEN`.

</details>

<details>
<summary><strong>BR-J03: Client được phép sửa Job khi còn là DRAFT</strong></summary>

Trong trạng thái `DRAFT`, chủ Job được cập nhật mọi trường (title, description, budget, skills, category, thời hạn) không giới hạn.

</details>

<details>
<summary><strong>BR-J04: Job DRAFT không hiển thị công khai và không nhận Proposal</strong></summary>

- Không xuất hiện trong danh sách tìm kiếm, chi tiết public, danh mục, kết quả lọc.
- Bất kỳ nút "Ứng tuyển" nào đều bị chặn; API gửi proposal kiểm tra `status = OPEN` và từ chối.
- Chỉ chủ Job (và Admin moderation) xem được Job DRAFT.

</details>

<details>
<summary><strong>BR-J05: Chỉ publish được khi mọi trường bắt buộc đã hợp lệ</strong></summary>

Điều kiện `DRAFT → OPEN`:
- title (10–100 ký tự, không spam/URL), description đủ dài, ≥1 category, ≥1 skill
- budget hợp lệ (`budgetMin >= 0`, `budgetMin <= budgetMax`), duration, experience level
- `deadline`/`expiryDate` (nếu có) > thời điểm publish
- Tài khoản Client đã xác minh email/thanh toán, không bị giới hạn đăng bài
- Trường thiếu/hợp lệ sai → publish bị từ chối kèm lỗi từng trường

</details>

## B. Publish & Nhận Proposal (BR-J06 – BR-J09)

<details>
<summary><strong>BR-J06: Publish chuyển trạng thái DRAFT → OPEN</strong></summary>

Thao tác publish thực hiện chuyển `DRAFT → OPEN`, đặt `publishedAt`, đưa Job vào chỉ mục tìm kiếm. Publish Job không ở `DRAFT` → lỗi.

</details>

<details>
<summary><strong>BR-J07: Chỉ Job OPEN mới nhận Proposal</strong></summary>

API gửi proposal yêu cầu `job.status === 'OPEN'` và Job chưa qua ngày hết hạn + còn chỗ trống (`positions_filled < positions_required`, BR-J37). Mọi trạng thái còn lại (`DRAFT`, `IN_PROGRESS`, `CLOSED`, `CANCELLED`, `COMPLETED`) từ chối.

</details>

<details>
<summary><strong>BR-J08: Job OPEN nhận được nhiều Proposal cùng lúc</strong></summary>

Không giới hạn số proposal cho một Job mở — mỗi Freelancer gửi tối đa 1 proposal đang hoạt động cho 1 Job, nhưng nhiều Freelancer khác nhau thì nhiều proposal song song. Hệ thống phải chịu được nhiều proposal arrives đồng thời (không lock Job khi ghi proposal).

</details>

<details>
<summary><strong>BR-J09: Nhận Proposal không làm thay đổi trạng thái Job</strong></summary>

`createProposal` chỉ ghi bản ghi Proposal; Job vẫn giữ nguyên `OPEN`. Chỉ hành động **accept** mới đổi trạng thái Job (BR-J16). Không có trigger/counter nào tự đổi Job khi có proposal mới.

</details>

## C. Chỉnh sửa Job & Tách biệt với Proposal (BR-J10 – BR-J14)

<details>
<summary><strong>BR-J10: Client được phép sửa Job đang OPEN (Phân loại theo tình trạng Proposal)</strong></summary>

Khi Job ở trạng thái `OPEN`, việc cho phép chỉnh sửa và phạm vi áp dụng được phân thành 2 trường hợp cụ thể:

1. **Trường hợp 1: Job OPEN nhưng CHƯA CÓ Proposal nào ($0$ proposal)**:
   - Client được tự do sửa đổi các thông tin nội dung: `title` (nhưng `slug` giữ nguyên theo BR-J42), `description`, `skills` (1–10 skills theo BR-J43), `jobCategories`, `budgetMin`, `budgetMax` (≥ $10 theo BR-J41), `deadline`, `expiryDate` (> now), và `hiringType` (`SINGLE` ↔ `MULTIPLE`).
   - Thao tác này không gây xung đột quyền lợi vì chưa có ứng viên nào nộp hồ sơ.

2. **Trường hợp 2: Job OPEN và ĐÃ CÓ Proposal nộp vào ($ge 1$ proposal)**:
   - **Bảo toàn snapshot đề xuất (BR-J11, BR-J12)**: Cho phép sửa nội dung mô tả, kỹ năng, thời hạn và ngân sách; tuy nhiên **tuyệt đối không làm thay đổi giá trị đề xuất (`bidAmount`) và thời gian giao hàng (`deliveryDays`)** của các Proposal đã nộp trước đó.
   - **Thông báo cập nhật (BR-J13)**: Hệ thống ghi nhận mốc thời gian cập nhật và gửi thông báo tới các Freelancer đã nộp để họ chủ động xem xét lại đề xuất, có quyền rút đơn (`WITHDRAW`) để nộp lại nếu muốn.
   - **Ràng buộc vị trí tuyển (BR-J37)**: Không được giảm `positionsRequired` xuống thấp hơn số lượng đã tuyển `positionsFilled`. Nếu đã tuyển $ge 2$ người ở chế độ `MULTIPLE`, cấm chuyển ngược về `SINGLE`.
   - **Cấm đổi tiền tệ (BR-J41)**: Đơn vị tiền tệ bị khóa cố định, không được thay đổi sau khi đã Publish.

3. **Bảng phân định các trường được phép sửa vs bị khóa khi Job OPEN**:

| Trường dữ liệu | Cho phép sửa khi `OPEN` | Ràng buộc áp dụng |
|---|:---:|---|
| `title` | Có | Sửa được tên hiển thị; `slug` định danh URL giữ nguyên (BR-J42). |
| `description` | Có | Tối đa 5.000 ký tự. |
| `skills` | Có | Tối thiểu 1, tối đa 10 kỹ năng (BR-J43). |
| `jobCategories` | Có | Phải thuộc danh mục đang hoạt động (`ACTIVE`). |
| `budgetMin`, `budgetMax` | Có | Phải $ge $10$; không ảnh hưởng giá bid của proposal cũ (BR-J12). |
| `deadline`, `expiryDate` | Có | Phải là thời điểm trong tương lai (`> now()`). |
| `positionsRequired` | Có | Phải $ge positionsFilled$ (BR-J37). |
| `slug` | ❌ **Khóa** | Bất biến sau Publish để bảo toàn SEO và link chia sẻ (BR-J42). |
| `budgetType` / `currency` | ❌ **Khóa** | Không đổi loại ngân sách / đơn vị tiền tệ sau khi đã Publish (BR-J41). |
| `positionsFilled` | ❌ **Khóa** | Chỉ hệ thống tự động tăng khi Hire thành công. |
| `status` | ❌ **Khóa** | Không sửa qua form Update (chỉ qua Publish, Close, Reopen). |
| `clientId` | ❌ **Khóa** | Không thể chuyển nhượng quyền sở hữu Job. |

</details>

<details>
<summary><strong>BR-J11: Cập nhật Job không tự động sửa các Proposal hiện có</strong></summary>

`updateJob` chỉ ghi vào bảng Job (+ quan hệ skill/category). Không có logic nào đụng vào bảng Proposal khi Job thay đổi — không re-price, không đổi deliveryDays, không reset trạng thái của proposal đã gửi.

</details>

<details>
<summary><strong>BR-J12: Proposal giữ nguyên điều khoản gốc của Freelancer dù Job có đổi sau đó</strong></summary>

`bidAmount`, `deliveryDays`, `coverLetter` trong proposal là **snapshot** tại thời điểm gửi. Client sửa Job (đổi ngân sách, đổi mô tả) không ghi đè các giá trị này. Nếu accept, Contract lấy đúng `bidAmount` đã đề xuất (không lấy budget mới của Job).

</details>

<details>
<summary><strong>BR-J13: Thay đổi trọng yếu của Job không làm thay đổi Proposal hiện có; Freelancer tự rút và nộp lại</strong></summary>

- Khi Job bị sửa trọng yếu (đổi phạm vi/ngân sách lớn), hệ thống **không sửa** proposal đã tồn tại.
- Việc điều chỉnh được xử lý theo cách: Freelancer tự `WITHDRAW` rồi nộp lại với điều khoản mới (nếu vẫn muốn), hoặc tiếp tục giữ đề xuất cũ.
- (Khuyến nghị vận hành: thông báo cho các Freelancer đã ứng tuyển khi Job thay đổi trọng yếu để họ chủ động quyết định.)

</details>

<details>
<summary><strong>BR-J14: Chỉ chủ Job được update, publish, close, quản lý Job</strong></summary>

Mọi thao tác ghi (`update`, `publish`, `close`, `change status`, `delete`) đều kiểm tra `job.clientId === currentUserId` ở **server-side**. Sai → 403/404 (không phân biệt "biết id hay không" — tránh IDOR). Admin chỉ can thiệp qua luồng moderation có audit log.

</details>

## D. Thuê & IN_PROGRESS (BR-J15 – BR-J21)

<details>
<summary><strong>BR-J15: Số proposal HIRED tối đa bằng số chỗ cần tuyển (BR-J37)</strong></summary>

- `SINGLE`: tối đa 1 `HIRED` — hire proposal đầu tiên thì các `SUBMITTED`/`INTERVIEWING` khác tự `REJECTED` (BR-J17).
- `MULTIPLE`: tối đa `positions_required` `HIRED`; check chỗ phải nằm trong transaction (khóa row Job), không chỉ ở tầng UI.
- Chống race: Contract unique trên `proposalId` (mỗi proposal tối đa 1 Contract); `jobId` không còn unique (BR-J18).

</details>

<details>
<summary><strong>BR-J16: Accept proposal tăng positions_filled; Job chuyển IN_PROGRESS khi tuyển đủ chỗ</strong></summary>

Hành động hire/accept tăng `positions_filled += 1` và đổi `job.status: OPEN → IN_PROGRESS` **chỉ khi** `positions_filled == positions_required` (SINGLE thì lần hire đầu tiên đã đủ). `MULTIPLE` chưa đủ chỗ → Job giữ `OPEN` để tiếp tục nhận proposal. Accept proposal của Job không ở `OPEN` → lỗi.

</details>

<details>
<summary><strong>BR-J17: Tuyển đủ chỗ làm các proposal đang mở cùng Job tự chuyển REJECTED</strong></summary>

Trong cùng transaction với BR-J16:
- `SINGLE`: ngay khi hire 1 proposal → mọi proposal `SUBMITTED`/`INTERVIEWING` còn lại → `REJECTED` (kèm thông báo "đã chọn ứng viên khác").
- `MULTIPLE`: các proposal khác **giữ nguyên** trạng thái; đến khi tuyển đủ chỗ → mọi `SUBMITTED`/`INTERVIEWING` còn lại → `REJECTED` + thông báo.
- Proposal `DRAFT` của người khác không bị ảnh hưởng (vẫn thấy Job nên không gửi được khi Job IN_PROGRESS — BR-J19).

</details>

<details>
<summary><strong>BR-J18: Accept proposal tạo đúng 1 Contract tương ứng</strong></summary>

Cùng transaction: tạo 1 bản ghi Contract gắn với proposal vừa hire (`proposalId` unique → mỗi proposal tối đa 1 Contract). `MULTIPLE` → nhiều Contract cho 1 Job; `jobId` chỉ là index thường, không còn unique. Contract mang `totalAmount = bidAmount` của proposal thắng.

</details>

<details>
<summary><strong>BR-J19: Job IN_PROGRESS không nhận Proposal mới</strong></summary>

API gửi proposal yêu cầu `status = OPEN`; Job `IN_PROGRESS` → từ chối. Nút ứng tuyển trên UI cũng bị ẩn.

</details>

<details>
<summary><strong>BR-J20: Job IN_PROGRESS không được sửa trực tiếp các điều khoản cốt lõi</strong></summary>

Khi đã có Contract hiệu lực, các trường điều khoản (ngân sách, phạm vi, thời hạn) bị khóa ở endpoint update Job thường. Sửa được thì chỉ có trường không ảnh trợ nghĩa (ví dụ title phụ, ghi chú nội bộ).

</details>

<details>
<summary><strong>BR-J21: Thay đổi điều khoản sau IN_PROGRESS phải qua quy trình modification/change-request riêng</strong></summary>

Mọi thay đổi thỏa thuận sau khi ký contract đi qua quy trình tách biệt: change request / contract amendment (đề xuất → hai bên đồng ý → cập nhật Contract + Job trong 1 transaction). Không có đường update Job trực tiếp để "vượt" contract.

</details>

## E. Đóng & Mở lại (BR-J22 – BR-J27)

<details>
<summary><strong>BR-J22: Client đóng được Job OPEN khi chưa có proposal HIRED hay contract hiệu lực</strong></summary>

Điều kiện `close`: chủ Job, Job `OPEN`, **chưa** có proposal `HIRED` và chưa có contract hiệu lực. Nếu đã có → phải đi qua luồng Contract (BR-J28).

</details>

<details>
<summary><strong>BR-J23: Đóng Job chuyển trạng thái OPEN → CLOSED</strong></summary>

Thao tác close đổi `status: OPEN → CLOSED`, đặt `closedAt` + lý do (hết hạn / không còn nhu cầu / khác). Đóng Job không ở `OPEN` → lỗi transition.

</details>

<details>
<summary><strong>BR-J24: Proposal SUBMITTED/INTERVIEWING của Job vừa đóng trở thành EXPIRED</strong></summary>

Cùng transaction với BR-J23 (và với job tự hết hạn): mọi proposal `SUBMITTED`/`INTERVIEWING` của Job → `EXPIRED` (terminal), không còn accept/reject được nữa, Freelancer nhận thông báo. Trạng thái `EXPIRED` khác `REJECTED` — không phải lỗi của Freelancer. (Job tuyển đủ chỗ thì proposal còn lại → `REJECTED`, xem BR-J17.)

</details>

<details>
<summary><strong>BR-J25: Job CLOSED không nhận Proposal mới</strong></summary>

API gửi proposal yêu cầu `OPEN` → `CLOSED` bị từ chối; Job ẩn khỏi tìm kiếm.

</details>

<details>
<summary><strong>BR-J26: Job CLOSED có thể được mở lại nếu hệ thống hỗ trợ</strong></summary>

`CLOSED → OPEN` chỉ khi: chủ Job chủ động reopen, Job chưa hết `expiryDate` vĩnh viễn, và **không có contract hiệu lực** (BR-J28). Mở lại được ghi nhận bằng `reopenedAt`/audit log.

</details>

<details>
<summary><strong>BR-J27: Mở lại Job không hồi sinh các Proposal đã EXPIRED</strong></summary>

Các proposal chuyển `EXPIRED` ở BR-J24 vẫn giữ nguyên — không quay về `SUBMITTED`. Freelancer muốn tham gia lại phải **nộp proposal mới** (vẫn tôn trọng giới hạn anti-spam).

</details>

## F. Trạng thái dẫn xuất từ Contract (BR-J28 – BR-J32)

<details>
<summary><strong>BR-J28: Job có contract hiệu lực không được đóng — phải kết thúc qua luồng Contract</strong></summary>

`close`/`cancel` Job khi còn contract hiệu lực → từ chối. Chỉ sau khi Contract `COMPLETED` hoặc `CANCELLED` thì Job mới chuyển trạng thái tương ứng (BR-J29/J30).

</details>

<details>
<summary><strong>BR-J29: Job chuyển COMPLETED chỉ sau khi Contract được hoàn thành</strong></summary>

Không có endpoint cho Client đặt Job `COMPLETED` trực tiếp. Trigger duy nhất: contract hoàn thành (đã thanh toán/xác nhận xong) → transaction set `job.status = COMPLETED`. Job `MULTIPLE` có nhiều Contract → chỉ khi **mọi** Contract của Job đã `COMPLETED` thì Job mới `COMPLETED`.

</details>

<details>
<summary><strong>BR-J30: Job chuyển CANCELLED khi contract bị hủy hoặc thỏa điều kiện hủy</strong></summary>

- Contract bị hủy (cả hai bên đồng ý / điều khoản hủy / dispute kết thúc) → Job `CANCELLED`.
- Job chưa có contract → Client hủy trực tiếp được (`OPEN → CANCELLED`), cần lý do.

</details>

<details>
<summary><strong>BR-J31: Job COMPLETED không sửa được và không nhận Proposal</strong></summary>

- Update/publish bị chặn cho `COMPLETED`.
- Gửi proposal bị chặn (chỉ `OPEN` mới nhận — BR-J07).
- Job vẫn hiển thị lịch sử công khai (danh mục "đã hoàn thành") nhưng không tương tác được.

</details>

<details>
<summary><strong>BR-J32: Job CANCELLED không sửa được và không nhận Proposal</strong></summary>

Giống BR-J31: mọi update bị chặn, không nhận proposal, chỉ hiển thị ở lịch sử của Client/Freelancer có liên quan.

</details>

## G. Xóa & Toàn vẹn dữ liệu (BR-J33 – BR-J36)

<details>
<summary><strong>BR-J33: Job đã publish không bị xóa cứng (hard delete)</strong></summary>

Job từng OPEN có thể được tham chiếu bởi Proposal, Contract, Review, notification, lịch sử giao dịch. Nên chỉ **soft delete/archive** (`deletedAt`), giữ nguyên dữ liệu cho tranh chấp/audit. API không có thao tác xóa vật lý cho Job đã publish.

</details>

<details>
<summary><strong>BR-J34: Job DRAFT không có bản ghi phụ thuộc thì được phép xóa</strong></summary>

DRAFT chưa công khai, không có proposal/contract/review gắn liền → có thể xóa (dùng lại quyền soft delete hoặc hard delete tùy policy). Nếu DRAFT đã có dữ liệu phụ thuộc (file, template link...) thì vẫn áp dụng soft delete.

</details>

<details>
<summary><strong>BR-J35: Chuyển trạng thái Job phải validate ở server; client không gán trạng thái tùy ý</strong></summary>

- API nhận "action" (publish/close/reopen/cancel) chứ không nhận `status` thô để ghi thẳng.
- Server kiểm tra whitelist chuyển đổi theo sơ đồ; transition sai → `INVALID_STATUS_TRANSITION`.
- Không tin cậy giá trị status gửi từ client — kể cả khi client gửi, server vẫn đối chiếu với trạng thái hiện tại + điều kiện (ownership, contract...) trước khi ghi.

</details>

<details>
<summary><strong>BR-J36: Các thao tác đổi trạng thái Job + Proposal + Contract phải nguyên tử</strong></summary>

Những tác động liên hoàn phải chạy trong **1 database transaction** (rollback toàn bộ nếu lỗi):
- Accept proposal: proposal `→ HIRED` + `positions_filled += 1` + tạo Contract + notification; `SINGLE` thì auto-reject mọi `SUBMITTED`/`INTERVIEWING` khác ngay, `MULTIPLE` thì giữ nguyên — đến khi tuyển đủ chỗ mới Job `OPEN→IN_PROGRESS` + auto-reject các proposal còn lại (BR-J15 – BR-J17).
- Đóng Job: Job `OPEN→CLOSED` + các proposal `SUBMITTED/INTERVIEWING→EXPIRED` + notification.
- Contract hoàn thành/hủy: Contract terminal + Job `COMPLETED`/`CANCELLED`.

Không được để trạng thái nửa vời (vd: Job đã IN_PROGRESS nhưng Contract chưa tạo).

</details>

<details>
<summary><strong>BR-J37: Các trường tuyển dụng của Job — hiring_type, positions_required, positions_filled (BR-P02, BR-P32, BR-P33)</strong></summary>

- `hiring_type`: `SINGLE` (mặc định) | `MULTIPLE`; `positions_required`: số nguyên ≥ 1, `SINGLE` luôn ép = 1; `positions_filled`: ≥ 0, mặc định 0.
- `positions_filled` **chỉ** tăng trong transaction hire (BR-J16); không có đường ghi trực tiếp từ client.
- Không cho đặt `positions_required < positions_filled` (không "thu hồi" chỗ của người đã tuyển); sửa `positions_required` sau publish phải ≥ `positions_filled`.
- Tuyển đủ chỗ (`positions_filled == positions_required`) → Job `IN_PROGRESS` (BR-J16); chưa đủ → giữ `OPEN`.
- Trường chỉ chỉnh được khi Job còn `DRAFT`/`OPEN` (BR-J03/J10); sau khi có contract thì khóa theo BR-J20/J21.

</details>

---

## H. Toàn vẹn Xóa & Hủy Proposal (BR-J38 – BR-J39)

<details>
<summary><strong>BR-J38: Chặn xóa Job khi đang có hợp đồng hoạt động hoặc đang có tranh chấp</strong></summary>

- Tuyệt đối không cho phép Client xóa (kể cả soft delete) Job đang ở trạng thái `IN_PROGRESS` hoặc có Contract liên kết đang trong các trạng thái hoạt động: `PENDING`, `SIGNED`, `IN_PROGRESS`, hoặc đang có tranh chấp `DISPUTE`.
- Thao tác xóa bị từ chối ở tầng API (`JOB_CANNOT_BE_DELETED_WITH_ACTIVE_CONTRACT`).
- Client chỉ có thể giải quyết dứt điểm hợp đồng (hoàn thành hoặc hủy/giải quyết tranh chấp) trước khi thực hiện lưu trữ/xóa Job.

</details>

<details>
<summary><strong>BR-J39: Tự động hủy và thông báo Proposal khi Job OPEN bị xóa bởi Client</strong></summary>

- Khi Client soft-delete một Job đang `OPEN` mà đã có Freelancer nộp Proposal (ở trạng thái `SUBMITTED` hoặc `INTERVIEWING`):
  - Toàn bộ các Proposal này tự động chuyển sang trạng thái `EXPIRED` hoặc `CANCELLED` trong cùng database transaction xóa Job.
  - Hoàn trả lại lượt ứng tuyển (Connects / Bidding credits) cho các Freelancer liên quan (nếu hệ thống có cơ chế tính phí lượt nộp).
  - Hệ thống tự động gửi thông báo (Notification / Email) tới các ứng viên với lý do: "Công việc đã bị Client gỡ bỏ".

</details>

## I. Vòng đời & Tự động hết hạn (BR-J40)

<details>
<summary><strong>BR-J40: Tự động đóng Job khi hết hạn đăng bài (Job Expiration Window)</strong></summary>

- Một Job `OPEN` có vòng đời hiệu lực tối đa (mặc định 30 ngày kể từ khi publish hoặc không có tương tác tuyển dụng mới).
- Hệ thống chạy cron-job định kỳ:
  - Trước khi hết hạn 3 ngày: gửi thông báo nhắc nhở Client gia hạn hoặc chủ động đóng.
  - Khi chạm mốc hết hạn mà chưa tuyển xong: Job tự động chuyển `OPEN → CLOSED` với lý do `EXPIRED_AUTO`.
  - Toàn bộ Proposal đang ở `SUBMITTED` / `INTERVIEWING` tự động chuyển sang `EXPIRED` theo BR-J24.

</details>

## J. Ngân sách & Định danh SEO (BR-J41 – BR-J42)

<details>
<summary><strong>BR-J41: Ngưỡng ngân sách tối thiểu và tính bất biến của đơn vị tiền tệ</strong></summary>

- **Ngưỡng tối thiểu**: Không cho phép tạo hoặc publish Job có ngân sách bằng 0 hoặc dưới mức sàn quy định (ví dụ tối thiểu $10 đối với Fixed Price hoặc $3/giờ đối với Hourly) nhằm phòng chống spam bài đăng rác.
- **Tính bất biến của tiền tệ**: Đơn vị tiền tệ (Currency: `USD`, `VND`, `ETH`,...) được cố định ngay khi Job chuyển sang `OPEN`. Cấm Client thay đổi đơn vị tiền tệ sau khi đã Publish để đảm bảo tính minh bạch và tránh sai lệch giá trị đối với các Proposal đã nộp.

</details>

<details>
<summary><strong>BR-J42: Tính bất biến của URL Slug sau khi Job đã Publish</strong></summary>

- Ở trạng thái `DRAFT`, việc cập nhật `title` có thể tự động đồng bộ lại `slug`.
- Một khi Job đã chuyển `OPEN` (đã được lập chỉ mục SEO, chia sẻ liên kết công khai hoặc được bookmark bởi Freelancer):
  - Trường `slug` trở thành **bất biến (immutable)**.
  - Client vẫn có thể chỉnh sửa `title` của Job theo BR-J10, nhưng `slug` định danh trên URL không thay đổi để tránh lỗi liên kết 404 và bảo toàn lịch sử truy cập.

</details>

## K. Quy chuẩn Nội dung & Kỹ năng (BR-J43)

<details>
<summary><strong>BR-J43: Giới hạn số lượng kỹ năng và quy chuẩn tệp đính kèm (Attachments)</strong></summary>

- **Kỹ năng (Skills)**: Bắt buộc tối thiểu 1 kỹ năng (BR-J05) và tối đa 10 kỹ năng cho mỗi Job để ngăn chặn việc lạm dụng từ khóa (keyword stuffing) gây nhiễu bộ lọc tìm kiếm.
- **Tệp đính kèm**:
  - Tối đa 5 tệp đính kèm cho mỗi Job posting; mỗi tệp không vượt quá dung lượng tối đa (ví dụ 10MB/file).
  - Chỉ chấp nhận các định dạng tài liệu và hình ảnh an toàn (`.pdf`, `.doc`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.zip`).
  - Hệ thống phải sanitize tên file và quét mã độc trước khi lưu trữ đám mây.

</details>

## L. Ký quỹ, Quản trị rủi ro & Mở lại (BR-J44 – BR-J46)

<details>
<summary><strong>BR-J44: Ràng buộc nạp ký quỹ (Escrow Deposit) trước khi chính thức IN_PROGRESS</strong></summary>

- Đối với các hợp đồng có bảo chứng thanh toán (Escrow / Milestone Web3): Thao tác Client chấp nhận Proposal (Hire) sẽ khởi tạo Contract ở trạng thái chờ ký quỹ (`PENDING_FUNDING`).
- Job chỉ chính thức chuyển sang `IN_PROGRESS` sau khi Client đã thanh toán/ký quỹ thành công cho Milestone đầu tiên (hoặc toàn bộ dự án).
- Nếu trong vòng 24–48 giờ Client không hoàn tất nạp quỹ, đề nghị thuê sẽ hết hạn, chỗ tuyển không bị trừ và Job vẫn giữ trạng thái `OPEN` để tiếp tục nhận ứng viên khác.

</details>

<details>
<summary><strong>BR-J45: Tác động khi tài khoản Client bị khóa hoặc vi phạm (Account Suspension Impact)</strong></summary>

- Khi tài khoản Client bị Admin đình chỉ (`isBanned = true` hoặc bị hạn chế hoạt động):
  - Toàn bộ các Job đang `OPEN` và `DRAFT` của Client đó lập tức bị ẩn khỏi kết quả tìm kiếm công khai và chuyển sang trạng thái tạm dừng/hủy (`CANCELLED` hoặc `SUSPENDED`).
  - Các Proposal đang chờ duyệt trên các Job này tự động bị hủy và hoàn trả lượt nộp cho Freelancer.
  - Các Job đang `IN_PROGRESS` sẽ bị đóng băng (Freeze) để quản trị viên kiểm tra quyền lợi hợp đồng và tiền ký quỹ cho Freelancer đang thực hiện.

</details>

<details>
<summary><strong>BR-J46: Thời hạn tối đa cho phép mở lại (Reopen) Job đã đóng</strong></summary>

- Thao tác Reopen (`CLOSED → OPEN` theo BR-J26) chỉ có hiệu lực đối với các Job đã đóng trong vòng tối đa **60 ngày**.
- Sau thời hạn 60 ngày, Job được hệ thống chuyển sang lưu trữ vĩnh viễn (Archived). Client không thể Reopen lại mà bắt buộc phải sử dụng tính năng "Tạo bản sao" (Clone / Duplicate Job) để tạo một bản thảo `DRAFT` mới hoàn toàn.
- Job đã từng bị `CANCELLED` hoặc `COMPLETED` không bao giờ được phép Reopen.

</details>

---

## Phân quyền tóm tắt

| Actor | Quyền |
|---|---|
| Guest | Xem Job `OPEN` công khai, tìm kiếm. |
| Freelancer | + xem chi tiết, ứng tuyển/rút proposal, bookmark. |
| Client | + tạo/sửa/publish/đóng/hủy/xóa Job **của mình**, quyết định proposal. |
| Admin | Moderation Job + audit log. |

## Chống lạm dụng (tham chiếu vận hành)

- Giới hạn số Job đăng/ngày; Job trùng nội dung bị chặn.
- Job viết chứa thông tin liên hệ trực tiếp (email/điện thoại/link ngoài) → chặn hoặc duyệt thủ công.
- Job có contract hiệu lực không được hạ ngân sách dưới `totalAmount` của contract (bảo đảm nhất quán với BR-J20/J21).
