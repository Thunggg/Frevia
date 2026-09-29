import { cookies } from "next/headers";

const proxyHandler = async (
  request: Request,
  { params }: { params: { path: string[] } },
) => {
  // Khởi tạo cookieStore để có thể set cookie
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("accessToken")?.value;

  // chuẩn hóa lại url người dùng gửi lên
  const { path } = await params;
  const fullUrl = path.join("/");

  // check xem có body hay không, nếu có thì parse ra json
  const rawBody = await request.text();
  const body = rawBody ? JSON.parse(rawBody) : undefined;

  // Lấy search params từ request.url
  const { search } = new URL(request.url);

  const res = await fetch(`http://localhost:3000/${fullUrl}${search}`, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Nếu là route login thì phải set cookie accessToken và refreshToken vào cookieStore
  if (
    (fullUrl === "api/auth/login" || path[path.length - 1] === "login") &&
    res.ok
  ) {
    const payload = await res.clone().json();

    cookieStore.set({
      name: "accessToken",
      value: payload.data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    cookieStore.set({
      name: "refreshToken",
      value: payload.data.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
};

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  return await proxyHandler(request, { params });
}

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  return await proxyHandler(request, { params });
}

export async function PUT(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  return await proxyHandler(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  return await proxyHandler(request, { params });
}

export async function PATCH(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  return await proxyHandler(request, { params });
}
