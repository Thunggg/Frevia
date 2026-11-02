# Hướng dẫn vẽ Class Diagram và Sequence Diagram cho Report 4

Tài liệu này giải thích cách đọc code và vẽ sơ đồ theo mẫu đang dùng trong dự án Frevia. Bố cục tham khảo từ phần của các thành viên, đặc biệt các sơ đồ Role của tthuan; nội dung của từng sơ đồ phải được kiểm tra lại với code của chức năng đó.

## 1. Bắt đầu học từ đâu?

Nên mở các file sau bằng draw.io theo thứ tự:

1. [View Freelancer Profile](../../sequence-diagrams-remake/nhuy/UC-07.01-view-freelancer-profile.drawio): một truy vấn, một điều kiện và hai nhánh trả kết quả.
2. [Delete Portfolio](../../sequence-diagrams-remake/nhuy/UC-09.05-delete-portfolio.drawio): xác thực, kiểm tra tồn tại, quyền sở hữu và soft-delete.
3. [Add Freelancer Skill](../../sequence-diagrams-remake/nhuy/UC-08.02-add-freelancer-skill.drawio): nhiều truy vấn và nhánh lồng nhau.
4. [Update Freelancer Profile](../../sequence-diagrams-remake/nhuy/UC-07.02-update-freelancer-profile.drawio): phân biệt cập nhật trực tiếp và gửi yêu cầu chờ duyệt.
5. [Class Diagram của Portfolio](images/sprint1/nhuy/classDiagram/PortfolioManagement.drawio): ví dụ Controller, Service, Repository và PrismaService tách riêng.

Trong draw.io, dùng **File → Open From → Device** để mở file `.drawio`. File này là nguồn có thể chỉnh sửa; PDF dùng để chèn vào báo cáo.

## 2. Cấu trúc thư mục

```text
sequence-diagrams-remake/nhuy/
  UC-09.05-delete-portfolio.drawio           # Nguồn sequence dùng trong dự án

docs/Report 4/
  sections/nhuy/
    2/sprint1.tex ... sprint5.tex           # Thiết kế chi tiết và hình sơ đồ
    4/sprint1.tex ... sprint5.tex           # ClassMethod và ClassAttribute
  images/sprint<N>/nhuy/
    classDiagram/
      PortfolioManagement.drawio
      PortfolioManagement.svg
      PortfolioManagement.pdf
    sequences/
      UC-09.05-delete-portfolio.drawio
      UC-09.05-delete-portfolio.svg
      UC-09.05-delete-portfolio.pdf
```

Bản sequence trong Report 4 được sao chép từ `sequence-diagrams-remake/nhuy/`. Khi sửa nguồn, cần đồng bộ bản sao và xuất lại hình. Không sửa PDF rồi bỏ quên file `.drawio`.

## 3. Đọc code trước khi vẽ

Đọc theo chiều xử lý của một request:

| File hoặc thành phần | Thông tin cần lấy |
|---|---|
| `*.controller.ts` | HTTP method, đường dẫn, tham số, DTO, service được gọi, `@IsPublic()` |
| `*.service.ts` | Thứ tự gọi repository, các `if`, quyền sở hữu, dữ liệu trả về, `try/catch` |
| `*.repo.ts` | Tên method thực tế, model Prisma, bộ lọc, transaction, thao tác tạo/sửa/xóa |
| `*.error.ts` | Tên exception và HTTP status |
| `*.dto.ts` và schema dùng chung | Kiểu dữ liệu đầu vào, validation, cấu trúc đầu ra |
| `access-token.guard.ts` | Các điều kiện xác thực JWT và session |
| `permission.guard.ts` | Kiểm tra role và quyền truy cập endpoint |

Ví dụ `Delete Portfolio` trong code đi qua:

```text
PortfolioController.deletePortfolio(id, currentUserId)
  → PortfolioService.deletePortfolio(portfolioId, currentUserId)
  → PortfolioRepository.findPortfolioWithProfile(portfolioId)
  → kiểm tra portfolio tồn tại
  → kiểm tra portfolio thuộc currentUserId
  → PortfolioRepository.deletePortfolio(portfolioId)
  → prisma.portfolioItem.update({ data: { deletedAt: new Date() } })
  → trả message PORTFOLIO_DELETED
```

Vì code cập nhật `deletedAt`, sơ đồ phải mô tả **soft-delete**, không ghi `DELETE FROM PortfolioItem`. Tương tự, không thêm bước gửi email, gọi AI hoặc tạo thông báo nếu luồng tương ứng không có bước đó trong code.

