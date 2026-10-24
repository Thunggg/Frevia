# Spec — Dịch vụ AI phân tích CV (`frevia-ai`)

> Tài liệu đặc tả cho service phân tích CV mà NestJS gọi sang.
> Trạng thái: **chốt spec** · Phạm vi: service AI (không gồm nghiệp vụ hồ sơ phía NestJS)
> Liên quan trong repo: [`ai-cv-analyzer.service.ts`](../apps/api/src/shared/services/ai-cv-analyzer.service.ts),
> [`profile.service.ts`](../apps/api/src/routes/profiles/profile.service.ts),
> [`profile.model.ts`](../packages/shared-type/src/model/profile.model.ts)

---

## 0. Tóm tắt

`frevia-ai` là một service nội bộ (Python, chạy cạnh NestJS) nhận **một file CV** (PDF, có thể mở rộng DOC/DOCX),
đọc nội dung, gọi **LLM local qua Ollama** để trích xuất thông tin có cấu trúc, chuẩn hóa theo JSON schema rồi
trả về cho NestJS. Service **không xác thực người dùng, không truy cập DB, không tự ghi vào hồ sơ**.

Kết quả cuối cùng được hiển thị cho freelancer **xem → sửa → xác nhận** trước khi NestJS lưu vào hồ sơ.

### Quyết định mặc định (có thể đổi, cần chốt ở mục 13)

| Hạng mục | Mặc định đề xuất |
|---|---|
| Ngôn ngữ / framework | Python 3.11 + FastAPI + Uvicorn |
| LLM runtime | Ollama, model `qwen2.5:7b-instruct`, `temperature = 0` |
| Đọc PDF text | `pypdf` (hoặc `pdfplumber` nếu cần layout) |
| Đọc DOCX | `python-docx` |
| OCR | Tesseract (`pytesseract` + `pdf2image`/`poppler`) — chỉ dùng khi PDF không có text layer |
| Kiểm tra schema | Pydantic v2 (`model_validate`, cấm field lạ) |
| Đóng gói | Docker image riêng, thêm service vào `docker-compose.yml` |
| Cấu hình | Biến môi trường: `OLLAMA_URL`, `OLLAMA_MODEL`, `OCR_ENABLED`, `MAX_UPLOAD_MB`, `REQUEST_TIMEOUT_S` |

---

## 1. Ranh giới trách nhiệm

| Việc | `frevia-ai` | NestJS (`apps/api`) | Web (`apps/web`) |
|---|---|---|---|
| Xác thực, phân quyền, kiểm tra hồ sơ thuộc về ai | ✗ | ✓ (`getOwnedFreelancerProfile`) | ✗ |
| Lưu file CV (Cloudinary / local `uploads/`) | ✗ | ✓ | ✗ |
| Gửi file sang service AI | ✗ | ✓ (`AiCvAnalyzerService.extractSkills`) | ✗ |
| Nhận file, kiểm tra magic bytes/dung lượng lần 2 | ✓ | ✓ (đã check khi upload) | ✗ |
| Trích xuất text, OCR | ✓ | ✗ | ✗ |
| Gọi LLM, parse JSON, chuẩn hóa | ✓ | ✗ | ✗ |
| Map tên skill về **skill catalog** của hệ thống | ✗ (chỉ trả tên thô) | ✓ (`SkillResolverService`) | ✗ |
| Loại skill đã có trong hồ sơ, dedupe | ✗ | ✓ | ✗ |
| Hiển thị cho freelancer sửa & xác nhận | ✗ | ✗ (chỉ trả API) | ✓ |
| Ghi vào hồ sơ | ✗ | ✓ (sau khi người dùng xác nhận) | ✗ |
| Lưu log/audit nội dung CV | chỉ log kỹ thuật, **không log nội dung CV** | ✓ | ✗ |

**Nguyên tắc**: service AI là *hàm thuần* — `file vào → JSON ra`. Mọi thứ liên quan tới con người, quyền, DB đều ở NestJS.
Nhờ vậy service AI có thể test độc lập, và không giữ PII lâu hơn thời gian xử lý request.

---

