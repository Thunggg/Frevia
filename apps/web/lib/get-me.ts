import { envConfig } from "@/configs/validate-env";
import type { ApiResponse, GetMeResType } from "@shared/types";
import { cookies } from "next/headers";

export async function getMeServer(): Promise<GetMeResType | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return null;
  }

  const res = await fetch(`${envConfig.NESTJS_API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await res.json()) as ApiResponse<GetMeResType>;

  if (!res.ok || !data.success) {
    return null;
  }

  return data.data;
}
