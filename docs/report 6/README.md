# Hướng Dẫn & Đặc Tả Dự Án Viết Report 6 (Software User Guides)
> **Dành cho AI Agent & Kỹ sư kỹ thuật (Technical Writer) - Đồ án tốt nghiệp Capstone Project tại FPT University**

Tài liệu này cung cấp toàn bộ thông tin hệ thống, kiến trúc công nghệ, các vai trò người dùng, đặc tả 12 luồng nghiệp vụ (Workflows), và quy chuẩn định dạng LaTeX để sinh nội dung hoàn chỉnh cho file [`Report6_Software_User_Guides.tex`](./Report6_Software_User_Guides.tex).

---

## 1. Thông Tin Tổng Quan Về Dự Án (Project Metadata)

- **Tên dự án:** Frevia – Verified Freelance Marketplace Platform
- **Mã đề tài (Project Code):** `SEP490_04`
- **Đơn vị đào tạo:** Trường Đại học FPT (FPT University - Can Tho Campus)
- **Giảng viên hướng dẫn (Supervisor):** ThS. Cao Hồng Nga (`ngach@fe.edu.vn`)
- **Nhóm sinh viên thực hiện (Capstone Team):**
  1. **Phạm Khả Vy** - MSSV: `CE182254` (Email: `vypkce182254@fpt.edu.vn`)
  2. **Trần Phát Tài** - MSSV: `CE181632` (Email: `taitpce181632@fpt.edu.vn`)
  3. **Nguyễn Tiến Thuận** - MSSV: `CE181024` (Email: `thuanntce181024@fpt.edu.vn`)
  4. **Võ Nhựt Tín** - MSSV: `CE180619` (Email: `tinvnce180619@fpt.edu.vn`)
  5. **Nguyễn Lư Nhật Huy** - MSSV: `CE181196` (Email: `huynlnce181196@fpt.edu.vn`)

---

## 2. Mô Tả Hệ Thống & Nền Tảng Kỹ Thuật (Architecture & Tech Stack)

### 2.1 Mô tả nghiệp vụ
**Frevia** là sàn giao dịch việc làm tự do tập trung vào tính **minh bạch, bảo mật và an toàn tài chính**, giải quyết triệt để các rủi ro gian lận danh tính và bùng tiền hợp đồng trên thị trường tự do. Hệ thống tích hợp:
- **Xác thực danh tính chuyên gia (ID Verification / eKYC):** Thẩm định căn cước công dân (CCCD)/Hộ chiếu và ảnh chân dung selfie qua quy trình kiểm duyệt nghiêm ngặt.
- **Hợp đồng & Thanh toán tạm giữ (Escrow Payment via Stripe):** Khách hàng nạp tiền ký quỹ vào hệ thống tạm giữ Stripe trước khi bắt đầu mốc công việc (Milestone). Tiền chỉ được giải ngân cho Freelancer khi Client nghiệm thu đạt chuẩn.
- **Cơ chế phân xử tranh chấp (Dispute Resolution):** Quản trị viên tiếp nhận bằng chứng, nhật ký trao đổi và phân xử hoàn tiền hoặc giải ngân khi hai bên xảy ra xung đột.
- **Diễn đàn chuyên môn (Community Forum):** Không gian giao lưu, chia sẻ bài viết kiến thức, hỏi đáp theo danh mục và có kiểm duyệt nội dung (Moderation).
- **Cổng quản trị đa vai trò (Admin Management Portal):** Quản lý người dùng, phân quyền RBAC, duyệt hồ sơ eKYC, quản lý danh mục công việc, kỹ năng, banner quảng cáo.

### 2.2 Công nghệ phát triển (Technology Stack)
- **Web Frontend:** Next.js 16.2.0 (App Router), React 19.2.0, TypeScript 5.9.2, Tailwind CSS 4.3.2, Base UI, Lucide Icons, Zod 4.4.3.
- **Backend API & Real-time:** NestJS 11.0.1, Socket.IO 4.8.3 (WebSocket Chat & Real-time Notifications), TypeScript 5.9.2.
- **Database & Caching:** PostgreSQL 16 (Neon Cloud / Local Container), Prisma ORM 7.8.0, Redis 7 (Session Cache).
- **Dịch vụ tích hợp bên thứ ba:**
  - **Stripe API (22.6.2):** Thanh toán thẻ tín dụng, Escrow Hold & Release, Payouts, Webhook events.
  - **Cloudinary:** Lưu trữ đám mây tài liệu eKYC, avatar, sản phẩm đính kèm portfolio.
  - **Gmail SMTP (Nodemailer):** Gửi mã OTP xác minh email khi đăng ký tài khoản.