## 4. Vẽ Class Diagram

### 4.1. Mỗi lớp là một ô riêng

Một ô lớp thường có ba ngăn:

```text
PortfolioService
-----------------------------------------------
- portfolioRepository: PortfolioRepository
-----------------------------------------------
+ getPortfolios(profileId: number)
+ addPortfolio(profileId, currentUserId, data)
+ getPortfolioDetail(portfolioId: number)
+ updatePortfolio(portfolioId, currentUserId, data)
+ deletePortfolio(portfolioId, currentUserId)
```

- `+`: phương thức public.
- `-`: thuộc tính hoặc phương thức private.
- Tên lớp, thuộc tính, tham số và kiểu dữ liệu lấy từ code.
- Giữ Controller, Service và Repository thành các lớp độc lập.
- Lớp dùng chung có thể chỉ hiện các phương thức liên quan đến module; phải ghi rõ đây là góc nhìn theo module.

### 4.2. Nối đúng dependency

```text
PortfolioController → PortfolioService → PortfolioRepository → PrismaService
```

Quan hệ lấy từ dependency được inject trong constructor. Có thể dùng dependency nét đứt với đầu mũi tên mở. Không dùng mũi tên kế thừa nếu code không có `extends`.

Ví dụ `private readonly portfolioRepository: PortfolioRepository` chứng minh Service phụ thuộc Repository. `private readonly prisma: PrismaService` chứng minh Repository phụ thuộc PrismaService.

Nếu cần vẽ thêm CloudinaryService, TokenService hoặc ProfileRevisionService, hãy đặt thành ô riêng và nối từ lớp thực sự sử dụng dependency. Các đường nối nên chạy qua khoảng trống, không xuyên qua chữ trong ô lớp.

## 5. Vẽ Sequence Diagram

### 5.1. Các lifeline theo mẫu của dự án

```text
Actor | View | Route | Controller | Service | Repository | PrismaService | Database
```

| Lifeline | Ý nghĩa |
|---|---|
| Actor | Người thực hiện use case: Visitor, Freelancer, Client hoặc Admin |
| View | Màn hình nhận thao tác và hiển thị kết quả |
| Route | Điểm nhận/chuyển tiếp request; cần ghi rõ nếu đó là BFF |
| Controller | Nhận tham số và gọi service |
| Service | Điều phối nghiệp vụ, kiểm tra điều kiện |
| Repository | Truy cập dữ liệu theo các method trong code |
| PrismaService | Thực hiện lời gọi Prisma |
| Database | Nơi lưu dữ liệu |

`View` và `Route` có thể là vai trò trong sơ đồ, không nhất thiết là một class TypeScript cùng tên. Không giả định có thêm lớp hoặc thêm một lần gọi mạng chỉ để điền đủ các cột.

Repository phải nối đến **PrismaService**, sau đó mới đến Database. Mô tả ở cột Database là ý nghĩa của thao tác dữ liệu, không phải khẳng định code có một câu SQL viết tay.

### 5.2. Call, return và self-call

- **Call**: nét liền, đầu mũi tên kín.
- **Return**: nét đứt, đầu mũi tên mở, đi ngược về bên gọi.
- **Self-call**: đi từ lifeline quay lại chính lifeline đó, có activation bar phụ.
- **Activation bar**: thời gian đối tượng đang thực thi; không kéo thanh xuyên suốt toàn sơ đồ nếu đối tượng không hoạt động trong toàn bộ thời gian đó.

Sau khi một truy vấn trả kết quả về Service, dùng tên thao tác kiểm tra rõ nghĩa:

```text
Handle profile lookup result
Handle duplicate skill lookup result
Handle portfolio update result
```

Đặt `alt` khi code có điều kiện tương ứng. Nếu code trả nguyên một danh sách và không phân nhánh theo danh sách rỗng, không tự tạo một nhánh lỗi “list is empty”. Danh sách rỗng vẫn có thể là kết quả hợp lệ.

## 6. Phân nhánh và đánh số

### 6.1. `alt`, `opt`, `loop`, `break` và `ref`

| Khối | Khi dùng |
|---|---|
| `alt` | Có các nhánh thay thế như tìm thấy/không tìm thấy, đúng/sai quyền sở hữu |
| `opt` | Một bước chỉ chạy khi điều kiện đúng |
| `loop` | Code lặp một thao tác, ví dụ kiểm tra slug đến khi không trùng |
| `break` | Nhánh lỗi kết thúc interaction hiện tại |
| `ref` | Tham chiếu đến một interaction khác đã được định nghĩa |

