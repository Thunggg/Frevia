import {
  getForumCategoriesServer,
  getTopForumCategoriesServer,
  getTopActiveUsersServer,
} from "@/lib/get-forum-categories";
import { ForumCategoryView } from "./components/forum-category-view";

const ForumPage = async () => {
  const [categories, topCategories, topUsers] = await Promise.all([
    getForumCategoriesServer(),
    getTopForumCategoriesServer(3),
    getTopActiveUsersServer(5),
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