- **Bảo mật & Quản trị:** JSON Web Tokens (JWT: Access Token 15m, Refresh Token 7d), Argon2id password hashing, Session Guard, Infisical Secret Manager.
- **Triển khai & Môi trường:** Turborepo monorepo, Docker Compose, Nginx.

---

## 3. Các Vai Trò Người Dùng (User Roles & Permissions)

1. **Guest / Visitor (Khách vãng lai):** Xem trang chủ, tìm kiếm danh sách việc làm, tìm kiếm hồ sơ chuyên gia, xem bài viết và bình luận trên diễn đàn công khai.
2. **Client / Employer (Nhà tuyển dụng):** Đăng tin tuyển dụng (Job Post), xem xét danh sách hồ sơ ứng tuyển (Proposals), phỏng vấn/trao đổi qua chat, ký hợp đồng, nạp tiền ký quỹ tạm giữ (Escrow Payment), nghiệm thu sản phẩm của từng milestone (Approve Deliverable), giải ngân tiền, gửi đánh giá (Review), và tạo khiếu nại tranh chấp (Dispute).
3. **Freelancer / Expert (Chuyên gia tự do):** Tạo hồ sơ năng lực chuyên môn (Expert Profile & Portfolio), gửi hồ sơ xác thực CCCD/eKYC để nhận huy hiệu Verified, tìm việc làm, nộp báo giá & đề xuất (Submit Proposal), nhận hợp đồng, nộp sản phẩm hoàn thành (Submit Deliverable), nhận tiền về ví, gửi đánh giá Client, tham gia thảo luận diễn đàn.
4. **Administrator (Quản trị viên hệ thống):** Quản lý toàn bộ người dùng (khóa/kích hoạt), phân quyền vai trò (Roles & Permissions RBAC), thẩm định và phê duyệt hồ sơ eKYC, quản lý Master Data (danh mục kỹ năng Skills, danh mục việc làm Job Categories, Banners quảng cáo), phân xử khiếu nại hợp đồng (Dispute Resolution).
5. **Moderator (Kiểm duyệt viên):** Giám sát nội dung bài viết/bình luận trên diễn đàn cộng đồng, tiếp nhận báo cáo vi phạm, đưa bài viết vi phạm vào Thùng rác (Trash) hoặc khôi phục bài viết.

---

## 4. Cấu Trúc Bắt Buộc Của Report 6 (Theo Mẫu LaTeX)

Tài liệu [`Report6_Software_User_Guides.tex`](./Report6_Software_User_Guides.tex) phải giữ đúng cấu trúc sau:

```
├── Trang bìa (Title Page) - Logo fpt_logo_r6.png, Title fptred, Hanoi/Can Tho 2026
├── Mục lục (Table of Contents, List of Tables, List of Figures)
├── I. Record of Changes (Bảng 4 cột: Date, A* M D, In charge, Change Description)
└── II. Release Package & User Guides
    ├── 1. Deliverable Package (Bảng liệt kê source, tài liệu, DB scripts, test reports...)
    ├── 2. Installation Guides
    │   ├── 2.1 System Requirements (Client, Server, Software, Network & Port mapping table)
    │   └── 2.2 Installation Instruction (Hướng dẫn cài đặt bằng Docker & Local PNPM)
    └── 3. User Manual
        ├── 3.1 Overview (Kiến trúc tổng quan & sơ đồ luồng hệ thống TikZ/Mermaid)
        ├── 3.2 Workflow 1: Authentication & Session Management
        ├── 3.3 Workflow 2: Freelancer Identity Verification (eKYC)
        ├── 3.4 Workflow 3: Expert Profile & Portfolio Setup
        ├── 3.5 Workflow 4: Job Posting & Search
        ├── 3.6 Workflow 5: Proposal Submission & Candidate Hiring
        ├── 3.7 Workflow 6: Contract Creation & Escrow Payment
        ├── 3.8 Workflow 7: Milestone Deliverable Submission & Fund Release
        ├── 3.9 Workflow 8: Contract Dispute Resolution
        ├── 3.10 Workflow 9: Ratings & Feedback
        ├── 3.11 Workflow 10: Real-time Messaging & Notifications
        ├── 3.12 Workflow 11: Community Forum & Content Moderation
        └── 3.13 Workflow 12: Admin System & Master Data Management
```

