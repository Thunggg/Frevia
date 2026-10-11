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
import { Separator } from "@repo/ui/components/shadcn/separator";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { LoginBodySchema } from "@shared/types";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type * as z from "zod";

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
    <div>
      <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-5">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-[13px] font-medium text-foreground/70">
                  Email address
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-11 border-border/60 bg-white/60 text-[14px] transition-colors placeholder:text-muted-foreground/40 focus:border-[#4fae2e] focus:ring-[#4fae2e]/15 dark:border-white/10 dark:bg-white/[0.03] dark:focus:border-[#4fae2e] dark:focus:ring-[#4fae2e]/20"
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
                <FieldLabel className="text-[13px] font-medium text-foreground/70">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-11 border-border/60 bg-white/60 pr-10 text-[14px] transition-colors placeholder:text-muted-foreground/40 focus:border-[#4fae2e] focus:ring-[#4fae2e]/15 dark:border-white/10 dark:bg-white/[0.03] dark:focus:border-[#4fae2e] dark:focus:ring-[#4fae2e]/20"
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
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

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-[13px] text-muted-foreground/70"
              >
                Remember me
              </Label>
            </div>
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            form="login-form"
            className="mt-1 h-11 w-full rounded-lg bg-[#4fae2e] text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#459928] hover:shadow-md active:scale-[0.99] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </FieldGroup>
      </form>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-[11px] tracking-wider text-muted-foreground/50">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        onClick={() => clickGoogleLogin()}
        disabled={googleLinkMutation.isPending}
        className="h-11 w-full rounded-lg border-border/60 bg-white/60 text-[14px] font-medium transition-all dark:border-white/10 dark:bg-white/[0.03] active:scale-[0.99]"
      >
        <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden>
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
        Google
      </Button>

      <p className="mt-8 text-center text-[13px] text-muted-foreground/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#4fae2e] transition-colors hover:text-[#3f9225]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
