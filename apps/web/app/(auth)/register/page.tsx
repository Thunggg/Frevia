import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Frevia account to hire talent or find work.",
};

const RegisterPage = () => {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
};

export default RegisterPage;