---

## 5. Đặc Tả Chi Tiết 12 Luồng Nghiệp Vụ (Detailed Workflows)

Mỗi mục Workflow trong **3. User Manual** bắt buộc phải trình bày đủ **5 phần con**:
1. **Purpose & Actors:** Mục đích của quy trình và các vai trò tham gia.
2. **Workflow Diagram:** Sơ đồ luồng (sử dụng khối môi trường TikZ hoặc mô tả chi tiết bằng flowchart).
3. **Step-by-step Instructions:** Các bước thao tác tuần tự (Step 1, Step 2, ...) ghi rõ tên nút bấm, trường nhập liệu, định dạng file, và kết quả mong đợi.
4. **User Interface Figures:** Khối chèn ảnh giao diện (`\begin{figure}[H] \includegraphics[width=0.85\linewidth]{figures/<tên>.png} \caption{...} \end{figure}`). Nếu chưa có ảnh, dùng placeholder khung mẫu.
5. **Notes & Troubleshooting:** Các lưu ý bảo mật, điều kiện tiên quyết và hướng dẫn khắc phục lỗi thường gặp.

---

### Workflow 1: Authentication & Session Management
- **Mục đích:** Hướng dẫn người dùng đăng ký tài khoản mới, xác thực OTP email, đăng nhập bảo mật và quản lý các thiết bị đang đăng nhập.
- **Vai trò:** Guest, Client, Freelancer, Admin, Moderator.
- **Các bước chính:**
  - *Step 1 (Đăng ký):* Truy cập `/register`, chọn vai trò (Client hoặc Freelancer), nhập Email, Mật khẩu (tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số), Họ và tên, tick chấp thuận Điều khoản $\rightarrow$ bấm nút **"Sign Up"**.
  - *Step 2 (Xác thực OTP):* Hệ thống gửi mã OTP gồm 6 chữ số đến email. Người dùng nhập mã OTP vào trang `/verify-otp` $\rightarrow$ bấm **"Verify Account"**.
  - *Step 3 (Đăng nhập):* Truy cập `/login`, nhập Email và Mật khẩu (hoặc bấm **"Sign in with Google"**) $\rightarrow$ bấm **"Log In"**. Hệ thống cấp phát cặp Access Token (JWT) và Refresh Token trong HTTP-Only cookie.
  - *Step 4 (Quản lý phiên thiết bị):* Vào mục **Settings $\rightarrow$ Active Sessions**, xem danh sách IP, trình duyệt, thời gian đăng nhập. Người dùng có thể bấm **"Revoke Session"** để đăng xuất từ xa khỏi thiết bị lạ.
- **Lưu ý & Lỗi:** Mã OTP hết hạn sau 5 phút. Sai mật khẩu quá 5 lần sẽ tạm khóa đăng nhập trong 15 phút.

---

### Workflow 2: Freelancer Identity Verification (eKYC)
- **Mục đích:** Xác thực thông tin cá nhân của Freelancer bằng giấy tờ tùy thân (CCCD/Hộ chiếu) để cấp huy hiệu "Verified Badge", gia tăng độ tin cậy.
- **Vai trò:** Freelancer (gửi hồ sơ) & Administrator (thẩm định).
- **Các bước chính:**
  - *Step 1:* Freelancer đăng nhập, truy cập **Profile $\rightarrow$ ID Verification**.
  - *Step 2:* Chọn loại giấy tờ (Citizen Identity Card hoặc Passport).
  - *Step 3:* Tải lên ảnh mặt trước (Front ID), ảnh mặt sau (Back ID) và ảnh chân dung chụp cùng giấy tờ (Selfie with ID). Hệ thống kiểm tra dung lượng tối đa 5MB, định dạng PNG/JPEG.
  - *Step 4:* Nhập số CCCD/Passport, ngày cấp, nơi cấp $\rightarrow$ bấm **"Submit Verification Request"**. Trạng thái chuyển thành `PENDING`.
  - *Step 5 (Admin Review):* Admin truy cập **Admin Portal $\rightarrow$ ID Verifications**. Mở xem chi tiết hồ sơ, đối chiếu ảnh và số CCCD.
  - *Step 6:* Admin bấm **"Approve"** để xác nhận hoặc **"Reject"** (nhập lý do từ chối như: ảnh mờ, sai thông tin).
