import {
  LoginBodyType,
  LoginResType,
  RegisterBodyType,
  UserType,
} from "@shared/types";
import { http } from "../lib/http";

export const authApiRequest = {
  login: (body: LoginBodyType) =>
    http.post<LoginResType>("/api/auth/login", body, false),

  register: (body: RegisterBodyType) => http.post("/api/auth/register", body),

  me: () => http.get<UserType>("/api/auth/me"),
};
