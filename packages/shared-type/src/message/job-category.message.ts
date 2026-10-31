// Thông điệp cho module người dùng xem danh mục công việc
// (Job Category — UC-46.06 View Job Category List, UC-46.07 View Job Category Detail).
// Giá trị là khoá i18n ở web (namespace "Error").
export const JobCategoryMessage = {
  JOB_CATEGORY_NOT_FOUND: "Error.JobCategoryNotFound",
  FAILED_TO_LOAD_JOB_CATEGORY_LIST: "Error.FailedToLoadJobCategoryList",
  FAILED_TO_LOAD_JOB_CATEGORY_DETAIL: "Error.FailedToLoadJobCategoryDetail",
} as const;