- **Kết quả:** Freelancer được duyệt sẽ hiển thị huy hiệu Verified xanh lá trên toàn bộ hồ sơ và báo giá proposal.

---

### Workflow 3: Expert Profile & Portfolio Setup
- **Mục đích:** Freelancer hoàn thiện hồ sơ nghề nghiệp để thu hút khách hàng tiềm năng.
- **Vai trò:** Freelancer.
- **Các bước chính:**
  - *Step 1:* Truy cập **Workspace $\rightarrow$ Expert Profile**.
  - *Step 2:* Cập nhật tiêu đề nghề nghiệp (Professional Title, ví dụ: "Senior Fullstack Developer"), tỷ giá làm việc ($/giờ), số năm kinh nghiệm, và phần tiểu sử (Bio).
  - *Step 3:* Chọn kỹ năng chuyên môn từ danh mục Master Skills (ví dụ: Next.js, NestJS, Docker, UI/UX Design).
  - *Step 4 (Tạo Portfolio Item):* Bấm nút **"Add Portfolio Item"**, điền tên dự án, đường dẫn live demo/GitHub, mô tả giải pháp công nghệ, và tải lên ảnh chụp màn hình dự án $\rightarrow$ bấm **"Save Project"**.
- **Lưu ý:** Hồ sơ có đầy đủ kỹ năng và portfolio sẽ được thuật toán gợi ý ưu tiên hiển thị trên trang tìm kiếm chuyên gia.

---

### Workflow 4: Job Posting & Search
- **Mục đích:** Khách hàng tạo tin tuyển dụng chi tiết; Freelancer tìm kiếm các dự án phù hợp với năng lực.
- **Vai trò:** Client (Đăng tin) & Freelancer (Tìm việc).
- **Các bước chính:**
  - *Step 1 (Client Post Job):* Client bấm nút **"Post a Job"** trên thanh điều hướng.
  - *Step 2:* Nhập tiêu đề công việc, chọn danh mục (Job Category, ví dụ: Web Development, Mobile Apps), nhập mô tả chi tiết yêu cầu kỹ thuật.
  - *Step 3:* Chọn loại ngân sách (Fixed Price hoặc Hourly), nhập số tiền ngân sách tối đa ($), thời hạn hoàn thành dự kiến (Deadline), và chọn các kỹ năng bắt buộc $\rightarrow$ bấm **"Publish Job"**.
  - *Step 4 (Freelancer Search Job):* Freelancer truy cập trang `/jobs`. Sử dụng thanh tìm kiếm theo từ khóa, bộ lọc danh mục (Category), mức ngân sách, và nhãn kỹ năng (Skills). Bấm vào từng tin để xem chi tiết yêu cầu.

---

### Workflow 5: Proposal Submission & Candidate Hiring
- **Mục đích:** Freelancer nộp báo giá cạnh tranh; Client so sánh các hồ sơ và lựa chọn người phù hợp nhất.
- **Vai trò:** Freelancer & Client.
- **Các bước chính:**
  - *Step 1 (Submit Proposal):* Freelancer tại trang chi tiết công việc bấm nút **"Submit Proposal"**.
  - *Step 2:* Nhập giá chào thầu (Bid Amount), thời gian giao hàng dự kiến (Delivery Time: số ngày), viết thư ngỏ (Cover Letter) trình bày kinh nghiệm, và đính kèm tài liệu giải pháp $\rightarrow$ bấm **"Send Proposal"**.
  - *Step 3 (Client Review):* Client truy cập **Job Management $\rightarrow$ Proposals**. Xem danh sách báo giá, so sánh giá cả, thời gian, điểm uy tín và portfolio của từng freelancer.
  - *Step 4:* Client có thể bấm **"Chat"** để trao đổi trước khi quyết định. Khi đồng ý, Client bấm nút **"Hire Freelancer"** để tiến hành lập hợp đồng.

---

