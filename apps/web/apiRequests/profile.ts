import {
  FreelancerProfileDetailType,
  UpdateFreelancerProfileType,
  FreelancerSkillType,
  AddFreelancerSkillType,
  PortfolioItemType,
  AddPortfolioType,
  UpdatePortfolioType,
} from "@shared/types";
import { http } from "@/lib/http";

export const profileApiRequest = {
  getProfileDetail: (id: number) =>
    http.get<FreelancerProfileDetailType>(`/profiles/${id}`),

  updateProfile: (id: number, body: UpdateFreelancerProfileType) =>
    http.put<FreelancerProfileDetailType>(`/profiles/${id}`, body),

  getSkills: (id: number) =>
    http.get<FreelancerSkillType[]>(`/profiles/${id}/skills`),

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
