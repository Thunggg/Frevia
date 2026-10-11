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
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

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
    <div className="m-auto w-full min-w-0 max-w-[360px]">
      <Link
        href="/"
        className="mb-8 flex items-center justify-center gap-2 lg:hidden"
      >
        <Image
          src="/Logo.png"
          alt="Frevia"
          width={28}
          height={28}
          className="size-7 object-contain"
          priority
        />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Frevia
        </span>
      </Link>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Frevia account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Reset password
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter your email, the code we sent you, and a new password.
      </p>

      <form
        id="forgot-password-form"
        className="mt-7"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="gap-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="forgot-password-email"
                >
                  Email
                </FieldLabel>
                <Input
                  {...field}
                  id="forgot-password-email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="forgot-password-new-password"
                >
                  New password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="forgot-password-new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={
                      showNewPassword ? "Hide new password" : "Show new password"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="forgot-password-confirm-password"
                >
                  Confirm new password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="forgot-password-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className="pr-10"
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="forgot-password-otp"
                >
                  Verification code
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="forgot-password-otp"
                    placeholder="6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
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
                      disabled={
                        countdown > 0 || sendOtpMutation.isPending
                      }
                    >
                      {sendOtpMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending</span>
                        </>
                      ) : countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        "Send code"
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

          <Button
            type="submit"
            form="forgot-password-form"
            className="h-10 w-full cursor-pointer font-medium"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Resetting password</span>
              </>
            ) : (
              "Reset password"
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your credentials are always encrypted.
          </p>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
