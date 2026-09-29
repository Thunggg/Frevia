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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@repo/ui/components/shadcn/field";
import { Input } from "@repo/ui/components/shadcn/input";
import { RegisterBodySchema, RoleName } from "@shared/types";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { authApiRequest } from "@/apiRequests/auth";
import { handleErrorApi } from "@/lib/utils";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { ApiFail } from "@/lib/http";
import {
  RadioGroup,
  RadioGroupItem,
} from "@repo/ui/components/shadcn/radio-group";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/ui/components/shadcn/input-group";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();

  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
      otpCode: "",
      fullName: "",
      role: RoleName.FREELANCER,
    },
  });

  async function onSubmit(payload: z.infer<typeof RegisterBodySchema>) {
    try {
      const res = await authApiRequest.register(payload);

      if (res.success) {
        toastSuccess({ message: "Register successful" });
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
        toastError({ message: "Register failed" });
      }
    }
  }

  async function sendOtp() {
    try {
      const email = form.getValues("email");

      if (!email) {
        toastError({ message: "Email is required" });
        return;
      }

      const res = await authApiRequest.sendOtp({
        email,
        type: "EMAIL_VERIFICATION",
      });

      if (res.success) {
        toastSuccess({ message: res.data.message });
        setCountdown(30);
      }
    } catch (error: unknown) {
      if (error instanceof ApiFail) {
        handleErrorApi({ error: error.response, setError: form.setError });
      }
    }
  }

  return (
    <Card className="w-full sm:max-w-md mx-auto my-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="form-rhf-demo"
          onSubmit={form.handleSubmit(onSubmit, (errors) =>
            console.log(errors),
          )}
        >
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-email">
                    Full Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
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
                  <FieldLabel htmlFor="form-rhf-demo-email">
                    Email address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
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
                  <FieldLabel htmlFor="form-rhf-demo-email">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
                  />
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
                  <FieldLabel htmlFor="form-rhf-demo-email">
                    Confirm Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="otpCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-email">
                    Otp Code
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      placeholder="OTP Code"
                      maxLength={6}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // Loại bỏ mọi ký tự không phải số
                        field.onChange(value);
                      }}
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        variant="secondary"
                        onClick={() => sendOtp()}
                        disabled={countdown > 0}
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
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-email">Role</FieldLabel>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="max-w-sm"
                  >
                    <FieldLabel htmlFor="plus-plan">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Freelancer</FieldTitle>
                          <FieldDescription>
                            For freelancers who want to find jobs.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          checked={field.value === RoleName.FREELANCER}
                          value={RoleName.FREELANCER}
                          id="plus-plan"
                        />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="pro-plan">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Employer</FieldTitle>
                          <FieldDescription>
                            For employers who want to hire freelancers.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={RoleName.CLIENT} id="pro-plan" />
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                </Field>
              )}
            />
            <FieldGroup className="w-56 cursor-pointer">
              <Field orientation="horizontal">
                <Checkbox
                  id="terms-checkbox-basic"
                  name="terms-checkbox-basic"
                  className="cursor-pointer"
                  onClick={() => setIsTermsAccepted(!isTermsAccepted)}
                />
                <FieldLabel
                  htmlFor="terms-checkbox-basic"
                  className="cursor-pointer"
                >
                  Accept terms and conditions
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            type="submit"
            form="form-rhf-demo"
            disabled={!isTermsAccepted}
          >
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
