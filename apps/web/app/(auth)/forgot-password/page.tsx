import { getTranslations } from "next-intl/server";
import { AuthShell } from "../components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthShell
      title={t("title")}
      description={t("description")}
      imageSrc="/auth/forgot-password.jpg"
      panelTitle={t("panelTitle")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
