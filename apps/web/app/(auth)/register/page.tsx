import { AuthShell } from "../components/auth-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Join as a freelancer or employer and get started."
      imageSrc="/auth/register.jpg"
      panelTitle="Find work or hire talent."
    >
      <RegisterForm />
    </AuthShell>
  );
}
