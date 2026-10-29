# Report 4 — Software Design Document (Frevia)

Cấu trúc giống **Report 3** (cùng `main.tex`, `cover.tex`, `table_of_contents.tex`, thư mục `sections/`, `images/`).

## Cách build

```powershell
cd "docs\Report 4"
latexmk -pdf main.tex
```

Hoặc: `pdflatex main.tex` chạy 2 lần (để cập nhật mục lục).

## Cấu trúc nội dung

| Mục | File | Nội dung |
|---|---|---|
| 1 | `sections/1.Overall_Description.tex` | Assumptions, Design Constraints, Technology Suggestion |
| 2 | `sections/2.System_Architecture_Design.tex` | Overall Architecture, System Architecture (31 route modules), Package Diagram |
| 3 | `sections/3.System_Detailed_Design.tex` | System Detailed Design — điều hướng vào `sections/<member>/sprint<N>.tex` |
| 3.1 | `sections/kvy/sprint1.tex` | **Sprint 1 — Community Forum, 17 chức năng** (mỗi chức năng có *a. Class Diagram* + *b. Sequence Diagram(s)*) |
| 4 | `sections/4.Class_Specification.tex` | Quy ước class, class spec module forum, entity catalog (64 model Prisma) |

### 17 chức năng sprint 1 (member kvy)

View Forum Category List · View Forum Category Detail · View Post List · View Post Detail ·
Create Post · Update Post · Delete Post · Like Post · Unlike Post · View Post Likes ·
View Post Comments · Create Comment · Update Comment · Delete Comment · Like Comment ·
Unlike Comment · Report Content

## Hình ảnh

```
images/sprint1/kvy/sequences/<TenFile>.svg   -> .pdf (vector)
images/sprint1/kvy/classDiagram/<Ten Chuc Nang>.svg -> .pdf (vector)
```

- Nguồn là các file **SVG** (export từ draw.io, đã chỉnh theme sáng).
- `pdflatex` không chèn trực tiếp SVG được, nên mỗi SVG được xuất sang **PDF vector**
  (giữ nguyên đường nét và chữ, **zoom không bị vỡ nét**) và LaTeX chèn PDF đó.
  Không dùng PNG nữa.
- Macro `\kfig{width}{path-không-đuôi}{caption}{label}` trong `main.tex`:
  ưu tiên `<path>.pdf`, sau đó `<path>.png`, nếu chưa có thì in khung
  *"Diagram pending export"* — nhờ vậy tài liệu **luôn compile được** dù thiếu hình.

### Xuất lại PDF vector sau khi sửa SVG

Script `tools/svg2pdf.js` dùng Chrome headless in SVG ra PDF 1 trang, đúng kích thước,
không lề, và tự ép **light theme** (giải `light-dark(light, dark)` về nhánh sáng):

```powershell
cd "docs\Report 4"

# một file
node tools/svg2pdf.js "images/sprint1/kvy/sequences/PostList.svg"

# toàn bộ diagram của sprint 1
$svgs = Get-ChildItem "images\sprint1\kvy\sequences","images\sprint1\kvy\classDiagram" -Filter *.svg |
        ForEach-Object { $_.FullName }
node tools/svg2pdf.js @svgs
```

Yêu cầu: Google Chrome (mặc định `C:\Program Files\Google\Chrome\Application\chrome.exe`,
có thể override bằng biến môi trường `CHROME_PATH`) và Node.js.

Kiểm tra nhanh một PDF xuất ra: `pdfinfo` phải báo `Pages: 1`, `pdfimages -list`
không có dòng nào (tức là 100% vector), `pdffonts` có font nhúng.

### Hình kiến trúc

`images/architecture/*` (overall architecture, system architecture, package diagram,
`restful-api`) hiện là placeholder — thêm file `.pdf` (vector) hoặc `.png` cùng tên
là hình tự hiện.

## Thêm sprint của thành viên khác

1. Tạo `sections/<member>/sprint<N>.tex`.
2. Trong đó khai báo `\subsection{...}` và các `\subsubsection{<Tên chức năng>}`, mỗi chức năng gồm
   `\textbf{a.~Class Diagram}`, `\textbf{b.~Sequence Diagram(s)}` và các lệnh `\kfig`.
3. Thêm dòng `\input{sections/<member>/sprint<N>}` vào `sections/3.System_Detailed_Design.tex`.
4. Đặt hình vào `images/sprint<N>/<member>/{sequences,classDiagram}/`.

## Lưu ý

- Bảng đặc tả class của forum nằm ở mục 4.2 (mục 3 chỉ gồm a. Class Diagram và b. Sequence Diagram(s)).