## 2. Luồng xử lý

> **Hiện trạng tích hợp**: NestJS đã có endpoint `POST /api/profiles/:id/cv/analyze` và đã gọi service AI;
> **Web chưa có UI gọi endpoint này** (xem 8.3 và mục 12). Phần "xem → sửa → xác nhận" dưới đây là luồng đích.

```
Freelancer            Web (Next.js)              NestJS (apps/api)                frevia-ai (service này)
    │                     │                            │                                  │
    │ gọi API (khi có UI) │                            │                                  │
    ├────────────────────>│ POST /api/profiles/:id/cv/analyze                              │
    │                     ├───────────────────────────>│ 1. kiểm tra quyền sở hữu hồ sơ   │
    │                     │                            │ 2. đọc CV (local:// hoặc remote) │
    │                     │                            │ 3. multipart POST /api/v1/ai/analyze-cv
    │                     │                            ├─────────────────────────────────>│ 4. nhận file
    │                     │                            │                                  │ 5. trích text (+OCR)
    │                     │                            │                                  │ 6. gọi Ollama
    │                     │                            │                                  │ 7. chuẩn hóa JSON
    │                     │                            │<─────────────────────────────────┤ 8. trả JSON
    │                     │                            │ 9. map skill catalog, dedupe,    │
    │                     │                            │    bỏ skill đã có                │
    │                     │<───────────────────────────┤ { suggestions: [...] }           │
    │<────────────────────┤ 10. UI review/sửa/xác nhận  │                                  │
    │  xác nhận            │                            │                                  │
    ├────────────────────>├───────────────────────────>│ 11. ghi vào hồ sơ (chỉ field     │
    │                     │                            │     người dùng đã tick)          │
```

Phạm vi tài liệu này là bước 4–8. Bước 1–3 và 9 đã có ở NestJS; bước 10–11 chưa làm (xem mục 12).

---

## 3. Hợp đồng API

### 3.1 Endpoint

```
POST /api/v1/ai/analyze-cv
Content-Type: multipart/form-data
Field:        file  (bắt buộc, 1 file)
```

- Không yêu cầu auth (service nội bộ, chỉ mở trong mạng Docker).
- Có thể thêm `?include=` (mặc định `skills,experience,education,projects,summary`) khi cần tắt bớt phần nặng.

### 3.2 Response 200

```json
{
  "skills": [
    { "name": "React", "proficiency_level": 8, "confidence": 0.9, "evidence": "3 years building React apps" }
  ],
  "experience": [
    {
      "title": "Frontend Developer",
      "company": "Acme",
      "start_date": "2022-03",
      "end_date": "2024-01",
      "is_current": false,
      "description": "Built the design system",
      "confidence": 0.75
    }
  ],
  "education": [
    { "degree": "BSc Computer Science", "school": "HCMUT", "start_year": 2018, "end_year": 2022, "confidence": 0.8 }
  ],
  "projects": [
    { "name": "Shop App", "description": "E-commerce mobile app", "technologies": ["React Native", "Stripe"], "confidence": 0.6 }
  ],
  "summary": "Frontend developer with 4 years of experience...",
  "meta": {
    "source": "pdf_text",
    "pages": 2,
    "chars": 8421,
    "truncated": false,
    "ocr_used": false,
    "model": "qwen2.5:7b-instruct",
    "duration_ms": 8123,
    "warnings": []
  }
}
```

- `source ∈ { pdf_text, pdf_ocr, docx, doc }`
- Mọi field mảng có thể rỗng; **không bao giờ** trả field `null` cho cả object `experience/education/projects`.
- `confidence ∈ [0,1]` hoặc `null` khi model không đưa ra được.
- `profession_level` sai kiểu/ngoài 1..10 → trả `null` (không tự bịa).

### 3.3 Mã lỗi

