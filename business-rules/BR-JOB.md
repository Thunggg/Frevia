# Business Rule - Job (BR-J01 – BR-J54)

Business rule quản lý Job theo **thực tế thông dụng của các nền tảng freelance** (Upwork, Freelancer.com, Fiverr, Toptal). Mỗi rule giữ nguyên ID BR-Jxx để đối chiếu.

> [!TIP]
> **Xem nhanh**: Bảng đối chiếu Use Case (Trần Phát Tài - `Frevia_BACKLOG.xlsx`) sang các Business Rules tương ứng đã được tổng hợp riêng tại file [UC-JOB-BR.md](./UC-JOB-BR.md) hoặc xem ở cuối tài liệu này tại [Mục S: Ánh xạ Use Case & Business Rules](#s-ánh-xạ-use-case-trần-phát-tài--business-rules).

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
- title (10–100 ký tự, không spam/URL), description đủ dài, đúng 1 category (Job chỉ thuộc duy nhất 1 danh mục, BR-J53), ≥1 skill
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
   - Client được tự do sửa đổi các thông tin nội dung: `title` (nhưng `slug` giữ nguyên theo BR-J42), `description`, `skills` (1–10 skills theo BR-J43), `categoryId` (chỉ chọn duy nhất 1 danh mục theo BR-J53), `budgetMin`, `budgetMax` (≥ $10 theo BR-J41), `deadline`, `expiryDate` (> now), và `hiringType` (`SINGLE` ↔ `MULTIPLE`).
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
| `categoryId` / `jobCategory` | Có | Phải thuộc danh mục đang hoạt động (`ACTIVE`) (BR-J53). Mỗi Job chỉ thuộc **duy nhất 1 danh mục**, cấm chọn nhiều. |
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

Điều kiện `close`: chủ Job, Job `OPEN`, **chưa** có proposal `HIRED` và chưa có contract hiệu lực. Nếu đã có → phải đi qua luồng Contract (BR-J28). *(Ngoại lệ: Đối với Job `MULTIPLE` đã tuyển được một phần và Client muốn dừng tuyển các vị trí còn lại, áp dụng cơ chế chốt tuyển sớm theo BR-J47)*.

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

Không có endpoint cho Client đặt Job `COMPLETED` trực tiếp. Trigger duy nhất: contract hoàn thành (đã thanh toán/xác nhận xong) → transaction set `job.status = COMPLETED`. Job `MULTIPLE` có nhiều Contract → chỉ khi **mọi** Contract của Job đã `COMPLETED` thì Job mới `COMPLETED`. *(Trường hợp kết quả hỗn hợp có cả hợp đồng hoàn tất và hợp đồng hủy, xem BR-J48)*.

</details>

<details>
<summary><strong>BR-J30: Job chuyển CANCELLED khi contract bị hủy hoặc thỏa điều kiện hủy</strong></summary>

- Contract bị hủy (cả hai bên đồng ý / điều khoản hủy / dispute kết thúc) → Job `CANCELLED`. *(Đối với Job `MULTIPLE`, hủy 1 contract riêng lẻ không tự động hủy toàn bộ Job: xem BR-J48)*.
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

## M. Tuyển nhiều vị trí & Xử lý Hợp đồng phức tạp (BR-J47 – BR-J48)

<details>
<summary><strong>BR-J47: Đóng tuyển sớm khi mới tuyển một phần cho Job tuyển nhiều vị trí (Stop Accepting Proposals / Partial Hire Close)</strong></summary>

- **Bối cảnh**: Đối với Job `hiring_type = MULTIPLE` có `positions_required > 1`, Client đã tuyển được một phần (`0 < positions_filled < positions_required`) và không có nhu cầu tuyển thêm số vị trí còn lại.
- **Cơ chế xử lý**: Hệ thống cho phép Client thực hiện thao tác **"Chốt tuyển dụng / Ngừng nhận đề xuất"** (`stop_recruitment` hoặc giảm `positions_required` về bằng `positions_filled`).
- **Tác động trong cùng Database Transaction**:
  - Cập nhật `positions_required = positions_filled`.
  - Chuyển trạng thái Job: `OPEN → IN_PROGRESS` (vì số chỗ cần tuyển nay đã bằng số chỗ đã tuyển).
  - Tự động chuyển toàn bộ Proposal còn lại đang ở trạng thái `SUBMITTED` hoặc `INTERVIEWING` sang `REJECTED` (với lý do: "Khách hàng đã chốt đủ số lượng cần tuyển").
  - Gửi thông báo đến các Freelancer có đề xuất bị từ chối.
  - Các hợp đồng đang có hiệu lực (`ACTIVE`, `PENDING_SIGN`) tiếp tục diễn ra bình thường, không bị xáo trộn.

</details>

<details>
<summary><strong>BR-J48: Xử lý hủy hợp đồng riêng lẻ và kết thúc hỗn hợp trong Job MULTIPLE</strong></summary>

- **Hủy hợp đồng riêng lẻ (Partial Contract Cancellation)**:
  - Trong Job `MULTIPLE`, mỗi Freelancer ký một Contract độc lập. Việc một Contract bị hủy (`CANCELLED` do hai bên đồng ý, do hết hạn ký quỹ BR-J44, hoặc do phán quyết tranh chấp) **tuyệt đối không làm hủy toàn bộ Job và không ảnh hưởng đến các Contract khác đang hoạt động**.
  - **Tùy chọn cho Client khi một hợp đồng bị hủy**:
    1. *Tuyển bù (Reopen position)*: Giảm `positions_filled -= 1`. Nếu Job đang `IN_PROGRESS`, Job tự động chuyển ngược lại `OPEN` để tiếp tục nhận Proposal tuyển ứng viên thay thế.
    2. *Không tuyển bù*: Giảm đồng thời cả `positions_required -= 1` và `positions_filled -= 1`. Job giữ nguyên trạng thái `IN_PROGRESS` (nếu vẫn còn $\ge 1$ hợp đồng hoạt động).
- **Trường hợp hủy toàn bộ (All Contracts Cancelled)**: Job chỉ chuyển sang trạng thái `CANCELLED` khi **toàn bộ** các Contract của Job đều bị hủy và Client không có nhu cầu tuyển tiếp (`positions_filled == 0` và không còn hợp đồng nào hiệu lực).
- **Kết thúc hỗn hợp (Mixed Final Status)**: Khi tất cả các Contract liên quan đến Job đã kết thúc (không còn Contract nào ở `ACTIVE`/`DISPUTED`):
  - Nếu có **ít nhất 1 Contract** đạt `COMPLETED` thành công: Job được chuyển sang trạng thái `COMPLETED` (ghi nhận hoàn tất dự án/hoàn tất một phần).
  - Chỉ khi **100% Contract** bị `CANCELLED`: Job mới chuyển sang `CANCELLED`.

</details>

## N. Tin nổi bật & Quản trị hiển thị ưu tiên (BR-J49)

<details>
<summary><strong>BR-J49: Quy chuẩn Tin nổi bật (Featured Job) và bảo toàn hiển thị ưu tiên</strong></summary>

- **Cấp phát cờ `featured`**: Trường `featured` (`true`/`false`) không thể được Client gán tự do qua API cập nhật thông thường (`updateJob`). Cờ này chỉ được hệ thống bật (`featured = true`) khi Client hoàn tất thanh toán gói nâng cấp tin nổi bật hoặc do Admin phê duyệt.
- **Phạm vi hiệu lực**:
  - Nhãn `featured` chỉ phát huy tác dụng hiển thị (ưu tiên lên đầu trang kết quả tìm kiếm, gắn huy hiệu nổi bật, ưu tiên trong Job Alert) khi Job ở trạng thái `OPEN`.
  - Khi Job chuyển sang các trạng thái kết thúc hoặc ngừng nhận đơn (`CLOSED`, `IN_PROGRESS`, `CANCELLED`, `COMPLETED`), nhãn nổi bật tự động mất hiệu lực ưu tiên trên các giao diện tìm việc làm công khai.
- **Bản nháp (DRAFT)**: Job `DRAFT` có thể lưu trạng thái đã mua quyền featured trước, nhưng thời hạn kích hoạt nổi bật chỉ bắt đầu tính từ thời điểm Job được chuyển sang `OPEN`.

</details>

## O. Thời hạn & Ràng buộc tiến độ (BR-J50)

<details>
<summary><strong>BR-J50: Phân định thời hạn nhận hồ sơ (expiryDate) và thời hạn bàn giao dự án (deadline)</strong></summary>

- **Ngữ nghĩa tách biệt**:
  - `expiryDate` (Hạn đăng bài tuyển dụng): Thời điểm cuối cùng Job mở nhận Proposal. Sau thời điểm này, Job tự động đóng sang `CLOSED` (theo BR-J40) và ngưng nhận đề xuất mới.
  - `deadline` (Hạn bàn giao dự án): Thời hạn mong muốn hoàn thành toàn bộ khối lượng công việc của dự án/hợp đồng.
- **Ràng buộc logic thời gian**:
  - Tại thời điểm Publish hoặc Update Job, nếu Client cung cấp cả hai trường thì bắt buộc: `now() < expiryDate <= deadline`. Thời hạn kết thúc tuyển dụng không được xảy ra sau ngày dự án phải hoàn thành bàn giao.
  - Khi ký hợp đồng (Contract): `deadline` của Job đóng vai trò làm mốc tham chiếu trần cho các mốc giao việc (Milestones) hoặc thời gian cam kết giao hàng (`deliveryDays`) của Proposal.

</details>

## P. Kiểm duyệt độc lập & An toàn nội dung (BR-J51)

<details>
<summary><strong>BR-J51: Kiểm duyệt độc lập bài đăng Job và chế tài chống lộ thông tin liên lạc ngoài (Job Moderation & Anti-disintermediation)</strong></summary>

- **Kiểm duyệt độc lập (Job-level Moderation)**:
  - Khi một bài đăng Job bị người dùng báo cáo (Report qua UC-34) hoặc bị hệ thống quét thấy dấu hiệu gian lận, Admin có quyền xử lý độc lập đối với chính Job đó (Takedown / Suspend) mà không nhất thiết phải khóa toàn bộ tài khoản Client:
    - Nếu Job đang `OPEN`: Tức thì ẩn khỏi kết quả tìm kiếm công khai, đóng băng không cho nhận thêm Proposal và tạm dừng quyền chấp nhận/thuê của Client.
    - Nếu Job đang `IN_PROGRESS`: Kích hoạt cơ chế kiểm tra an toàn ký quỹ (Escrow freeze) để bảo vệ quyền lợi thù lao của Freelancer trước khi Admin đưa ra kết luận xử lý.
- **Chống giao dịch chui ngoài sàn (Anti-disintermediation Scanning)**:
  - Hệ thống kiểm tra tự động nội dung `title` và `description` của Job:
    - Nếu phát hiện số điện thoại, chuỗi định dạng email cá nhân, đường dẫn mạng xã hội ngoài sàn (Zalo, Telegram, WhatsApp, Facebook...), hệ thống sẽ từ chối Publish/Update và yêu cầu Client gỡ bỏ thông tin liên hệ trực tiếp.
    - Mọi trao đổi và thỏa thuận trước hợp đồng bắt buộc phải thực hiện thông qua hệ thống tin nhắn nội bộ của Frevia.

</details>

## Q. Thông báo & Tính toàn vẹn Danh mục (BR-J52 – BR-J53)

<details>
<summary><strong>BR-J52: Chống spam Job Alert khi cập nhật tin và quy tắc gợi ý việc làm (Job Alert & Recommendation Rules)</strong></summary>

- **Tần suất phát Job Alert (UC-23)**:
  - Sự kiện phát thông báo việc làm phù hợp (Job Alert Notification / Email) **chỉ được kích hoạt một lần duy nhất** khi Job chuyển trạng thái `DRAFT → OPEN` (lần đầu Publish hoặc sau khi Reopen).
  - Thao tác chỉnh sửa nội dung Job (`updateJob`) **tuyệt đối không được kích hoạt lại Job Alert** nhằm ngăn chặn hành vi Client liên tục chỉnh sửa để spam thông báo vào hòm thư Freelancer.
- **Điều kiện gợi ý việc làm (Recommendation Engine - UC-42)**:
  - Hệ thống gợi ý chỉ đề xuất các Job thỏa mãn: trạng thái `OPEN`, chưa hết hạn, còn chỗ trống tuyển (`positions_filled < positions_required`), Client có độ tin cậy tốt (`client.isBanned === false`).
  - Tự động loại trừ không gợi ý Job cho những Freelancer đã nộp đề xuất hoặc đã từng bị Client từ chối (`REJECTED`) ở chính Job đó.

</details>

<details>
<summary><strong>BR-J53: Mỗi Job thuộc duy nhất 1 Danh mục & Tính toàn vẹn của Danh mục việc làm (Single Job Category & Category Usability - UC-46)</strong></summary>

- **Quy tắc danh mục duy nhất (Single Category Rule)**:
  - Mỗi Job **chỉ thuộc duy nhất 1 Job Category** (`categoryId`). Hệ thống **tuyệt đối không cho phép** chọn nhiều danh mục cho cùng một bài đăng việc làm.
  - Dữ liệu đầu vào khi tạo (`createJob`) hoặc cập nhật (`updateJob`) chỉ nhận một mã định danh danh mục đơn lẻ (`categoryId: number`).
- **Ràng buộc trạng thái hoạt động (Active Status Constraint)**:
  - Khi thực hiện tạo mới (`createJob`), chỉnh sửa (`updateJob`) hoặc công khai (`publishJob`), danh mục được gán vào Job bắt buộc phải tồn tại và đang ở trạng thái hoạt động (`status = ACTIVE`, `deletedAt === null`).
- **Ứng xử khi danh mục bị vô hiệu hóa hoặc xóa mềm**:
  - Nếu danh mục của Job bị Admin chuyển sang `INACTIVE` hoặc xóa mềm:
    - Các Job đã ở trạng thái `OPEN` trước đó vẫn hiển thị bình thường để không làm gián đoạn tiến trình tuyển dụng hiện tại.
    - Khi Client sửa Job (`updateJob`), hệ thống sẽ từ chối lưu nếu danh mục của Job không còn hoạt động; Client buộc phải chọn 1 danh mục `ACTIVE` hợp lệ khác để thay thế.
    - Đối với Job `DRAFT`: Không thể Publish cho đến khi Job được gán đúng 1 danh mục đang `ACTIVE` (bảo toàn BR-J05).

</details>

## R. Tương tác cá nhân & Theo dõi (BR-J54)

<details>
<summary><strong>BR-J54: Quy tắc Đánh dấu tin (Bookmark) và Toàn vẹn Lịch sử xem (View Counter Integrity)</strong></summary>

- **Quy tắc Bookmark Job (UC-12)**:
  - Chỉ người dùng có vai trò `FREELANCER` mới được quyền Bookmark Job (Client không Bookmark Job, kể cả của mình).
  - Bookmark là liên kết theo dõi cá nhân: Khi Job chuyển sang trạng thái `CLOSED`, `CANCELLED` hoặc `COMPLETED`, Job đó vẫn được giữ trong danh sách Bookmark của Freelancer nhưng giao diện phải hiển thị huy hiệu trạng thái tương ứng để Freelancer nhận biết tin đã ngừng tuyển.
  - Khi Job bị xóa mềm (`deletedAt !== null`) hoặc tài khoản Client bị cấm (`isBanned === true`), Job sẽ tự động ẩn khỏi danh sách Bookmark hiển thị của Freelancer.
- **Toàn vẹn số liệu xem (View Analytics & Recently Viewed)**:
  - Thao tác truy cập xem chi tiết Job chỉ được ghi nhận vào lịch sử xem (`RecentlyViewedJob`) và tăng lượt xem thống kê khi người xem khác với chủ sở hữu bài đăng (`viewerId !== clientId`).
  - Lượt xem từ Client chủ bài đăng hoặc lượt xem khi Job còn ở trạng thái `DRAFT` không được tính vào số liệu thống kê mức độ quan tâm của Job.

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

---

## S. Ánh xạ Use Case (Trần Phát Tài) & Business Rules

Bảng đối chiếu toàn bộ các Use Case liên quan đến phần Job do **Trần Phát Tài** phụ trách (theo dữ liệu từ `Frevia_BACKLOG.xlsx`) với các Business Rules tương ứng trong hệ thống:

### 1. Ma trận tổng hợp (Use Case ↔ Business Rules)

| Use Case ID | Screen / Function | Module | Actor | Business Rules áp dụng |
|---|---|---|---|---|
| **UC-10.01** | View Job List | Job Browsing | Guest, Client, Freelancer | BR-J04, BR-J25, BR-J31, BR-J32, BR-J33, BR-J45, BR-J49, BR-J51 |
| **UC-10.02** | View Job Detail | Job Browsing | Guest, Client, Freelancer | BR-J04, BR-J07, BR-J19, BR-J25, BR-J31, BR-J32, BR-J37, BR-J42, BR-J43, BR-J50, BR-J54 |
| **UC-11.01** | View My Jobs | Job Management | Client | BR-J01, BR-J14, BR-J33 |
| **UC-11.02** | Create Job | Job Management | Client | BR-J01, BR-J02, BR-J37, BR-J41, BR-J42, BR-J43, BR-J50, BR-J51, BR-J53 |
| **UC-11.03** | Publish Job | Job Management | Client | BR-J05, BR-J06, BR-J14, BR-J35, BR-J41, BR-J42, BR-J50, BR-J52, BR-J53 |
| **UC-11.04** | Update Job | Job Management | Client | BR-J03, BR-J10, BR-J11, BR-J12, BR-J13, BR-J14, BR-J20, BR-J21, BR-J31, BR-J32, BR-J37, BR-J41, BR-J42, BR-J49, BR-J52, BR-J53 |
| **UC-11.05** | Delete Job | Job Management | Client | BR-J14, BR-J33, BR-J34, BR-J38, BR-J39 |
| **UC-11.06** | Close Job | Job Management | Client | BR-J14, BR-J22, BR-J23, BR-J24, BR-J25, BR-J28, BR-J36, BR-J47 |
| **UC-11.07** | Reopen Job | Job Management | Client | BR-J14, BR-J26, BR-J27, BR-J46, BR-J52 |
| **UC-12.01** | View Bookmarked Job List | Bookmarked Jobs Management | Freelancer | BR-J54 |
| **UC-12.02** | Bookmark Job | Bookmarked Jobs Management | Freelancer | BR-J54 |
| **UC-12.03** | Remove Bookmark | Bookmarked Jobs Management | Freelancer | BR-J54 |
| **UC-22.01 – 22.05** | Saved Search Management | Saved Search Management | Freelancer | BR-J04, BR-J25, BR-J33, BR-J41, BR-J43, BR-J53 |
| **UC-23.01 – 23.05** | Job Alert Management | Job Alert Management | Freelancer | BR-J37, BR-J52 |
| **UC-46.06 – 46.07** | Job Category Browsing | Job Category | Freelancer | BR-J04, BR-J25, BR-J33, BR-J53 |
| **UC-42.01** | Recommend Jobs / Freelancers | Job Recommendation | AI / System | BR-J37, BR-J52 |

---

### 2. Chi tiết ràng buộc nghiệp vụ cho từng Use Case

#### Nhóm UC-10: Job Browsing (Duyệt tin việc làm)
- **UC-10.01: View Job List**
  - `BR-J04`: Không bao giờ hiển thị Job có trạng thái `DRAFT` trên kết quả tìm kiếm/lọc công khai.
  - `BR-J25`: Job `CLOSED` tự động ẩn khỏi danh sách tìm việc làm đang mở.
  - `BR-J31`, `BR-J32`: Job `COMPLETED` và `CANCELLED` không hiển thị ở danh sách việc làm thông thường (chỉ xem ở lịch sử giao dịch).
  - `BR-J33`: Loại trừ toàn bộ các Job đã bị xóa mềm (`deletedAt !== null`).
  - `BR-J45`: Toàn bộ Job của Client bị khóa tài khoản (`client.isBanned = true`) lập tức bị ẩn.
  - `BR-J49`: Tin nổi bật (`featured = true`) được ưu tiên đưa lên đầu kết quả khi còn `OPEN`.
  - `BR-J51`: Job bị Admin kiểm duyệt gỡ bỏ (`SUSPENDED`/`FLAGGED`) bị ẩn khỏi kết quả tìm kiếm.

- **UC-10.02: View Job Detail**
  - `BR-J04`: Chi tiết Job `DRAFT` chỉ duy nhất chủ sở hữu bài đăng (hoặc Admin kiểm duyệt) mới xem được; các user khác bị từ chối 403/404.
  - `BR-J07`, `BR-J19`, `BR-J25`, `BR-J31`: Nút ứng tuyển ("Submit Proposal") chỉ kích hoạt khi Job `OPEN` và còn chỗ trống; các trạng thái `IN_PROGRESS`, `CLOSED`, `COMPLETED`, `CANCELLED` tự động vô hiệu hóa nút ứng tuyển.
  - `BR-J37`: Hiển thị minh bạch hình thức tuyển (`hiringType`: `SINGLE`/`MULTIPLE`), số chỗ cần tuyển (`positionsRequired`) và số chỗ đã tuyển (`positionsFilled`).
  - `BR-J42`: Truy cập chi tiết định danh qua đường dẫn `slug` bất biến.
  - `BR-J43`: Hiển thị kỹ năng (1–10 skills) và danh sách tệp đính kèm an toàn hợp lệ (tối đa 5 tệp, $\le 10$MB/file).
  - `BR-J50`: Hiển thị phân biệt rõ thời hạn kết thúc nhận hồ sơ (`expiryDate`) và thời hạn bàn giao dự án (`deadline`).
  - `BR-J54`: Lịch sử xem (`RecentlyViewedJob`) và lượt xem thống kê chỉ ghi nhận khi người xem khác với chủ Job (`userId !== clientId`); không ghi nhận view khi Job là `DRAFT`.

---

#### Nhóm UC-11: Job Management (Quản lý việc làm - Phía Client)
- **UC-11.01: View My Jobs**
  - `BR-J01`: Chỉ tài khoản mang vai trò `CLIENT` mới có quyền truy cập.
  - `BR-J14`: Server-side check `job.clientId === currentUserId`, chỉ hiển thị các Job do chính mình tạo ra (chống IDOR).
  - Hiển thị đầy đủ mọi trạng thái Job của Client (`DRAFT`, `OPEN`, `IN_PROGRESS`, `CLOSED`, `COMPLETED`, `CANCELLED`); tự động loại trừ Job đã bị xóa mềm (`deletedAt !== null`).

- **UC-11.02: Create Job**
  - `BR-J01`: Chỉ tài khoản vai trò `CLIENT` mới được phép tạo Job.
  - `BR-J02`: Job mới tạo luôn luôn khởi tạo với trạng thái `status = DRAFT`; không cho phép gán thẳng ra `OPEN`.
  - `BR-J37`: Khởi tạo tuyển dụng: `hiring_type` (`SINGLE` mặc định hoặc `MULTIPLE`), `positions_required` ($\ge 1$, SINGLE luôn = 1), `positions_filled = 0`.
  - `BR-J41`: Ràng buộc ngân sách hợp lệ: `budgetMin >= 0`, `budgetMin <= budgetMax`, đạt mức sàn tối thiểu ($10 Fixed Price); loại ngân sách mặc định `FIXED_PRICE`.
  - `BR-J42`: Tự động khởi tạo `slug` định danh duy nhất từ `title`.
  - `BR-J43`: Bắt buộc từ 1 đến 10 kỹ năng; tệp đính kèm tối đa 5 file, dung lượng $\le 10$MB/file, đúng định dạng cho phép.
  - `BR-J50`: Ràng buộc thời gian: nếu có nhập `expiryDate` và `deadline` thì bắt buộc `now() < expiryDate <= deadline`.
  - `BR-J51`: Tự động quét và chặn thông tin liên hệ ngoài sàn (SĐT, Email, Telegram, Zalo) trong tiêu đề và mô tả.
  - `BR-J53`: Mỗi Job chỉ được chọn **duy nhất 1 danh mục** (`categoryId`), không cho phép chọn nhiều danh mục. Danh mục được chọn bắt buộc phải đang ở trạng thái `ACTIVE` và chưa bị xóa.

- **UC-11.03: Publish Job**
  - `BR-J05`: Kiểm tra hợp lệ toàn bộ trường bắt buộc: `title` (10–100 ký tự), `description` đủ dài, đúng 1 category `ACTIVE` (BR-J53), $\ge 1$ skill, ngân sách hợp lệ, Client đã xác thực email/không bị phạt.
  - `BR-J06`: Chuyển trạng thái `DRAFT → OPEN`, thiết lập mốc `publishedAt`, đưa Job vào chỉ mục tìm kiếm. Chỉ cho phép publish Job đang là `DRAFT`.
  - `BR-J14`: Kiểm tra server-side quyền sở hữu của Client (`job.clientId === currentUserId`).
  - `BR-J35`: Chuyển đổi trạng thái phải được whitelist và validate tại server.
  - `BR-J41`: Đơn vị tiền tệ và loại ngân sách trở thành bất biến sau khi Publish.
  - `BR-J42`: `slug` URL bị đóng băng cố định, không thể thay đổi sau khi đã Publish.
  - `BR-J50`: Hạn đăng bài `expiryDate` phải lớn hơn thời điểm hiện tại và $\le deadline$.
  - `BR-J52`: Kích hoạt sự kiện phát Job Alert (UC-23) một lần duy nhất.

- **UC-11.04: Update Job**
  - `BR-J03`: Khi Job còn là `DRAFT`, được tự do sửa đổi mọi trường dữ liệu không hạn chế.
  - `BR-J10`: Khi Job ở trạng thái `OPEN`, áp dụng phân loại:
    - *Chưa có Proposal:* Client tự do sửa đổi nội dung, kỹ năng, ngân sách.
    - *Đã có Proposal:* Cho phép sửa nội dung, nhưng **tuyệt đối không làm đổi giá trị `bidAmount` và `deliveryDays`** của Proposal cũ (BR-J11, BR-J12).
    - **Các trường bị khóa:** `slug` (BR-J42), `budgetType`/`currency` (BR-J41), `positionsFilled`, `status`, `clientId`.
  - `BR-J13`: Thay đổi trọng yếu của Job không tự sửa Proposal hiện có; Freelancer tự rút và nộp lại nếu muốn.
  - `BR-J14`: Chỉ chủ Job (`clientId`) mới có quyền thực hiện.
  - `BR-J20`, `BR-J21`: Job `IN_PROGRESS` bị khóa các điều khoản cốt lõi, thay đổi phải qua quy trình Amendment/Change Request riêng.
  - `BR-J31`, `BR-J32`: Job `COMPLETED` và `CANCELLED` bị cấm chỉnh sửa hoàn toàn.
  - `BR-J37`: Không được giảm `positionsRequired` xuống thấp hơn `positionsFilled`.
  - `BR-J49`: Cấm sửa đổi cờ `featured` qua form update thông thường.
  - `BR-J52`: Thao tác cập nhật Job **tuyệt đối không** kích hoạt lại Job Alert.
  - `BR-J53`: Cập nhật danh mục duy nhất của Job (`categoryId`), bắt buộc phải đang ở trạng thái `ACTIVE`. Không cho phép chọn nhiều danh mục.

- **UC-11.05: Delete Job**
  - `BR-J14`: Kiểm tra nghiêm ngặt quyền sở hữu `job.clientId === currentUserId`.
  - `BR-J33`: Job đã từng `OPEN` chỉ được xóa mềm (`deletedAt = now()`), không xóa cứng để bảo vệ toàn vẹn dữ liệu phụ thuộc.
  - `BR-J34`: Job `DRAFT` chưa có bản ghi phụ thuộc được phép xóa.
  - `BR-J38`: **Chặn xóa Job** nếu Job đang ở `IN_PROGRESS` hoặc có hợp đồng (`Contract`) đang hoạt động (`PENDING_SIGN`, `ACTIVE`, `DISPUTED`).
  - `BR-J39`: Khi xóa Job đang `OPEN` mà đã có Proposal: trong cùng 1 transaction, tự động hủy toàn bộ Proposal sang `EXPIRED`, hoàn lại connects/lượt nộp cho Freelancer và gửi thông báo.

- **UC-11.06: Close Job**
  - `BR-J14`: Kiểm tra quyền sở hữu bài đăng (`job.clientId === currentUserId`).
  - `BR-J22`, `BR-J28`: Chỉ đóng được Job đang `OPEN` và **chưa có hợp đồng hiệu lực**. Nếu đã có Contract thì phải kết thúc qua luồng Contract.
  - `BR-J23`: Chuyển trạng thái `OPEN → CLOSED`, ghi nhận thời gian `closedAt` và lý do đóng.
  - `BR-J24`: Trong cùng transaction: toàn bộ Proposal đang `SUBMITTED`/`INTERVIEWING` của Job tự động chuyển sang `EXPIRED` (terminal) và thông báo cho Freelancer.
  - `BR-J25`: Job `CLOSED` lập tức bị ẩn khỏi tìm kiếm và không nhận thêm Proposal mới.
  - `BR-J36`: Đóng Job và hết hạn Proposal phải thực thi nguyên tử trong 1 Database Transaction.
  - `BR-J47`: Đối với Job tuyển nhiều vị trí (`MULTIPLE`) đã tuyển được 1 phần, Client áp dụng thao tác chốt tuyển sớm để đóng các vị trí còn lại (Job chuyển `IN_PROGRESS`, auto-reject các proposal còn lại).

- **UC-11.07: Reopen Job**
  - `BR-J14`: Kiểm tra quyền sở hữu của Client.
  - `BR-J26`: Chuyển trạng thái `CLOSED → OPEN` khi chưa có hợp đồng hiệu lực; ghi nhận audit log `reopenedAt`.
  - `BR-J27`: Mở lại Job **tuyệt đối không hồi sinh** các Proposal đã `EXPIRED`; Freelancer phải nộp proposal mới nếu muốn ứng tuyển lại.
  - `BR-J46`: Thời hạn tối đa cho phép Reopen là **60 ngày** kể từ khi đóng. Quá 60 ngày Job chuyển sang lưu trữ (Archived) và Client buộc phải clone ra bản thảo `DRAFT` mới. Job `CANCELLED` hoặc `COMPLETED` không bao giờ được phép Reopen.
  - `BR-J52`: Khi Reopen, hệ thống có thể phát thông báo Job Alert lại 1 lần nếu Job vẫn còn hạn.

---

#### Nhóm UC-12: Bookmarked Jobs Management (Quản lý việc làm đã lưu)
- **UC-12.01: View Bookmarked Job List**
  - `BR-J54`: Chỉ trả về danh sách bookmark thuộc sở hữu của chính Freelancer đăng nhập (`userId`).
  - `BR-J54`: Tự động loại trừ các Job đã bị xóa mềm (`deletedAt !== null`) hoặc thuộc Client bị cấm (`client.isBanned = true`).
  - `BR-J54`: Các Job đã chuyển sang `CLOSED`, `IN_PROGRESS`, `COMPLETED` vẫn hiển thị trong Bookmark kèm nhãn trạng thái để Freelancer theo dõi tiến độ.

- **UC-12.02: Bookmark Job**
  - `BR-J54`: Chỉ tài khoản `FREELANCER` mới được phép bookmark. Client không được bookmark Job (đặc biệt cấm bookmark job của chính mình).
  - `BR-J54`: Job phải tồn tại, chưa bị xóa và Client không bị cấm.
  - Ràng buộc duy nhất (Unique Constraint): Mỗi Freelancer chỉ bookmark 1 Job tối đa 1 lần `(userId, jobId)`.

- **UC-12.03: Remove Bookmark**
  - `BR-J54`: Chỉ xóa bookmark của chính mình. Xóa cứng (hard delete) bản ghi `JobBookmark`.
  - Trả ngoại lệ nếu bản ghi bookmark không tồn tại (`BookmarkNotFoundException`).

---

#### Nhóm UC-22: Saved Search Management (Bộ lọc tìm kiếm đã lưu)
*(Bao gồm UC-22.01 đến UC-22.05: Xem danh sách, Chi tiết, Tạo, Cập nhật, Xóa bộ lọc)*
- `BR-J41`: Tiêu chí lọc ngân sách `budgetMin`, `budgetMax` phải hợp lệ.
- `BR-J43`: Bộ lọc kỹ năng (`skills`) phải khớp với các kỹ năng hợp lệ trong hệ thống.
- `BR-J53`: Danh mục lưu trong bộ lọc (`categoryId`) phải thuộc danh mục đang hoạt động (`ACTIVE`).
- Khi áp dụng tìm kiếm từ bộ lọc đã lưu: Áp dụng đầy đủ quy tắc ẩn Job DRAFT (BR-J04), ẩn Job đã đóng (BR-J25) và ẩn Job bị xóa/banned (BR-J33, BR-J45).

---

#### Nhóm UC-23: Job Alert Management (Quản lý thông báo việc làm)
*(Bao gồm UC-23.01 đến UC-23.05: Xem danh sách, Chi tiết, Tạo, Cập nhật, Xóa cảnh báo việc làm)*
- `BR-J37`: Chỉ quét và gửi thông báo cho các Job còn chỗ tuyển (`positions_filled < positions_required`).
- `BR-J52`: **Chống spam Job Alert**: Hệ thống chỉ kích hoạt gửi thông báo Job Alert **đúng một lần duy nhất** khi Job chuyển từ `DRAFT → OPEN` (lúc Publish hoặc Reopen). Khi Client chỉnh sửa bài (`UC-11.04`), tuyệt đối không kích hoạt lại Job Alert.
- `BR-J52`: Chỉ gửi alert cho các Job đang `OPEN`, chưa hết hạn, và Client không bị phạt (`client.isBanned = false`).

---

#### Nhóm UC-46: Job Category Browsing (Phía Freelancer)
*(UC-46.06: View Job Category List & UC-46.07: View Job Category Detail)*
- `BR-J53`: Phía người dùng chỉ xem được các danh mục công việc đang ở trạng thái `ACTIVE` và chưa bị xóa mềm (`deletedAt === null`).
- Khi xem danh sách công việc thuộc một danh mục: Chỉ hiển thị các Job có trạng thái `OPEN`, chưa hết hạn và chưa bị xóa mềm (BR-J04, BR-J25, BR-J33).

---

#### Nhóm UC-42: Job / Freelancer Recommendation (AI)
*(UC-42.01: Gợi ý việc làm phù hợp với Freelancer)*
- `BR-J37`: Chỉ gợi ý các Job còn vị trí tuyển dụng trống (`positions_filled < positions_required`).
- `BR-J52`: Thuật toán gợi ý chỉ lấy các Job có trạng thái `OPEN`, chưa hết hạn, Client không bị khóa tài khoản; tự động loại trừ không đề xuất những Job mà Freelancer đó đã nộp Proposal hoặc đã từng bị Client từ chối (`REJECTED`).
