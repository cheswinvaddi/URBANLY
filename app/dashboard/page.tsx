import { Suspense } from "react";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { CitizenDashboard } from "@/components/dashboard/citizen-dashboard";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import {
  getDashboardReportData,
  type DashboardReportData,
} from "@/lib/reports/dashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading dashboard"
      className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-12"
    >
      <div className="h-96 w-full max-w-7xl animate-pulse rounded-3xl bg-white" />
    </main>
  );
}

async function DashboardContent() {
  await io();
  let user;

  try {
    user = await getAuthenticatedUser();
  } catch {
    console.error("[dashboard] Failed to verify the current user.");
    return <DashboardUnavailable />;
  }

  if (!user) {
    redirect("/login");
  }

  let reportData: DashboardReportData | null;

  try {
    reportData = await getDashboardReportData(user.id);
  } catch {
    console.error("[dashboard] Failed to load the current user's reports.");
    reportData = null;
  }

  return <CitizenDashboard user={user} reportData={reportData} />;
}

function DashboardUnavailable() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-12">
      <section
        aria-labelledby="dashboard-unavailable-title"
        className="max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm"
        role="alert"
      >
        <h1
          className="text-lg font-semibold text-slate-950"
          id="dashboard-unavailable-title"
        >
          Dashboard temporarily unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We couldn’t verify your account right now. Please refresh the page or
          try again shortly.
        </p>
      </section>
    </main>
  );
}
