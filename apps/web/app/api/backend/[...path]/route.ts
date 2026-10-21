import { envConfig } from "@/configs/validate-env";
import { translateBackendErrorPayload } from "@/i18n/backend-message";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { refreshAuthTokens } from "@/lib/auth-session";
import { cookies } from "next/headers";

const nestApiUrl = envConfig?.NESTJS_API_URL.replace(/\/$/, "");
const NEST_API = nestApiUrl?.endsWith("/api")
  ? nestApiUrl.slice(0, -4)
  : nestApiUrl;

const proxyApiUrl = envConfig?.NESTJS_PROXY_URL?.replace(/\/$/, "");
const PROXY_API = proxyApiUrl?.endsWith("/api")
  ? proxyApiUrl.slice(0, -4)
  : proxyApiUrl;

type RouteContext = { params: Promise<{ path: string[] }> };

const resolveLocale = (value: string | undefined): Locale =>
  isLocale(value) ? value : defaultLocale;

/**
 * Backend trả về mã lỗi dạng key i18n (ví dụ "Error.EmailAlreadyExists")
 * trong `error.details[].message`, còn `error.message` là cụm HTTP status
 * chung. Dịch ngay tại tầng BFF để mọi component phía client nhận được
 * nội dung đã bản địa hoá mà không cần biết tới i18n.
 */
const localizeErrorBody = (
  responseBody: ArrayBuffer,
  contentType: string,
  status: number,
  locale: Locale,
): ArrayBuffer | string => {
  if (status < 400) return responseBody;
  if (!contentType.includes("application/json")) return responseBody;
  if (responseBody.byteLength === 0) return responseBody;

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(responseBody));
  } catch {
    return responseBody;
  }

  const translated = translateBackendErrorPayload(payload, locale);
  if (translated === payload) return responseBody;

  return JSON.stringify(translated);
};

const proxyHandler = async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  if (!NEST_API) {
    const payload = {
      success: false,
      error: { message: "Backend API is not configured." },
    };

    return Response.json(translateBackendErrorPayload(payload, locale), {
      status: 500,
    });
  }

  let accessToken = cookieStore.get("accessToken")?.value;

  const { path } = await params;
  const fullPath = path.join("/");
  const backendPath = fullPath.startsWith("api/")
    ? fullPath
    : `api/${fullPath}`;

  // Chỉ POST tạo bài đăng forum (path chính xác /api/forums/posts, không phải
  // comment/like/... dưới nó) đi qua proxy SensitiveAI (3002) để scan nội dung.
  // Các request khác gọi thẳng backend (3000). Proxy không xử lý auth refresh
  // hay websocket nên CHỈ riêng route tạo bài mới được đưa qua proxy.
  const isCreateForumPost =
    request.method === "POST" &&
    backendPath === "api/forums/posts" &&
    !!PROXY_API;

  const baseApi = isCreateForumPost ? PROXY_API : NEST_API;

  // Giữ nguyên query string
  const { search } = new URL(request.url);

  // Giữ nguyên Content-Type (quan trọng với multipart/form-data upload).
  // Nếu không có header, không gửi header Content-Type nào xuống backend
  // để backend tự nhận diện.
  const contentType = request.headers.get("content-type");

  // Không phải mọi method đều có body -> tránh đọc body khi rỗng.
  // Đọc dưới dạng binary (arrayBuffer) để không làm hỏng file upload.
  const hasBody = !["GET", "DELETE"].includes(request.method);
  const rawBody = hasBody ? await request.arrayBuffer() : undefined;

  // Hàm forward để forward request đến backend
  const forward = (token: string | undefined) =>
    fetch(`${baseApi}/${backendPath}${search}`, {
      method: request.method,
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: hasBody ? (rawBody as ArrayBuffer) : undefined,
    });

  let nestRes = await forward(accessToken);

  // Access hết hạn / invalid → refresh 1 lần rồi retry request gốc
  if (nestRes.status === 401 && !fullPath.includes("auth/refresh-token")) {
    const tokens = await refreshAuthTokens(cookieStore);
    if (tokens) {
      accessToken = tokens.accessToken;
      nestRes = await forward(accessToken);
    }
  }

  const responseBody = await nestRes.arrayBuffer();
  const responseContentType =
    nestRes.headers.get("content-type") ?? "application/json";

  // Chỉ forward Content-Type, KHÔNG forward nguyên res.headers
  // (content-encoding/content-length của NestJS có thể làm browser
  // decode lỗi vì fetch() đã tự giải nén sẵn).
  return new Response(
    localizeErrorBody(
      responseBody,
      responseContentType,
      nestRes.status,
      locale,
    ),
    {
      status: nestRes.status,
      headers: {
        "Content-Type": responseContentType,
      },
    },
  );
};

export async function GET(request: Request, ctx: RouteContext) {
  return proxyHandler(request, ctx);
}
export async function POST(request: Request, ctx: RouteContext) {
  return proxyHandler(request, ctx);
}
export async function PUT(request: Request, ctx: RouteContext) {
  return proxyHandler(request, ctx);
}
export async function PATCH(request: Request, ctx: RouteContext) {
  return proxyHandler(request, ctx);
}
export async function DELETE(request: Request, ctx: RouteContext) {
  return proxyHandler(request, ctx);
}
