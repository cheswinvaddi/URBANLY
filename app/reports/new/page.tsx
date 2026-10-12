import { Suspense } from "react";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { ReportSubmissionForm } from "@/components/reports/report-submission-form";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export default function NewReportPage() {
  return (
    <Suspense fallback={<ReportPageLoading />}>
      <NewReportContent />
    </Suspense>
  );
}

function ReportPageLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading report form"
      className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-12"
    >
      <div className="h-[36rem] w-full max-w-3xl animate-pulse rounded-3xl bg-white" />
    </main>
  );
}

async function NewReportContent() {
  await io();
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return <ReportSubmissionForm />;
}