Viết guard trong dấu ngoặc vuông, ví dụ `[portfolio is null]`. Nhánh ném exception phải thể hiện việc kết thúc luồng lỗi; không để người đọc hiểu rằng sau khi trả 404, request đó vẫn tiếp tục cập nhật dữ liệu.

### 6.1.1. Thu gọn `opt` và `alt` theo mẫu Role List

Áp dụng các quy tắc sau khi sơ đồ có nhiều khoảng trống hoặc quá nhiều khung lồng nhau:

1. Nếu một `alt` chỉ có nhánh lỗi kết thúc bằng exception và nhánh còn lại tiếp tục bình thường, có thể dùng `opt [điều kiện lỗi; throws and exits]` cho phần lỗi. Đưa các bước thành công tiếp theo ra ngoài khung; giữ rõ ý nghĩa kết thúc request khi lỗi xảy ra.
2. Giữ `alt` khi cả hai nhánh đều là các cách xử lý hợp lệ: ví dụ hồ sơ dưới ngưỡng thì gửi yêu cầu chờ duyệt, còn đủ ngưỡng thì cập nhật trực tiếp.
3. Chỉ kéo chiều ngang của khung đến lifeline xa nhất thực sự có message trong khung. Một nhánh lỗi từ Service trả về Actor không cần phủ thêm Repository, PrismaService và Database.
4. Tính chiều cao từng hàng theo số dòng của nhãn message, chừa khoảng trống nhỏ cho activation bar. Không dùng khoảng cách lớn cố định cho mọi message.
5. Đặt nhãn điều kiện trong một vùng riêng ở đầu nhánh. Nếu lifeline đi xuyên qua chữ, dùng nền nhãn phù hợp mà không thay đổi background của canvas.
6. Đánh số lại khi đưa luồng thành công ra khỏi nhánh. Ví dụ sau `11. Handle lookup result`, các bước lỗi trong `opt` có thể dùng `11.1.1` đến `11.1.4`, còn luồng chính tiếp tục từ `12`.

Mẫu Role List có phần lỗi 401/403 trong một khung gọn. Khi có nhiều điều kiện thay thế, vẫn phải thể hiện đúng ngữ nghĩa UML: một `opt` có một operand; dùng `alt` để phân biệt các trường hợp loại trừ nhau. Không sao chép hình thức nếu hình mẫu có điểm không thống nhất với UML hoặc code.

Sau khi thu gọn, so sánh danh sách message với bản trước: chỉ đổi bố cục, cách tổ chức khung và số luồng, không làm mất thao tác hoặc nhánh nghiệp vụ.

### 6.2. Quy tắc đánh số phân cấp

Luồng ngoài cùng dùng `1`, `2`, `3`... Nếu bước ngay trước `alt` là `20. Handle lookup result`:

```text
20. Handle lookup result
alt [record is null]
  20.1.1. Throw NotFoundException
  20.1.2. Return 404 response
  20.1.3. Display error message
else [record exists]
  20.2.1. Check ownership
  alt [owner differs from currentUserId]
    20.2.1.1.1. Throw ForbiddenException
    20.2.1.1.2. Return 403 response
  else [owner matches currentUserId]
    20.2.1.2.1. updateRecord(id, data)
    20.2.1.2.2. Return updated record
```

Đọc số từ trái sang phải: **bước cha → nhánh → bước trong nhánh**. Với nested `alt`, tiếp tục nối nhánh và bước vào số của thao tác kiểm tra cha.

- Mỗi call và return có số riêng.
- Không trùng số giữa hai message.
- Không dùng `undefined`, số tự sinh lỗi hoặc nhảy sang một tiền tố không có bước cha.
- Sau khi tách/gộp một nhánh, kiểm tra lại toàn bộ số phía sau.

## 7. JWT phải đặt tại `3.1 Verify jwt`

Các endpoint có `@IsPublic()` không bắt buộc xác thực JWT. Các endpoint được bảo vệ dùng `ref 3.1 Verify jwt` theo quy ước của bộ sơ đồ.

Theo `AuthGuard` hiện tại:

| Điều kiện | Kết quả |
|---|---|
| Không có Bearer token | 401 |
| Xác minh JWT thất bại | 401 |
| Payload không có `sessionId` | 401 |
| Không tìm thấy session theo `sessionId` và `userId` | 401 |
| User bị ban hoặc đã bị xóa | 403 |
| JWT hợp lệ, session tồn tại, user hoạt động | Gắn payload vào request và tiếp tục |

