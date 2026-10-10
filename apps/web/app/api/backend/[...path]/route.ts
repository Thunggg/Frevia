import { envConfig } from "@/configs/validate-env";
import { refreshAuthTokens } from "@/lib/auth-session";
import { cookies } from "next/headers";

const nestApiUrl = envConfig?.NESTJS_API_URL.replace(/\/$/, "");
const NEST_API = nestApiUrl?.endsWith("/api")
  ? nestApiUrl.slice(0, -4)
  : nestApiUrl;

type RouteContext = { params: Promise<{ path: string[] }> };

const proxyHandler = async (request: Request, { params }: RouteContext) => {
  if (!NEST_API) {
    return Response.json(
      { success: false, error: { message: "Backend API is not configured." } },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;

  const { path } = await params;
  const fullPath = path.join("/");
  const backendPath = fullPath.startsWith("api/")
    ? fullPath
    : `api/${fullPath}`;

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
    fetch(`${NEST_API}/${backendPath}${search}`, {
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

  // Chỉ forward Content-Type, KHÔNG forward nguyên res.headers
  // (content-encoding/content-length của NestJS có thể làm browser
  // decode lỗi vì fetch() đã tự giải nén sẵn).
  return new Response(responseBody, {
    status: nestRes.status,
    headers: {
      "Content-Type": nestRes.headers.get("content-type") ?? "application/json",
    },
  });
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