| HTTP | `detail` (mã) | Khi nào | NestJS map thành |
|---|---|---|---|
| 400 | `CV_FILE_REQUIRED` | thiếu field `file` | `CvFileRequiredException` |
| 400 | `CV_FILE_INVALID` | không phải PDF/DOCX hợp lệ, magic bytes sai | `CvFileInvalidException` |
| 413 | `CV_FILE_TOO_LARGE` | > `MAX_UPLOAD_MB` (mặc định 10MB) | `CvFileInvalidException` |
| 422 | `CV_TEXT_EMPTY` | không trích được text kể cả sau OCR | `CvAiUnavailableException` (hoặc lỗi riêng) |
| 422 | `CV_ENCRYPTED` | PDF có mật khẩu | lỗi riêng "CV được bảo vệ" |
| 500 | `LLM_UNAVAILABLE` | không kết nối được Ollama | `CvAiUnavailableException` |
| 500 | `LLM_INVALID_OUTPUT` | model trả JSON không hợp lệ sau khi đã retry | `CvAiUnavailableException` |
| 504 | `LLM_TIMEOUT` | vượt `REQUEST_TIMEOUT_S` | `CvAiUnavailableException` |

Khuôn lỗi: `{ "detail": "CODE", "message": "mô tả ngắn" }` — NestJS đọc `detail` để map sang thông báo i18n.

### 3.4 Giới hạn

| Giới hạn | Giá trị |
|---|---|
| Dung lượng file | ≤ 10 MB (khớp giới hạn upload hiện tại của NestJS) |
| Số trang đọc | ≤ 20 trang đầu, phần vượt bị cắt và set `meta.truncated = true` |
| Ký tự gửi vào LLM | ≤ ~24.000 ký tự (chunk + merge nếu dài hơn) |
| Số item trả về | skills ≤ 50, experience ≤ 20, education ≤ 10, projects ≤ 20 |
| Timeout xử lý | ≤ 240 s (NestJS đang đặt 300 s ⇒ luôn nhỏ hơn client timeout) |

---

## 4. Trách nhiệm 1 — Tiếp nhận CV

**Đầu vào**: `UploadFile` (multipart) + tên file gốc.

Các bước:

1. Đọc tối đa `MAX_UPLOAD_MB + 1` byte để phát hiện vượt hạn mức sớm (không nạp cả file vào RAM trước khi kiểm tra).
2. **Không tin `Content-Type`** — hiện NestJS luôn gửi `type: application/pdf` kể cả khi file là DOCX:
   - PDF: 5 byte đầu `%PDF-`
   - DOCX: zip container ⇒ `PK\x03\x04` và có entry `word/document.xml`
   - DOC (nhị phân cũ): `\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1` — chỉ hỗ trợ nếu bật cờ `ALLOW_LEGACY_DOC`
3. Ghi ra file tạm (`tempfile`) và **luôn xoá trong `finally`**; không lưu file sau khi trả kết quả.
4. Với PDF: từ chối ngay nếu file bị mã hoá (`CV_ENCRYPTED`).
5. Chống lạm dụng: giới hạn dung lượng sau khi giải nén cho DOCX (zip-bomb), giới hạn số trang, giới hạn thời gian parse.

**Đầu ra**: đường dẫn file tạm + loại file đã xác định (`pdf | docx | doc`) + `meta.pages`.

---

## 5. Trách nhiệm 2 — Đọc và trích xuất văn bản

### 5.1 PDF

1. Thử đọc **text layer** (`pypdf`/`pdfplumber`): lấy text từng trang.
2. Quyết định có OCR:
   - Nếu tổng ký tự hữu ích / số trang < **ngưỡng `OCR_MIN_CHARS_PER_PAGE` (mặc định 100)** ⇒ coi là PDF scan.
   - Hoặc > 60% trang có text rỗng.
3. OCR (khi bật): render trang ở 300 DPI → Tesseract (`vie+eng` nếu CV tiếng Việt) → set `meta.source = pdf_ocr`, `meta.ocr_used = true`.
4. Nếu cả text layer và OCR đều ra < 50 ký tự ⇒ `422 CV_TEXT_EMPTY`.

### 5.2 DOCX / DOC

- DOCX: `python-docx`, duyệt theo thứ tự (**paragraph → table → paragraph**) để không mất nội dung trong bảng (CV rất hay dùng bảng 2 cột).
- DOC: chuyển đổi qua LibreOffice headless nếu có, ngược lại trả `CV_FILE_INVALID` với message rõ ràng.

