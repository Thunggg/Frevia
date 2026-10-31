# Report 4 — Software Design Document (Frevia)

Cấu trúc giống **Report 3** (cùng `main.tex`, `cover.tex`, `table_of_contents.tex`, thư mục `sections/`, `images/`).

## Cách build

```powershell
cd "docs\Report 4"
latexmk -pdf main.tex
```

Hoặc: `pdflatex main.tex` chạy 2 lần (để cập nhật mục lục).

## Trang bìa và front matter (giống mẫu)

| Thành phần | File | Ghi chú |
|---|---|---|
| Bìa | `cover.tex` | Logo 7.5 cm, "Capstone Project Report", "Report 4 -- Software Design Document", "-- Can Tho, October 2026 --". Cùng khuôn với Report 1 / Report 3; danh sách thành viên và giảng viên hướng dẫn không đặt trên bìa (nằm ở Report 1). |
| Mục lục | `table_of_contents.tex` | Bắt đầu từ trang 2 (`\setcounter{page}{2}` sau bìa). |
| I. Record of Changes | `sections/record_of_changes.tex` | Bảng Date / A*M, D / In charge / Change Description. |
| II. Software Design Document | `main.tex` (`\part{...}`) | Mở đầu phần nội dung, trước chương 1. |

Cách đánh số bám mẫu: `I.` / `II.` cho part, `1.` cho chương, `1.1` và `1.1.1` cho mục con
(`\titleformat` + `\renewcommand{\thesection}` trong `main.tex`). Hai nhãn **Package
Descriptions** (1.2) và **Table Descriptions** (2.1) để dạng tiêu đề không số
(`\subsubsection*{}` / `\subsection*{}`), đúng như file mẫu.

## Cấu trúc nội dung

| Mục | File | Nội dung |
|---|---|---|
| 1 | `sections/1.System_Design.tex` | **1.1 System Architecture** (3-tier + layered + bảng 31 route module + 2 hình), **1.2 Package Diagram** (+ hình + bảng *Package Descriptions*), **1.3** Assumptions & Risks, **1.4** Design Constraints, **1.5** Technology Stack (+ hình REST) |
| 2 | `sections/2.Database_Design.tex` | **2.1 Table Relationships** (9 nhóm bảng), nhãn **Table Descriptions** (64 bảng Prisma: mô tả + *Primary keys* + *Foreign keys*) + ERD (`images/database/erd.pdf`) |
| 3 | `sections/3.Detailed_Design.tex` | **Detailed Design** — điều hướng vào `sections/<member>/2/sprint<N>.tex` |
| 3.1 | `sections/kvy/2/sprint1.tex` | **Sprint 1 — Forum Management (UC-14)**: 1 class diagram + 17 sequence diagram |
| 3.7 | `sections/kvy/2/sprint2.tex` | **Sprint 2 — Manage Conversation (UC-27)**: 1 class diagram + 8 sequence diagram |
| 3.13 | `sections/kvy/2/sprint3.tex` | **Sprint 3 — Manage Moderation (UC-34), Manage ID Verification (UC-35), Manage Forum Trash (UC-36)**: mỗi module 1 class diagram + các sequence diagram |
| 4 | `sections/4.Class_Specification.tex` | Quy ước class, class spec module forum, entity catalog (64 model Prisma) — chương bổ sung ngoài sample |

Thứ tự và cách đánh số chương bám theo `sample/Report4_Software Design Document.docx`
(1 System Design → 1.1 / 1.2, 2 Database Design, 3 Detailed Design → 3.x.1 Class Diagram,
3.x.2/.3 … sequence diagram). Phần Assumptions, Design Constraints, Technology Stack
giữ nguyên nội dung cũ nhưng được gộp vào cuối chương 1 thành 1.3 – 1.5.

Mỗi module gồm 1 `\subsection`, một `\subsubsection{Class Diagram}` (3.x.1)
chứa class diagram cấp module, rồi các `\subsubsection{UC-xx.yy -- ...}` (3.x.2, 3.x.3, …)
chứa sequence diagram — cùng khuôn với các module của member khác.

### Các UC của member kvy

