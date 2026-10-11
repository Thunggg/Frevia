import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Frevia account.",
};

const LoginPage = () => {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