### 5.3 Làm sạch & chuẩn hóa

| Bước | Quy tắc |
|---|---|
| Unicode | `NFKC`; bỏ ký tự điều khiển; chuẩn hóa `\r\n`, non-breaking space, zero-width |
| Dòng | Bỏ dòng chỉ có số trang / header-footer lặp lại (so khớp theo ≥3 trang) |
| Khoảng trắng | Gộp nhiều space, bỏ dòng trống liên tiếp (giữ tối đa 1) |
| Dòng bị ngắt | Nối dòng khi câu chưa kết thúc và dòng sau bắt đầu bằng chữ thường (giảm lỗi cho LLM) |
| Bullet | Chuẩn hóa `•`, `-`, `*` về `- ` để model dễ đọc |
| Bảo toàn | **Không** sửa tên riêng, không dịch, không viết tắt; giữ nguyên dấu tiếng Việt |

**Đầu ra**: `text` sạch + `meta{source, pages, chars, truncated}`.

---

## 6. Trách nhiệm 3 — Phân tích bằng LLM (Ollama)

### 6.1 Gọi model

```
POST {OLLAMA_URL}/api/chat        (mặc định http://ollama:11434)
{
  "model": "qwen2.5:7b-instruct",
  "stream": false,
  "format": "json",               // buộc JSON hợp lệ
  "options": { "temperature": 0, "top_p": 0.1, "num_ctx": 8192, "seed": 42 }
}
```

- `temperature = 0` + `seed` cố định ⇒ kết quả ổn định, dễ test (golden file).
- `format: "json"` (hoặc `format: <json-schema>` nếu model hỗ trợ) để hạn chế JSON hỏng.
- Timeout riêng cho Ollama (`LLM_TIMEOUT_S`, mặc định 180 s); tổng thời gian phải < timeout của NestJS.

### 6.2 Prompt (khung)

System:
```
Bạn là bộ trích xuất thông tin CV. Chỉ trích xuất thông tin CÓ TRONG VĂN BẢN.
Tuyệt đối không suy diễn, không thêm kỹ năng/kinh nghiệm không được nhắc tới.
Trường không có trong CV thì để null (hoặc mảng rỗng). Trả về DUY NHẤT JSON theo schema.
```

User: `schema mô tả field` + `nội dung CV đã làm sạch`.

Quy tắc chống bịa (bắt buộc ghi trong prompt và kiểm tra lại ở bước 7):

1. Mỗi skill **phải** có `evidence` là đoạn text/câu ngắn xuất hiện trong CV; nếu không tìm thấy chuỗi tương ứng ⇒ loại bỏ hoặc set `confidence` rất thấp.
2. Không tự chia nhỏ/ghép kỹ năng ("ReactJS" ≠ "React Native").
3. Ngày/tháng chỉ lấy khi CV ghi rõ; không suy ra từ thứ tự.
4. `summary` chỉ tóm tắt lại nội dung CV, không thêm nhận xét về năng lực.

### 6.3 CV dài / nhiều trang

- Nếu text > ngưỡng: chia theo trang (ưu tiên) hoặc theo block ~8.000 ký tự có overlap 300 ký tự.
- Gọi model cho từng phần, sau đó **merge**: skills hợp theo tên (giữ `confidence` cao nhất), experience/education nối rồi dedupe theo (title, company) / (degree, school).
- Luôn kèm `summary` sinh từ **bản gộp** ở lần gọi cuối, không phải từng phần.

### 6.4 Chịu lỗi

| Tình huống | Xử lý |
|---|---|
| JSON không parse được | Retry 1 lần với prompt nhắc "chỉ trả JSON, không giải thích"; vẫn lỗi ⇒ `LLM_INVALID_OUTPUT` |
| Thiếu field bắt buộc | Điền mặc định (mảng rỗng/null), ghi vào `meta.warnings` |
| Model trả field lạ | Bỏ (Pydantic `extra="forbid"`), ghi vào `meta.warnings` |
| Ollama không phản hồi | `LLM_UNAVAILABLE` / `LLM_TIMEOUT` (không retry vô hạn, tối đa 1 lần) |