| Module | UC | Số sequence |
|---|---|---|
| Forum Management | UC-14.01 … UC-14.17 | 17 |
| Manage Conversation | UC-27.01 … UC-27.08 | 8 |
| Manage Moderation | UC-34.01 … UC-34.03 | 3 |
| Manage ID Verification | UC-35.01 … UC-35.04 | 4 |
| Manage Forum Trash | UC-36.01 … UC-36.03 | 3 |

## Hình ảnh

```
images/sprint<N>/kvy/sequences/UC-<xx>.<yy>-<ten-uc>.svg   -> .pdf (vector)
images/sprint<N>/kvy/classDiagram/<TenModule>.svg          -> .pdf (vector)
```

- Sequence diagram lấy từ `sequence-diagrams/UC-<xx>.<yy>-<ten-uc>.drawio`.
- Class diagram cấp module lấy từ `class-diagrams/UC-<xx>_<TenModule>_Class_Diagram.drawio`
  (`ForumManagement`, `ManageConversation`, `ManageModeration`, `ManageIDVerification`,
  `ManageForumTrash`).

- Nguồn là các file **SVG** (export từ draw.io, đã chỉnh theme sáng).
- `pdflatex` không chèn trực tiếp SVG được, nên mỗi SVG được xuất sang **PDF vector**
  (giữ nguyên đường nét và chữ, **zoom không bị vỡ nét**) và LaTeX chèn PDF đó.
  Không dùng PNG nữa.
- Macro `\kfig{width}{path-không-đuôi}{caption}{label}` trong `main.tex`:
  ưu tiên `<path>.pdf`, sau đó `<path>.png`, nếu chưa có thì in khung
  *"Diagram pending export"* — nhờ vậy tài liệu **luôn compile được** dù thiếu hình.

### Xuất SVG từ draw.io

Class/sequence diagram nguồn là file `.drawio`; xuất sang SVG (light theme, cắt theo nội dung)
bằng draw.io desktop CLI rồi mới chuyển sang PDF:

```powershell
cd "docs\Report 4"
& "C:\Program Files\draw.io\draw.io.exe" -x -f svg --theme light --size diagram `
    -o "images\sprint3\kvy\classDiagram\ManageForumTrash.svg" `
    "..\..\class-diagrams\UC-36_Manage_Forum_Trash_Class_Diagram.drawio"
node tools/svg2pdf.js "images\sprint3\kvy\classDiagram\ManageForumTrash.svg"
```

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

Bốn hình của chương 1 (`overall-architecture`, `system-architecture`, `package-diagram`,
`restful-api`) được **sinh tự động** từ `tools/arch_diagrams.js` (SVG thuần, không cần
draw.io), rồi xuất sang PDF vector bằng `tools/svg2pdf.js`:

```powershell
cd "docs\Report 4"
node tools/arch_diagrams.js
node tools/svg2pdf.js "images/architecture/overall-architecture.svg" `
    "images/architecture/system-architecture.svg" `
    "images/architecture/package-diagram.svg" `
    "images/architecture/restful-api.svg"
```

Muốn sửa nội dung/chữ của hình thì sửa trong `tools/arch_diagrams.js` (mỗi hình là một
hàm, toạ độ tính theo lưới 1000 đơn vị) rồi chạy lại hai lệnh trên. Không sửa trực tiếp
file `.svg`/`.pdf` vì lần sinh sau sẽ ghi đè.

`images/database/erd.pdf` là ERD toàn bộ schema, copy từ `Report 3/image/ERD/ERD-ALL.drawio.pdf`.

## Thêm sprint của thành viên khác

1. Tạo `sections/<member>/2/sprint<N>.tex`.
2. Trong đó khai báo `\subsection{...}` (3.x) rồi `\subsubsection{Class Diagram}` (3.x.1) và các
   `\subsubsection{UC-xx.yy -- <Tên chức năng>}`, mỗi mục chứa một lệnh `\kfig`.
3. Thêm dòng `\input{sections/<member>/2/sprint<N>}` vào `sections/3.Detailed_Design.tex`.
4. Đặt hình vào `images/sprint<N>/<member>/{sequences,classDiagram}/`.

## Lưu ý

- Bảng đặc tả class của forum nằm ở mục 4.2 (mục 3 chỉ gồm a. Class Diagram và b. Sequence Diagram(s)).
