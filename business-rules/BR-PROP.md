# Business Rule - Proposal (BR-PROP)

Business rule cho quy trình ứng tuyển/thuê theo **thực tế thông dụng của các nền tảng freelance** (Upwork, Freelancer.com, Fiverr, Toptal). Các rule liên kết với Job dùng ID `BR-Jxx` (xem `BR-JOB.md`).

## Trạng thái Proposal

| Trạng thái | Ý nghĩa | Terminal? |
|---|---|---|
| `DRAFT` | Nháp, chưa gửi (Client không thấy) | Không |
| `SUBMITTED` | Đã gửi, chờ Client xem xét (thay cho `PENDING`) | Không |
| `INTERVIEWING` | Client phản hồi, đang liên hệ/phỏng vấn | Không |
| `HIRED` | Được thuê → tạo Contract (thay cho `ACCEPTED`) | Có |
| `REJECTED` | Client từ chối hoặc Job đã tuyển đủ chỗ | Có |
| `WITHDRAWN` | Freelancer tự rút | Có |
| `EXPIRED` | Job đóng/hết hạn nên đề xuất tự đóng (xem BR-P20) | Có |

```
DRAFT ──submit──► SUBMITTED ──client──► INTERVIEWING ──hire──► HIRED ──► (Contract / proposal)
                    │ │ │                    │ │
                    │ │ └──withdraw──────────┴──────► WITHDRAWN   (freelancer)
                    │ └───reject─────────────────────► REJECTED    (client / tuyển đủ chỗ)
                    └─────Job đóng hoặc hết hạn─────► EXPIRED      (hệ thống)
  (sau REJECTED / WITHDRAWN → được nộp lại; EXPIRED không hồi sinh — BR-J27)
```

**Số chỗ tuyển:** Job có `hiring_type` (`SINGLE` mặc định / `MULTIPLE`), `positions_required`, `positions_filled` — xem BR-P02, BR-P32, BR-P33 và BR-J37.

## A. Điều kiện gửi (Eligibility)

<details>
<summary><strong>BR-P01: Chỉ Freelancer đạt điều kiện được gửi proposal</strong></summary>

- Vai trò `FREELANCER`, tài khoản đã xác minh email (industry còn yêu cầu: liên kết thanh toán, không bị suspended).
- Tài khoản bị khóa không gửi được.

</details>

<details>
<summary><strong>BR-P02: Job phải OPEN, chưa hết hạn và còn chỗ trống (liên kết BR-J07, BR-J19, BR-J25, BR-J37)</strong></summary>

Chỉ gửi được khi Job `status = OPEN` + chưa qua `expiryDate`/`deadline` + chưa bị đóng sớm + **còn chỗ trống** (`positions_filled < positions_required`, BR-J37). Mọi trạng thái khác đều từ chối — kể cả Job DRAFT/IN_PROGRESS/CLOSED/CANCELLED/COMPLETED. Job đã tuyển đủ chỗ → từ chối dù trạng thái chưa kịp chuyển (chống race).

</details>

<details>
<summary><strong>BR-P03: Không ứng tuyển cho Job của chính mình</strong></summary>

`job.clientId !== currentUserId` — chặn xung đột lợi ích và giao dịch nội bộ.

</details>

<details>
<summary><strong>BR-P04: Mỗi Freelancer tối đa 1 proposal đang hoạt động cho mỗi Job</strong></summary>

Tập active: `DRAFT`, `SUBMITTED`, `INTERVIEWING`, `HIRED`. Unique constraint `(jobId, freelancerId)` cho các trạng thái active (chống race condition). Sau khi `REJECTED`/`WITHDRAWN` → được nộp lại (trong giới hạn anti-spam BR-P50).

</details>

<details>
<summary><strong>BR-P05: Trả lời đủ câu hỏi screening / khớp yêu cầu Job</strong></summary>