---

## 7. Trách nhiệm 4 — Chuẩn hóa kết quả

### 7.1 Schema (Pydantic v2)

| Object | Field | Kiểu | Quy tắc |
|---|---|---|---|
| Skill | `name` | str | trim, 1..100 ký tự, dedupe không phân biệt hoa/thường |
| | `proficiency_level` | int\|null | 1..10; ngoài khoảng ⇒ `null` |
| | `confidence` | float\|null | 0..1 |
| | `evidence` | str\|null | ≤ 200 ký tự, cắt từ text gốc |
| Experience | `title`, `company` | str\|null | trim, ≤ 150 |
| | `start_date`, `end_date` | str\|null | chuẩn hóa `YYYY-MM` hoặc `YYYY` |
| | `is_current` | bool | true khi end trống/`Present`/`Hiện tại` |
| | `description` | str\|null | ≤ 1000 |
| Education | `degree`, `school` | str\|null | ≤ 150 |
| | `start_year`, `end_year` | int\|null | 1950..năm hiện tại+1 |
| Project | `name` | str\|null | ≤ 150 |
| | `technologies` | str[] | dedupe, ≤ 30, mỗi phần tử ≤ 60 |
| | `description` | str\|null | ≤ 1000 |
| Response | `summary` | str\|null | ≤ 1500 |
| | `meta` | object | như mục 3.2 |

### 7.2 Quy tắc chuẩn hóa

- **Chuẩn hóa ngày**: `03/2022`, `Mar 2022`, `2022-03`, `Tháng 3/2022` → `2022-03`; chỉ có năm → `2022`.
- **Dedupe**: skill theo `lower(trim(name))`; experience theo `(lower(title), lower(company))`; education theo `(lower(degree), lower(school))`.
- **Giới hạn số lượng** (mục 3.4) — cắt bớt thì ghi `meta.warnings`.
- **Đánh dấu thiếu/không chắc chắn**, không suy diễn:
  - `null` = không có trong CV;
  - `confidence < 0.5` = có nhưng model không chắc (UI nên tô nhạt và yêu cầu người dùng xác nhận);
  - `meta.warnings` liệt kê dạng mã: `TRUNCATED`, `OCR_LOW_QUALITY`, `UNKNOWN_FIELD_DROPPED`, `DATE_UNPARSED`, `EMPTY_SECTION:<tên>`.
- **Kiểm tra chéo `evidence`**: skill nào `evidence` không xuất hiện (chuẩn hóa, không phân biệt hoa/thường/khoảng trắng) trong text CV ⇒ hạ `confidence` xuống ≤ 0.3 hoặc loại bỏ nếu `STRICT_EVIDENCE=true`.

**Đầu ra**: JSON đã validate, sẵn sàng trả về.

---

## 8. Trách nhiệm 5 — Trả kết quả & tích hợp NestJS

### 8.1 Phía service AI

- Trả JSON (mục 3.2), header `Content-Type: application/json`, **không** kèm file/text CV gốc.
- Không cache theo mặc định; nếu bật cache thì key = `sha256(file) + model + schema_version`, TTL ≤ 24 h và **chỉ cache kết quả đã chuẩn hóa** (không cache text CV).
- Log: `request_id`, thời lượng từng bước (parse/OCR/LLM/normalize), `source`, `pages`, `warnings`, model; **không log nội dung CV, không log PII**.

### 8.2 Phía NestJS (đã có, cần mở rộng)

Luồng hiện tại: `POST /api/profiles/:id/cv/analyze` → [`profile.service.ts`](../apps/api/src/routes/profiles/profile.service.ts)
`analyzeCv()` → `readCvBytes()` → `AiCvAnalyzerService.extractSkills()` → `SkillResolverService` → `{ suggestions: [{ skillName, proficiencyLevel }] }`.

Service AI cần **tương thích ngược** với client hiện tại:

