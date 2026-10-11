import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

const ForgotPasswordPage = () => {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
};

export default ForgotPasswordPage;
