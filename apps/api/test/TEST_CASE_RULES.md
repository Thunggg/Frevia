# QUY TẮC VIẾT UNIT TEST CASE — BACKEND (`apps/api/test`)

> Tài liệu này quy định format chung cho toàn bộ unit test backend, để mọi người viết test
> thống nhất, dễ đọc, dễ map với ma trận `UF-01 → UF-36` trong
> `docs/Report 5/Report5_Unit Test.xls`, và có thể export ra PDF bằng một lệnh.

---

## 1. Phạm vi & nguyên tắc chung

- Test đặt trong `apps/api/test/`, **không sửa production code** để test chạy được.
- Ưu tiên **service-layer test** với repository được mock.
- Dùng **Jest + TypeScript** (`ts-jest`), không dùng framework test khác.
- Mỗi test phải **độc lập**: chạy riêng vẫn pass, không phụ thuộc thứ tự test khác.
- Mỗi test chỉ kiểm tra **một hành vi** (một nhánh logic / một exception / một biên).
- Tên test và comment dùng **tiếng Anh cho tên test**, **tiếng Việt cho comment `//`**.
- Khi report và implementation khác nhau: **test theo hành vi thật của code**, đồng thời ghi rõ
  điểm khác biệt trong comment.

---

## 2. Cấu trúc thư mục

| Thư mục | Nội dung | UF |
|---|---|---|
| `test/forums/` | Category, Post, Like, Comment, Report | UF-01 → UF-17 |
| `test/conversations/` | Conversation, Message, File | UF-18 → UF-25 |
| `test/moderation/` | Moderation queue / detail / resolve | UF-26 → UF-28 |
| `test/IDVerification/` | Admin duyệt / từ chối xác minh | UF-29 → UF-32 |
| `test/admin/` | Forum trash (posts / comments) | UF-33 → UF-36 |

Quy ước file:

```text
apps/api/test/
├── jest-unit.json                  # Config Jest cho unit test
├── jest-setup.ts                   # Biến môi trường cho test
├── export-test-report.mjs          # Script export PDF
├── TEST_CASE_RULES.md              # File quy tắc này
├── forums/
│   ├── forum-category.unit-spec.ts
│   ├── forum-post.unit-spec.ts
│   ├── forum-like.unit-spec.ts
│   ├── forum-comment.unit-spec.ts
│   └── forum-report.unit-spec.ts
├── conversations/
│   └── conversations.unit-spec.ts
├── moderation/
│   └── moderation.unit-spec.ts
├── IDVerification/
│   └── identity-verification.unit-spec.ts
└── admin/
    └── forums-trash.unit-spec.ts
```

**Bắt buộc:** file test phải có hậu tố `.unit-spec.ts`.

---

## 3. Quy tắc đặt tên

### 3.1. Tên file

```text
<domain>-<feature>.unit-spec.ts
```

Ví dụ: `forum-comment.unit-spec.ts`, `forum-report.unit-spec.ts`,
`identity-verification.unit-spec.ts`.

### 3.2. `describe` cấp ngoài cùng

Format:

```ts
describe('<Tên chức năng> (UF-xx to UF-yy)', () => { ... });
```

Ví dụ:

```ts
describe('Forum comments (UF-11 to UF-16)', () => {
```

### 3.3. `describe` cấp trong (theo từng function)

Format:

```ts
describe('UF-xx <functionName>', () => { ... });
```

Ví dụ:

```ts
describe('UF-13 updateForumComment', () => {
```

### 3.4. Tên `it`

- Viết **tiếng Anh**, bắt đầu bằng **động từ** ở hiện tại đơn.
- Mô tả **hành vi + kết quả mong đợi**, không mô tả cách implement.
- Không dùng `should ...`.
- Không ghi mã UF trong tên `it` (mã UF nằm ở `describe` và comment `//`).

| Nên ✅ | Không nên ❌ |
|---|---|
| `creates a comment with valid content` | `test create comment` |
| `raises NotFound when the post does not exist` | `should throw 404` |
| `forbids a client from reading deleted posts` | `check permission` |
| `accepts a message of exactly 2000 characters` | `test max length` |

---

## 4. Format bắt buộc của một test case

