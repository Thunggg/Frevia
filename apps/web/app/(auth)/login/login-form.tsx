"use client";

import { useGoogleLink, useLogin } from "@/hooks/use-auth";
import { ApiFail } from "@/lib/http";
import { handleErrorApi } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { LoginBodySchema } from "@shared/types";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();
  const googleLinkMutation = useGoogleLink();

  const form = useForm<z.infer<typeof LoginBodySchema>>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(payload: z.infer<typeof LoginBodySchema>) {
    loginMutation.mutate(payload, {
      onSuccess: (response) => {
        if (response.success) {
          toastSuccess({ message: "Login successful" });
          router.push("/");
        }
      },
      onError: (error) => {
        if (error instanceof ApiFail) {
          handleErrorApi({
            error: error.response,
            setError: form.setError,
            duration: 3000,
          });
        } else {
          toastError({ message: "Login failed", duration: 3000 });
        }
      },
    });
  }

  function clickGoogleLogin() {
    googleLinkMutation.mutate(undefined, {
      onSuccess: (response) => {
        if (response.success) {
          window.location.href = response.data.url;
        }
      },
      onError: () => {
        toastError({ message: "Failed to get Google link", duration: 3000 });
      },
    });
  }

  return (
    <div className="m-auto w-full min-w-0 max-w-sm">
      <Link
        href="/"
        className="mb-10 flex items-center justify-center gap-2 lg:hidden"
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
        Sign in
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Use your Frevia account to continue.
      </p>

      <form
        id="form-rhf-demo"
        className="mt-8"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup className="gap-5">
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
                  autoFocus
                  aria-invalid={fieldState.invalid}
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
                <FieldLabel
                  className="text-sm font-medium text-foreground"
                  htmlFor="password"
                >
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="cursor-pointer" />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            form="form-rhf-demo"
            className="h-10 w-full cursor-pointer font-medium"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in</span>
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your credentials are always encrypted.
          </p>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="outline"
        type="button"
        onClick={() => clickGoogleLogin()}
        disabled={googleLinkMutation.isPending}
        className="h-10 w-full cursor-pointer font-medium"
      >
        {googleLinkMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting</span>
          </>
        ) : (
          <>
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
