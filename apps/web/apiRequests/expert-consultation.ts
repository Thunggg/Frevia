import { http } from "@/lib/http";
import type {
  CompleteExpertConsultationType,
  CreateExpertConsultationType,
  ExpertConsultationListQueryType,
  ExpertConsultationListType,
  ExpertConsultationType,
  RejectExpertConsultationType,
} from "@shared/types";

const queryString = (query: ExpertConsultationListQueryType) => {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.status) params.set("status", query.status);
  return params.toString();
};

export const expertConsultationApi = {
  create: (body: CreateExpertConsultationType) =>
    http.post<ExpertConsultationType>("/expert-consultations", body),
  listMine: (query: ExpertConsultationListQueryType) =>
    http.get<ExpertConsultationListType>(
      `/expert-consultations/mine?${queryString(query)}`,
    ),
  listAssigned: (query: ExpertConsultationListQueryType) =>
    http.get<ExpertConsultationListType>(
      `/expert-consultations/assigned?${queryString(query)}`,
    ),
  detail: (id: number) =>
    http.get<ExpertConsultationType>(`/expert-consultations/${id}`),
  accept: (id: number) =>
    http.patch<ExpertConsultationType>(
      `/expert-consultations/${id}/accept`,
      {},
    ),
  reject: (id: number, body: RejectExpertConsultationType) =>
    http.patch<ExpertConsultationType>(
      `/expert-consultations/${id}/reject`,
      body,
    ),
  start: (id: number) =>
    http.patch<ExpertConsultationType>(`/expert-consultations/${id}/start`, {}),
  complete: (id: number, body: CompleteExpertConsultationType) =>
    http.patch<ExpertConsultationType>(
      `/expert-consultations/${id}/complete`,
      body,
    ),
  cancel: (id: number) =>
    http.patch<ExpertConsultationType>(
      `/expert-consultations/${id}/cancel`,
      {},
    ),
};
