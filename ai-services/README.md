# Frevia AI Microservices

Thư mục này chứa 2 microservices AI độc lập được kết nối với hệ thống Frevia thông qua **Docker Compose**:

---

## 1. Dịch vụ AI Xác minh Danh tính (eKYC / ID Verification)
- **Repository nguồn:** [`ivakavych-kartoshka/IDVerification`](https://github.com/ivakavych-kartoshka/IDVerification)
- **Thư mục local:** `ai-services/id-verification`
- **Công nghệ:** Python 3.11, FastAPI, OpenCV, InsightFace, RapidOCR, MediaPipe
- **Cổng hoạt động:** Container port `8001` (Host port `8001`)
- **Build context trong Docker Compose:** `./ai-services/id-verification/ai`
- **Dockerfile:** `./ai-services/id-verification/ai/Dockerfile`
- **Endpoints chính được Backend Frevia gọi:**
  - `POST /verify/`: Xác thực CCCD đầy đủ (OCR mặt trước/sau, Face match, Liveness, Anti-tamper).
  - `POST /liveness/pose`: Kiểm tra cử động khuôn mặt real-time (yaw, pitch, roll, blink).
  - `GET /healthz`: Healthcheck trạng thái dịch vụ.
- **Biến môi trường trong Backend:**
  - `AI_SERVICE_URL=http://id-verification:8001`
  - `AI_SERVICE_TIMEOUT_MS=60000`

---

## 2. Dịch vụ AI Trích xuất & Khớp nối CV - Việc làm (Section-Aware CV & Job Matching)
- **Repository nguồn:** [`tptai1314/section-aware-cv-job-matching`](https://github.com/tptai1314/section-aware-cv-job-matching)
- **Thư mục local:** `ai-services/cv-matching`
- **Công nghệ:** Python 3.11, FastAPI, Sentence-Transformers (BGE-M3), ChromaDB, Ollama LLM
- **Cổng hoạt động:** Container port `8000` (Host port `8000`)
- **Build context trong Docker Compose:** `./ai-services/cv-matching`
- **Dockerfile:** `apps/ai/Dockerfile`
- **Endpoints chính được Backend Frevia gọi:**
  - `POST /api/v1/ai/analyze-cv`: Bóc tách thông tin ứng viên từ file PDF/DOCX sang JSON có cấu trúc.
  - `POST /internal/*`: API nội bộ tính điểm tương đồng ngữ nghĩa giữa hồ sơ và yêu cầu tuyển dụng.
  - `GET /healthz`: Healthcheck trạng thái dịch vụ.
- **Biến môi trường trong Backend:**
  - `FREVIA_AI_URL=http://cv-matching:8000`
  - `FREVIA_AI_TOKEN=frevia_ai_internal_secret_token`
- **Phụ thuộc:** Yêu cầu service `ollama` (port 11434) để phục vụ suy luận LLM bóc tách văn bản.

---

## 3. Lệnh khởi chạy nhanh với Docker Compose
Từ thư mục gốc dự án `Frevia`:

```bash
# Khởi động toàn bộ 5 dịch vụ (frontend, backend, id-verification, cv-matching, ollama)
docker compose up -d --build

# Xem log kiểm tra kết nối giữa các dịch vụ
docker compose logs -f id-verification cv-matching backend
```

