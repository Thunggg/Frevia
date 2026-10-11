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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  FieldDescription,
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
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

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
    <div className="m-auto w-full min-w-0 max-w-[430px]">
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
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Start hiring or find work in minutes.
      </p>

      <form
        id="form-rhf-demo"
        className="mt-8"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="gap-4">
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="fullName"
                >
                  Full name
                </FieldLabel>
                <Input
                  {...field}
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  autoCapitalize="words"
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="email"
                >
                  Email
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
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

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="text-sm font-medium text-foreground"
                    htmlFor="register-password"
                  >
                    Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      className="pr-10"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
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
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    className="text-sm font-medium text-foreground"
                    htmlFor="register-confirm-password"
                  >
                    Confirm password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...field}
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className="pr-10"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
          </div>

          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="otp-code"
                >
                  Verification code
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="otp-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending</span>
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
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="role-freelancer"
                >
                  I want to join as
                </FieldLabel>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-2"
                  aria-invalid={fieldState.invalid}
                >
                  <FieldLabel
                    htmlFor="role-freelancer"
                    className="cursor-pointer rounded-lg border-border transition-colors hover:border-muted-foreground/40"
                  >
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Freelancer</FieldTitle>
                        <FieldDescription>
                          Find jobs and work on projects.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={RoleName.FREELANCER}
                        id="role-freelancer"
                      />
                    </Field>
                  </FieldLabel>
                  <FieldLabel
                    htmlFor="role-client"
                    className="cursor-pointer rounded-lg border-border transition-colors hover:border-muted-foreground/40"
                  >
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Client</FieldTitle>
                        <FieldDescription>
                          Post jobs and hire freelancers.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={RoleName.CLIENT} id="role-client" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field orientation="horizontal">
            <Checkbox
              id="terms-checkbox-basic"
              name="terms-checkbox-basic"
              className="cursor-pointer"
              checked={isTermsAccepted}
              onCheckedChange={(value) => setIsTermsAccepted(value === true)}
            />
            <FieldLabel
              htmlFor="terms-checkbox-basic"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              I agree to the{" "}
              <Link
                href="#"
                className="font-normal underline underline-offset-2 hover:text-foreground"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-normal underline underline-offset-2 hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </FieldLabel>
          </Field>

          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-10 w-full cursor-pointer font-medium"
            disabled={!isTermsAccepted || registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating account</span>
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your credentials are always encrypted.
          </p>
        </FieldGroup>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
