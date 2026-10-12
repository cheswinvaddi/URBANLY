import { Suspense } from "react";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { MyReports } from "@/components/reports/my-reports";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export default function MyReportsPage() {
  return (
    <Suspense fallback={<ReportsPageLoading />}>
      <MyReportsContent />
    </Suspense>
  );
}

function ReportsPageLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your reports"
      className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-12"
    >
      <div className="h-96 w-full max-w-5xl animate-pulse rounded-3xl bg-white" />
    </main>
  );
}

async function MyReportsContent() {
  await io();
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return <MyReports />;
}
