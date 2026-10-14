// ====== Hooks react-query cho các thao tác Admin quản lý User ======
// Mỗi hook gói 1 API call; sau khi thành công component thường gọi router.refresh()
// để trang (server component) render lại dữ liệu mới.
import { adminApiRequest } from "@/apiRequests/admin";
import type {
  AdminCreatePortfolioItemBodyType,
  AdminCreateUserBodyType,
  AdminReplaceFreelancerSkillsBodyType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateFreelancerProfileBodyType,
  AdminUpdatePortfolioItemBodyType,
  AdminUpdateUserBodyType,
  ApiResponse,
} from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

// Bóc phần `data` từ envelope ApiResponse { success, message?, data }
function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

// Tạo tài khoản mới
export function useCreateUser() {
  return useMutation({
    mutationFn: (body: AdminCreateUserBodyType) =>
      adminApiRequest.createUser(body).then(extractData),
  });
}

// Sửa thông tin chung account (email / displayName / isBanned)
export function useUpdateUser() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminUpdateUserBodyType;
    }) => adminApiRequest.updateUser(id, body).then(extractData),
  });
}

// Lấy catalog Skill active (chỉ fetch khi dialog mở - enabled)
export function useSkillCatalog(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "skill-catalog"] as const,
    queryFn: () => adminApiRequest.getSkillCatalog().then(extractData),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// Sửa hồ sơ Client (công ty) của 1 user
export function useUpdateClientProfile() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminUpdateClientProfileBodyType;
    }) => adminApiRequest.updateClientProfile(id, body).then(extractData),
  });
}

// Sửa "giới thiệu" hồ sơ Freelancer (professional title + bio)
export function useUpdateFreelancerProfile() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminUpdateFreelancerProfileBodyType;
    }) => adminApiRequest.updateFreelancerProfile(id, body).then(extractData),
  });
}

// Thay thế toàn bộ danh sách kỹ năng của hồ sơ Freelancer
export function useReplaceFreelancerSkills() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminReplaceFreelancerSkillsBodyType;
    }) => adminApiRequest.replaceFreelancerSkills(id, body).then(extractData),
  });
}

// Tạo mới 1 portfolio item
export function useCreatePortfolioItem() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminCreatePortfolioItemBodyType;
    }) => adminApiRequest.createPortfolioItem(id, body).then(extractData),
  });
}

// Sửa 1 portfolio item
export function useUpdatePortfolioItem() {
  return useMutation({
    mutationFn: ({
      id,
      itemId,
      body,
    }: {
      id: number;
      itemId: number;
      body: AdminUpdatePortfolioItemBodyType;
    }) => adminApiRequest.updatePortfolioItem(id, itemId, body).then(extractData),
  });
}

// Xoá (soft-delete) 1 portfolio item
export function useDeletePortfolioItem() {
  return useMutation({
    mutationFn: ({ id, itemId }: { id: number; itemId: number }) =>
      adminApiRequest.deletePortfolioItem(id, itemId).then(extractData),
  });
}