Mỗi `it` gồm **3 phần**, ngăn cách bằng **một dòng trống** (không bắt buộc ghi
`Arrange/Act/Assert`, nhưng phải giữ đúng thứ tự):

1. **Arrange** — mock dữ liệu / trạng thái repository.
2. **Act** — gọi service.
3. **Assert** — kiểm tra kết quả và kiểm tra repository có/không được gọi.

### 4.1. Comment `//` bắt buộc

**Mỗi `it` phải có đúng một dòng comment `//` tiếng Việt ngay phía trên**, giải thích:

- Điều kiện đầu vào (nếu có).
- Hành vi / kết quả mong đợi.

Test **đầu tiên** của mỗi `describe('UF-xx ...')` phải bắt đầu comment bằng `UF-xx:`.

Ví dụ:

```ts
describe('UF-12 createForumComment', () => {
  // UF-12: Tạo bình luận với nội dung hợp lệ và truyền đúng tham số cho repository.
  it('creates a comment with valid content', async () => {
    ...
  });

  // Chấp nhận nội dung dài 1 ký tự (biên dưới).
  it('accepts one-character content', async () => {
    ...
  });

  // Bài viết không tồn tại trả về NotFound và không tạo bình luận.
  it('raises NotFound when the post does not exist', async () => {
    ...
  });
});
```

Quy tắc comment:

- Luôn dùng `//`, không dùng `/* */`.
- Comment nằm **ngay trên** dòng `it(...)`, cùng indentation với `it`.
- Không lặp lại y nguyên tên test; comment phải nói rõ **vì sao / kết quả**.
- Khi đổi hành vi hoặc đổi tên test → **cập nhật lại comment**.
- Comment là nguồn dữ liệu cho cột “Mô tả” khi export PDF, nên không được bỏ trống.

### 4.2. Template đầy đủ

```ts
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ForumCommentRepository } from '../../src/routes/forums/forums-comment/forums-comment.repo';
import { ForumCommentService } from '../../src/routes/forums/forums-comment/forums-comment.service';

describe('Forum comments (UF-11 to UF-16)', () => {
  // Mock toàn bộ method repository mà service sử dụng.
  const repository = {
    findPostById: jest.fn(),
    findCommentById: jest.fn(),
    createForumComment: jest.fn(),
    updateForumComment: jest.fn(),
    softDeleteForumComment: jest.fn(),
    getForumCommentLists: jest.fn(),
    findLikeByUserAndComment: jest.fn(),
    createCommentLike: jest.fn(),
    deleteCommentLike: jest.fn(),
  };

  // Cast qua unknown vì repository thật có PrismaService, test chỉ cần đúng shape.
  const service = new ForumCommentService(
    repository as unknown as ForumCommentRepository,
  );

  // Reset mock trước mỗi test để test không ảnh hưởng nhau.
  beforeEach(() => jest.clearAllMocks());

  describe('UF-13 updateForumComment', () => {
    // Tác giả cập nhật được bình luận của mình và repository nhận đúng nội dung mới.
    it('updates a comment owned by the author', async () => {
      // Arrange
      repository.findCommentById.mockResolvedValue({
        id: 5,
        postId: 1,
        content: 'Old content',
        user: { id: 10, profile: { displayName: 'Alice', avatarUrl: null } },
      });
      repository.updateForumComment.mockResolvedValue({
        id: 5,
        content: 'Updated content',
        user: { id: 10, profile: { displayName: 'Alice', avatarUrl: null } },
      });

      // Act
      const result = await service.updateForumComment(1, 5, 10, {
        content: 'Updated content',
      });

      // Assert
      expect(result.content).toBe('Updated content');
      expect(repository.updateForumComment).toHaveBeenCalledWith(5, {
        content: 'Updated content',
      });
    });

    // Người khác không được sửa bình luận và repository không được gọi.
    it('forbids another user from updating the comment', async () => {
      repository.findCommentById.mockResolvedValue({ id: 5, userId: 10 });

      await expect(
        service.updateForumComment(1, 5, 99, { content: 'Hijacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.updateForumComment).not.toHaveBeenCalled();
    });
  });
});
```

---

## 5. Quy tắc mock & dữ liệu test

### 5.1. Mock repository