Nếu Job có custom questions → bắt buộc trả lời đủ trước khi submit. Job yêu cầu skill/kinh nghiệm/khu vực → profile Freelancer phải khớp (hoặc nhận cảnh báo "không đủ tiêu chí").

</details>

<details>
<summary><strong>BR-P06: Job hết chỗ trống không nhận proposal mới</strong></summary>

Job `IN_PROGRESS` (đã tuyển đủ chỗ) → API từ chối (BR-J19). Job `MULTIPLE` mới tuyển 1 phần vẫn giữ `OPEN` và tiếp tục nhận proposal đến khi đủ chỗ (BR-J37).

</details>

## B. Nội dung proposal

<details>
<summary><strong>BR-P10: Trường bắt buộc khi submit</strong></summary>

- `coverLetter`: bắt buộc, trim, 100–5000 ký tự, không chứa email/điện thoại/link liên hệ ngoài (anti-disintermediation).
- `bidAmount`: bắt buộc, > 0; nếu nằm ngoài budget range của Job → yêu cầu xác nhận "ngoài ngân sách".
- `deliveryDays`: bắt buộc, số nguyên > 0.
- Câu hỏi screening (nếu có): bắt buộc trả lời đủ.

</details>

<details>
<summary><strong>BR-P11: Đính kèm</strong></summary>

Số file giới hạn (5–10), mỗi file ≤ 5–25 MB, định dạng cho phép; link portfolio phải validate URL. Job có cờ "yêu cầu portfolio" → bắt buộc ≥1 đính kèm.

</details>

<details>
<summary><strong>BR-P12: Nháp (DRAFT)</strong></summary>

- Lưu được dữ liệu chưa đủ, chỉ chủ sở hữu sửa/xóa được, Client không nhìn thấy.
- Gửi từ nháp = chạy lại toàn bộ eligibility (BR-P01–P06) + check đủ trường bắt buộc tại thời điểm gửi (BR-J05 tinh thần: không gửi khi Job vừa đóng).
- Nháp hết hạn sau 7–30 ngày (industry practice).

</details>

<details>
<summary><strong>BR-P13: Không sửa proposal sau khi submit — rút rồi nộp lại</strong></summary>

Proposal `SUBMITTED` bất biến. Freelancer muốn đổi điều khoản → `WITHDRAW` rồi submit lại (nếu Job còn mở). (Nền tảng hỗ trợ "chỉnh khi Client chưa mở" thì chỉ sửa được khi `viewedAt IS NULL`.)

</details>

<details>
<summary><strong>BR-P14: Proposal giữ nguyên điều khoản gốc dù Job đổi sau đó (BR-J12, BR-J13)</strong></summary>

- `bidAmount`, `deliveryDays`, `coverLetter` là **snapshot** tại thời điểm gửi.
- Client sửa Job không ghi đè các giá trị này; nếu accept thì Contract lấy `bidAmount` gốc của proposal.
- Thay đổi trọng yếu của Job → hệ thống không sửa proposal; Freelancer tự quyết định: giữ đề xuất cũ, hoặc `WITHDRAW` + nộp lại với điều khoản mới.

</details>

## C. Freelancer

<details>
<summary><strong>BR-P20: Proposal tự EXPIRED khi Job đóng/hết hạn (BR-J24, BR-J27)</strong></summary>

Cùng transaction khi Job `OPEN → CLOSED` (hoặc tự hết hạn): mọi proposal `SUBMITTED`/`INTERVIEWING` → `EXPIRED`, không accept/reject được nữa, Freelancer nhận thông báo. Khi Job reopen (BR-J26) proposal `EXPIRED` **không** hồi sinh (BR-J27) — nộp lại là proposal mới.

Lưu ý phân biệt: Job **tuyển đủ chỗ** thì proposal còn lại → `REJECTED` chứ không `EXPIRED` (BR-P32).

</details>

<details>
<summary><strong>BR-P21: Xem & quản lý proposal của mình</strong></summary>

