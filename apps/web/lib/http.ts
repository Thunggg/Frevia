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
  body?: object,
  isRequestToProxyAPI: boolean = true,
): Promise<ApiSuccess<T>> => {
  // chuẩn hóa lại url người dùng gửi lên
  const formatUrl = url.startsWith("/") ? url : `/${url}`;

  const fullUrl = isRequestToProxyAPI ? `/api/backend${formatUrl}` : formatUrl;

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: unknown;

  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => "");
    throw new ApiFail(
      {
        success: false,
        error: {
          code: String(res.status),
          message: text
            ? `Response is not valid JSON: ${text.slice(0, 300)}`
            : "Response is not valid JSON",
        },
        timestamp: new Date().toISOString(),
      },
      res.status,
    );
  }

  if (!res.ok) {
    throw new ApiFail(data as ApiError, res.status);
  }

  return data as ApiSuccess<T>;
};

export const http = {
  get: <T>(url: string, isRequestToProxyAPI: boolean = true) => {
    return request<T>("GET", url, undefined, isRequestToProxyAPI);
  },

  post: <T>(url: string, body: object, isRequestToProxyAPI: boolean = true) => {
    return request<T>("POST", url, body, isRequestToProxyAPI);
  },

  put: <T>(url: string, body: object, isRequestToProxyAPI: boolean = true) => {
    return request<T>("PUT", url, body, isRequestToProxyAPI);
  },

  patch: <T>(
    url: string,
    body: object,
    isRequestToProxyAPI: boolean = true,
  ) => {
    return request<T>("PATCH", url, body, isRequestToProxyAPI);
  },

  delete: <T>(
    url: string,
    body?: object,
    isRequestToProxyAPI: boolean = true,
  ) => {
    return request<T>("DELETE", url, body, isRequestToProxyAPI);
  },
};
