import type {
  ProfileRevisionSubmissionType,
  ProfileRevisionType,
  ProfileRevisionTypeType,
} from "@shared/types";
import { http } from "@/lib/http";

export const profileRevisionApiRequest = {
  getMine: (type: ProfileRevisionTypeType) =>
    http.get<{ revision: ProfileRevisionType | null }>(
      `/profile-revisions/me?type=${type}`,
    ),
};

export type { ProfileRevisionSubmissionType };
