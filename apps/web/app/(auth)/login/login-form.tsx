"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/ui/components/shadcn/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { Label } from "@repo/ui/components/shadcn/label";
import { LoginBodySchema } from "@shared/types";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { authApiRequest } from "@/apiRequests/auth";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { handleErrorApi } from "@/lib/utils";
import { ApiFail } from "@/lib/http";
import Link from "next/link";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginBodySchema>>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(payload: z.infer<typeof LoginBodySchema>) {
    try {
      setIsLoading(true);
      const res = await authApiRequest.login(payload);

      if (res.success) {
        toastSuccess({ message: "Login successful" });
      }
    } catch (error: unknown) {
      if (error instanceof ApiFail) {
        handleErrorApi({
          error: error.response,
          setError: form.setError,
          duration: 3000,
        });
      } else {
        toastError({ message: "Login failed", duration: 3000 });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function clickGoogleLogin() {
    const res = await authApiRequest.getGoogleLink();

    if (res.success) {
      window.location.href = res.data.url;
    } else {
      toastError({ message: "Failed to get Google link", duration: 3000 });
    }
  }

  return (
    <Card className="w-full max-w-xl p-10 bg-color-card-foreground">
      {/* Card Header */}
      <CardHeader className="p-0 mb-8 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome Back!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to your account to continue
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Email Field */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-foreground" htmlFor="email">
                    Email address
                  </FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="pl-10 h-11"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-foreground" htmlFor="password">
                    Password
                  </FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="pl-10 pr-10 h-11"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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

            {/* Remember Me */}
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox id="remember" className="cursor-pointer" />
              <div className="flex items-center justify-between w-full space-x-2">
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-muted-foreground cursor-pointer"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              form="form-rhf-demo"
              className="w-full mt-6 h-11 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              Login
            </Button>
          </FieldGroup>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className=" px-3 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="flex">
          <Button
            variant="outline"
            type="button"
            onClick={() => clickGoogleLogin()}
            className="h-11 font-medium  w-full cursor-pointer"
          >
            {/* Bạn có thể thay bằng SVG thực tế của Google */}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
        </div>
      </CardContent>
      <CardFooter className="p-0 mt-8 justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/90 font-semibold"
          >
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
