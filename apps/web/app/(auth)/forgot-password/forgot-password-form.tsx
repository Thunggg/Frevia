"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/shadcn/input-group";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  ForgotPasswordBodySchema,
  TypeOfVerificationCode,
} from "@shared/types";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApiRequest } from "@/apiRequests/auth";
import { handleErrorApi } from "@/lib/utils";
import { ApiFail } from "@/lib/http";
import { Eye, EyeOff } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const form = useForm<z.infer<typeof ForgotPasswordBodySchema>>({
    resolver: zodResolver(ForgotPasswordBodySchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(payload: z.infer<typeof ForgotPasswordBodySchema>) {
    try {
      setIsLoading(true);
      const res = await authApiRequest.forgotPassword(payload);

      if (res.success) {
        toastSuccess({
          message: res.data.message ?? "Password reset successful",
        });
        form.reset();
        router.push("/login");
      }
    } catch (error: unknown) {
      if (error instanceof ApiFail) {
        handleErrorApi({
          error: error.response,
          setError: form.setError,
          duration: 3000,
        });
      } else {
        toastError({ message: "Reset password failed" });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function sendOtp() {
    try {
      setIsSendingOtp(true);
      const email = form.getValues("email");

      const res = await authApiRequest.sendOtp({
        email,
        type: TypeOfVerificationCode.PASSWORD_RESET,
      });

      if (res.success) {
        toastSuccess({ message: res.data.message });
        setCountdown(30);
      }
    } catch (error: unknown) {
      if (error instanceof ApiFail) {
        handleErrorApi({ error: error.response, setError: form.setError });
      } else {
        toastError({ message: "Send OTP failed" });
      }
    } finally {
      setIsSendingOtp(false);
    }
  }

  return (
    <Card className="w-full sm:max-w-md mx-auto my-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and set a new password
        </p>
      </CardHeader>
      <CardContent>
        <form id="forgot-password-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-email">
                    Email address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="forgot-password-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-new-password">
                    New Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="forgot-password-new-password"
                      type={showNewPassword ? "text" : "password"}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmNewPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-confirm-password">
                    Confirm Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="forgot-password-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      aria-invalid={fieldState.invalid}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-password-otp">
                    OTP Code
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="forgot-password-otp"
                      placeholder="OTP Code"
                      maxLength={6}
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="secondary"
                        onClick={() => sendOtp()}
                        disabled={countdown > 0 || isSendingOtp}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Send OTP"}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            type="submit"
            form="forgot-password-form"
            disabled={isLoading}
          >
            Submit
          </Button>
        </Field>
        <p className="text-sm text-muted-foreground text-center">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary/90"
          >
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
