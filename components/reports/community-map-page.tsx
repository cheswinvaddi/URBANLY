"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { reportCategories, reportStatuses } from "@/lib/report-constants";
import { ReportMap, type MapReport } from "@/components/reports/report-map";

interface MapReportsResponse {
  reports: MapReport[];
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

export function CommunityMapPage() {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: "100",
      withCoordinates: "true",
    });

    if (category) params.set("category", category);
    if (status) params.set("status", status);

    async function loadReports() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reports?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("The map report data could not be loaded.");
        }

        const body = (await response.json()) as MapReportsResponse;
        setReports(body.reports);
        setTotalPages(body.pagination.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setError("We couldn’t load reports for the map. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReports();
    return () => controller.abort();
  }, [category, page, retryCount, status]);

  return (
    <main className="min-h-screen flex-1 bg-[#f5f8f5] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              className="inline-flex min-h-9 items-center rounded-lg text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
              href="/dashboard"
            >
              ← Back to dashboard
            </Link>
            <p className="mt-5 text-sm font-semibold text-emerald-800">
              Explore geolocated issues
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Community Report Map
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Markers show only reports with coordinates supplied at submission.
              Reports with an address alone are not placed on the map.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800/20 bg-white px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            href="/reports"
          >
            View report list
          </Link>
        </div>

        <section
          aria-label="Filter map reports"
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5"
        >
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="map-category-filter"
            >
              Category
            </label>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              id="map-category-filter"
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              value={category}
            >
              <option value="">All categories</option>
              {reportCategories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabels[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="map-status-filter"
            >
              Status
            </label>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
              id="map-status-filter"
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="">All statuses</option>
              {reportStatuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section aria-label="Map of community reports" className="mt-5">
          {loading ? (
            <div
              aria-busy="true"
              aria-label="Loading map reports"
              className="grid h-[60vh] min-h-[400px] place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-600"
            >
              Loading geolocated reports…
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
              <h2 className="text-lg font-semibold">
                No reports with coordinates found
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Only reports submitted with valid latitude and longitude can be
                shown as map markers. Address-only reports remain available in
                the community report list.
              </p>
              {(category || status) && (
                <button
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-800/20 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  onClick={() => {
                    setCategory("");
                    setStatus("");
                    setPage(1);
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <ReportMap reports={reports} />
              <p aria-live="polite" className="mt-3 text-sm text-slate-600">
                Showing {reports.length} geolocated{" "}
                {reports.length === 1 ? "report" : "reports"}
                {totalPages > 1 ? ` on page ${page} of ${totalPages}` : ""}.
              </p>
            </>
          )}

          {!loading && !error && totalPages > 1 && (
            <nav
              aria-label="Map report pages"
              className="mt-5 flex items-center justify-between gap-4"
            >
              <button
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                type="button"
              >
                Previous
              </button>
              <p className="text-sm text-slate-600">
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
