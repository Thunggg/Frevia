import { cookies } from "next/headers";
import { envConfig } from "../../../../configs/validate-env"; // chỉnh lại path cho khớp project

const NEST_API = envConfig?.NESTJS_API_URL;

type RouteContext = { params: Promise<{ path: string[] }> };

const proxyHandler = async (request: Request, { params }: RouteContext) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const { path } = await params;
  const fullPath = path.join("/");

  // Giữ nguyên query string
  const { search } = new URL(request.url);

  // Không phải mọi method đều có body -> tránh request.json() throw khi body rỗng
  const hasBody = !["GET", "DELETE"].includes(request.method);
  const rawBody = hasBody ? await request.text() : undefined;

  const nestRes = await fetch(`${NEST_API}/${fullPath}${search}`, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: rawBody || undefined,
  });

  const responseBody = await nestRes.text();

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