- `payload.skills[].name` phải giữ đúng tên field cũ (NestJS đang đọc `name` + `proficiency_level`).
- NestJS bỏ qua các field mới (experience/education/projects/summary) — **không lỗi**.
- Khi repo này mở rộng contract (việc ở mục 12), thêm `CvAnalyzeResponseSchema.suggestions` → profile draft gồm cả 4 nhóm còn lại.

### 8.3 Phía Web

Hiện trạng (đã kiểm tra code):

- `apps/web/apiRequests/profile.ts` chỉ có `uploadCv`, `deleteCv` và `searchSkillSuggestions`
  → **chưa có hàm nào gọi `POST /api/profiles/:id/cv/analyze`**, nên endpoint này hiện chưa được UI dùng.
- `general-settings.tsx` có UI upload/xoá CV nhưng **không có nút "Phân tích CV"**.
- Lưu ý phân biệt: `searchSkillSuggestions` (`GET /api/profiles/skills/suggestions`) là **tính năng khác** —
  gợi ý tên skill từ catalog khi freelancer tự thêm skill, **không phải** phân tích CV.

Theo spec, cần bổ sung:

- Nút "Phân tích CV" → gọi endpoint analyze, hiển thị loading (có thể tới vài chục giây) và cho phép huỷ.
- Hiển thị từng nhóm (Kỹ năng / Kinh nghiệm / Học vấn / Dự án / Giới thiệu) dưới dạng **bản nháp cho người dùng sửa**.
- Field có `confidence < 0.5` hoặc `null` được đánh dấu "cần kiểm tra"; không tự tick sẵn những field này.
- Chỉ ghi vào hồ sơ khi freelancer bấm xác nhận; không tự động lưu.
- `meta.warnings` hiển thị dạng ghi chú nhỏ ("CV scan, chất lượng nhận dạng có thể thấp").
- Xử lý lỗi theo mã ở mục 3.3 (hết hạn mức, không kết nối được AI, timeout…).

---

## 9. Phi chức năng

| Nhóm | Yêu cầu |
|---|---|
| Hiệu năng | CV 1–2 trang: p95 ≤ 20 s (không OCR) / ≤ 60 s (có OCR). Vượt 240 s ⇒ `LLM_TIMEOUT`. |
| Đồng thời | ≥ 2 request song song; OCR và LLM là 2 pool riêng, có semaphore tránh nghẽn GPU/CPU. |
| Tài nguyên | Ảnh hưởng chủ yếu là Ollama (RAM/VRAM). Service AI phải cấu hình được model nhỏ hơn khi máy yếu. |
| Bảo mật | Chỉ bind trong mạng nội bộ Docker; không expose port ra ngoài; xoá file tạm trong `finally`; từ chối PDF mã hoá; giới hạn dung lượng + số trang chống zip-bomb/DoS. |
| PII | Không log nội dung CV; không lưu file/text sau khi trả kết quả; không gửi dữ liệu ra internet (LLM chạy local). |
| Cấu hình | `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_S`, `OCR_ENABLED`, `OCR_LANGS`, `MAX_UPLOAD_MB`, `MAX_PAGES`, `STRICT_EVIDENCE`, `LOG_LEVEL`. Thiếu biến bắt buộc ⇒ **fail-fast khi khởi động**. |
| Vận hành | `GET /healthz` (service sống) và `GET /readyz` (kiểm tra kết nối Ollama + model đã pull). Docker healthcheck dùng `/healthz`. |
| Versioning | Đường dẫn có `/v1/`; đổi schema phá vỡ tương thích ⇒ tăng version, giữ `/v1` thêm 1 sprint. |
| Ngôn ngữ | CV tiếng Việt và tiếng Anh; OCR cần `vie+eng`; prompt yêu cầu trả field giữ nguyên ngôn ngữ gốc. |

---

## 10. Kiểm thử & tiêu chí nghiệm thu

### 10.1 Bộ test

