import { envConfig } from "@/configs/validate-env";
import {
  ApiResponse,
  ForumCategoryListResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";
import { cookies } from "next/headers";
import { ForumCategoryView } from "./components/forum-category-view";

const ForumPage = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken || !envConfig?.NESTJS_API_URL) {
    return <ForumCategoryView categories={[]} topCategories={[]} topUsers={[]} />;
  }

  const [categories, topCategories, topUsers] = await Promise.all([
    (async (): Promise<ForumCategoryListResponseType> => {
      const res = await fetch(`${envConfig.NESTJS_API_URL}/api/forums/categories`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const data = (await res.json()) as ApiResponse<ForumCategoryListResponseType>;
      if (!res.ok || !data.success) return [];
      return data.data;
    })(),
    (async (): Promise<ForumCategoryTopListResponseType> => {
      const res = await fetch(`${envConfig.NESTJS_API_URL}/api/forums/categories/top?limit=3`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const data = (await res.json()) as ApiResponse<ForumCategoryTopListResponseType>;
      if (!res.ok || !data.success) return [];
      return data.data;
    })(),
    (async (): Promise<ForumTopActiveUserListResponseType> => {
      const res = await fetch(`${envConfig.NESTJS_API_URL}/api/forums/users/top?limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const data = (await res.json()) as ApiResponse<ForumTopActiveUserListResponseType>;
      if (!res.ok || !data.success) return [];
      return data.data;
    })(),
  ]);

  return (
    <ForumCategoryView
      categories={categories}
      topCategories={topCategories}
      topUsers={topUsers}
    />
  );
};

export default ForumPage;
