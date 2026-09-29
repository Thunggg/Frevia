export const OauthProvider = {
  GOOGLE: "GOOGLE",
} as const;

export type OauthProviderType =
  (typeof OauthProvider)[keyof typeof OauthProvider];
