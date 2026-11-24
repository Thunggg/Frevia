import { http } from "@/lib/http";
import type {
  RecommendationExplanationType,
  RecommendedJobResponseType,
  RecommendedFreelancerResponseType,
  RecommendationReindexResponseType,
  RecommendationOutboxProcessResponseType,
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

  reindex: () =>
    http.post<RecommendationReindexResponseType>("/recommendations/reindex", {}),

  processOutbox: () =>
    http.post<RecommendationOutboxProcessResponseType>(
      "/recommendations/outbox/process",
      {},
    ),
};

export default recommendationApiRequest;

