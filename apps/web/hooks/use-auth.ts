import { authApiRequest } from "@/apiRequests/auth";
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from "@shared/types";
import { useMutation } from "@tanstack/react-query";

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

export { useForgotPassword, useGoogleLink, useLogin, useRegister, useSendOtp };
