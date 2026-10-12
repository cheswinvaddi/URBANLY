import { AuthCard } from "@/components/auth/auth-card";
import { RegistrationForm } from "@/components/auth/auth-forms";

export default function RegisterPage() {
  return (
    <AuthCard
      description="Join your neighbors in making streets and public spaces better for everyone."
      eyebrow="Get started"
      title="Create your account"
    >
      <RegistrationForm />
    </AuthCard>
  );
}
