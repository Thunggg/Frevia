import forumServerRequest from "@/apiRequests/forum.server";
import { ForumCategoryView } from "./components/forum-category-view";

const ForumPage = async () => {
  const [categories, topCategories, topUsers] = await Promise.all([
    forumServerRequest.getCategories(),
    forumServerRequest.getTopCategories(3),
    forumServerRequest.getTopUsers(5),
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
