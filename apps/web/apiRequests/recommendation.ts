import { http } from "@/lib/http";
import type {
  RecommendationExplanationType,
  RecommendationFeedbackType,
  RecommendedJobResponseType,
  RecommendedFreelancerResponseType,
} from "@shared/types";

export const recommendationApiRequest = {
  getRecommendedJobs: (limit: number = 10) =>
    http.get<RecommendedJobResponseType>(`/recommendations/jobs?limit=${limit}`),

  getRecommendedFreelancers: (jobId: number, limit: number = 10) =>
    http.get<RecommendedFreelancerResponseType>(
      `/recommendations/freelancers?jobId=${jobId}&limit=${limit}`,
    ),

  getExplanation: (recommendationId: number) =>
    http.get<RecommendationExplanationType>(
      `/recommendations/${recommendationId}/explanation`,
    ),

  submitFeedback: (recommendationId: number, type: RecommendationFeedbackType) =>
    http.post<{ id: number; recommendationId: number; type: string }>(
      `/recommendations/${recommendationId}/feedback`,
      { type },
    ),
};

export default recommendationApiRequest;

