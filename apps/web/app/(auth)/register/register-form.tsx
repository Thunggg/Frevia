"use client";

import { useRegister, useSendOtp } from "@/hooks/use-auth";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/shadcn/input-group";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui/components/shadcn/radio-group";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { RegisterBodySchema, RoleName } from "@shared/types";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type * as z from "zod";

export function RegisterForm() {
  const router = useRouter();

  const registerMutation = useRegister();
  const sendOtpMutation = useSendOtp();

  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const form = useForm<z.infer<typeof RegisterBodySchema>>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      code: "",
      fullName: "",
      role: RoleName.FREELANCER,
    },
  });

  function onSubmit(payload: z.infer<typeof RegisterBodySchema>) {
    registerMutation.mutate(payload, {
      onSuccess: (response) => {
        if (response.success) {
          toastSuccess({ message: "Register successful" });
          form.reset();
          router.push("/login");
        }
      },
      onError: (error) => {
        if (error instanceof ApiFail) {
          handleErrorApi({ error: error.response, setError: form.setError });
        } else {
          toastError({ message: "Register failed", duration: 3000 });
        }
      },
    });
  }

  function sendOtp() {
    sendOtpMutation.mutate(
      {
        email: form.getValues("email"),
        type: "EMAIL_VERIFICATION",
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
      <form id="register-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-full-name">Full name</FieldLabel>
                <Input
                  {...field}
                  id="register-full-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="h-11"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-email">Email address</FieldLabel>
                <Input
                  {...field}
                  id="register-email"
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
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
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
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-confirm-password">
                  Confirm password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="register-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                <FieldLabel htmlFor="register-otp">OTP code</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="register-otp"
                    placeholder="6-digit code"
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                    aria-invalid={fieldState.invalid}
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

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-3">
                <FieldLabel>I want to</FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3"
                >
                  <FieldLabel
                    htmlFor="role-freelancer"
                    className="cursor-pointer rounded-xl border border-border bg-background p-4 transition-colors has-data-[state=checked]:border-[#4fae2e]/60 has-data-[state=checked]:bg-[#eaf8df]/50 dark:has-data-[state=checked]:bg-[#4fae2e]/10"
                  >
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Find work</FieldTitle>
                        <FieldDescription>
                          Join as a freelancer and apply to projects.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        checked={field.value === RoleName.FREELANCER}
                        value={RoleName.FREELANCER}
                        id="role-freelancer"
                      />
                    </Field>
                  </FieldLabel>
                  <FieldLabel
                    htmlFor="role-client"
                    className="cursor-pointer rounded-xl border border-border bg-background p-4 transition-colors has-data-[state=checked]:border-[#4fae2e]/60 has-data-[state=checked]:bg-[#eaf8df]/50 dark:has-data-[state=checked]:bg-[#4fae2e]/10"
                  >
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Hire talent</FieldTitle>
                        <FieldDescription>
                          Join as an employer and post jobs.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={RoleName.CLIENT}
                        id="role-client"
                      />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </Field>
            )}
          />

          <Field orientation="horizontal" className="items-start gap-3">
            <Checkbox
              id="terms-checkbox"
              checked={isTermsAccepted}
              onCheckedChange={(checked) =>
                setIsTermsAccepted(checked === true)
              }
              className="mt-0.5"
            />
            <FieldLabel
              htmlFor="terms-checkbox"
              className="cursor-pointer font-normal leading-snug text-muted-foreground"
            >
              I accept the terms and conditions
            </FieldLabel>
          </Field>
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
          form="register-form"
          className="h-11 flex-1 bg-[#4fae2e] font-semibold text-white hover:bg-[#459928] active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
          disabled={!isTermsAccepted || registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
