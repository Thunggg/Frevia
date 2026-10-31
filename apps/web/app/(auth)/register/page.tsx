import { getTranslations } from "next-intl/server";
import { AuthShell } from "../components/auth-shell";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <AuthShell
      title={t("title")}
      description={t("description")}
      imageSrc="/auth/register.jpg"
      panelTitle={t("panelTitle")}
    >
      <RegisterForm />
    </AuthShell>
  );
}