`PermissionGuard` là bước kiểm tra riêng: thiếu `roleId` hoặc không có quyền với method/path thì trả 403.

Ví dụ cách đặt số trong phần xác thực:

```text
3. Send protected request
ref 3.1 Verify jwt
  alt [authentication fails]
    3.1.1.1. Return 401
    3.1.1.2. Display authentication error
  else [user is banned or deleted]
    3.1.2.1. Return 403
    3.1.2.2. Display forbidden message
  else [authentication succeeds]
    3.1.3.1. Attach JWT payload and continue
ref 3.2 PermissionGuard
```

Đây là quy ước đánh số của bộ sơ đồ, không phải quy tắc bắt buộc của UML. Khi bố trí request theo mẫu khác, cần giữ được thứ tự thực thi thực tế của guards, validation và controller.

## 8. Self-call có activation bar theo mẫu XML

Đoạn dưới là một fragment minh họa để ghép vào `<root>` đang có. `parent="1"` phải tồn tại và `target` phải trỏ tới đúng activation bar. Tọa độ phải chỉnh lại theo lifeline của sơ đồ đang vẽ.

```xml
<mxCell id="self_activation" value=""
  style="html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;newEdgeStyle={&quot;curved&quot;:0,&quot;rounded&quot;:0};fontSize=13;"
  vertex="1" parent="1">
  <mxGeometry x="920" y="2515" width="10" height="20" as="geometry"/>
</mxCell>

<mxCell id="self_call"
  value="20. Handle update&lt;div&gt;result&lt;/div&gt;"
  style="html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;fontSize=12;"
  edge="1" target="self_activation" parent="1">
  <mxGeometry x="0.3" y="-75" relative="1" as="geometry">
    <mxPoint x="925" y="2495" as="sourcePoint"/>
    <mxPoint x="930" y="2515" as="targetPoint"/>
    <Array as="points">
      <mxPoint x="965" y="2495"/>
      <mxPoint x="965" y="2520"/>
    </Array>
    <mxPoint x="75" y="75" as="offset"/>
  </mxGeometry>
</mxCell>
```

Thanh activation phải nằm trên lifeline được gọi, không bị trôi sang lifeline kế bên. Mũi tên phải kết thúc tại thanh đó. Không chỉ vẽ một đường vòng mà bỏ thanh activation.

## 9. Xuống dòng và bố cục

Trong thuộc tính XML `value`, HTML cần được escape đúng **một lần** và cell phải có `html=1`:

```xml
<mxCell value="Handle update&lt;div&gt;result&lt;/div&gt;"
  style="text;html=1;whiteSpace=wrap;"/>
```

Khi draw.io đọc XML, `&lt;div&gt;` trở thành thẻ `<div>` để xuống dòng. Nếu escape thành `&amp;lt;div&amp;gt;`, draw.io có thể hiển thị nguyên văn thẻ. Không sửa bằng cách chèn thêm nhiều lớp escape.

Khi chỉnh bố cục:

- Giữ background mặc định của draw.io.
- Căn các lifeline kết thúc cùng độ cao.
- Dành một khoảng riêng cho tên guard và đầu khối `alt`.
- Cho nested `alt` nằm hoàn toàn trong nhánh cha.
- Đường phân cách hai nhánh là nét đứt **không đầu mũi tên**.
- Ngắt dòng tên method hoặc điều kiện dài; tăng khoảng cách lifeline nếu cần.
- Không để chữ, cạnh khối `alt` hay nhãn `ref` đè lên activation bar.

## 10. Xuất SVG/PDF bằng draw.io

Chạy từ thư mục gốc `D:\Do-an\frevia-clone`:

```powershell
$diagram = 'docs/Report 4/images/sprint1/nhuy/sequences/UC-09.05-delete-portfolio.drawio'
$outputPdf = 'docs/Report 4/images/sprint1/nhuy/sequences/UC-09.05-delete-portfolio.pdf'
$outputSvg = 'docs/Report 4/images/sprint1/nhuy/sequences/UC-09.05-delete-portfolio.svg'

& 'C:\Program Files\draw.io\draw.io.exe' -x -f pdf --crop -o $outputPdf $diagram
& 'C:\Program Files\draw.io\draw.io.exe' -x -f svg -o $outputSvg $diagram
```