Chỉ xem proposal của chính mình (ownership), kèm trạng thái, `submittedAt`, `viewedAt` (Client đã xem chưa), lý do reject nếu Client cung cấp. Filter theo Job/trạng thái/thời gian.

</details>

<details>
<summary><strong>BR-P22: Rút proposal (WITHDRAW)</strong></summary>

- Chỉ khi `status = SUBMITTED` hoặc `INTERVIEWING`; `HIRED` thì phải hủy Contract chứ không phải withdraw.
- Sau withdraw: terminal, ẩn khỏi danh sách Client, Client (đã xem) nhận thông báo.
- Rút/nộp lại bị giới hạn tần suất (BR-P50).

</details>

<details>
<summary><strong>BR-P23: Không xem được proposal người khác</strong></summary>

Freelancer chỉ thấy proposal của mình; bid giữ kín (đa số marketplace) trừ khi nền tảng có chế độ bidding công khai.

</details>

## D. Client

<details>
<summary><strong>BR-P30: Xem proposal của Job mình, đánh dấu đã xem</strong></summary>

- Chỉ chủ Job (`job.clientId === userId`); chỉ proposal `SUBMITTED`/`INTERVIEWING` (DRAFT của Freelancer không thấy).
- Sort chuẩn: mới nhất / giá thấp→cao / phù hợp nhất.
- Mở chi tiết → set `viewedAt` (Freelancer thấy "đã xem", dùng cho follow-up).

</details>

<details>
<summary><strong>BR-P31: Từ chối proposal</strong></summary>

Chỉ `SUBMITTED` hoặc `INTERVIEWING` của Job mình. Lý do từ chối **tùy chọn** (chọn từ danh sách có sẵn: hết ngân sách, thiếu kinh nghiệm, đã chọn người khác...). Job đã tuyển đủ chỗ → mọi proposal còn lại auto `REJECTED` (BR-J17).

</details>

<details>
<summary><strong>BR-P32: Thuê (HIRED) — nguyên tử, theo hiring_type (BR-J15 – BR-J18, BR-J36)</strong></summary>

Điều kiện: proposal `SUBMITTED` hoặc `INTERVIEWING` của Job mình, Job `OPEN`, **còn chỗ trống** (`positions_filled < positions_required` — BR-J37), `bidAmount` hợp lệ, Client đủ điều kiện (đã xác minh thanh toán, không vượt giới hạn thuê).

Trong **1 transaction** (khóa row Job khi check chỗ):
1. Proposal → `HIRED` (+`acceptedAt`)
2. `positions_filled += 1`
3. Proposal khác cùng Job:
   - `hiring_type = SINGLE`: mọi `SUBMITTED`/`INTERVIEWING` còn lại → `REJECTED` + thông báo (BR-J17)
   - `hiring_type = MULTIPLE`: **giữ nguyên** trạng thái — client tiếp tục phỏng vấn và vẫn nhận proposal mới
4. Nếu đã tuyển đủ chỗ (`positions_filled == positions_required`): Job `OPEN → IN_PROGRESS` (BR-J16) + mọi `SUBMITTED`/`INTERVIEWING` còn lại → `REJECTED` + thông báo
5. Tạo đúng **1 Contract cho proposal thắng** (`proposalId` unique — BR-J18), `totalAmount = bidAmount`
6. Thông báo Freelancer được thuê

Chống race condition: khóa row Job trong transaction khi check chỗ + unique constraint `proposalId` cho Contract — không thể hire trùng 2 lần / vượt số chỗ.

</details>

<details>
<summary><strong>BR-P33: Số lượng thuê theo hiring_type</strong></summary>

- `SINGLE` (mặc định): 1 Job tối đa 1 Freelancer — enforce bằng business rule trong transaction hire (BR-P32), không còn dựa vào constraint `jobId` unique.
- `MULTIPLE`: tối đa `positions_required` Freelancer, mỗi người 1 Contract (`proposalId` unique; `jobId` chỉ là index thường — BR-J15/J18). Tuyển đủ chỗ → Job `IN_PROGRESS`, đóng cửa nhận proposal.