- Khai báo mock **một lần** ở đầu `describe` lớn, dưới dạng object các `jest.fn()`.
- Chỉ khai báo những method mà service thực sự gọi.
- Cast: `repository as unknown as XRepository`.
- `beforeEach(() => jest.clearAllMocks())` là **bắt buộc**.

```ts
const repository = {
  getForumCategories: jest.fn(),
  getForumCategoryById: jest.fn(),
};

const service = new ForumService(repository as unknown as ForumRepository);

beforeEach(() => jest.clearAllMocks());
```

### 5.2. Mock service bên ngoài

Các service có I/O thật (Cloudinary, email, AI, HTTP...) phải mock:

```ts
jest.mock('../../src/routes/conversations/conversation-file.storage', () => {
  const actual = jest.requireActual(
    '../../src/routes/conversations/conversation-file.storage',
  );
  return { ...actual, uploadConversationFile: jest.fn() };
});
```

### 5.3. Dữ liệu test

- Dùng **ngày cố định** (`new Date('2026-01-01T00:00:00.000Z')`), không dùng
  `new Date()` trong expected value.
- Không gọi database, network, filesystem thật.
- Không phụ thuộc biến môi trường thật — dùng `test/jest-setup.ts`.
- Với dữ liệu cố tình không hợp lệ để test schema: dùng `Schema.safeParse(...)`.
- Với dữ liệu cố tình không hợp lệ truyền thẳng vào service: cast `as never` để bỏ qua
  type của DTO (validation thật nằm ở controller/Zod pipe).

---

## 6. Bộ test tối thiểu cho mỗi UF

Mỗi function/UF cần tối thiểu các nhóm sau (nếu áp dụng được):

| Loại | Ký hiệu trong report | Ví dụ |
|---|---|---|
| Normal — luồng đúng | `N` | tạo thành công, lấy danh sách thành công |
| Boundary — biên | `B` | `page = 1`, `limit = 100`, chuỗi đúng 1000/2000 ký tự, 1 ký tự |
| Abnormal — lỗi | `A` | NotFound, Forbidden, Conflict, lỗi database |

Checklist cho mỗi UF:

- [ ] Có ít nhất 1 test happy path.
- [ ] Có test biên dưới / biên trên nếu có giới hạn (`min`, `max`, `page`, `limit`).
- [ ] Có test `NotFound` khi id không tồn tại.
- [ ] Có test `Forbidden` khi sai role / không phải chủ sở hữu (nếu có).
- [ ] Có test lỗi database → exception nghiệp vụ (nếu service có `try/catch`).
- [ ] Có test schema/DTO cho dữ liệu rỗng / sai kiểu (nếu có Zod schema).

---

## 7. Quy tắc assert exception

```ts
// Đúng: assert đúng loại exception
await expect(service.getMessages(99, 1)).rejects.toBeInstanceOf(
  NotFoundException,
);

// Đúng: nếu validation fail trước khi ghi dữ liệu, phải kiểm tra repository không được gọi
expect(repository.createForumComment).not.toHaveBeenCalled();
```

- Không assert message string nếu message đến từ constant dễ đổi.
- Không assert `toThrow(Error)` chung chung — phải đúng loại exception.
- Với lỗi nghiệp vụ, ưu tiên `toBeInstanceOf(...)` của NestJS exception.
- Với schema, dùng `safeParse` và assert `parsed.success === false/true`.

---

## 8. Quy tắc riêng cho schema / DTO (Zod)

Các trường hợp sau **phải test ở tầng schema**, không cần gọi service:

- `page`, `limit` ngoài khoảng cho phép.
- Chuỗi rỗng (`''`) cho title/content/reason.
- Độ dài biên: đúng `max`, vượt `max` 1 ký tự.
- Thiếu field bắt buộc.
- Sai kiểu dữ liệu (ví dụ `participantId = 0`).

Ví dụ:

```ts
// Schema từ chối page = 0.
it('rejects page=0 through ForumPostFilterSchema', () => {
  const parsed = ForumPostFilterSchema.safeParse({ page: '0', limit: '10' });
  expect(parsed.success).toBe(false);
});
```

---

## 9. Khi report khác implementation

Nếu report mô tả hành vi khác code thực tế:

1. **Test theo code thực tế** (nguồn sự thật khi chạy).
2. Ghi rõ điểm khác biệt trong comment `//`.
3. Không sửa production code chỉ để khớp report.