`--crop` giúp PDF theo kích thước sơ đồ. Kiểm tra file đầu ra thực sự tồn tại và thời gian sửa đổi đã cập nhật. Trong môi trường Codex, biến `ELECTRON_RUN_AS_NODE=1` có thể làm draw.io chạy sai chế độ; khi gặp lỗi này cần chạy ứng dụng với biến đó được loại khỏi môi trường của tiến trình con.

Sau khi xuất, mở **chính file `.drawio`** và kiểm tra thêm SVG/PDF. Việc XML hợp lệ không chứng minh rằng chữ hoặc các đường nối đã hiển thị đúng.

## 11. Chèn vào LaTeX

Ví dụ trong `sections/nhuy/2/sprint1.tex`:

```tex
\subsection{Portfolio Management}

\textbf{a.~Class Diagram}
\kfig{0.92\textwidth}
  {images/sprint1/nhuy/classDiagram/PortfolioManagement}
  {Class diagram of Portfolio Management}
  {fig:nhuy-class-PortfolioManagement}

\textbf{b.~Sequence Diagram(s)}
\subsubsection{UC-09.05 -- Delete Portfolio}
\kfig{0.88\textwidth}
  {images/sprint1/nhuy/sequences/UC-09.05-delete-portfolio}
  {Sequence diagram of UC-09.05 Delete Portfolio}
  {fig:nhuy-seq-UC-09.05-delete-portfolio}
```

Không thêm đuôi `.pdf` vào tham số đường dẫn của `\kfig`. Label phải duy nhất trong toàn báo cáo. Với sơ đồ dài, kiểm tra thêm trang PDF của report vì hình có thể bị thu nhỏ quá mức; có thể tách interaction phụ bằng `ref` nếu vẫn giữ được logic và định nghĩa đầy đủ phần được tham chiếu.

Phần đặc tả lớp đặt ở `sections/nhuy/4/sprint<N>.tex`, dùng `ClassMethodTable` và `ClassAttributeTable` như mẫu tthuan. Khi thay đổi chữ ký phương thức trong hình, kiểm tra lại bảng đặc tả tương ứng.

## 12. Checklist trước khi bàn giao

- [ ] Mỗi bước có căn cứ từ Controller, Service, Repository hoặc thành phần thực sự được gọi.
- [ ] Các method, endpoint, tham số và HTTP status đúng với code.
- [ ] Repo nối tới PrismaService; không bỏ tầng này.
- [ ] Phân biệt hard-delete, soft-delete, transaction và cập nhật chờ duyệt.
- [ ] Guard của `alt` đúng với điều kiện trong code; không thêm nhánh lỗi giả.
- [ ] Nhánh lỗi kết thúc đúng, không chạy tiếp luồng thành công.
- [ ] Message và return được đánh số duy nhất, liên tục trong từng cấp.
- [ ] Nested `alt` kế thừa đúng tiền tố của bước cha.
- [ ] Endpoint public không bị thêm bước bắt buộc JWT.
- [ ] `3.1 Verify jwt` có đủ kết quả 401, 403 và tiếp tục thành công.
- [ ] Self-call có activation bar theo mẫu và mũi tên nối đúng.
- [ ] Không có `undefined`, thẻ HTML hiện nguyên văn, chữ bị cắt hoặc bị che.
- [ ] Lifeline, thanh activation, các khối và đường nối đã được kiểm tra bằng draw.io.
- [ ] Bản nguồn, bản trong Report 4, SVG, PDF và đường dẫn `\kfig` đã đồng bộ.
- [ ] Chỉ sửa các file thuộc phạm vi được yêu cầu.

## 13. Mẫu yêu cầu để dùng lại

```text
Hãy vẽ/rà soát các sequence diagram sau: [danh sách UC].

File mẫu: [đường dẫn các file draw.io mẫu].
File được phép sửa: [liệt kê cụ thể].
Source code dùng để đối chiếu: [controller, service, repository, guards, DTO/schema].

Giữ bố cục và background theo mẫu. Đọc code trước khi vẽ; không suy đoán bước xử lý.
Dùng Repo → PrismaService → Database. Các điều kiện phải phản ánh code thực tế.
Đánh số phân cấp theo nhánh và nested alt; Verify jwt mang số 3.1.
Self-call có activation bar đúng mẫu XML. Return dùng nét đứt.
Sửa lỗi xuống dòng HTML và tránh chữ, activation bar, alt chồng lấn.
Mở/render bằng draw.io để kiểm tra; không chỉ kiểm tra cú pháp XML.
Đồng bộ các bản sao và file xuất trong phạm vi được cho phép.
Báo rõ phần đã sửa và phần chưa xác minh được.
```
