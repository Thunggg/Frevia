import { http } from "@/lib/http";
import type {
  ExpertProfileType,
  ProfileRevisionSubmissionType,
  UpdateExpertProfileType,
} from "@shared/types";

export const expertProfileApi = {
  getMine: () => http.get<ExpertProfileType>("/expert-profile/me"),
  updateMine: (body: UpdateExpertProfileType) =>
    http.put<ProfileRevisionSubmissionType>("/expert-profile/me", body),
};
