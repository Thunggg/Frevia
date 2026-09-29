import { ApiError, ApiResponse } from "@shared/types";

export class ApiFail extends Error {
  readonly response: ApiError;
  readonly status: number;

  constructor(response: ApiError, status: number) {
    super(response.error.message);
    this.response = response;
    this.status = status;
  }
}

export const request = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: any,
  isRequestToProxyAPI: boolean = true,
): Promise<ApiResponse<T>> => {
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

  const data = await res.json();

  if (!res.ok) {
    throw new ApiFail(data, res.status);
  }

  return data;
};

export const http = {
  get: <T>(url: string, isRequestToProxyAPI: boolean = true) => {
    return request<T>("GET", url, undefined, isRequestToProxyAPI);
  },

  post: <T>(url: string, body: any, isRequestToProxyAPI: boolean = true) => {
    return request<T>("POST", url, body, isRequestToProxyAPI);
  },

  put: <T>(url: string, body: any, isRequestToProxyAPI: boolean = true) => {
    return request<T>("PUT", url, body, isRequestToProxyAPI);
  },

  patch: <T>(url: string, body: any, isRequestToProxyAPI: boolean = true) => {
    return request<T>("PATCH", url, body, isRequestToProxyAPI);
  },

  delete: <T>(url: string, isRequestToProxyAPI: boolean = true) => {
    return request<T>("DELETE", url, undefined, isRequestToProxyAPI);
  },
};
