import { ApiFail, http } from "@/lib/http";
import type {
  AddSocialLinkType,
  ApiError,
  ClientProfileDetailType,
  FavoriteFreelancerType,
  FollowingFreelancerType,
  DiscoverFreelancerType,
  IdentityVerificationDocumentType,
  IdentityVerificationStatusType,
  SocialLinkType,
  UpdateClientProfileType,
  UploadIdentityDocumentType,
  AvatarUploadResponseType,
  ChangePasswordType,
  GeneralProfileType,
  UpdateGeneralProfileType,
  ProfileRevisionSubmissionType,
} from "@shared/types";

export const accountProfileApi = {
  getGeneralProfile: () => http.get<GeneralProfileType>("/account-profile"),
  updateGeneralProfile: (body: UpdateGeneralProfileType) =>
    http.put<ProfileRevisionSubmissionType>("/account-profile", body),
  changePassword: (body: ChangePasswordType) =>
    http.put<{ message: string }>("/account-profile/password", body),
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/backend/account-profile/avatar", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new ApiFail(payload as ApiError, response.status);
    return payload as { success: true; data: AvatarUploadResponseType };
  },
  getIdentityStatus: () =>
    http.get<IdentityVerificationStatusType>("/identity-verifications/status"),

  async uploadIdentityDocument(input: UploadIdentityDocumentType, file: File) {
    const formData = new FormData();
    formData.set("documentType", input.documentType);
    formData.set("file", file);
    const response = await fetch(
      "/api/backend/identity-verifications/documents",
      { method: "POST", body: formData },
    );
    const payload = await response.json();
    if (!response.ok) throw new ApiFail(payload as ApiError, response.status);
    return payload as {
      success: true;
      data: IdentityVerificationDocumentType;
    };
  },

  /** Chấm 1 khung webcam qua AI (poll trong lúc làm thử thách liveness). */
  async livenessPose(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(
      "/api/backend/identity-verifications/liveness-pose",
      { method: "POST", body: formData },
    );
    const payload = await response.json();
    if (!response.ok) throw new ApiFail(payload as ApiError, response.status);
    return payload as {
      success: true;
      data: {
        face_found: boolean;
        yaw: number | null;
        pitch: number | null;
        roll: number | null;
        blink?: boolean;
      };
    };
  },

  /**
   * Gửi CCCD (trước/sau) + selfie + frames liveness để AI xác minh
   * (IDVerification pipeline). Document mới tạo: PENDING (AI pass, chờ admin
   * duyệt) hoặc REJECTED (kèm lý do trong reviewNotes).
   */
  async verifyIdentityAi(input: {
    documentType: UploadIdentityDocumentType["documentType"];
    front: File;
    back?: File | null;
    selfie: File;
    liveness: File[];
  }) {
    const formData = new FormData();
    formData.set("documentType", input.documentType);
    formData.set("front", input.front);
    if (input.back) formData.set("back", input.back);
    formData.set("selfie", input.selfie);
    for (const frame of input.liveness) {
      formData.append("liveness", frame);
    }
    const response = await fetch(
      "/api/backend/identity-verifications/ai-check",
      { method: "POST", body: formData },
    );
    const payload = await response.json();
    if (!response.ok) throw new ApiFail(payload as ApiError, response.status);
    return payload as {
      success: true;
      data: IdentityVerificationDocumentType;
    };
  },

  getClientProfile: (userId: number) =>
    http.get<ClientProfileDetailType>(`/clients/${userId}`),
  updateClientProfile: (body: UpdateClientProfileType) =>
    http.put<ProfileRevisionSubmissionType>("/clients/me/profile", body),

  getSocialLinks: () => http.get<SocialLinkType[]>("/social-links"),
  addSocialLink: (body: AddSocialLinkType) =>
    http.post<SocialLinkType>("/social-links", body),
  deleteSocialLink: (id: number) =>
    http.delete<{ message: string }>(`/social-links/${id}`),

  getFavorites: () =>
    http.get<FavoriteFreelancerType[]>("/favorites/freelancers"),
  addFavorite: (freelancerId: number) =>
    http.post<{ message: string }>(
      `/favorites/freelancers/${freelancerId}`,
      {},
    ),
  removeFavorite: (freelancerId: number) =>
    http.delete<{ message: string }>(`/favorites/freelancers/${freelancerId}`),

  getFollowing: () =>
    http.get<FollowingFreelancerType[]>("/following/freelancers"),
  discoverFreelancers: () =>
    http.get<DiscoverFreelancerType[]>("/following/freelancers/discover"),
  followFreelancer: (freelancerId: number) =>
    http.post<{ message: string }>(
      `/following/freelancers/${freelancerId}`,
      {},
    ),
  unfollowFreelancer: (freelancerId: number) =>
    http.delete<{ message: string }>(`/following/freelancers/${freelancerId}`),
};