Ví dụ các điểm đã ghi nhận:

- `viewForumLikeDetail` trả `[]` khi bài viết không có like, **không ném NotFound**.
- Toggle like bài viết chưa like → **tạo like** (`{ liked: true }`).
- UF-27 được test qua `getPendingPosts` vì **không có endpoint moderation detail riêng**.
- `restoreTrashPost` / `restoreTrashComment` **không select `deletedAt`**, nên không assert
  `result.deletedAt`.

---

## 10. Chạy test & export PDF

Chạy trong `apps/api`:

```bash
# Chạy toàn bộ unit test
npm run test:unit

# Chạy 1 file
npx jest --config test/jest-unit.json test/forums/forum-comment.unit-spec.ts --runInBand

# Chạy 1 test theo tên
npx jest --config test/jest-unit.json -t "UF-13" --runInBand
```

Kiểm tra type (bao gồm toàn bộ file test):

```bash
npx tsc --noEmit -p tsconfig.json
```

Export danh sách test ra PDF (script tự chạy Jest lấy kết quả thật):

```bash
# Mặc định: test/reports/unit-test-report.pdf
npm run test:report

# Chỉ định đường dẫn (truyền vị trí)
npm run test:report -- "../../docs/Report 5/Report5_Unit_Test_Backend.pdf"

# Hoặc dùng cờ với node
node ./test/export-test-report.mjs --out "../../docs/Report 5/Report5_Unit_Test_Backend.pdf"
```

Tùy chọn của script export:

| Cờ | Ý nghĩa |
|---|---|
| `--out <path>` | Đường dẫn file PDF đầu ra |
| `--html <path>` | Đường dẫn file HTML trung gian |
| `--results <path>` | Dùng lại JSON kết quả Jest có sẵn |
| `--no-run` | Không chạy Jest, chỉ liệt kê test |

---

## 11. Checklist trước khi commit

- [ ] File đúng thư mục, đúng hậu tố `.unit-spec.ts`.
- [ ] `describe` ngoài cùng có dải UF (`UF-xx to UF-yy`).
- [ ] `describe` trong cùng có format `UF-xx <functionName>`.
- [ ] Mỗi `it` có **đúng một comment `//` tiếng Việt** ở ngay trên.
- [ ] Test đầu tiên của mỗi UF có comment bắt đầu bằng `UF-xx:`.
- [ ] Có đủ happy path + boundary + exception theo mục 6.
- [ ] Có `beforeEach(() => jest.clearAllMocks())`.
- [ ] Không gọi DB/network/Cloudinary thật.
- [ ] `npm run test:unit` pass toàn bộ.
- [ ] `npx tsc --noEmit -p tsconfig.json` không lỗi.
- [ ] Đã chạy lại `npm run test:report` nếu thêm/đổi/xóa test.
- [ ] Không sửa production code.

---

## 12. Những điều không được làm

| ❌ Không làm | ✅ Thay bằng |
|---|---|
| Viết test không có comment `//` | Thêm comment tiếng Việt ngay trên `it` |
| Đặt tên test `should ...`, `test ...` | Bắt đầu bằng động từ: `creates`, `returns`, `rejects` |
| Dùng `new Date()` trong expected | Dùng ngày cố định |
| Gọi Prisma/DB thật | Mock repository |
| Assert message string dễ đổi | Assert loại exception |
| Test nhiều hành vi trong 1 `it` | Tách thành nhiều `it` |
| Phụ thuộc thứ tự test | Reset mock trong `beforeEach` |
| Sửa production code để test pass | Test theo hành vi thật, ghi chú khác biệt |
| Bỏ qua biên `min`/`max` | Test đúng biên và vượt biên 1 đơn vị |
| Để test file ngoài `apps/api/test/` | Đặt đúng thư mục theo bảng mục 2 |

---

## 13. Liên kết liên quan

- Ma trận test gốc: `docs/Report 5/Report5_Unit Test.xls`
- Jest config: `apps/api/test/jest-unit.json`
- Script export PDF: `apps/api/test/export-test-report.mjs`
- PDF báo cáo: `docs/Report 5/Report5_Unit_Test_Backend.pdf`
