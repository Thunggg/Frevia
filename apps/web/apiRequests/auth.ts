import {
  ForgotPasswordBodyType,
  GetAuthorizationUrlResType,
  GetMeResType,
  LoginBodyType,
  LoginResType,
  MessageResType,
  RegisterBodyType,
  RegisterResType,
  SendOTPBodyType,
} from "@shared/types";
import { http } from "@/lib/http";

export const authApiRequest = {
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/auth/login", body, false),

  register: (body: RegisterBodyType) =>
    http.post<RegisterResType>("/api/auth/register", body),

  sendOtp: (body: SendOTPBodyType) =>
    http.post<MessageResType>("/api/auth/otp", body),

  forgotPassword: (body: ForgotPasswordBodyType) =>
    http.post<MessageResType>("/api/auth/forgot-password", body),

  getGoogleLink: () =>
    http.get<GetAuthorizationUrlResType>("/api/auth/google-link"),

  me: () => http.get<GetMeResType>("/api/auth/me"),
};
