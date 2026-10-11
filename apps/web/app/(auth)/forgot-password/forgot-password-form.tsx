"use client";

import { useForgotPassword, useSendOtp } from "@/hooks/use-auth";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type * as z from "zod";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(0);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const sendOtpMutation = useSendOtp();
  const forgotPasswordMutation = useForgotPassword();

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

  function onSubmit(payload: z.infer<typeof ForgotPasswordBodySchema>) {
    forgotPasswordMutation.mutate(payload, {
      onSuccess: (response) => {
        if (response.success) {
          toastSuccess({ message: response.data.message });
        }
        form.reset();
        router.push("/login");
      },
      onError: (error) => {
        if (error instanceof ApiFail) {
          handleErrorApi({ error: error.response, setError: form.setError });
        } else {
          toastError({ message: "Reset password failed", duration: 3000 });
        }
      },
    });
  }

  function sendOtp() {
    sendOtpMutation.mutate(
      {
        email: form.getValues("email"),
        type: TypeOfVerificationCode.PASSWORD_RESET,
      },
      {
        onSuccess: (response) => {
          if (response.success) {
            toastSuccess({ message: response.data.message });
            setCountdown(60);
          }
        },
        onError: (error) => {
          if (error instanceof ApiFail) {
            handleErrorApi({ error: error.response, setError: form.setError });
          } else {
            toastError({ message: "Send OTP failed", duration: 3000 });
          }
        },
      },
    );
  }

  return (
    <div>
      <form id="forgot-password-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
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
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-11"
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
                  New password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="forgot-password-new-password"
                    type={showNewPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
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
                  Confirm password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="forgot-password-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
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
                <FieldLabel htmlFor="forgot-password-otp">OTP code</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="forgot-password-otp"
                    placeholder="6-digit code"
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
                      disabled={countdown > 0 || sendOtpMutation.isPending}
                    >
                      {sendOtpMutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        "Send OTP"
                      )}
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

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 active:scale-[0.99]"
          onClick={() => form.reset()}
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="forgot-password-form"
          className="h-11 flex-1 bg-[#4fae2e] font-semibold text-white hover:bg-[#459928] active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#4fae2e] transition-colors hover:text-[#3f9225]"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
