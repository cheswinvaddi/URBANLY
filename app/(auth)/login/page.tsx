import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";

type LoginSearchParams = PageProps<"/login">["searchParams"];

export default function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <AuthCard
          description="Sign in to follow local issues and keep track of the reports you make."
          eyebrow="Welcome back"
          title="Sign in to Urbanly"
        >
          <div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </AuthCard>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      description="Sign in to follow local issues and keep track of the reports you make."
      eyebrow="Welcome back"
      title="Sign in to Urbanly"
    >
      <LoginForm registered={params.registered === "1"} />
    </AuthCard>
  );
}
