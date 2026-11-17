# Kiểm tra UC-18 đến UC-21 — 05/11/2026

Đối chiếu schema Prisma, source frontend/API và tài liệu Sprint 2 tại
`docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Subsections/sprint2/nhuy`.
Tài liệu này dùng số UC cũ 15–18; báo cáo dưới đây dùng số UC người dùng cung cấp.

## Kết quả theo use case

| UC                                        | Kết quả                      | Chi tiết                                                                                                                                                                                                                                                               |
| ----------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UC-18.01 Upload Identity Documents        | Chưa đạt                     | Tạo được PENDING nhưng API upload thường không chặn PENDING/APPROVED; nhận 6 MB dù doc giới hạn 5 MB; không nhận WebP. API AI chỉ chặn APPROVED của bản ghi mới nhất, chưa chặn PENDING. Form hiện gọi AI, chỉ nhận ảnh và yêu cầu webcam; không có luồng PDF như doc. |
| UC-18.02 View Verification Status         | Đạt phần backend đã kiểm tra | Đọc được chưa nộp, PENDING, REJECTED và reviewNotes. API dùng null cho chưa nộp và UI ánh xạ nhãn. Chưa thử cập nhật trạng thái trên trình duyệt với admin thực tế.                                                                                                    |
| UC-19.01 View Client Profile              | Một phần                     | Có hồ sơ công ty và social links; schema response loại thông tin user nhạy cảm. Chưa có thống kê việc đăng, hợp đồng, rating và danh sách job đang mở như doc.                                                                                                         |
| UC-19.02 Update Company Information       | Một phần                     | Lưu và đọc lại được tên, mô tả, website. Validation vẫn nhận javascript: URL; chưa giới hạn website theo varchar(255). Industry/location trong doc không có trong schema hiện tại. Có quy trình duyệt theo độ hoàn thiện hồ sơ trong thiết kế mới.                     |
| UC-20.01 View Social Link List            | Một phần                     | Có danh sách của bản thân và social links trên Client công khai; chưa có trên Freelancer công khai. GET /social-links chỉ đọc user đăng nhập.                                                                                                                          |
| UC-20.02 Add Social Link                  | Một phần                     | Thêm và chặn trùng tuần tự được; validation vẫn nhận javascript: URL và chưa giới hạn varchar(500). Schema chưa có unique(profileId, platform), nên chưa bảo đảm chống trùng đồng thời.                                                                                |
| UC-20.03 Delete Social Link               | Một phần                     | Kiểm tra quyền sở hữu và hard delete đúng trên DB. Hai giao diện settings gọi xóa trực tiếp, thiếu bước xác nhận như doc.                                                                                                                                              |
| UC-21.01 View Favorite Freelancer List    | Có lỗi biên                  | Danh sách hiện được với freelancer đã có FreelancerProfile; freelancer mới chỉ có Profile bị lọc khỏi danh sách dù thêm thành công. Query chưa lọc tài khoản đã xóa hoặc vai trò Freelancer bị thu hồi.                                                                |
| UC-21.02 Add Freelancer to Favorites      | Đạt luồng cơ bản đã kiểm tra | Ghi DB và chặn trùng tuần tự; cần xử lý trường hợp freelancer chưa có hồ sơ nghề nghiệp và race unique constraint để tránh 500.                                                                                                                                        |
| UC-21.03 Remove Freelancer from Favorites | Đạt phần backend đã kiểm tra | Xóa đúng mapping của client; đọc lại DB xác nhận đã mất. Chưa thử thao tác trên trình duyệt.                                                                                                                                                                           |

## Bằng chứng kiểm thử

- 3 bộ test service/repository/revision: 16/16 test pass.
- Bộ unit test quản trị identity verification: 26/26 test pass. Đây là test admin,
  không thay thế kiểm tra luồng upload của Freelancer.
- Audit trên database dev qua Infisical: 16 ca, 9 pass và 7 fail.
- Bảy ca fail: chặn upload PENDING; chặn upload APPROVED; từ chối trên 5 MB;
  nhận WebP; chặn URL công ty ngoài HTTP/HTTPS; chặn social URL ngoài HTTP/HTTPS;
  hiển thị freelancer mới trong danh sách favorites.
- Toàn bộ dữ liệu thử nằm trong một transaction với tài khoản riêng và đã rollback.
  Sequence PostgreSQL có thể tăng; không commit tài khoản hay giấy tờ thử.
- Storage được mock; không upload tài liệu thật và không gọi AI. Audit không xác
  nhận OCR, liveness, Cloudinary hoặc webcam.
- Chưa thực hiện browser end-to-end. Chưa sửa production code trong lượt audit này.

## Các điểm cần xử lý trước khi nghiệm thu

1. Thống nhất giới hạn và định dạng file giữa doc, controller, service và UI;
   chặn một yêu cầu active trong cả upload thường lẫn AI.
2. Kiểm tra bảo vệ file giấy tờ: Cloudinary upload hiện chưa cấu hình authenticated
   delivery và trả secure_url trực tiếp. Cần xác minh cấu hình storage thực tế;
   chưa thể coi là đáp ứng yêu cầu chỉ người có quyền đọc tài liệu.
3. Chỉ cho HTTP/HTTPS và giới hạn độ dài URL theo database.
4. Bổ sung social links công khai cho Freelancer và xác nhận trước khi xóa.
5. Đồng bộ quy tắc thêm/hiển thị favorites cho freelancer mới; lọc tài khoản không
   còn hợp lệ, xử lý cạnh tranh khi thêm trùng.
6. Chốt phần thống kê/industry/location trong doc với schema hiện tại trước khi
   bổ sung Client Profile.

Chạy lại audit từ `apps/api` sau khi build API:

```powershell
infisical.cmd run --env=dev --path=/api --project-config-dir=../.. -- node --max-old-space-size=256 --max-semi-space-size=4 test/account-profile.audit.cjs
```

Script trả exit code 1 khi có ca FAIL. Nó dùng output build hiện tại trong dist,
nên cần build lại nếu source thay đổi.
