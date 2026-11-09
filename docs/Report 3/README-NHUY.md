# Report 3 — Phần của Nguyễn Lữ Nhật Huy

Cập nhật ngày 08/11/2026, sau khi merge `origin/dev` tại commit `d38ff72`
vào nhánh làm việc `uc-07-08-09-freelancer-management`.
Merge commit: `51986e5`. Các thay đổi local trước đó đã được khôi phục;
bản dự phòng vẫn nằm trong stash có tên
`codex-preserve-local-before-dev-update-2026-11-08`.

## Bản đọc

- [Report 3 đầy đủ](main.pdf): 597 trang, đã tích hợp phần Nhuy vào báo cáo chung.
- [Bản riêng phần Nhuy](nhuy-report3.pdf): 211 trang, thuận tiện kiểm tra phạm vi cá nhân.
- [Nguồn bản riêng](nhuy-report3.tex).

Nội dung báo cáo giữ tiếng Anh theo định dạng chung của nhóm.
Screen Layout là mô tả giao diện có khung minh họa, không phải screenshot ứng dụng.

## Phạm vi đã hoàn thiện

| Sprint | Số use case | Nhóm chức năng |
| --- | ---: | --- |
| 1 | 10 | Freelancer Profile, Skills, Portfolio |
| 2 | 10 | Identity Verification, Client Profile, Social Links, Favorites |
| 3 | 9 | Following, Notifications, Switch/Join Role |
| 4 | 12 | Reviews, Review Responses, General Account Profile |
| 5 | 10 | Profile Revision Review, Expert Profile, CV |
| Tổng | 51 | |

Mỗi use case có trigger, actor, điều kiện trước/sau, luồng chính, luồng thay thế,
ngoại lệ, business rules và liên hệ API/database. Mỗi mô tả chức năng có dữ liệu
vào/ra, validation, bố cục giao diện và acceptance criteria.

- Mã UC thống nhất với `docs/UC_diagram/Frevia_UC.csv`.
- Sáu use case duyệt hồ sơ chỉ xuất hiện ở Sprint 5; không lặp lại ở Sprint 4.
- Bốn nguồn `sprint2..5/nhuy` trước đây đã chuyển thành `nhuy.tex`.
- Functional Requirements đã include đầy đủ năm file `sprint1..5/nhuy.tex`.
- Cập nhật các dòng screen description/authorization liên quan và registry business rules.
- Có bảng truy vết và bảng acceptance gaps trong cuối phần Functional Requirements.

## Kiểm tra

- 51 mã UC duy nhất, 51 đặc tả, 51 mô tả chức năng; đủ các section bắt buộc.
- Các mã đều có trong UC catalog; toàn bộ đường dẫn `input` được kiểm tra.
- Hai bản PDF build thành công bằng Tectonic 0.17.0.
- Bản riêng Nhuy: kiểm tra text bounds trên toàn bộ 211 trang; không có chữ
  vượt ra ngoài trang hoặc trang trắng. Đã render và xem các trang đại diện.
- Log bản riêng không có Overfull, Undefined, Missing character hoặc LaTeX Error.
- Bản chung còn 14 trang có text vượt biên giấy, ở các phần Permissions, Forum,
  Users, Banners và Job Categories của thành viên khác (trang 241, 245, 264,
  284, 341, 348, 374, 435, 437, 448, 453, 526, 536, 546). Các lỗi này chưa
  được chỉnh vì nằm ngoài phạm vi phần Nhuy đã thống nhất. Bản chung vẫn có cảnh báo font;
  không diễn giải việc build thành công là toàn bộ báo cáo chung đã được rà soát thị giác.
- Sau khi merge dev: install theo frozen lockfile, shared types build,
  Prisma Client generate, API build và 20 test liên quan đều thành công.

Hoàn thiện tài liệu không đồng nghĩa các acceptance gap đã được sửa trong ứng dụng.
Không áp dụng migration hoặc thay đổi dữ liệu database trong lượt cập nhật này.

## Kiểm tra lại và build

Từ thư mục gốc dự án:

```powershell
node "docs/Report 3/tools/check-nhuy-report.mjs"
```

Từ `docs/Report 3`, nếu đã cài Tectonic:

```powershell
tectonic --keep-logs main.tex
tectonic --keep-logs nhuy-report3.tex
```

`tools/complete-nhuy-report.mjs` chứa dữ liệu biên soạn và sinh các nguồn của Nhuy.
Nếu dùng generator, chỉnh nội dung tại đó trước rồi sinh lại; chạy generator sẽ
ghi đè các file Nhuy được sinh. Không cần chạy generator để build các file hiện có.
`nhuy-coverage.json` là danh mục để kiểm tra tính đầy đủ.
