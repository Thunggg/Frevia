# Report 5 — Nguyễn Lữ Nhật Huy

Cập nhật ngày 09/11/2026. Nội dung test giữ tiếng Anh theo báo cáo chung;
comment trong Jest giữ tiếng Việt theo `apps/api/test/TEST_CASE_RULES.md`.

## Kết quả và file đọc

- `Report5_Unit Test.xls`: thêm **57 matrix, UF-122–UF-178, gồm 582 case** cho
  51 use case của Nhật Huy trong Sprint 1–5. Mỗi method một matrix; upload và
  replace CV dùng chung method nên dùng chung matrix.
- `Report5_Test Report.xlsx`: thêm **16 sheet có tiền tố NH**, gồm **198 case
  system/API**. Cả ba vòng để `Pending`; ngày chạy và người chạy để trống.
- `Report5_Unit_Test_Backend.pdf` và `.html`: kết quả toàn bộ bộ unit test.
- `Report5_Test_Documentation.pdf` và `.tex`: thêm phần xác minh hiện tại,
  phân biệt số liệu mới với các bảng lịch sử của báo cáo cũ.

Đã chạy thành công **1.358/1.358 unit test, 34 suite**, trong đó 582 case mới.
Kiểm tra TypeScript thành công. Chưa chạy 198 case system/API trên ứng dụng.
Không suy ra tỷ lệ code coverage từ số case pass.

Các matrix cũ UF-01–UF-121 có 965 case đặc tả, không phải danh mục một-một với
776 test executable ban đầu. Vì vậy tổng số đặc tả trong matrix và tổng test
Jest khác nhau. Thống kê matrix giữ số liệu cũ; không tự đổi thành Passed.
Workbook system hiện có 817 case đặc tả, gồm 619 case cũ và 198 case mới.

## Phạm vi

Mã matrix đã được sắp lại theo thứ tự UC được yêu cầu. Xem
[bảng UC → Unit Test](NHUY-UNIT-TEST-INDEX.md): phần chính UF-122–UF-171,
các method hỗ trợ UF-172–UF-178. Nội dung 582 case được giữ nguyên.

| Sprint | UC | Chức năng |
| --- | --- | --- |
| 1 | UC-07.01–02, UC-08, UC-09 | Freelancer Profile, Skills, Portfolio |
| 2 | UC-18, UC-19, UC-20, UC-21 | Identity Verification, Client Profile, Social Links, Favorites |
| 3 | UC-29, UC-30, UC-31 | Following, Notifications, Switch/Join Role |
| 4 | UC-39, UC-40, UC-41 | Reviews, Review Responses, Account Profile |
| 5 | UC-47, UC-07.03–06 | Profile Revision Review, Expert Profile, CV |

Đối chiếu với `docs/Report 3/nhuy-coverage.json`, tài liệu thiết kế Nhật Huy
trong Report 4 và backend hiện tại. `tools/nhuy-test-catalog.json` liên kết
UC, method, file source, dòng code, UTCID, input, loại N/A/B và expected result.
Các case DTO kiểm tra trực tiếp shared Zod schema; service test mock repository,
Cloudinary, hashing, AI, storage và indexing, không gọi database/network thật.

## Điểm cần hiểu đúng theo code

- Role thực tế là `Client`, `Freelancer`, `Admin`, `Expert`; enum loại revision
  là `CLIENT`, `FREELANCER`, `EXPERT`.
- Ngưỡng cần duyệt hồ sơ là strength **nhỏ hơn 20**, không phải nhỏ hơn hoặc bằng 20.
- CV chỉ nhận PDF tối đa 10 MiB; avatar JPEG/PNG/WebP tối đa 5 MiB.
  Multer trả **413** khi file vượt giới hạn tại controller. Gọi trực tiếp service
  có thể nhận **400**; test hai tầng này không thay thế nhau.
- AI xác minh thành công tạo document `PENDING` để admin duyệt. AI từ chối hoặc
  phát hiện trùng CCCD tạo `REJECTED`; lỗi gọi AI không tạo document.
- UC-47.05 của admin dùng danh sách revision có filter trạng thái và phân trang.
  Endpoint `/profile-revisions/me` chỉ trả revision gần nhất của tài khoản.
  Không mô tả endpoint này như toàn bộ lịch sử cá nhân.
- Unit test xác minh logic service và DTO. JWT/RBAC, trình duyệt, giao dịch DB,
  Cloudinary/AI thật và toàn bộ workflow còn cần chạy các case system/API.

Không sửa production code để làm test pass. Các thay đổi production có sẵn
trong workspace trước lượt này được giữ nguyên. Script export được sửa để
chỉ thay PDF sau khi đã tạo được file mới, tránh báo thành công vì PDF cũ còn tồn tại.

## Kiểm tra và sinh lại

Từ thư mục gốc dự án:

```powershell
npm.cmd run test:unit --prefix apps/api -- --runInBand
npm.cmd run test:unit --prefix apps/api -- --runInBand test/nhuy
node node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json
```

Nguồn của các test mới nằm trong `tools/build-nhuy-tests.mjs`. Khi thay đổi
case, sửa nguồn này trước rồi sinh lại và format:

```powershell
node "docs/Report 5/tools/build-nhuy-tests.mjs"
node node_modules/prettier/bin/prettier.cjs --write "apps/api/test/nhuy/*.ts"
npm.cmd run test:unit --prefix apps/api -- --runInBand --json --outputFile=../../tmp/report5-all-results.json
node apps/api/test/export-test-report.mjs --results tmp/report5-all-results.json --out "docs/Report 5/Report5_Unit_Test_Backend.pdf"
```

`build-nhuy-workbooks.py` cập nhật file BIFF `.xls` bằng xlrd/xlutils/xlwt vì
Artifact Tool không đọc/ghi định dạng BIFF. Các thư viện bổ sung chỉ đặt trong
`tmp/report5-deps`. File `.xlsx` được biên soạn bằng Artifact Tool và đã tính lại
bằng Microsoft Excel để xác minh công thức trong engine đích.

Quá trình tái tạo workbook cần bản gốc trước khi thêm phần Nhật Huy ở
`tmp/report5-originals`, kết quả Jest ở `tmp/report5-all-results.json` và dữ liệu
trung gian ở `tmp/report5-artifacts`. Không thay bản gốc bằng file đã có UF-122
trở đi; generator không dùng workbook đầu ra làm template đầu vào.

`verify-nhuy-report.py` kiểm tra mọi input có đúng một dấu O mỗi UTCID,
mỗi case có một expected result, đủ type và kết quả chạy; đối chiếu dữ liệu
cũ, style nhìn thấy, 51 mã UC, 198 trạng thái Pending và không có lỗi công thức.
Kết quả được lưu tại `tools/nhuy-verification.json`.

Hai PDF đã được kiểm tra text bounds toàn bộ trang và render các trang đại diện.
Không có trang trắng hoặc chữ vượt khỏi khổ giấy. Bản LaTeX dùng Times New Roman,
Arial và Courier New để giữ phong cách báo cáo và tránh thiếu font khi build.
