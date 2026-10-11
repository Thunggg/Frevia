import { AuthShell } from "../components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email, choose a new password, and confirm with the OTP code."
      imageSrc="/auth/forgot-password.jpg"
      panelTitle="Get back into your account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
