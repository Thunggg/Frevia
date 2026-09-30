import { envConfig } from "@/configs/validate-env";
import {
  ApiResponse,
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";
import { cookies } from "next/headers";

export async function getForumCategoriesServer(): Promise<ForumCategoryListResponseType> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return [];
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/categories`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumCategoryListResponseType>;

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}

export async function getTopForumCategoriesServer(
  limit: number = 3,
): Promise<ForumCategoryTopListResponseType> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return [];
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/categories/top?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumCategoryTopListResponseType>;

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}

export async function getTopActiveUsersServer(
  limit: number = 5,
): Promise<ForumTopActiveUserListResponseType> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return [];
  }

  const res = await fetch(
    `${envConfig.NESTJS_API_URL}/api/forums/users/top?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as ApiResponse<ForumTopActiveUserListResponseType>;

  if (!res.ok || !data.success) {
    return [];
  }

  return data.data;
}
