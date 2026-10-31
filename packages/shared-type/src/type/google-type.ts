export type GoogleUserInfo = {
  id: string; // Google user id → lưu OauthAccount.providerUserId
  email: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
};
