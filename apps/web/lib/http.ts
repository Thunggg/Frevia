import { ApiError, ApiSuccess } from "@shared/types";

export class ApiFail extends Error {
  readonly response: ApiError;
  readonly status: number;

  constructor(response: ApiError, status: number) {
    // Proxy moderation trả về { success:false, message, moderation } (không có error.message)
    const message =
      response?.error?.message ??
      (response as { message?: string }).message ??
      "Request failed";
    super(message);
    this.response = response;
    this.status = status;
  }
}

export const request = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: object | FormData,
  isRequestToProxyAPI: boolean = true,
): Promise<ApiSuccess<T>> => {
  // chuẩn hóa lại url người dùng gửi lên
  const formatUrl = url.startsWith("/") ? url : `/${url}`;

  const fullUrl = isRequestToProxyAPI ? `/api/backend${formatUrl}` : formatUrl;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const rawText = await res.text().catch(() => "");
  let data: unknown;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new ApiFail(
      {
        success: false,
        error: {
          code: String(res.status),
          message: rawText
            ? `Response is not valid JSON: ${rawText.slice(0, 300)}`
            : "Response is not valid JSON",
        },
        timestamp: new Date().toISOString(),
      },
      res.status,
    );
  }

  if (!res.ok) {
    if (typeof window !== "undefined") {
      const isAuthPage =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register") ||
        window.location.pathname.startsWith("/forgot-password");

      // Khách vãng lai trên trang public gọi /auth/me bị 401 là bình thường — không ép chuyển về /login.
      const isSessionProbe =
        formatUrl === "/auth/me" || formatUrl === "/api/auth/me";

      const errData = data as ApiError | undefined;
      const isBannedError =
        errData?.error?.message === "Error.UserBanned" ||
        (typeof errData?.error?.message === "string" &&
          (errData.error.message.toLowerCase().includes("khoá") ||
            errData.error.message.toLowerCase().includes("banned")));

      if (
        ((res.status === 401 && !isSessionProbe) ||
          (res.status === 403 && isBannedError)) &&
        !isAuthPage
      ) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`;
      }
    }

    throw new ApiFail(data as ApiError, res.status);
  }

  return data as ApiSuccess<T>;
};

export const http = {
  get: <T>(url: string, isRequestToProxyAPI: boolean = true) => {
    return request<T>("GET", url, undefined, isRequestToProxyAPI);
  },

  post: <T>(url: string, body: object | FormData, isRequestToProxyAPI: boolean = true) => {
    return request<T>("POST", url, body, isRequestToProxyAPI);
  },

  put: <T>(url: string, body: object | FormData, isRequestToProxyAPI: boolean = true) => {
    return request<T>("PUT", url, body, isRequestToProxyAPI);
  },

  patch: <T>(
    url: string,
    body: object | FormData,
    isRequestToProxyAPI: boolean = true,
  ) => {
    return request<T>("PATCH", url, body, isRequestToProxyAPI);
  },

  delete: <T>(
    url: string,
    body?: object | FormData,
    isRequestToProxyAPI: boolean = true,
  ) => {
    return request<T>("DELETE", url, body, isRequestToProxyAPI);
  },
};
