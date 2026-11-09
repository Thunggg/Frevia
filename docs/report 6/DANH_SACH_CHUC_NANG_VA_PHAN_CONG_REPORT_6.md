# DANH SÁCH CHI TIẾT CÁC CHỨC NĂNG CẦN LÀM & BẢNG PHÂN CÔNG REPORT 6 (SOFTWARE USER GUIDES)

> **Dự án:** Frevia – AI-Powered Freelance Marketplace & Collaboration Platform  
> **Mã nhóm:** SEP490_04  
> **Mục tiêu tài liệu:** Liệt kê đầy đủ, chi tiết từ A–Z toàn bộ các mục, hướng dẫn cài đặt và tất cả các chức năng của hệ thống cần viết trong **Report 6 (Software User Guides)**, đồng thời phân chia công việc đều cho **5 thành viên** trong nhóm.

---

## MỤC LỤC
1. [I. Cấu trúc tổng thể của Report 6 & Quy chuẩn bắt buộc](#i-cấu-trúc-tổng-thể-của-report-6--quy-chuẩn-bắt-buộc)
2. [II. Danh sách chi tiết TẤT CẢ các phần & chức năng cần làm (Từ A đến Z)](#ii-danh-sách-chi-tiết-tất-cả-các-phần--chức-năng-cần-làm-từ-a-đến-z)
   - [PHẦN A: Đóng gói bàn giao & Hướng dẫn cài đặt hệ thống (Sections 1 & 2)](#phần-a-đóng-gói-bàn-giao--hướng-dẫn-cài-đặt-hệ-thống-sections-1--2)
   - [PHẦN B: Hướng dẫn sử dụng phần mềm theo từng Module & Actor (Section 3)](#phần-b-hướng-dẫn-sử-dụng-phần-mềm-theo-từng-module--actor-section-3)
3. [III. Bảng phân công chi tiết cho 5 thành viên nhóm SEP490_04](#iii-bảng-phân-công-chi-tiết-cho-5-thành-viên-nhóm-sep490_04)
4. [IV. Tổ chức thư mục ảnh & File LaTeX để làm việc nhóm không bị xung đột](#iv-tổ-chức-thư-mục-ảnh--file-latex-để-làm-việc-nhóm-không-bị-xung-đột)

---

## I. CẤU TRÚC TỔNG THỂ CỦA REPORT 6 & QUY CHUẨN BẮT BUỘC

### 1. Cấu trúc khung tài liệu (`Report6_Software_User_Guides.tex`)
Theo mẫu chuẩn của FPT University, Report 6 bao gồm các phần chính sau:
- **Cover Page & Table of Contents:** Trang bìa, Mục lục (`\tableofcontents`), Danh mục bảng (`\listoftables`), Danh mục hình ảnh (`\listoffigures`).
- **I. Record of Changes:** Bảng lịch sử thay đổi tài liệu (Date, A/M/D, In charge, Change Description).
- **II. Release Package & User Guides:**
  - **1. Deliverable Package:** Bảng liệt kê toàn bộ các gói sản phẩm bàn giao (Source code, Database scripts, AI Microservices, Docker Compose, Reports 1–7, Test cases, Slide thuyết trình).
  - **2. Installation Guides:**
    - **2.1 System Requirements:** Cấu hình phần cứng (Client/Server), phần mềm, và bảng ánh xạ cổng mạng (Port Mapping).
    - **2.2 Installation Instruction:** Hướng dẫn cài đặt từ máy trắng (chưa có gì) từ A–Z kèm ảnh chụp màn hình khoanh đỏ từng bước.
  - **3. User Manual:**
    - **3.1 Overview:** Tổng quan hệ thống, mô tả 5 nhóm người dùng (`Guest`, `Freelancer`, `Client`, `Expert`, `Admin`) và sơ đồ luồng tổng thể.
    - **3.2 – 3.17 Feature Workflows:** Hướng dẫn sử dụng chi tiết cho toàn bộ các chức năng của hệ thống.

---

### 2. Quy chuẩn 5 phần bắt buộc cho MỖI chức năng trong mục `3. User Manual`
Để tài liệu đồng nhất khi 5 thành viên cùng viết, **mọi chức năng** đều phải trình bày theo đúng 5 mục nhỏ sau:
1. **Mục đích & Vai trò sử dụng (Purpose & Target Role):**
   - Giải thích ngắn gọn chức năng dùng để làm gì, dành cho Actor nào (`Guest`, `Freelancer`, `Client`, `Expert`, `Admin`), và điều kiện tiên quyết (Pre-conditions, ví dụ: đã đăng nhập, tài khoản đã xác thực eKYC, Milestone đã nạp tiền Escrow...).
2. **Sơ đồ luồng thao tác (Workflow / Screen Transition):**
   - Mô tả ngắn luồng đi từ màn hình nào sang màn hình nào (hoặc vẽ sơ đồ TikZ/Draw.io cho từng nhóm chức năng lớn).
3. **Các bước thực hiện chi tiết (Step-by-Step Instructions):**
   - Đánh số thứ tự rõ ràng: **Step 1, Step 2, Step 3...**
   - Khớp chính xác với số thứ tự khoanh đỏ trên ảnh chụp màn hình:
     - **Bấm vào đâu:** Ghi rõ tên nút/menu trên giao diện (ví dụ: Nhấn nút **`Post a Job`** ở góc trên bên phải).
     - **Nhập dữ liệu gì:** Liệt kê các trường trong Form (tên trường, bắt buộc hay tùy chọn, định dạng hợp lệ, ví dụ: *Email*, *Password tối thiểu 8 ký tự*, *Budget > 0*).
     - **Kết quả mong đợi (Expected Result):** Hệ thống hiển thị thông báo Toast gì, chuyển hướng sang URL nào, trạng thái bản ghi đổi thành gì.
4. **Ảnh chụp màn hình minh họa (Annotated UI Screenshots):**
   - Phải có **khung khoanh đỏ (Red Bounding Box)** và **số thứ tự màu đỏ (`1`, `2`, `3`...)** kèm nhãn chữ chỉ dẫn nếu trong 1 màn hình có nhiều bước bấm.
   - Sử dụng dữ liệu thật, có ý nghĩa (không nhập `abc`, `test123`, `asdf`).
5. **Lưu ý & Xử lý lỗi thường gặp (Notes & Common Troubleshooting):**
   - Liệt kê các lỗi người dùng hay gặp (ví dụ: nhập sai định dạng, file quá dung lượng 5MB/10MB, chưa chọn checkbox đồng ý điều khoản, phiên đăng nhập hết hạn) và cách khắc phục.

---

## II. DANH SÁCH CHI TIẾT TẤT CẢ CÁC PHẦN & CHỨC NĂNG CẦN LÀM (TỪ A ĐẾN Z)

### PHẦN A: ĐÓNG GÓI BÀN GIAO & HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG (SECTIONS 1 & 2)

#### Hạng mục A1: Mục `I. Record of Changes` & `II.1 Deliverable Package`
- [ ] **A1.1 – Bảng Record of Changes:** Ghi nhận lịch sử tạo mới (A) và cập nhật (M) của cả 5 thành viên theo từng đợt review.
- [ ] **A1.2 – Bảng Deliverable Package (`II.1`):** Liệt kê đầy đủ 12 hạng mục bàn giao:
  1. Project Schedule & Tracking (`Project_Schedule.xlsx`)
  2. Product Backlog & Sprint Backlogs
  3. Monorepo Source Code (`apps/web`, `apps/api`, `packages/*`)
  4. AI Microservices Source Code (`ai-services/id-verification`, `ai-services/cv-matching`)
  5. Database Schema & Migrations (`apps/api/prisma/schema.prisma`, `migrations/`, `seed*.ts`)
  6. Docker & Orchestration Files (`docker-compose.yml`, `Dockerfile` cho Web, API, AI services)
  7. Report 1 – Project Introduction
  8. Report 2 – Project Management Plan
  9. Report 3 – Software Requirement Specification (SRS)
  10. Report 4 – Software Design Document (SDD)
  11. Report 5 – Testing Document & Unit/Integration Test Suites
  12. Report 6 – Software User Guides & Report 7 – Final Project Report + Slides

#### Hạng mục A2: Mục `II.2.1 System Requirements`
- [ ] **A2.1 – Yêu cầu phần cứng Client (Người dùng cuối):** CPU Dual-core+, RAM 4GB+ (khuyên dùng 8GB), Webcam (để chụp Selfie eKYC), Trình duyệt Chrome/Edge/Firefox/Safari bản mới nhất.
- [ ] **A2.2 – Yêu cầu phần cứng Server / Máy chạy môi trường Local Docker:** CPU 4 cores+ (khuyên dùng 8 cores), RAM tối thiểu 16GB (do chạy đồng thời Next.js, NestJS, PostgreSQL, Redis, Ollama LLM `qwen3:4b`, FastAPI CV-Matching và ID-Verification), ổ cứng trống tối thiểu 25GB SSD, GPU NVIDIA (tùy chọn để tăng tốc AI).
- [ ] **A2.3 – Yêu cầu phần mềm (Software Stack):** Windows 10/11 (WSL2) hoặc Ubuntu 22.04 LTS / macOS, Git, Node.js v22 LTS, PNPM v9+, Docker Desktop (Docker Engine v26+ & Docker Compose v2+), Python 3.10/3.11 (nếu chạy AI trực tiếp ngoài Docker).
- [ ] **A2.4 – Bảng ánh xạ cổng mạng (Network & Port Mapping Table):**
  - Web Frontend (`Next.js`): Host `3003` (Docker) / `3001` (Local) $\rightarrow$ Container `3001`
  - Backend API (`NestJS`): Host `3002` (Docker) / `3000` (Local) $\rightarrow$ Container `3000`
  - PostgreSQL Database: `5432`
  - Redis Cache & Queue: `6379`
  - Ollama LLM Server (`qwen3:4b`): `11434`
  - AI Service 1 – Section-Aware CV-Job Matching (`FastAPI`): `8000`
  - AI Service 2 – ID Verification eKYC (`FastAPI` + YOLO/InsightFace/PaddleOCR): `8001`

#### Hạng mục A3: Mục `II.2.2 Installation Instructions` (Hướng dẫn cài đặt từ A–Z như máy trắng chưa có gì)
> **Yêu cầu đặc biệt:** Chụp ảnh màn hình từng bước cài đặt từ đầu đến cuối, khoanh đỏ vị trí bấm tải, nút Next/Install, câu lệnh Terminal và kết quả màn hình chạy thành công.

- [ ] **A3.1 – Bước 1: Cài đặt công cụ nền tảng (Prerequisites từ máy trắng):**
  1. Tải và cài đặt **Git** (`https://git-scm.com/downloads`) $\rightarrow$ Chụp ảnh trang tải, các bước bấm *Next/Install* và chạy `git --version` trên Terminal.
  2. Tải và cài đặt **Node.js v22 LTS** (`https://nodejs.org`) $\rightarrow$ Chụp ảnh trang tải bản LTS, trình cài đặt `.msi`, và kiểm tra `node -v`, `npm -v`.
  3. Cài đặt **PNPM Package Manager** qua lệnh `npm install -g pnpm` (hoặc `corepack enable`) $\rightarrow$ Chụp ảnh lệnh và kết quả `pnpm -v`.
  4. Tải và cài đặt **Docker Desktop** (`https://www.docker.com/products/docker-desktop/`) $\rightarrow$ Chụp ảnh trang tải, bật WSL2 backend, khởi động Docker Desktop báo trạng thái *Engine running* màu xanh, kiểm tra `docker --version` và `docker compose version`.
  5. Tải và cài đặt **PostgreSQL 16+ & Redis** (dành cho hướng chạy Local Development) hoặc sử dụng Docker container.
- [ ] **A3.2 – Bước 2: Clone Source Code dự án & AI Microservices:**
  1. Mở Terminal, chạy `git clone <repo-url> Frevia` và `cd Frevia`.
  2. Kiểm tra thư mục `ai-services/id-verification` và `ai-services/cv-matching` (hướng dẫn tải model weights `yolo_best.pt` nếu chưa có).
  3. Chạy `pnpm install` tại thư mục gốc để cài đặt toàn bộ dependencies cho Monorepo (`apps/web`, `apps/api`, `packages/*`).
- [ ] **A3.3 – Bước 3: Cấu hình biến môi trường (`.env` Configuration):**
  1. Tạo file `apps/api/.env` và `apps/web/.env` (hoặc cấu hình Infisical CLI).
  2. Giải thích chi tiết từng nhóm biến môi trường trong bảng:
     - Database & Redis (`DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`)
     - JWT & Auth (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`)
     - Cloudinary Upload (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
     - Stripe Payment & Connect (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
     - Email SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
     - AI Endpoints (`ID_VERIFICATION_SERVICE_URL=http://localhost:8001`, `AI_SERVICE_URL=http://localhost:8000`, `OLLAMA_BASE_URL=http://localhost:11434`)
- [ ] **A3.4 – Bước 4: Khởi tạo Cơ sở dữ liệu, Chạy Migration & Seed dữ liệu mẫu:**
  1. Chạy `pnpm --filter api prisma generate` để sinh Prisma Client.
  2. Chạy `pnpm --filter api prisma migrate deploy` (hoặc `prisma migrate dev`) để tạo toàn bộ bảng trong PostgreSQL.
  3. Chạy các lệnh Seed dữ liệu nền tảng:
     - `pnpm --filter api seed:permissions` (Khởi tạo danh sách quyền & gán quyền cho các Role)
     - `pnpm --filter api seed:job-categories` (Khởi tạo danh mục ngành nghề & kỹ năng)
     - `pnpm --filter api seed` (Tạo tài khoản Admin, Client, Freelancer, Expert mẫu).
  4. Cung cấp **Bảng danh sách tài khoản Demo** (Email, Mật khẩu, Vai trò) để giảng viên/người chấm bài đăng nhập thử nghiệm ngay.
- [ ] **A3.5 – Bước 5: Khởi chạy toàn bộ hệ thống (2 Cách):**
  - **Cách 1 (Khuyên dùng): Chạy toàn bộ bằng Docker Compose (`One-Command Deployment`):**
    1. Chạy `docker compose up -d --build` (Chụp ảnh quá trình build 5 containers: `frevia-frontend`, `frevia-backend`, `frevia-id-verification`, `frevia-cv-matching`, `frevia-ollama`).
    2. Chạy lệnh kéo model LLM cho Ollama: `docker exec -it frevia-ollama ollama pull qwen3:4b`.
    3. Chụp ảnh màn hình Docker Desktop hiển thị cả 5 containers đều ở trạng thái **Running / Healthy**.
  - **Cách 2: Chạy môi trường Local Development (`pnpm dev`):**
    1. Chạy `pnpm dev` tại thư mục gốc (Turborepo khởi chạy đồng thời `apps/api` ở port `3000` và `apps/web` ở port `3001`).
    2. Chụp ảnh Terminal hiển thị NestJS và Next.js khởi động thành công.
- [ ] **A3.6 – Bước 6: Kiểm tra vận hành sau cài đặt (Post-Installation Verification):**
  1. Mở trình duyệt truy cập Web App (`http://localhost:3003` hoặc `http://localhost:3001`) $\rightarrow$ Chụp ảnh trang chủ Frevia.
  2. Kiểm tra Swagger/Health API (`http://localhost:3002/api`), trang Swagger của AI CV-Matching (`http://localhost:8000/docs`) và AI ID-Verification (`http://localhost:8001/docs`).

---

### PHẦN B: HƯỚNG DẪN SỬ DỤNG PHẦN MỀM THEO TỪNG MODULE & ACTOR (SECTION 3)

Dưới đây là danh sách **toàn bộ 16 Modules (128 chức năng chi tiết)** bao phủ 100% các Use Cases và 172 màn hình của hệ thống.

---

#### MODULE 1: Tổng quan hệ thống & Phân hệ Khách vãng lai (Guest & Public Browsing)
*Actor: Guest (Khách chưa đăng nhập) / Tất cả người dùng*

- [ ] **M1.01 – Tổng quan hệ thống (`3.1 Overview`):** Giới thiệu kiến trúc Frevia, bảng phân quyền 5 Actors (`Guest`, `Freelancer`, `Client`, `Expert`, `Admin`), và sơ đồ tổng thể luồng nghiệp vụ từ Đăng việc $\rightarrow$ Ứng tuyển $\rightarrow$ Hợp đồng & Ký quỹ Stripe $\rightarrow$ Bàn giao & Nghiệm thu $\rightarrow$ Đánh giá / Khiếu nại.
- [ ] **M1.02 – Khám phá Trang chủ (`/` - Homepage):** Hướng dẫn sử dụng thanh điều hướng (Navbar), ô tìm kiếm nhanh trên Hero Banner, xem danh mục nghề nghiệp nổi bật, danh sách việc làm mới nhất, và các liên kết Footer.
- [ ] **M1.03 – Tìm kiếm, Lọc & Sắp xếp việc làm công khai (`/find-work` - UC-21.01):** Hướng dẫn nhập từ khóa tìm kiếm, lọc theo Danh mục (Job Category), Kỹ năng (Skills), Loại ngân sách (Fixed-Price / Hourly), Khoảng giá (Min–Max Budget), Trình độ kinh nghiệm (Entry/Intermediate/Expert), và sắp xếp kết quả.
- [ ] **M1.04 – Xem chi tiết tin tuyển dụng công khai (`/job/[slug]` - UC-21.02):** Hướng dẫn xem mô tả công việc, danh sách kỹ năng yêu cầu, ngân sách, các mốc Milestone dự kiến, thông tin tóm tắt về Client đăng bài, và nút chuyển sang ứng tuyển (`Apply Now`).
- [ ] **M1.05 – Xem hồ sơ công khai của Freelancer (`/profiles/[id]` - UC-18.02):** Xem thông tin giới thiệu, huy hiệu đã xác thực danh tính (Verified Badge), kỹ năng, danh sách dự án Portfolio, lịch sử công việc và đánh giá từ các hợp đồng trước.
- [ ] **M1.06 – Xem chi tiết dự án Portfolio công khai (`/profiles/[id]/portfolio/[itemId]`):** Xem hình ảnh/tài liệu đính kèm của dự án mẫu, mô tả chi tiết và liên kết dự án thực tế của Freelancer.
- [ ] **M1.07 – Xem hồ sơ công khai của Client (`/clients/[id]` - UC-19.01):** Xem thông tin công ty, website, quy mô, lịch sử các công việc đã đăng và đánh giá từ Freelancer.
- [ ] **M1.08 – Tra cứu Danh bạ Chuyên gia & Chi tiết Chuyên gia (`/experts` & `/experts/[id]` - UC-20.01, UC-20.02):** Tìm kiếm chuyên gia theo lĩnh vực chuyên môn, xem thông tin học vấn, chứng chỉ, kinh nghiệm và kênh liên hệ của Expert.
- [ ] **M1.09 – Xem diễn đàn cộng đồng công khai (`/forum` & `/forum/posts/[id]`):** Duyệt danh sách bài viết theo chuyên mục, tìm kiếm bài viết và đọc nội dung thảo luận cùng bình luận.

---

#### MODULE 2: Xác thực người dùng & Quản lý phiên đăng nhập (Authentication & Session Management)
*Actor: Guest, Freelancer, Client, Expert, Admin*

- [ ] **M2.01 – Đăng ký tài khoản mới bằng Email/Mật khẩu (`/register` - UC-04):** Hướng dẫn chọn vai trò khởi tạo (`Freelancer` hoặc `Client`), nhập Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, đồng ý điều khoản và hoàn tất đăng ký.
- [ ] **M2.02 – Đăng nhập bằng Email & Mật khẩu (`/login` - UC-02):** Hướng dẫn nhập Email, Mật khẩu, tùy chọn *Remember me*, nhấn *Sign In*, và giải thích cơ chế tự động điều hướng theo vai trò (Admin $\rightarrow$ `/admin`, Expert $\rightarrow$ `/expert/profile`, Client/Freelancer $\rightarrow$ `/dashboard`).
- [ ] **M2.03 – Đăng nhập / Đăng ký nhanh bằng Google OAuth (`/login`, `/register` - UC-01):** Hướng dẫn nhấn nút *Continue with Google*, chọn tài khoản Google trên cửa sổ popup OAuth và cấp quyền truy cập.
- [ ] **M2.04 – Quên mật khẩu & Đặt lại mật khẩu qua Email (`/forgot-password` - UC-05):** Hướng dẫn nhập Email nhận mã/link khôi phục, kiểm tra hộp thư đến, mở link đặt lại mật khẩu và nhập mật khẩu mới.
- [ ] **M2.05 – Xem danh sách & Chi tiết phiên đăng nhập đang hoạt động (`/sessions` - UC-16.01, UC-16.02):** Hướng dẫn kiểm tra các thiết bị đang đăng nhập tài khoản (Trình duyệt, Hệ điều hành, Địa chỉ IP, Thời gian đăng nhập, thẻ *Current Session*).
- [ ] **M2.06 – Thu hồi phiên đăng nhập từ xa (`/sessions` - UC-16.03):** Hướng dẫn nhấn nút *Revoke* để đăng xuất cưỡng bức một thiết bị lạ từ xa.
- [ ] **M2.07 – Đăng xuất khỏi hệ thống (`Logout` - UC-03):** Hướng dẫn mở menu Avatar trên Header/Sidebar và nhấn *Log out* để kết thúc phiên làm việc an toàn.

---

#### MODULE 3: Cài đặt tài khoản chung & Chuyển đổi vai trò (Account Settings & Role Switching)
*Actor: Freelancer, Client, Expert*

- [ ] **M3.01 – Cập nhật thông tin tài khoản cơ bản (`/profile/edit` hoặc Settings):** Chỉnh sửa Họ tên hiển thị, Số điện thoại, Địa chỉ/Múi giờ.
- [ ] **M3.02 – Tải lên & Cắt ảnh đại diện (Upload & Crop Avatar):** Hướng dẫn chọn file ảnh (`JPG/PNG/WEBP`), kéo khung cắt ảnh tỉ lệ 1:1 và lưu Avatar mới.
- [ ] **M3.03 – Đổi mật khẩu bảo mật (Change Password):** Nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.
- [ ] **M3.04 – Quản lý liên kết mạng xã hội (Manage Social Links):** Thêm, chỉnh sửa hoặc xóa các đường dẫn GitHub, LinkedIn, Website cá nhân.
- [ ] **M3.05 – Đăng ký thêm vai trò mới cho tài khoản (Join as Client / Join as Freelancer):** Hướng dẫn người dùng đang chỉ có 1 vai trò (ví dụ `Freelancer`) kích hoạt thêm hồ sơ `Client` (hoặc ngược lại) trên cùng một tài khoản.
- [ ] **M3.06 – Chuyển đổi qua lại giữa các vai trò (Switch Active Role):** Hướng dẫn dùng nút chuyển đổi vai trò trên menu người dùng để đổi ngữ cảnh làm việc giữa `Client` và `Freelancer` mà không cần đăng xuất.

---

#### MODULE 4: Quản lý Hồ sơ Freelancer, Kỹ năng, Portfolio & CV (Freelancer Profile, Portfolio & CV)
*Actor: Freelancer*

- [ ] **M4.01 – Xem & Cập nhật hồ sơ chuyên môn Freelancer (`/profile`, `/profile/edit` - UC-18.01, UC-18.03):** Cập nhật chức danh nghề nghiệp (Professional Title), giới thiệu bản thân (Bio), mức thù lao theo giờ (Hourly Rate), số năm kinh nghiệm và trạng thái sẵn sàng nhận việc (Availability). Giải thích cơ chế tạo bản nháp *Profile Revision* chờ Admin duyệt nếu tài khoản đã xác thực.
- [ ] **M4.02 – Quản lý Kỹ năng của Freelancer (Add & Remove Freelancer Skills - UC-18.04, UC-18.05):** Tìm kiếm kỹ năng từ danh mục chuẩn của hệ thống, chọn mức độ thành thạo (Proficiency Level) để thêm vào hồ sơ, hoặc gỡ bỏ kỹ năng không còn phù hợp.
- [ ] **M4.03 – Xem danh sách & Thêm dự án Portfolio mới (`/profile` - UC-18.06, UC-18.07):** Nhấn *Add Portfolio Item*, nhập tiêu đề dự án, mô tả chi tiết, tải lên hình ảnh minh họa, gắn thẻ kỹ năng đã dùng và đường dẫn demo.
- [ ] **M4.04 – Sửa & Xóa dự án Portfolio (UC-18.09, UC-18.10):** Chỉnh sửa thông tin dự án đã đăng hoặc xóa dự án khỏi hồ sơ.
- [ ] **M4.05 – Tải lên, Xem trước, Thay thế & Xóa CV (`/profile` / CV Manager - UC-13.01, UC-13.02, UC-13.03, UC-13.04):**
  - Tải lên file CV định dạng PDF.
  - Xem hệ thống **AI Section-Aware CV-Job Matching** tự động trích xuất các phần trong CV (Education, Skills, Experience, Projects).
  - Xem trước file CV trực tiếp, tải bản CV mới thay thế bản cũ hoặc xóa CV.

---

#### MODULE 5: Xác thực danh tính điện tử bằng AI – eKYC (Identity Verification)
*Actor: Freelancer*

- [ ] **M5.01 – Gửi hồ sơ xác thực danh tính eKYC (`/identity-verification` - UC-29.01):**
  - Bước 1: Chọn loại giấy tờ tùy thân (CCCD / Passport) và nhập số giấy tờ.
  - Bước 2: Tải lên ảnh mặt trước (Front ID) và mặt sau (Back ID) rõ nét.
  - Bước 3: Mở Webcam trực tiếp trên trình duyệt để chụp ảnh khuôn mặt thực tế (Selfie Liveness Capture).
  - Bước 4: Hệ thống gọi **AI ID-Verification Service** (YOLOv8 cắt vùng thẻ + PaddleOCR đọc thông tin + InsightFace so khớp khuôn mặt trên CCCD với ảnh Selfie) và gửi kết quả để Admin hậu kiểm.
- [ ] **M5.02 – Theo dõi trạng thái xác thực eKYC (`/identity-verification`):** Xem trạng thái hồ sơ (`PENDING`, `APPROVED` kèm huy hiệu Verified, hoặc `REJECTED` kèm lý do từ chối từ Admin để gửi lại).

---

#### MODULE 6: Tiện ích Tìm việc nâng cao & Quản lý Đề xuất ứng tuyển (Job Search Utilities & Proposals)
*Actor: Freelancer*

- [ ] **M6.01 – Lưu việc làm yêu thích & Quản lý danh sách đã lưu (`/bookmarks` - UC-21.03, UC-21.04, UC-21.05):** Nhấn biểu tượng Bookmark (trái tim/dấu trang) trên thẻ công việc để lưu lại, xem danh sách tại trang `/bookmarks` và bỏ lưu khi không cần nữa.
- [ ] **M6.02 – Lưu bộ lọc tìm kiếm & Quản lý tìm kiếm đã lưu (Saved Searches - UC-21.06, UC-21.07, UC-21.08):** Lưu lại tổ hợp từ khóa + bộ lọc yêu thích với tên gợi nhớ, bấm chạy lại bộ lọc bằng 1 cú nhấp chuột hoặc xóa bộ lọc đã lưu.
- [ ] **M6.03 – Thiết lập & Quản lý Thông báo việc làm tự động (Job Alerts - UC-21.09 đến UC-21.13):** Tạo cấu hình nhận thông báo khi có việc làm mới khớp tiêu chí (tần suất nhận thông báo, bật/tắt trạng thái kích hoạt, sửa hoặc xóa Job Alert).
- [ ] **M6.04 – Gửi đề xuất ứng tuyển công việc (`/job/[slug]/apply` - UC-22.01):**
  - Nhập thư chào giá (Cover Letter), mức giá đề xuất (Proposed Bid Amount), thời gian hoàn thành dự kiến (Estimated Duration), chọn đính kèm CV/tài liệu mẫu và nhấn *Submit Proposal*.
- [ ] **M6.05 – Xem danh sách & Chi tiết các Proposal đã gửi (`/proposals` & `/proposals/[id]` - UC-22.02, UC-22.03):** Theo dõi trạng thái các đơn ứng tuyển (`PENDING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`).
- [ ] **M6.06 – Chỉnh sửa hoặc Rút lại Proposal đã gửi (`/proposals/[id]/edit` - UC-22.04, UC-22.05):** Cập nhật lại mức giá chào/Cover Letter khi Client chưa duyệt, hoặc nhấn *Withdraw Proposal* để rút đơn ứng tuyển.

---

#### MODULE 7: Không gian làm việc của Client – Hồ sơ Công ty, Yêu thích & Theo dõi (Client Profile & Network)
*Actor: Client*

- [ ] **M7.01 – Bảng điều khiển của Client (`/dashboard`):** Xem thống kê tổng quan các tin tuyển dụng đang mở, số lượng Proposal mới nhận được, các hợp đồng đang thực hiện và tổng chi tiêu.
- [ ] **M7.02 – Xem & Cập nhật Hồ sơ Công ty của Client (`/client/profile`, `/client/profile/edit` - UC-19.01, UC-19.02):** Cập nhật Tên công ty (Company Name), Website, Quy mô nhân sự, Ngành nghề, Mô tả doanh nghiệp và Địa chỉ.
- [ ] **M7.03 – Lưu Freelancer vào danh sách Yêu thích (`/favorites` - UC-19.03, UC-19.04, UC-19.05):** Nhấn nút *Save to Favorites* trên trang hồ sơ Freelancer, xem danh sách ứng viên tiềm năng đã lưu tại `/favorites` và xóa khỏi danh sách.
- [ ] **M7.04 – Theo dõi & Hủy theo dõi Freelancer (`/following` - UC-19.06, UC-19.07, UC-19.08):** Nhấn *Follow* để theo dõi hoạt động của Freelancer xuất sắc, quản lý danh sách đang theo dõi tại `/following`.

---

#### MODULE 8: Đăng tin tuyển dụng, AI Gợi ý Ứng viên & Tuyển chọn (Job Posting & Candidate Hiring)
*Actor: Client*

- [ ] **M8.01 – Tạo tin tuyển dụng mới (`/client/jobs/new` - UC-10.01):**
  - Nhập Tiêu đề công việc, chọn Danh mục (Job Category), thêm các Kỹ năng yêu cầu (Skills), viết Mô tả chi tiết, chọn hình thức trả lương (`FIXED` hoặc `HOURLY`), nhập Ngân sách, Hạn nộp hồ sơ, và thiết lập các mốc bàn giao dự kiến (Initial Milestones).
  - Chọn lưu nháp (*Save as Draft*) hoặc đăng công khai ngay (*Publish Job*).
- [ ] **M8.02 – Quản lý danh sách việc làm đã đăng (`/client/jobs` & `/client/jobs/[id]` - UC-10.02, UC-10.03):** Lọc danh sách công việc của Client theo trạng thái (`DRAFT`, `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CLOSED`, `CANCELLED`).
- [ ] **M8.03 – Chỉnh sửa, Đổi trạng thái (Đăng/Đóng/Mở lại) & Xóa tin tuyển dụng (`/client/jobs/[id]/edit` - UC-10.04, UC-10.05, UC-10.06):** Sửa nội dung bài đăng, đóng nhận hồ sơ khi đã tìm đủ người, hoặc xóa bài đăng nháp.
- [ ] **M8.04 – Xem danh sách Proposal ứng tuyển & AI CV-Job Matching (`/client/jobs/[id]/proposals` - UC-22.02, UC-13.05):**
  - Xem toàn bộ danh sách Freelancer đã nộp đơn vào công việc.
  - Xem **Điểm số độ phù hợp do AI tính toán (AI Match Score %)** kèm phân tích chi tiết từng phần (Skills Match, Experience Match, Education Match) từ microservice `cv-matching` + `Ollama qwen3:4b`.
- [ ] **M8.05 – Xem chi tiết Proposal, Duyệt chọn (Accept) hoặc Từ chối (Reject) ứng viên (UC-22.03, UC-22.06, UC-22.07):**
  - Đọc Cover Letter, xem CV đính kèm, nhấn *Message* để trao đổi trực tiếp, nhấn *Reject* để từ chối hoặc nhấn *Accept & Create Contract* để chuyển sang bước ký hợp đồng.

---

#### MODULE 9: Quản lý Hợp đồng, Tài liệu & Bàn giao Milestone (Contract & Milestone Workspace)
*Actor: Client & Freelancer*

- [ ] **M9.01 – Khởi tạo Hợp đồng từ Proposal đã duyệt (`/contracts/new` - UC-23.01):** Client kiểm tra và xác nhận điều khoản hợp đồng, tổng giá trị hợp đồng, thời hạn bắt đầu/kết thúc và danh sách các mốc thanh toán (Milestones).
- [ ] **M9.02 – Xem danh sách & Không gian làm việc chi tiết của Hợp đồng (`/contracts` & `/contracts/[id]` - UC-23.02, UC-23.03):** Theo dõi trạng thái hợp đồng (`DRAFT`, `PENDING_SIGNATURE`, `ACTIVE`, `COMPLETED`, `DISPUTED`, `CANCELLED`), tiến độ thanh toán và các tab chức năng.
- [ ] **M9.03 – Cập nhật điều khoản & Ký hợp đồng điện tử (Sign Contract - UC-23.04, UC-23.05):**
  - Client và Freelancer đọc kỹ điều khoản hợp đồng và lần lượt nhấn *Sign Contract* (Ký xác nhận hai bên) để kích hoạt hợp đồng sang trạng thái `ACTIVE`.
- [ ] **M9.04 – Hủy hợp đồng (Cancel Contract - UC-23.06):** Hướng dẫn hủy hợp đồng khi chưa bắt đầu hoặc thỏa thuận dừng hợp đồng kèm lý do.
- [ ] **M9.05 – Quản lý Tài liệu chung của Hợp đồng (Contract Files - UC-23.07, UC-23.08, UC-23.09):** Tải lên tài liệu đặc tả/thiết kế chung vào hợp đồng, tải xuống xem hoặc xóa file đính kèm.
- [ ] **M9.06 – Tạo mới, Chỉnh sửa & Xóa Milestone trong hợp đồng (UC-24.01, UC-24.04, UC-24.05):** Thêm mốc công việc mới (Tên Milestone, Mô tả, Số tiền phân bổ, Ngày đến hạn), sửa hoặc xóa Milestone chưa nạp tiền.
- [ ] **M9.07 – Freelancer cập nhật tiến độ & Nộp sản phẩm bàn giao (Submit Milestone Deliverable - UC-24.06, UC-24.07):**
  - Freelancer chuyển trạng thái Milestone sang đang làm, tải lên file sản phẩm bàn giao (Source code zip, bản thiết kế, báo cáo...) kèm ghi chú kết quả công việc và nhấn *Submit Work for Review*.
- [ ] **M9.08 – Client kiểm tra bài nộp, Yêu cầu sửa lại hoặc Nghiệm thu giải ngân (Review Deliverable - UC-24.08, UC-24.09, UC-24.10):**
  - Client tải xuống các file bàn giao của Freelancer để kiểm tra.
  - Trường hợp 1: Nhấn *Request Revision / Reject Deliverable* kèm phản hồi chi tiết các điểm cần sửa lại.
  - Trường hợp 2: Nhấn *Approve & Release Payment* để nghiệm thu hoàn tất Milestone và tự động giải ngân tiền từ quỹ Escrow cho Freelancer.

---

#### MODULE 10: Thanh toán Ký quỹ Stripe Escrow & Rút tiền Freelancer (Payments, Escrow & Payouts)
*Actor: Client & Freelancer*

- [ ] **M10.01 – Client quản lý Phương thức thanh toán đã lưu (`/payments/methods` - UC-25.01, UC-25.02, UC-25.03, UC-25.04):** Thêm thẻ tín dụng/ghi nợ quốc tế qua Stripe Elements (cung cấp số thẻ test của Stripe `4242 4242...` trong tài liệu hướng dẫn), đặt thẻ mặc định (*Set as Default*) hoặc xóa thẻ.
- [ ] **M10.02 – Client nạp tiền Ký quỹ cho Milestone qua Stripe (Fund Milestone Escrow - UC-25.05):**
  - Từ màn hình chi tiết Hợp đồng, Client nhấn *Fund Milestone*, chọn thẻ thanh toán hoặc chuyển sang trang Stripe Checkout, hoàn tất thanh toán để khóa tiền an toàn vào hệ thống Escrow (trạng thái Milestone chuyển sang `FUNDED`).
- [ ] **M10.03 – Client xem Lịch sử giao dịch & Hóa đơn chi tiết (`/payments` & `/payments/[id]` - UC-25.06, UC-25.07):** Tra cứu danh sách toàn bộ các lần nạp tiền Escrow, phí nền tảng, hoàn tiền và xem chi tiết biên lai từng giao dịch.
- [ ] **M10.04 – Freelancer liên kết tài khoản nhận tiền Stripe Connect Express (`/payouts/onboarding` - UC-25.08):** Hướng dẫn Freelancer nhấn *Connect Stripe Account*, hoàn tất biểu mẫu xác minh Stripe Connect Express để đủ điều kiện nhận tiền giải ngân.
- [ ] **M10.05 – Freelancer theo dõi Lịch sử nhận tiền & Chi tiết Payout (`/payouts` & `/payouts/[id]` - UC-25.09, UC-25.10):** Kiểm tra số dư đã giải ngân từ các Milestone hoàn thành, phí dịch vụ khấu trừ và trạng thái chuyển khoản về tài khoản Stripe của Freelancer.

---

#### MODULE 11: Giải quyết Tranh chấp Hợp đồng & Đánh giá tín nhiệm (Disputes & Reviews)
*Actor: Client & Freelancer*

- [ ] **M11.01 – Mở khiếu nại / Tranh chấp hợp đồng (`/contracts/[id]/disputes/new` - UC-26.01):**
  - Khi hai bên bất đồng về chất lượng bàn giao hoặc tiến độ, Client hoặc Freelancer nhấn *Open Dispute*, chọn Milestone tranh chấp, nhập lý do chi tiết, số tiền yêu cầu bồi hoàn/thanh toán và tải lên bằng chứng (ảnh chụp màn hình, file bàn giao, lịch sử trao đổi).
- [ ] **M11.02 – Đóng phí trọng tài tranh chấp (Pay Dispute Arbitration Fee - UC-26.02):** Hướng dẫn thanh toán phí xử lý tranh chấp để kích hoạt quy trình phân xử của Admin.
- [ ] **M11.03 – Xem chi tiết tranh chấp, Gửi phản hồi & Bổ sung bằng chứng (`/disputes/[id]` - UC-26.03, UC-26.04, UC-26.05):** Bên bị khiếu nại vào xem nội dung cáo buộc, viết lời giải trình phản biện và đính kèm bằng chứng bảo vệ quyền lợi.
- [ ] **M11.04 – Chấp nhận hoặc Từ chối phương án hòa giải / Xem phán quyết cuối cùng (UC-26.06, UC-26.07):** Hai bên xem đề xuất phân chia tiền Escrow từ Admin và xác nhận đồng ý hoặc từ chối.
- [ ] **M11.05 – Viết đánh giá & Chấm điểm sau khi hoàn tất hợp đồng (`/contracts/[id]/review` - UC-27.01):**
  - Chấm điểm từ 1 đến 5 sao và viết nhận xét chi tiết cho đối tác (Client đánh giá Freelancer và Freelancer đánh giá Client).
- [ ] **M11.06 – Xem danh sách đánh giá, Chỉnh sửa, Xóa & Phản hồi đánh giá (UC-27.02 đến UC-27.07):** Xem các đánh giá trên trang hồ sơ, sửa/xóa đánh giá trong thời hạn cho phép, hoặc viết lời cảm ơn/phản hồi (*Respond to Review*) bên dưới đánh giá nhận được.

---

#### MODULE 12: Nhắn tin Thời gian thực, Thông báo & Diễn đàn Cộng đồng (Chat, Notifications & Forum)
*Actor: Client & Freelancer*

- [ ] **M12.01 – Danh sách hội thoại & Nhắn tin trực tiếp thời gian thực (`/conversations` & `/conversations/[id]`):**
  - Bắt đầu cuộc trò chuyện mới từ trang Proposal/Hồ sơ/Hợp đồng.
  - Gửi tin nhắn văn bản thời gian thực (WebSocket), đính kèm tệp tin/hình ảnh, tìm kiếm lịch sử cuộc trò chuyện và xem trạng thái đã đọc.
- [ ] **M12.02 – Trung tâm Thông báo thời gian thực (Notification Bell & `/notifications`):**
  - Xem thông báo bật lên trên biểu tượng Chuông ở Header khi có Proposal mới, tin nhắn mới, cập nhật Hợp đồng/Milestone hoặc kết quả duyệt hồ sơ.
  - Đánh dấu đã đọc từng thông báo, đánh dấu đã đọc tất cả (*Mark all as read*) hoặc nhấn vào thông báo để chuyển thẳng tới màn hình chi tiết.
- [ ] **M12.03 – Đăng bài viết thảo luận mới trên Diễn đàn (`/forum/new` - UC-17.07):** Chọn chuyên mục diễn đàn (Forum Category), nhập tiêu đề, nội dung bài viết (Rich Text/Markdown), gắn thẻ và đăng bài.
- [ ] **M12.04 – Chỉnh sửa, Xóa bài viết của mình & Thả cảm xúc Like/Unlike bài viết (`/forum/posts/[id]/edit` - UC-17.08, UC-17.09, UC-17.10):** Sửa nội dung bài đã đăng, xóa mềm bài viết hoặc bấm nút Like/Unlike.
- [ ] **M12.05 – Bình luận bài viết, Trả lời, Sửa, Xóa & Like bình luận (UC-17.11 đến UC-17.15):** Viết bình luận trao đổi dưới bài viết, phản hồi bình luận của người khác, chỉnh sửa/xóa bình luận cá nhân.
- [ ] **M12.06 – Báo cáo bài viết hoặc bình luận vi phạm tiêu chuẩn cộng đồng (Report Content - UC-17.16):** Nhấn nút *Report* trên bài viết/bình luận vi phạm, chọn lý do báo cáo (Spam, Lừa đảo, Ngôn từ kích động...) và gửi về hàng đợi kiểm duyệt của Admin.

---

#### MODULE 13: Phân hệ Chuyên gia (Expert Workspace)
*Actor: Expert*

- [ ] **M13.01 – Đăng nhập & Không gian làm việc riêng của Chuyên gia (`/expert/profile`):** Giải thích cơ chế tự động chuyển hướng tài khoản có role `Expert` vào cổng chuyên gia `/expert/profile` với giao diện Expert Shell riêng biệt.
- [ ] **M13.02 – Xem & Cập nhật Hồ sơ Chuyên gia (`/expert/profile` - UC-20.02, UC-20.03):**
  - Chỉnh sửa Chức danh chuyên gia (Headline), Lĩnh vực tư vấn chuyên sâu (Expertise Areas), Tiểu sử nghề nghiệp (Bio), Số năm kinh nghiệm, Công ty/Tổ chức hiện tại và liên kết hồ sơ.
  - Nhấn *Submit for Approval* để tạo yêu cầu duyệt hồ sơ (*Profile Revision*) gửi lên Admin.
- [ ] **M13.03 – Theo dõi trạng thái duyệt cập nhật hồ sơ Expert:** Kiểm tra thông báo trạng thái bản chỉnh sửa (`PENDING`, `APPROVED`, hoặc `REJECTED` kèm lý do từ Admin).

---

#### MODULE 14: Phân hệ Quản trị viên – Quản lý Phân quyền RBAC & Người dùng (Admin System, RBAC & Users)
*Actor: Admin*

- [ ] **M14.01 – Bảng điều khiển Quản trị viên (`/admin` - Admin Dashboard):** Xem tổng quan các chỉ số toàn hệ thống (Tổng số người dùng, Công việc, Hợp đồng, Doanh thu, các yêu cầu eKYC/Profile Revision/Moderation đang chờ xử lý) và điều hướng qua Sidebar Admin.
- [ ] **M14.02 – Xem & Cập nhật thông tin tài khoản Admin (`/admin/profile`):** Quản lý thông tin cá nhân và bảo mật của quản trị viên.
- [ ] **M14.03 – Quản lý Vai trò (Roles Management - `/admin/roles` - UC-06.01 đến UC-06.05):**
  - Xem danh sách toàn bộ các Role trong hệ thống (`Admin`, `Client`, `Freelancer`, `Expert` và các Custom Role).
  - Xem chi tiết một Role, Tạo Role mới (*Create Role*), Cập nhật tên/mô tả Role (*Update Role*) và Xóa Role (*Delete Role*).
- [ ] **M14.04 – Gán quyền truy cập API/Route cho từng Role (`/admin/roles/[id]` - UC-06.06):** Sử dụng giao diện bật/tắt (Toggle Matrix) theo từng Module để cấp hoặc thu hồi các Permission cho Role và lưu thay đổi.
- [ ] **M14.05 – Tra cứu Danh sách & Chi tiết Quyền hạn hệ thống (`/admin/permissions` - UC-15.01, UC-15.02):** Tìm kiếm và lọc danh sách toàn bộ Permissions theo phương thức HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) và theo Module.
- [ ] **M14.06 – Xem danh sách, Tìm kiếm, Lọc & Tạo mới Người dùng (`/admin/users` - UC-28.01, UC-28.03):**
  - Lọc người dùng theo Role, Trạng thái tài khoản (`ACTIVE`, `INACTIVE`, `BANNED`), tìm kiếm theo tên/email.
  - Tạo tài khoản người dùng mới trực tiếp từ trang Admin và gán Role khởi tạo (bao gồm cấp tài khoản cho `Expert` hoặc `Admin` mới).
- [ ] **M14.07 – Xem chi tiết Đa hồ sơ của Người dùng & Khóa/Mở khóa tài khoản (`/admin/users/[id]` - UC-28.02, UC-28.04):**
  - Xem thông tin chung của Account, đổi trạng thái hoạt động (Khóa/Ban tài khoản vi phạm hoặc kích hoạt lại), đổi Role.
- [ ] **M14.08 – Admin chỉnh sửa trực tiếp các Tab Hồ sơ chuyên biệt của User (`/admin/users/[id]` - UC-28.05 đến UC-28.09):**
  - Chỉnh sửa Tab **Client Profile** (thông tin công ty).
  - Chỉnh sửa Tab **Freelancer Basics** (tiêu đề, bio, hourly rate), **Freelancer Skills** và **Freelancer Portfolio**.
  - Chỉnh sửa Tab **Expert Profile** (thông tin chuyên gia).

---

#### MODULE 15: Phân hệ Quản trị viên – Quản lý Dữ liệu Danh mục Chuẩn (Admin Master Data Catalog)
*Actor: Admin*

- [ ] **M15.01 – Quản lý Danh mục Kỹ năng (`/admin/skills` - UC-11.01 đến UC-11.06):**
  - Xem danh sách kỹ năng, tìm kiếm, lọc kỹ năng đang hoạt động hoặc đã xóa.
  - Xem chi tiết, Tạo kỹ năng mới (*Create Skill*), Cập nhật tên/mô tả/danh mục (*Update Skill*), Xóa mềm (*Soft Delete*) và Khôi phục kỹ năng đã xóa (*Restore Skill*).
- [ ] **M15.02 – Quản lý Danh mục Ngành nghề / Việc làm (`/admin/job-categories` - UC-12.01 đến UC-12.06):**
  - Xem danh sách danh mục việc làm (cấu trúc cha – con nếu có), Xem chi tiết, Tạo mới, Cập nhật, Xóa mềm và Khôi phục danh mục việc làm.
- [ ] **M15.03 – Quản lý Chuyên mục Diễn đàn (`/admin/categories` - UC-14.01, UC-14.02, UC-17.01, UC-17.02, UC-17.03, UC-17.06):**
  - Xem danh sách & chi tiết chuyên mục diễn đàn, Tạo chuyên mục mới (Tên, Slug, Mô tả, Thứ tự hiển thị), Cập nhật, Xóa mềm và Khôi phục chuyên mục đã xóa.
- [ ] **M15.04 – Quản lý Banner Quảng cáo & Sự kiện (`/admin/banners` - UC-31.01 đến UC-31.05):**
  - Xem danh sách và chi tiết Banner, Tạo Banner mới kèm tải ảnh lên Cloudinary, cấu hình vị trí hiển thị/đường dẫn đích/thời gian hiệu lực, bật/tắt trạng thái hiển thị, Cập nhật và Xóa Banner.

---

#### MODULE 16: Phân hệ Quản trị viên – Hậu kiểm eKYC, Duyệt Hồ sơ, Kiểm duyệt Diễn đàn & Trọng tài Tranh chấp (Admin Governance & Arbitration)
*Actor: Admin*

- [ ] **M16.01 – Hậu kiểm & Phê duyệt Xác thực danh tính eKYC (`/admin/identity-verifications` & `/admin/identity-verifications/[id]` - UC-29.02 đến UC-29.05):**
  - Xem danh sách các yêu cầu xác thực eKYC đang chờ duyệt (`PENDING`).
  - Mở màn hình chi tiết để đối chiếu ảnh CCCD mặt trước, mặt sau, ảnh Selfie trực tiếp và kết quả chấm điểm tự động từ **AI ID-Verification Service** (độ khớp khuôn mặt, thông tin OCR trích xuất).
  - Nhấn **Approve** để cấp tích xanh xác thực cho Freelancer, hoặc nhấn **Reject** kèm nhập lý do từ chối cụ thể.
- [ ] **M16.02 – Phê duyệt Yêu cầu Cập nhật Hồ sơ (Profile Revisions Review - `/admin/profile-revisions` & `/admin/profile-revisions/[id]` - UC-30.01 đến UC-30.05):**
  - Xem danh sách các yêu cầu chỉnh sửa hồ sơ từ Client, Freelancer và Expert đang chờ duyệt, hoặc tra cứu lịch sử đã duyệt.
  - Xem bảng **So sánh đối chiếu (Diff View: Giá trị cũ vs. Giá trị mới)** của từng trường dữ liệu.
  - Nhấn **Approve** để áp dụng thay đổi lên hồ sơ công khai, hoặc nhấn **Reject** kèm ghi chú phản hồi.
- [ ] **M16.03 – Kiểm duyệt Nội dung bị báo cáo vi phạm (`/admin/moderation` & `/admin/moderation/[id]` - UC-17.17, UC-17.18, UC-17.19):**
  - Xem hàng đợi các bài viết và bình luận bị người dùng báo cáo vi phạm trên diễn đàn.
  - Xem chi tiết nội dung gốc, danh sách người báo cáo và lý do.
  - Ra quyết định xử lý: **Bỏ qua báo cáo (Dismiss Report)** nếu nội dung hợp lệ, hoặc **Ẩn/Xóa nội dung vi phạm (Remove Content)** và cảnh cáo người đăng.
- [ ] **M16.04 – Quản lý Thùng rác Diễn đàn & Khôi phục nội dung (`/admin/trash` - UC-17.04, UC-17.05):**
  - Xem danh sách các bài viết và bình luận đã bị xóa mềm, xem chi tiết nội dung và nhấn **Restore** để khôi phục lại nếu xóa nhầm.
- [ ] **M16.05 – Giám sát Hợp đồng & Trọng tài Phân xử Tranh chấp (`/admin/disputes` & `/admin/disputes/[id]` - UC-23.10, UC-23.11, UC-26.08, UC-26.09):**
  - Xem danh sách toàn bộ các vụ tranh chấp hợp đồng đang mở trên hệ thống.
  - Kiểm tra hồ sơ vụ việc: Điều khoản hợp đồng gốc, yêu cầu của Milestone, sản phẩm Freelancer đã nộp, lịch sử tin nhắn và toàn bộ bằng chứng do hai bên cung cấp.
  - Đưa ra đề xuất phân xử hoặc **Thực thi Phán quyết Trọng tài (Execute Dispute Resolution)**: Quyết định hoàn trả 100% tiền Escrow cho Client, giải ngân 100% cho Freelancer, hoặc chia theo tỷ lệ phần trăm công bằng giữa hai bên và đóng tranh chấp.

---

## III. BẢNG PHÂN CÔNG CHI TIẾT CHO 5 THÀNH VIÊN NHÓM SEP490_04

Nguyên tắc phân công:
1. **Đúng sở trường & đúng code đã làm:** Ai đã code và viết Use Case/Test Case cho module nào ở các Report 3, 4, 5 thì phụ trách viết User Guide và chụp ảnh màn hình cho đúng module đó (vì đã nắm rõ nhất từng nút bấm, dữ liệu đầu vào và luồng chạy).
2. **Cân bằng khối lượng:** Tổng cộng có **3 hạng mục Cài đặt/Đóng gói (`A1`–`A3`)** và **16 Modules hướng dẫn sử dụng (`M1`–`M16`, gồm 128 mục chi tiết, ~172 màn hình)**. Mỗi thành viên sẽ phụ trách **~25–26 mục chức năng (~32–36 màn hình chụp & chú thích)**.

### Bảng tổng hợp khối lượng công việc của 5 thành viên

| STT | Thành viên | Mã SV | Các phần & Module phụ trách chính | Số mục chi tiết | Số màn hình chụp & khoanh đỏ (ước tính) | Tên file LaTeX phụ trách |
| :-: | :--- | :---: | :--- | :-: | :-: | :--- |
| **1** | **Nguyễn Tiến Thuận** | `CE181024` | • **A2.4 & A3.5–A3.6:** Cài đặt Docker Compose 5 containers + AI Services + Ollama<br>• **Module 2:** Auth & Session Management<br>• **Module 14:** Admin RBAC (Roles, Permissions) & Admin User Management<br>• **Module 15 (phần 1–3):** Admin Skills, Job Categories, Forum Categories<br>• **Tổng hợp & Biên dịch file LaTeX chính** | **26 mục** | ~35 ảnh | `sec2_docker_ai.tex`<br>`sec3_m02_auth_session.tex`<br>`sec3_m14_admin_rbac_users.tex`<br>`sec3_m15_admin_catalogs.tex` |
| **2** | **Phạm Khả Vy** | `CE182254` | • **Module 1 (M1.01–M1.06):** Overview, Homepage, Find Work, Job Detail, Public Freelancer Profile<br>• **Module 4 (M4.01–M4.04):** Freelancer Profile, Skills & Portfolio<br>• **Module 6:** Bookmarks, Saved Searches, Job Alerts, Freelancer Proposals<br>• **Module 8 (M8.01–M8.03, M8.05):** Client Job Posting, Job Management & Reviewing Proposals | **26 mục** | ~36 ảnh | `sec3_m01_guest_public.tex`<br>`sec3_m04_freelancer_profile.tex`<br>`sec3_m06_search_proposals.tex`<br>`sec3_m08_client_jobs.tex` |
| **3** | **Trần Phát Tài** | `CE181632` | • **Module 4 (M4.05) & Module 8 (M8.04):** Quản lý CV & AI Section-Aware CV-Job Matching<br>• **Module 9:** Contract Lifecycle, Electronic Signature, Contract Files, Milestones & Deliverables<br>• **Module 10:** Stripe Payment Methods, Milestone Escrow Funding, Stripe Connect Onboarding & Freelancer Payouts | **25 mục** | ~34 ảnh | `sec3_m04_cv_ai_matching.tex`<br>`sec3_m09_contracts_milestones.tex`<br>`sec3_m10_payments_payouts.tex` |
| **4** | **Võ Nhựt Tín** | `CE180619` | • **Module 1 (M1.09) & Module 12:** Public Forum, Real-time Chat (`/conversations`), Notifications, Forum Posts/Comments/Likes/Reports<br>• **Module 11 (M11.01–M11.04):** Contract Dispute Creation, Fee Payment, Evidence & Responses<br>• **Module 16 (M16.03–M16.05):** Admin Moderation Queue, Forum Trash & Admin Dispute Arbitration | **25 mục** | ~34 ảnh | `sec3_m12_chat_noti_forum.tex`<br>`sec3_m11_disputes.tex`<br>`sec3_m16_admin_mod_disputes.tex` |
| **5** | **Nguyễn Lư Nhật Huy** | `CE181196` | • **A1, A2.1–A2.3 & A3.1–A3.4:** Deliverable Package, System Requirements, Cài đặt từ máy trắng (Git, Node, PNPM, `.env`, Prisma Migrate & Seed)<br>• **Module 1 (M1.07–M1.08), Module 3 & Module 7:** Account Settings, Role Switching, Client Profile, Favorites/Following, Public Experts<br>• **Module 5 & Module 13:** Freelancer eKYC (AI ID-Verification) & Expert Workspace<br>• **Module 11 (M11.05–M11.06), Module 15 (M15.04) & Module 16 (M16.01–M16.02):** Reviews & Responses, Admin Banners, Admin eKYC Review & Profile Revisions Review | **26 mục** | ~35 ảnh | `sec1_deliverables_install.tex`<br>`sec3_m03_m07_account_client.tex`<br>`sec3_m05_m13_ekyc_expert.tex`<br>`sec3_m11_m16_reviews_admin_approvals.tex` |

---

### Chi tiết công việc từng thành viên (Checklist cá nhân)

#### 1. Thành viên 1: Nguyễn Tiến Thuận (`CE181024`)
- **Phần Cài đặt Docker & AI (`II.2`):**
  - Viết bảng ánh xạ Port (`A2.4`) và hướng dẫn chạy `docker compose up -d --build` cho 5 containers (`frontend`, `backend`, `id-verification`, `cv-matching`, `ollama`), kéo model `qwen3:4b`, kiểm tra Swagger của 2 con AI (`8000/docs`, `8001/docs`) (`A3.5`, `A3.6`).
- **Phần Hướng dẫn sử dụng (`II.3`):**
  - **Module 2 (`M2.01` – `M2.07`):** Đăng ký, Đăng nhập Email/Password, Đăng nhập Google OAuth, Quên mật khẩu, Danh sách/Chi tiết/Thu hồi phiên đăng nhập (`/sessions`), Đăng xuất.
  - **Module 14 (`M14.01` – `M14.08`):** Admin Dashboard (`/admin`), Admin Profile, Quản lý Roles (Danh sách, Chi tiết, Tạo, Sửa, Xóa, Gán quyền Permission Matrix), Quản lý Permissions, Quản lý Users (Danh sách, Chi tiết, Tạo mới, Khóa/Mở khóa, Sửa trực tiếp 5 tab hồ sơ Client/Freelancer/Expert).
  - **Module 15 (`M15.01` – `M15.03`):** Quản lý Kỹ năng (`/admin/skills`), Quản lý Danh mục việc làm (`/admin/job-categories`), Quản lý Chuyên mục diễn đàn (`/admin/categories`) — bao gồm Tạo, Sửa, Xóa mềm và Khôi phục.
- **Vai trò ghép bài:** Kiểm tra định dạng LaTeX, ghép toàn bộ các file `.tex` con vào `Report6_Software_User_Guides.tex`, cập nhật `Record of Changes` và xuất bản PDF hoàn chỉnh.

#### 2. Thành viên 2: Phạm Khả Vy (`CE182254`)
- **Phần Hướng dẫn sử dụng (`II.3`):**
  - **Module 1 (`M1.01` – `M1.06`):** Viết mục `3.1 Overview` (Giới thiệu hệ thống & 5 Actors), Trang chủ (`/`), Tìm kiếm & Lọc việc làm (`/find-work`), Xem chi tiết việc làm (`/job/[slug]`), Xem hồ sơ Freelancer công khai (`/profiles/[id]`) và chi tiết Portfolio công khai.
  - **Module 4 (`M4.01` – `M4.04`):** Xem & cập nhật hồ sơ Freelancer (`/profile/edit`), Thêm/Xóa kỹ năng Freelancer, Danh sách/Thêm/Sửa/Xóa dự án Portfolio.
  - **Module 6 (`M6.01` – `M6.06`):** Lưu việc làm (`/bookmarks`), Tìm kiếm đã lưu (Saved Searches), Thông báo việc làm (Job Alerts), Gửi Proposal ứng tuyển (`/job/[slug]/apply`), Xem danh sách/Chi tiết/Sửa/Rút lại Proposal đã gửi (`/proposals`).
  - **Module 8 (`M8.01` – `M8.03`, `M8.05`):** Client đăng tin tuyển dụng mới (`/client/jobs/new`), Quản lý danh sách Job đã đăng, Sửa/Đổi trạng thái/Xóa Job, Xem chi tiết Proposal của ứng viên và Chấp nhận/Từ chối Proposal.

#### 3. Thành viên 3: Trần Phát Tài (`CE181632`)
- **Phần Hướng dẫn sử dụng (`II.3`):**
  - **Module 4 (`M4.05`) & Module 8 (`M8.04`):** Freelancer tải lên/xem/thay thế/xóa CV PDF, AI bóc tách cấu trúc CV, và màn hình Client xem danh sách ứng viên được xếp hạng kèm điểm số **AI Section-Aware CV-Job Matching** (`cv-matching` + `Ollama`).
  - **Module 9 (`M9.01` – `M9.08`):** Tạo hợp đồng từ Proposal, Danh sách & Chi tiết hợp đồng (`/contracts/[id]`), Cập nhật điều khoản, Ký hợp đồng điện tử hai bên (*Sign Contract*), Hủy hợp đồng, Quản lý/Upload/Xóa tài liệu hợp đồng (*Contract Files*), Tạo/Sửa/Xóa Milestone, Freelancer cập nhật tiến độ & nộp sản phẩm (*Submit Deliverable*), Client tải bài nộp kiểm tra & bấm *Approve* (Nghiệm thu) hoặc *Request Changes* (Yêu cầu sửa lại).
  - **Module 10 (`M10.01` – `M10.05`):** Quản lý thẻ thanh toán của Client (`/payments/methods`), Nạp tiền ký quỹ *Fund Milestone Escrow* qua Stripe, Xem lịch sử & chi tiết giao dịch thanh toán (`/payments`), Freelancer liên kết tài khoản nhận tiền *Stripe Connect Express Onboarding* (`/payouts/onboarding`), Xem lịch sử & chi tiết giải ngân (`/payouts`).

#### 4. Thành viên 4: Võ Nhựt Tín (`CE180619`)
- **Phần Hướng dẫn sử dụng (`II.3`):**
  - **Module 1 (`M1.09`) & Module 12 (`M12.01` – `M12.06`):** Nhắn tin trực tiếp thời gian thực (`/conversations`), Trung tâm thông báo thời gian thực (`/notifications`), Xem diễn đàn công khai (`/forum`), Tạo bài viết mới, Sửa/Xóa/Like bài viết, Bình luận/Trả lời/Sửa/Xóa/Like bình luận, Báo cáo bài viết hoặc bình luận vi phạm (*Report Content*).
  - **Module 11 (`M11.01` – `M11.04`):** Mở tranh chấp hợp đồng (`/contracts/[id]/disputes/new`), Đóng phí trọng tài tranh chấp, Xem chi tiết tranh chấp, Gửi phản hồi & bổ sung bằng chứng (`/disputes/[id]`), Chấp nhận/Từ chối phương án hòa giải.
  - **Module 16 (`M16.03` – `M16.05`):** Admin kiểm duyệt nội dung bị báo cáo (`/admin/moderation`), Quản lý thùng rác diễn đàn & khôi phục bài viết/bình luận đã xóa (`/admin/trash`), Admin giám sát hợp đồng & Trọng tài phân xử tranh chấp (`/admin/disputes` – đề xuất phương án và thực thi chia tiền/hoàn tiền Escrow).

#### 5. Thành viên 5: Nguyễn Lư Nhật Huy (`CE181196`)
- **Phần Đóng gói & Cài đặt cơ bản từ máy trắng (`II.1` & `II.2`):**
  - Viết bảng `II.1 Deliverable Package` (`A1.2`), Cấu hình phần cứng/phần mềm (`A2.1`–`A2.3`).
  - Chụp ảnh & viết hướng dẫn cài đặt từ A–Z như máy chưa có gì (`A3.1`–`A3.4`): Cài đặt Git, Node.js LTS, PNPM, Docker Desktop, Clone repo, cấu hình file `.env`, chạy Prisma Migrate & Seed dữ liệu mẫu, bảng tài khoản Demo.
- **Phần Hướng dẫn sử dụng (`II.3`):**
  - **Module 1 (`M1.07` – `M1.08`), Module 3 (`M3.01` – `M3.06`) & Module 7 (`M7.01` – `M7.04`):** Cài đặt tài khoản chung, Upload & Crop Avatar, Đổi mật khẩu, Quản lý Social Links, Đăng ký thêm vai trò & Chuyển đổi vai trò (`Client` $\leftrightarrow$ `Freelancer`), Client Dashboard, Xem & sửa Hồ sơ Công ty (`/client/profile`), Quản lý danh sách Freelancer yêu thích (`/favorites`) và đang theo dõi (`/following`), Xem danh bạ & chi tiết Chuyên gia công khai (`/experts`).
  - **Module 5 (`M5.01` – `M5.02`) & Module 13 (`M13.01` – `M13.03`):** Freelancer gửi hồ sơ xác thực eKYC (chụp CCCD 2 mặt + Webcam Selfie Liveness qua AI `id-verification`) & theo dõi trạng thái; Không gian làm việc của Chuyên gia (`/expert/profile` – xem và gửi yêu cầu cập nhật hồ sơ Expert).
  - **Module 11 (`M11.05` – `M11.06`), Module 15 (`M15.04`) & Module 16 (`M16.01` – `M16.02`):** Viết đánh giá sau hợp đồng (*Write Review*), Sửa/Xóa & Phản hồi đánh giá (*Respond to Review*); Admin quản lý Banner (`/admin/banners`); Admin hậu kiểm & duyệt eKYC (`/admin/identity-verifications`); Admin duyệt yêu cầu cập nhật hồ sơ có bảng so sánh Diff (`/admin/profile-revisions`).

---

## IV. TỔ CHỨC THƯ MỤC ẢNH & FILE LATEX ĐỂ LÀM VIỆC NHÓM KHÔNG BỊ XUNG ĐỘT

Để 5 người cùng làm trên Git mà không bị conflict file `Report6_Software_User_Guides.tex`, nhóm thống nhất cấu trúc thư mục trong `docs/report 6/` như sau:

```text
docs/report 6/
├── Report6_Software_User_Guides.tex       # File gốc (chỉ dùng \input{} để nạp các file con)
├── DANH_SACH_CHUC_NANG_VA_PHAN_CONG_REPORT_6.md
├── sections/                              # Mỗi thành viên viết vào các file .tex riêng của mình
│   ├── sec1_deliverables_install.tex      # Nhật Huy
│   ├── sec2_docker_ai.tex                 # Tiến Thuận
│   ├── sec3_m01_guest_public.tex          # Khả Vy
│   ├── sec3_m02_auth_session.tex          # Tiến Thuận
│   ├── sec3_m03_m07_account_client.tex    # Nhật Huy
│   ├── sec3_m04_freelancer_profile.tex    # Khả Vy
│   ├── sec3_m04_cv_ai_matching.tex        # Phát Tài
│   ├── sec3_m05_m13_ekyc_expert.tex       # Nhật Huy
│   ├── sec3_m06_search_proposals.tex      # Khả Vy
│   ├── sec3_m08_client_jobs.tex           # Khả Vy
│   ├── sec3_m09_contracts_milestones.tex  # Phát Tài
│   ├── sec3_m10_payments_payouts.tex      # Phát Tài
│   ├── sec3_m11_disputes.tex              # Nhựt Tín
│   ├── sec3_m11_m16_reviews_admin_approvals.tex # Nhật Huy
│   ├── sec3_m12_chat_noti_forum.tex       # Nhựt Tín
│   ├── sec3_m14_admin_rbac_users.tex      # Tiến Thuận
│   ├── sec3_m15_admin_catalogs.tex        # Tiến Thuận
│   └── sec3_m16_admin_mod_disputes.tex    # Nhựt Tín
└── images/                                # Phân chia thư mục ảnh riêng theo từng mảng
    ├── install/                           # Ảnh cài đặt Git, Node, Docker, Env, Terminal (Huy + Thuận)
    ├── guest/                             # Ảnh Homepage, Find Work, Public Profiles (Vy + Huy)
    ├── auth/                              # Ảnh Login, Register, Google OAuth, Sessions (Thuận)
    ├── freelancer/                        # Ảnh Profile, Portfolio, CV, eKYC, Bookmarks, Proposals (Vy + Tài + Huy)
    ├── client/                            # Ảnh Client Profile, Post Job, AI Matching, Favorites (Vy + Tài + Huy)
    ├── contracts_payments/                # Ảnh Contract, Milestone, Stripe Escrow, Payouts, Disputes (Tài + Tín)
    ├── community/                         # Ảnh Chat, Notifications, Forum, Reviews (Tín + Huy)
    ├── expert/                            # Ảnh Expert Workspace (Huy)
    └── admin/                             # Ảnh Admin Roles, Users, Catalogs, eKYC, Revisions, Moderation, Disputes (Thuận + Tín + Huy)
```

### Quy tắc đặt tên file ảnh & nhãn `\label{}` trong LaTeX:
1. **Tên file ảnh:** Viết chữ thường, không dấu, không khoảng trắng, bắt đầu bằng mã mục:
   - Ví dụ: `m02_01_register_form.png`, `m08_04_ai_cv_matching_score.png`, `inst_01_git_download.png`.
2. **Nhãn hình ảnh (`\label`):** Đặt theo cú pháp `fig:<mã_mục>_<mô_tả>` (ví dụ: `\label{fig:m02_01_register}`) để không bao giờ bị trùng nhãn giữa 5 thành viên.
3. **Ký tự đặc biệt trong LaTeX:** Nhớ escape các ký tự `\_`, `\%`, `\&`, `\#`, `\$` khi viết ngoài môi trường code/url.