| Loại | Nội dung |
|---|---|
| Unit — parse | PDF text layer, PDF scan (OCR), DOCX có bảng, file rỗng, PDF mã hoá, file > 10MB |
| Unit — clean | Header/footer lặp, unicode lạ, bullet, dòng bị ngắt |
| Unit — normalize | Ngày `03/2022`/`Mar 2022`/`2022`, proficiency ngoài 1..10, field lạ, dedupe, giới hạn số lượng |
| LLM | **Mock Ollama** (fixture JSON) cho CI; test riêng có gắn cờ `@pytest.mark.llm` khi chạy thật |
| Golden | 5–10 CV mẫu (`tests/fixtures/`) + JSON mong đợi (so khớp sau khi sort + bỏ `meta.duration_ms`) |
| Contract | Chạy cùng fixture, đảm bảo response vẫn chứa `skills[].name` + `proficiency_level` để NestJS không vỡ |
| Bảo mật | Path traversal tên file, file giả mạo magic bytes, zip-bomb DOCX |

### 10.2 Acceptance criteria

- [ ] Trả đúng schema mục 3.2, `extra="forbid"`, không có field lạ.
- [ ] PDF text, PDF scan (OCR), DOCX đều cho kết quả; `meta.source` đúng.
- [ ] Không xuất hiện skill/kinh nghiệm **không có** trong CV (kiểm tra bằng bộ golden + `evidence`).
- [ ] Mọi trường hợp lỗi ở mục 3.3 trả đúng mã, không trả stack trace.
- [ ] p95 thời gian xử lý đạt mục 9 với CV 1–2 trang.
- [ ] `docker compose up` chạy được service + Ollama; `/healthz` OK; NestJS gọi sang thành công end-to-end.
- [ ] Không log nội dung CV; file tạm bị xoá sau mỗi request.
- [ ] Tương thích ngược: NestJS hiện tại (chỉ đọc `skills`) vẫn chạy không cần sửa.

---

## 11. Database (đã bổ sung)

Trước khi bổ sung, schema **thiếu** những thứ sau cho luồng này:

| Thiếu gì | Hệ quả |
|---|---|
| Chỗ lưu kết quả phân tích | Mở lại phải gọi LLM lần nữa; không giữ được `confidence`/`warnings`/`meta`; không có trạng thái "chờ xác nhận" |
| Kinh nghiệm có cấu trúc | `FreelancerProfile.experience` chỉ là `String[]` — không chứa được company / thời gian / mô tả |
| Học vấn có cấu trúc | `FreelancerProfile.education` chỉ là `String[]` — không tách được degree / school / năm |
| Nguồn dữ liệu | Không biết mục nào do AI nhập để hiển thị badge hoặc undo |

Đã thêm bằng migration `20261007000000_add_cv_analysis_and_structured_profile_sections`:

| Object | Vai trò |
|---|---|
| `enum CvAnalysisStatus` | `PENDING / CONFIRMED / DISCARDED` — trạng thái bản nháp |
| `enum CvSourceType` | `PDF_TEXT / PDF_OCR / DOCX / DOC` — khớp `meta.source` |
| `enum ProfileContentSource` | `MANUAL / CV_IMPORT` — nguồn của một mục trong hồ sơ |
| `CvAnalysis` | 1 dòng cho 1 lần phân tích: `status`; CV đã phân tích (`cvUrl`, `cvFileName`, `cvUploadedAt`); meta (`source`, `pages`, `chars`, `truncated`, `ocrUsed`, `model`, `durationMs`, `warnings`); `payload Json` (kết quả đã chuẩn hóa kèm confidence/evidence); `confirmedAt`, `discardedAt` |
| `FreelancerExperience` | `title`, `company`, `startDate`, `endDate`, `isCurrent`, `description`, `source`, soft delete |
| `FreelancerEducation` | `degree`, `school`, `startYear`, `endYear`, `description`, `source`, soft delete |
| `PortfolioItem.source` | đánh dấu project được nhập từ CV |

Quy ước & lưu ý:

- `CvAnalysis` **không phải hồ sơ**: chỉ khi người dùng xác nhận thì dữ liệu mới được ghi vào
  `FreelancerSkill` / `FreelancerExperience` / `FreelancerEducation` / `PortfolioItem`, rồi set `status = CONFIRMED` + `confirmedAt`.
