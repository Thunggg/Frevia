import { AuthShell } from "../components/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to continue to your Frevia workspace."
      imageSrc="/auth/login.jpg"
      panelTitle="Your projects, in one place."
    >
      <LoginForm />
    </AuthShell>
  );
}
