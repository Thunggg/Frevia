// Thông điệp cho module Admin quản lý danh mục công việc (Job Category — UC-46).
// Giá trị là khoá i18n ở web (namespace "Error" / "Success").
export const ManageJobCategoryAdminMessage = {
  JOB_CATEGORY_NOT_FOUND: "Error.JobCategoryNotFound",
  FAILED_TO_LOAD_JOB_CATEGORY_LIST: "Error.FailedToLoadJobCategoryList",
  FAILED_TO_LOAD_JOB_CATEGORY_DETAIL: "Error.FailedToLoadJobCategoryDetail",
  JOB_CATEGORY_NAME_ALREADY_EXISTS: "Error.JobCategoryNameAlreadyExists",
  JOB_CATEGORY_HAS_JOBS: "Error.JobCategoryHasJobs",
  FAILED_TO_CREATE_JOB_CATEGORY: "Error.FailedToCreateJobCategory",
  FAILED_TO_UPDATE_JOB_CATEGORY: "Error.FailedToUpdateJobCategory",
  FAILED_TO_DELETE_JOB_CATEGORY: "Error.FailedToDeleteJobCategory",
  FAILED_TO_RESTORE_JOB_CATEGORY: "Error.FailedToRestoreJobCategory",
  // --- Success messages ---
  JOB_CATEGORY_DELETED: "Success.JobCategoryDeleted",
} as const;
