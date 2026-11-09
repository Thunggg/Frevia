# Rule viết Unit Test Matrix

## Phạm vi
1. Mỗi **hàm (method)** có 1 bảng matrix riêng, không phải 1 UC.
2. Ưu tiên hàm có logic thật (validate, rẽ nhánh). Hàm chỉ gọi qua lại thì bỏ qua.
3. Hàm gọi hàm khác (repository, service khác) thì **mock**, chỉ test logic của hàm đang xét.

## Đọc code trước
4. Phải đọc code BE trước khi viết: controller, DTO/validator, service, repository, exception handler, entity.
5. Mọi thông tin (trường, biên, message lỗi, mã HTTP) lấy **đúng từ code**, không tự đặt.
6. Code không có rule thì không tạo case. Test report/yêu cầu có mà code thiếu → ghi nhận là lỗi code. Code có mà test report không nhắc → vẫn thêm case.

## Chọn input
7. Chỉ đưa vào trường có validate, có rẽ nhánh, hoặc quyết định quyền/sở hữu dữ liệu.
8. Hàm GET: param lọc/phân trang/sắp xếp, token/role, precondition dữ liệu.
9. Hàm POST/PUT: mọi trường có validation (hợp lệ, không hợp lệ từng rule, biên).
10. Hàm DELETE/đổi trạng thái: ID, quyền sở hữu, trạng thái hiện tại.

## Cấu trúc bảng
12. **1 dòng = 1 giá trị cụ thể** (`0`, `1`, `"a"`, `empty`). Không dùng "or", dấu phẩy, dấu "/".

14. Mỗi cột UTCID chọn **đúng 1 giá trị** cho mỗi trường, đánh `O`.

16. Confirm ghi message lỗi và mã HTTP nguyên văn từ code.

## Tạo UTCID
17. Mỗi UTCID chỉ sai **một** điều kiện, các trường còn lại hợp lệ.
18. Dùng lớp tương đương, không test từng giá trị. Số case tăng theo cộng, không phải nhân.
19. Không test chéo các trường, trừ khi code có rule phụ thuộc.
20. Hai UTCID cùng nhánh code và cùng kết quả thì bỏ một.


## Tiêu chí đủ
24. Mỗi `if/else` có UTCID đi vào và UTCID không đi vào.
25. Mỗi `throw`/mã lỗi có ít nhất 1 UTCID.
26. Mỗi trường có ràng buộc có đủ case hợp lệ, không hợp lệ, biên.
27. Mỗi UTCID có đúng 1 kết quả mong đợi.


## Checklist chốt
- [ ] Đã đọc code của hàm
- [ ] Mỗi dòng chỉ 1 giá trị, không có "or"
- [ ] Có đủ cột UTCID và dấu O
- [ ] Phủ đủ nhánh `if`, `throw`, mã lỗi
- [ ] Biên và message lấy đúng từ code
- [ ] Đã gán Type N/A/B cho mọi UTCID
