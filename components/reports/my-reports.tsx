"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { reportCategories, reportStatuses } from "@/lib/report-constants";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: (typeof reportCategories)[number];
  status: (typeof reportStatuses)[number];
  location: { address: string };
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReportsResponse {
  reports: ReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categoryLabels: Record<(typeof reportCategories)[number], string> = {
  roads: "Roads and sidewalks",
  garbage: "Garbage and litter",
  streetlights: "Streetlights",
  water: "Water",
  drainage: "Drainage",
  other: "Other",
};

const statusLabels: Record<(typeof reportStatuses)[number], string> = {
  pending: "Pending",
  "in-progress": "In progress",
  resolved: "Resolved",
};

export function MyReports() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports/mine?page=${page}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Reports could not be loaded.");
        }

        const body = (await response.json()) as ReportsResponse;
        setReports(body.reports);
        setTotalPages(body.pagination.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setError("We couldn’t load your reports. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReports();
    return () => controller.abort();
  }, [page, retryCount, router]);

  return (
    <main className="min-h-screen flex-1 bg-[#f5f8f5] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className="inline-flex min-h-9 items-center rounded-lg text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
              href="/dashboard"
            >
              ← Back to dashboard
            </Link>
            <p className="mt-5 text-sm font-semibold text-emerald-800">Your neighborhood hub</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              My Reports
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Check the details and current status of the reports you submitted.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            href="/reports/new"
          >
            Report an issue
          </Link>
        </div>

        <section aria-label="Your reports" aria-live="polite" className="mt-8">
          {loading ? (
            <div aria-busy="true" className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
                  key={item}
                />
              ))}
              <p className="sr-only">Loading your reports…</p>
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-900"
              role="alert"
            >
              <p>{error}</p>
              <button
                className="mt-3 min-h-10 rounded-lg border border-rose-300 px-3 font-semibold hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-800"
                onClick={() => setRetryCount((count) => count + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm sm:px-8">
              <span
                aria-hidden="true"
                className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-800"
              >
                +
              </span>
              <h2 className="mt-5 text-lg font-semibold">No reports yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                When you submit a community issue, its details and status will appear here.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                href="/reports/new"
              >
                Submit your first report
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {reports.map((report) => (
                <li
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
                  key={report.id}
                >
                  <article>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                          {categoryLabels[report.category]}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight">
                          {report.title}
                        </h2>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          report.status === "resolved"
                            ? "bg-emerald-100 text-emerald-900"
                            : report.status === "in-progress"
                              ? "bg-sky-100 text-sky-900"
                              : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {statusLabels[report.status]}
                      </span>
                    </div>
                    {report.imageUrl && (
                      <Image
                        alt={`Photo for ${report.title}`}
                        className="mt-4 h-auto max-h-80 w-full rounded-xl object-cover sm:max-w-xl"
                        height={480}
                        src={report.imageUrl}
                        unoptimized
                        width={800}
                      />
                    )}
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {report.description}
                    </p>
                    <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-500">Location</dt>
                        <dd className="mt-1 text-slate-900">{report.location.address}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">Submitted</dt>
                        <dd className="mt-1 text-slate-900">
                          <time dateTime={report.createdAt}>
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(report.createdAt))}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {!loading && !error && totalPages > 1 && (
            <nav
              aria-label="My reports pages"
              className="mt-6 flex items-center justify-between gap-4"
            >
              <button
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                type="button"
              >
                Previous
              </button>
              <p aria-live="polite" className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <button
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