### Workflow 6: Contract Creation & Escrow Payment
- **Mục đích:** Thiết lập hợp đồng dịch vụ và nạp tiền ký quỹ tạm giữ qua Stripe Escrow để bảo đảm quyền lợi cho cả hai bên.
- **Vai trò:** Client (Ký hợp đồng & Thanh toán) & Freelancer.
- **Các bước chính:**
  - *Step 1:* Sau khi bấm **"Hire"**, Client thiết lập hợp đồng với các mốc công việc (Milestones), ví dụ: Milestone 1 - Giao diện UI (40%), Milestone 2 - Hoàn thiện API và Tích hợp (60%).
  - *Step 2:* Client bấm **"Fund Milestone 1 via Stripe"**.
  - *Step 3:* Hệ thống hiển thị cổng thanh toán Stripe Checkout an toàn. Client nhập thông tin thẻ tín dụng (Visa, MasterCard) và bấm **"Pay Now"**.
  - *Step 4:* Sau khi Stripe xác nhận thanh toán thành công qua Webhook, số tiền được khóa an toàn trong tài khoản Escrow của hệ thống. Trạng thái hợp đồng chuyển sang `ACTIVE`, thông báo cho Freelancer bắt đầu triển khai công việc.

---

### Workflow 7: Milestone Deliverable Submission & Fund Release
- **Mục đích:** Freelancer bàn giao sản phẩm của mốc công việc; Client kiểm tra nghiệm thu và kích hoạt giải ngân tiền từ quỹ tạm giữ.
- **Vai trò:** Freelancer & Client.
- **Các bước chính:**
  - *Step 1 (Submit Deliverable):* Freelancer truy cập **Active Contracts $\rightarrow$ View Milestones**. Tại mốc hiện tại, bấm **"Submit Work"**.
  - *Step 2:* Điền nội dung báo cáo hoàn thành, đính kèm file nén mã nguồn hoặc liên kết sản phẩm (Git repo, preview URL) $\rightarrow$ bấm **"Submit Deliverable"**. Trạng thái milestone chuyển thành `IN_REVIEW`.
  - *Step 3 (Client Inspection):* Client nhận thông báo và truy cập hợp đồng để kiểm tra sản phẩm bàn giao.
  - *Step 4 (Approve or Request Revision):*
    - Nếu sản phẩm chưa đạt yêu cầu: Client bấm **"Request Revision"**, nhập ghi chú chỉnh sửa để Freelancer làm lại.
    - Nếu sản phẩm đạt chuẩn: Client bấm **"Approve & Release Payment"**.
  - *Step 5:* Hệ thống tự động kích hoạt Stripe Payout giải ngân toàn bộ số tiền của milestone từ quỹ ký quỹ Escrow vào số dư ví của Freelancer.

---

### Workflow 8: Contract Dispute Resolution
- **Mục đích:** Xử lý và hòa giải bất đồng khi một trong hai bên vi phạm thỏa thuận hợp đồng.
- **Vai trò:** Client, Freelancer, Administrator.
- **Các bước chính:**
  - *Step 1:* Khi không đạt được thỏa thuận nghiệm thu, Client hoặc Freelancer bấm nút **"Open Dispute"** tại trang chi tiết hợp đồng.
  - *Step 2:* Chọn lý do tranh chấp (Chất lượng không đạt, chậm tiến độ, không liên lạc được, yêu cầu ngoài hợp đồng), tải lên các tài liệu chứng cứ và bản ghi trao đổi $\rightarrow$ bấm **"Submit Dispute"**. Trạng thái hợp đồng chuyển thành `DISPUTED` và toàn bộ quỹ Escrow bị đóng băng.
  - *Step 3 (Admin Investigation):* Admin truy cập **Admin Portal $\rightarrow$ Dispute Cases**. Mở hồ sơ tranh chấp, kiểm tra điều khoản hợp đồng, sản phẩm deliverable đã nộp, lịch sử tin nhắn giữa hai bên.
  - *Step 4 (Resolution Decision):* Admin đưa ra phán quyết chính thức:
    - **Refund to Client:** Hoàn trả tiền ký quỹ lại cho khách hàng (nếu freelancer không thực hiện công việc).
    - **Release to Freelancer:** Giải ngân tiền cho freelancer (nếu khách hàng vô cớ từ chối nghiệm thu hợp lệ).
    - **Partial Settlement:** Phân chia theo tỷ lệ thỏa thuận.
  - *Step 5:* Hệ thống thực hiện hoàn tất giao dịch tài chính tương ứng và đóng vụ việc tranh chấp (`RESOLVED`).

