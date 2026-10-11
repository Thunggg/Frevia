import { authApiRequest } from "@/apiRequests/auth";
import {
  ForgotPasswordBodyType,
  GetMeResType,
  LoginBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginBodyType) => authApiRequest.login(data),
  });
};

function useGoogleLink() {
  return useMutation({
    mutationFn: () => authApiRequest.getGoogleLink(),
  });
}

function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterBodyType) => authApiRequest.register(data),
  });
}

function useSendOtp() {
  return useMutation({
    mutationFn: (data: SendOTPBodyType) => authApiRequest.sendOtp(data),
  });
}

function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordBodyType) =>
      authApiRequest.forgotPassword(data),
  });
}

function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authApiRequest.me().then((res) => (res.success ? res.data : null)),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export { useForgotPassword, useGoogleLink, useLogin, useMe, useRegister, useSendOtp };
