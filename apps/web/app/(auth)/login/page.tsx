import { getTranslations } from "next-intl/server";
import { AuthShell } from "../components/auth-shell";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, redirect } = await searchParams;
  const t = await getTranslations("auth.login");

  return (
    <AuthShell
      title={t("title")}
      description={t("description")}
      imageSrc="/auth/login.jpg"
      panelTitle={t("panelTitle")}
    >
      <LoginForm oauthError={error} redirectTo={redirect} />
    </AuthShell>
  );
}
