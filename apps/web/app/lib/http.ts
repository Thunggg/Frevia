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
): Promise<ApiResponse<T>> => {
  // chuẩn hóa lại url người dùng gửi lên
  const fullUrl = url.startsWith("/") ? url : `/${url}`;

  const res = await fetch(`/api/backend` + fullUrl, {
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
  get: <T>(url: string) => {
    return request<T>("GET", url);
  },

  post: <T>(url: string, body: any) => {
    return request<T>("POST", url, body);
  },

  put: <T>(url: string, body: any) => {
    return request<T>("PUT", url, body);
  },

  patch: <T>(url: string, body: any) => {
    return request<T>("PATCH", url, body);
  },

  delete: <T>(url: string) => {
    return request<T>("DELETE", url);
  },
};
