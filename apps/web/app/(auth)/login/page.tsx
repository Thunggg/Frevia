import { AuthShell } from "../components/auth-shell";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to continue to your Frevia workspace."
      imageSrc="/auth/login.jpg"
      panelTitle="Your projects, in one place."
    >
      <LoginForm oauthError={error} />
    </AuthShell>
  );
}