</details>

<details>
<summary><strong>BR-P34: Nhắn tin trước khi hire qua kênh sàn</strong></summary>

Client nhắn Freelancer đã ứng tuyển qua messaging nội bộ; không chia sẻ liên hệ ngoài. Proposal giữ nguyên trạng thái đến khi hire/reject/withdraw.

</details>

<details>
<summary><strong>BR-P35: Chuyển proposal sang INTERVIEWING</strong></summary>

- Chỉ chủ Job (Client) chuyển được `SUBMITTED → INTERVIEWING` (đánh dấu đang liên hệ/phỏng vấn ứng viên).
- Client hire/reject từ cả `SUBMITTED` lẫn `INTERVIEWING`; Freelancer withdraw được từ cả 2 trạng thái (BR-P22/P31/P32).
- Nhiều proposal của cùng 1 Job có thể cùng ở `INTERVIEWING` một lúc.
- Không có chiều ngược lại (không quay về `SUBMITTED`); `INTERVIEWING` không phải terminal.

</details>

## E. Vòng đời & theo dõi

<details>
<summary><strong>BR-P40: Không còn proposal đang mở khi Job tuyển đủ chỗ</strong></summary>

Xem BR-P32 — cùng transaction với accept. Khi Job chuyển `IN_PROGRESS` (SINGLE: ngay lần hire đầu; `MULTIPLE`: lần hire đưa `positions_filled` lên `positions_required`), không còn proposal nào ở `SUBMITTED`/`INTERVIEWING`.

</details>

<details>
<summary><strong>BR-P41: Nhắc nhở/follow-up</strong></summary>

- Client chưa xem sau N ngày → nhắc Freelancer gia hạn/bổ sung (nếu nền tảng hỗ trợ refresh proposal).
- Proposal tồn tại quá 30–60 ngày khi Job vẫn mở → tự đóng để làm sạch.

</details>

## F. Phân quyền

| Actor | Quyền |
|---|---|
| Guest | Không có quyền với Proposal. |
| Freelancer | Tạo/sửa nháp/gửi/rút/xem proposal **của mình**. |
| Client | Xem/accept/reject proposal **của Job mình**, nhắn tin ứng viên. |
| Admin | Xem mọi proposal cho tranh chấp/moderation; không hire thay Client. |

Mọi thao tác kiểm tra vai trò + ownership (chống IDOR).

## G. Chống lạm dụng

<details>
<summary><strong>BR-P50: Giới hạn gửi proposal (anti-spam)</strong></summary>

- Giới hạn số/ngày hoặc /tuần theo gói (free ~10–20/ngày).
- Cần connection/token mỗi lần gửi (mô hình Upwork) hoặc phí nhỏ (mô hình Freelancer.com).
- Copy-paste cùng cover letter hàng loạt → phát hiện & cảnh báo; cover letter quá ngắn bị gắn cờ chất lượng thấp.

</details>

<details>
<summary><strong>BR-P51: Chống giao dịch ngoài sàn</strong></summary>

Cover letter/đính kèm chứa email, phone, Zalo/Telegram, link liên hệ trực tiếp → chặn lúc submit hoặc gắn cờ kiểm duyệt. Vi phạm → cảnh báo / tạm ngưng quyền ứng tuyển.

</details>

<details>
<summary><strong>BR-P52: Bảo vệ hai phía khi hire</strong></summary>

- Accept ≠ chuyển tiền: tiền vào escrow/hold theo Contract.
- Client hủy sau accept → chịu phí theo grace period; Freelancer nhận việc rồi bỏ → phạt điểm / tạm ngưng quyền ứng tuyển.
- Tranh chấp đi qua dispute, không sửa trạng thái proposal tùy tiện.

</details>