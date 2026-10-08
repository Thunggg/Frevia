import { cookies } from "next/headers";
import { envConfig } from "@/configs/validate-env";

const NEST_API = envConfig?.NESTJS_API_URL;

type RouteContext = { params: Promise<{ path: string[] }> };

const proxyHandler = async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const { path } = await params;
  const fullPath = path.join("/");

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

  const nestRes = await fetch(`${NEST_API}/${fullPath}${search}`, {
    method: request.method,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? (rawBody as ArrayBuffer) : undefined,
  });

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