- `payload` giữ nguyên `confidence`/`evidence` để UI hiển thị "cần kiểm tra" và cho sửa mà không phải gọi lại AI.
- `CvAnalysis.cvUploadedAt` dùng để so với CV hiện tại: kết quả cũ hơn CV đang lưu ⇒ coi là lỗi thời, UI nên cảnh báo.
- **Không** backfill từ `experience`/`education` (`String[]`) để tránh hai nguồn dữ liệu trùng nhau; hai cột cũ giữ nguyên
  cho tới khi API/UI chuyển hẳn sang bảng mới, sau đó xoá bằng migration riêng.
- `startDate`/`endDate` lưu dạng chuỗi `YYYY-MM` hoặc `YYYY` (CV thường chỉ ghi tới tháng) — cố ý **không** dùng `DateTime`
  để tránh tự bịa ngày.
- Tầng API/UI cho các bảng này **chưa làm** (repository/service + DTO cho bản nháp, endpoint xác nhận, màn hình review) — xem mục 12.

---

## 12. Khoảng trống hiện tại trong repo này

| # | Việc | File / khu vực | Ưu tiên |
|---|---|---|---|
| 1 | Contract chỉ trả `skills`; chưa có experience/education/projects/summary/confidence/meta | [`profile.model.ts:78`](../packages/shared-type/src/model/profile.model.ts#L78) (`CvAnalyzeSkillSchema`, `CvAnalyzeResponseSchema`) | Cao (nếu muốn dùng hết spec) |
| 2 | `FREVIA_AI_URL` chưa khai báo trong validate-env ⇒ không fail-fast khi thiếu | [`validate-env.ts`](../apps/api/src/shared/config/validate-env.ts) | Trung bình |
| 3 | Client luôn gửi `type: application/pdf` cho mọi loại file | [`ai-cv-analyzer.service.ts:27`](../apps/api/src/shared/services/ai-cv-analyzer.service.ts#L27) | Trung bình (service AI phải sniff magic bytes) |
| 4 | Upload CV **chỉ nhận PDF** (magic `%PDF-`, ≤10MB), trong khi BR-CV-02 ghi PDF/DOC/DOCX | [`profile.service.ts:60`](../apps/api/src/routes/profiles/profile.service.ts#L60) | Cần chốt lại BR hoặc mở rộng validator |
| 5 | Chưa có service AI trong repo/compose | `docker-compose.yml` (chỉ có `backend`, `frontend`) | — (thuộc service riêng) |
| 6 | **Web chưa gọi endpoint analyze**: không có nút "Phân tích CV", không có màn hình review/sửa/xác nhận | [`apiRequests/profile.ts`](../apps/web/apiRequests/profile.ts), `general-settings.tsx` | Cao (nút bấm cho cả luồng) |
| 7 | Chưa map lỗi chi tiết (`CV_ENCRYPTED`, `LLM_TIMEOUT`…) sang thông báo i18n | `profile.error.ts`, i18n `Error.*` | Thấp |
| 8 | Bảng `CvAnalysis` / `FreelancerExperience` / `FreelancerEducation` đã có nhưng **chưa có repository/service/DTO** dùng chúng | `apps/api/src/routes/profiles/`, `packages/shared-type` | Cao (nối DB với API) |

---

## 13. Câu hỏi cần chốt

1. **Service AI có tách repo riêng** không, hay đặt trong monorepo này (ví dụ `apps/ai/`)? Spec này giả định tách riêng, deploy bằng compose.
2. **Model Ollama** chính thức: `qwen2.5:7b-instruct` hay model khác? Máy chạy có GPU không (ảnh hưởng timeout và khả năng OCR)?
3. **DOC/DOCX**: mở rộng upload ở NestJS cho đúng BR-CV-02, hay giữ PDF-only và sửa lại BR?
4. **OCR**: bật mặc định hay chỉ khi phát hiện scan? Ngôn ngữ `vie+eng` đã đủ chưa?
5. **Phạm vi trả về**: chỉ `skills` (giữ nguyên như hiện tại) hay trả đủ 5 nhóm để UI review?
6. **Ghi hồ sơ**: freelancer tick từng field (khuyến nghị) hay ghi tất cả rồi cho sửa?