---

### Workflow 9: Ratings & Feedback
- **Mục đích:** Khách hàng và Freelancer chấm điểm uy tín và nhận xét lẫn nhau sau khi kết thúc hợp đồng.
- **Vai trò:** Client & Freelancer.
- **Các bước chính:**
  - *Step 1:* Khi hợp đồng hoàn tất hoặc được đóng lại, hệ thống hiển thị form **"Leave Feedback"**.
  - *Step 2:* Người dùng chấm điểm từ 1 đến 5 sao theo các tiêu chí: Chất lượng công việc (Quality), Kỹ năng giao tiếp (Communication), Đúng hạn (Timeliness).
  - *Step 3:* Nhập đoạn nhận xét bằng lời (Public Review Feedback) $\rightarrow$ bấm **"Submit Review"**.
  - *Step 4:* Đánh giá được hiển thị công khai trên trang cá nhân của đối tác và tự động tính vào điểm uy tín trung bình (Overall Rating).

---

### Workflow 10: Real-time Messaging & Notifications
- **Mục đích:** Trao đổi công việc tức thì qua chat và nhận thông báo cập nhật tiến độ theo thời gian thực.
- **Vai trò:** Client & Freelancer.
- **Các bước chính:**
  - *Step 1:* Bấm vào biểu tượng **Chat** trên thanh điều hướng để mở danh sách hội thoại.
  - *Step 2:* Chọn người nhận, gõ nội dung tin nhắn, đính kèm hình ảnh hoặc tài liệu $\rightarrow$ bấm nút gửi (hoặc phím Enter). Tin nhắn được đồng bộ tức thời qua Socket.IO.
  - *Step 3:* Biểu tượng **Notification (Chuông)** trên thanh header tự động hiển thị số lượng thông báo chưa đọc khi có sự kiện: Nhận proposal mới, tiền ký quỹ đã nạp, milestone đã được duyệt, hoặc có tin nhắn mới.

---

### Workflow 11: Community Forum & Content Moderation
- **Mục đích:** Tạo môi trường kết nối cộng đồng người làm nghề tự do; kiểm duyệt và bảo vệ môi trường thảo luận lành mạnh.
- **Vai trò:** Thành viên cộng đồng (Member/Client/Freelancer) & Moderator.
- **Các bước chính:**
  - *Step 1 (Member Post):* Thành viên truy cập `/forum`, chọn danh mục chủ đề (ví dụ: Kinh nghiệm Freelance, Tuyển dụng nhanh, Thảo luận công nghệ) $\rightarrow$ bấm **"Create New Post"**.
  - *Step 2:* Nhập tiêu đề, soạn nội dung bằng trình soạn thảo Markdown, gắn thẻ tags $\rightarrow$ bấm **"Publish Post"**.
  - *Step 3 (Interact):* Các thành viên khác có thể bấm Upvote, để lại bình luận trao đổi, hoặc bấm **"Report"** nếu thấy nội dung vi phạm.
  - *Step 4 (Moderation):* Moderator truy cập **Moderation Dashboard**. Xem danh sách các bài viết bị báo cáo vi phạm tiêu chuẩn cộng đồng.
  - *Step 5:* Moderator có thể bấm **"Move to Trash"** để ẩn bài viết khỏi diễn đàn. Khi cần xem lại hoặc khôi phục, Moderator truy cập mục **Forum Trash** và bấm **"Restore Post"**.

---

### Workflow 12: Admin System & Master Data Management
- **Mục đích:** Cung cấp công cụ quản trị tập trung cho Administrator để vận hành nền tảng toàn diện.
- **Vai trò:** Administrator.
- **Các bước chính:**
  - *User Management:* Xem danh sách toàn bộ người dùng, tìm kiếm theo email/tên, kích hoạt hoặc vô hiệu hóa tài khoản (`isActive = false`).
  - *Roles & Permissions (RBAC):* Cấu hình ma trận quyền hạn cho từng vai trò trong hệ thống.
  - *Skill Management:* Quản lý danh mục kỹ năng gốc: Thêm mới kỹ năng (Name, Slug, Description), cập nhật, xóa mềm (`deletedAt`), hoặc khôi phục kỹ năng.
  - *Job Category Management:* Quản lý các ngành nghề việc làm: Tạo mới category, cập nhật thông tin, kích hoạt/vô hiệu hóa, hoặc khôi phục danh mục bị xóa mềm.
  - *Banners Management:* Đăng tải banner quảng cáo trang chủ: Nhập tiêu đề, tải ảnh banner, gắn liên kết điều hướng (link URL), cấu hình ngày bắt đầu và kết thúc hiển thị.

