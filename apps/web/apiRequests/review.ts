import { http } from "@/lib/http";
import type {
  CreateReviewResponseType,
  CreateReviewType,
  ReviewType,
  ReviewResponseType,
  UpdateReviewResponseType,
  UpdateReviewType,
} from "@shared/types";

export const reviewApi = {
  list: (contractId: number) =>
    http.get<ReviewType[]>(`/reviews/contracts/${contractId}`),
  detail: (reviewId: number) => http.get<ReviewType>(`/reviews/${reviewId}`),
  create: (contractId: number, input: CreateReviewType) =>
    http.post<ReviewType>(`/reviews/contracts/${contractId}`, input),
  update: (reviewId: number, input: UpdateReviewType) =>
    http.patch<ReviewType>(`/reviews/${reviewId}`, input),
  remove: (reviewId: number) =>
    http.delete<{ message: string }>(`/reviews/${reviewId}`),
  respond: (reviewId: number, input: CreateReviewResponseType) =>
    http.post<ReviewResponseType>(`/reviews/${reviewId}/response`, input),
  updateResponse: (responseId: number, input: UpdateReviewResponseType) =>
    http.patch<ReviewResponseType>(`/reviews/responses/${responseId}`, input),
  removeResponse: (responseId: number) =>
    http.delete<{ message: string }>(`/reviews/responses/${responseId}`),
};
