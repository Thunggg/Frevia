import {
  FreelancerProfileDetailType,
  UpdateFreelancerProfileType,
  FreelancerSkillType,
  AddFreelancerSkillType,
  PortfolioItemType,
  AddPortfolioType,
  UpdatePortfolioType,
  CvUploadResponseType,
  ApiError,
} from "@shared/types";
import { ApiFail, http } from "@/lib/http";

export const profileApiRequest = {
  getProfileDetail: (id: number) =>
    http.get<FreelancerProfileDetailType>(`/profiles/${id}`),

  updateProfile: (id: number, body: UpdateFreelancerProfileType) =>
    http.put<FreelancerProfileDetailType>(`/profiles/${id}`, body),

  async uploadCv(id: number, file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(`/api/backend/profiles/${id}/cv`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new ApiFail(payload as ApiError, response.status);
    return payload as { success: true; data: CvUploadResponseType };
  },

  getSkills: (id: number) =>
    http.get<FreelancerSkillType[]>(`/profiles/${id}/skills`),

  searchSkillSuggestions: (search: string) =>
    http.get<Array<{ id: number; name: string }>>(
      `/profiles/skills/suggestions?search=${encodeURIComponent(search)}`,
    ),

  addSkill: (id: number, body: AddFreelancerSkillType) =>
    http.post<FreelancerSkillType>(`/profiles/${id}/skills`, body),

  deleteSkill: (skillId: number) =>
    http.delete<{ message: string }>(`/profiles/skills/${skillId}`),

  getPortfoliosList: (id: number) =>
    http.get<PortfolioItemType[]>(`/profiles/${id}/portfolios`),

  addPortfolio: (id: number, body: AddPortfolioType) =>
    http.post<PortfolioItemType>(`/profiles/${id}/portfolios`, body),

  getPortfolioDetail: (portfolioId: number) =>
    http.get<PortfolioItemType>(`/profiles/portfolios/${portfolioId}`),

  updatePortfolio: (portfolioId: number, body: UpdatePortfolioType) =>
    http.put<PortfolioItemType>(`/profiles/portfolios/${portfolioId}`, body),

  deletePortfolio: (portfolioId: number) =>
    http.delete<{ message: string }>(`/profiles/portfolios/${portfolioId}`),
};