---

## 6. Hướng Dẫn Cài Đặt & Triển Khai (Dùng Cho Section 2)

### 6.1 Bảng Cổng Dịch Vụ Mặc Định (Port Mapping Table)

| Component | Port | Production Exposure | Description |
|---|---|---|---|
| **Web Frontend (Client/Freelancer)** | `3003` (Container) / `3001` (Dev) | Public (HTTP/HTTPS) | Giao diện người dùng Next.js 16 |
| **Backend REST API & Gateway** | `3002` (Container) / `3000` (Dev) | Public via Reverse Proxy | API chính NestJS 11 & Socket.IO |
| **PostgreSQL Database** | `5432` | Internal Only | Cơ sở dữ liệu chính Prisma ORM |
| **Redis Cache** | `6379` | Internal Only | Quản lý phiên làm việc & bộ đệm |
| **Ollama AI Service** | `11434` | Internal Only | Dịch vụ AI hỗ trợ tóm tắt |

### 6.2 Các Bước Cài Đặt (Installation Steps)

```bash
# Bước 1: Sao chép mã nguồn từ repository
git clone https://github.com/frevia-platform/frevia-monorepo.git
cd frevia-monorepo

# Bước 2: Cài đặt các thư viện phụ thuộc bằng PNPM Monorepo
pnpm install

# Bước 3: Cấu hình biến môi trường
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Điền các biến DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, CLOUDINARY_API_KEY...

# Bước 4: Chạy migration cơ sở dữ liệu và seed dữ liệu ban đầu
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec pnpm seed:permissions
pnpm --filter api exec pnpm seed:job-categories
pnpm --filter api exec pnpm seed

# Bước 5: Khởi chạy toàn bộ hệ thống bằng Docker Compose
docker compose up -d --build

# Bước 6: Kiểm tra trạng thái các container
docker compose ps
```

---

## 7. Tài Khoản Demo Dùng Thử (Demo Credentials)

| Role | Email | Password | Mục đích kiểm thử |
|---|---|---|---|
| **Administrator** | `admin@frevia.local` | `Admin@123456` | Quản trị người dùng, duyệt eKYC, giải quyết tranh chấp, Master Data |
| **Moderator** | `moderator@frevia.local` | `Mod@123456` | Kiểm duyệt diễn đàn, xử lý bài viết Trash |
| **Client** | `client.demo@frevia.local` | `Client@123456` | Đăng tin tuyển dụng, nạp quỹ Stripe Escrow, nghiệm thu milestone |
| **Freelancer** | `freelancer.demo@frevia.local` | `Freelancer@123456` | Gửi eKYC, tạo portfolio, nộp proposal, bàn giao milestone deliverable |

---

## 8. Hướng Dẫn Biên Dịch LaTeX (Build Instructions)

Để biên dịch file [`Report6_Software_User_Guides.tex`](./Report6_Software_User_Guides.tex) ra PDF:

```powershell
# Chạy trong thư mục docs/report 6
cd "docs\report 6"

# Biên dịch lần 1 để tạo tệp .aux và cấu trúc bảng/hình
pdflatex -interaction=nonstopmode Report6_Software_User_Guides.tex

# Biên dịch lần 2 để cập nhật đầy đủ Table of Contents, Tables và Figures
pdflatex -interaction=nonstopmode Report6_Software_User_Guides.tex
```

> **Lưu ý quan trọng cho AI Agent khi sinh mã LaTeX:**
> - Tất cả các ký tự đặc biệt như `&`, `%`, `_`, `#`, `$` phải được escape đúng dạng: `\&`, `\%`, `\_`, `\#`, `\$`.
> - Dùng đúng bảng màu quy chuẩn của FPT: `\definecolor{fptred}{RGB}{192,0,0}`, `\definecolor{fptblue}{RGB}{46,117,181}`, `\definecolor{hdrfill}{RGB}{255,232,225}`.
> - Tiêu đề bảng (`\caption{...}`) luôn đặt **phía trên** bảng; tiêu đề hình ảnh luôn đặt **phía dưới** hình.

