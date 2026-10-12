import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/actions/auth";
import type { AuthenticatedUser } from "@/lib/auth/authorization";
import {
  reportCategories,
  reportStatuses,
} from "@/lib/report-constants";
import type { DashboardReportData } from "@/lib/reports/dashboard";

const navigationItems = [
  { label: "Dashboard", href: "#overview", icon: "grid", current: true },
  { label: "My Reports", href: "/reports/mine", icon: "pin", current: false },
  {
    label: "Community Reports",
    href: "/reports",
    icon: "community",
    current: false,
  },
  { label: "Report Map", href: "/map", icon: "pin", current: false },
] as const;

const statistics = [
  { key: "total", label: "Total Reports", icon: "layers", tone: "bg-emerald-50 text-emerald-800" },
  { key: "pending", label: "Pending", icon: "clock", tone: "bg-amber-50 text-amber-800" },
  { key: "inProgress", label: "In Progress", icon: "progress", tone: "bg-sky-50 text-sky-800" },
  { key: "resolved", label: "Resolved", icon: "check", tone: "bg-teal-50 text-teal-800" },
] as const;

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

function Icon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  const shared = {
    "aria-hidden": true as const,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "grid":
      return (
        <svg {...shared}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...shared}>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case "community":
      return (
        <svg {...shared}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19v-1.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19Z" />
          <path d="M16 5.2a3 3 0 0 1 0 5.7M17 13.2a4.8 4.8 0 0 1 3.5 4.6V19h-3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...shared}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "progress":
      return (
        <svg {...shared}>
          <path d="M4 18a9 9 0 1 1 16 0" />
          <path d="m12 13 4-4" />
          <circle cx="12" cy="13" r="1" />
        </svg>
      );
    case "check":
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16.5 9" />
        </svg>
      );
    case "plus":
      return (
        <svg {...shared}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...shared}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...shared}>
          <path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-8 8-16Z" />
          <path d="M5 20c2-5 5-8 10-11" />
        </svg>
      );
    default:
      return null;
  }
}

function Brand() {
  return (
    <Link
      className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
      href="/"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-emerald-800 text-base font-bold text-white">
        U
      </span>
      <span>
        <span className="block text-lg font-bold tracking-tight text-slate-950">Urbanly</span>
        <span className="block text-xs text-slate-500">Civic space, together</span>
      </span>
    </Link>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Main navigation">
      <ul
        className={
          mobile
            ? "flex min-w-max gap-2"
            : "space-y-1"
        }
      >
        {navigationItems.map((item) => (
          <li key={item.label}>
            <Link
              aria-current={item.current ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                item.current
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              } ${mobile ? "px-4" : "w-full"}`}
              href={item.href}
            >
              <Icon
                className="size-[18px] shrink-0"
                name={item.icon}
              />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ReportButton() {
  return (
    <Link
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
      href="/reports/new"
    >
      <Icon className="size-[18px]" name="plus" />
      Report an Issue
    </Link>
  );
}

export function CitizenDashboard({
  user,
  reportData,
}: {
  user: AuthenticatedUser;
  reportData: DashboardReportData | null;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] || "neighbor";
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main
      className="min-h-[calc(100vh-4rem)] flex-1 bg-[#f5f8f5] text-slate-950"
      id="overview"
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white px-5 py-7 lg:flex lg:flex-col">
          <Brand />
          <div className="mt-10">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
            <Navigation />
          </div>
          <div className="mt-auto rounded-2xl bg-emerald-50 p-4">
            <div className="grid size-9 place-items-center rounded-xl bg-white text-emerald-800">
              <Icon name="leaf" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">Small actions matter</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Your local knowledge helps make shared spaces better.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-7 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="lg:hidden">
                <Brand />
              </div>
              <div className="hidden text-sm text-slate-500 lg:block">
                Citizen workspace
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs capitalize text-slate-500">{user.role}</p>
                </div>
                <span
                  aria-label={`${user.name}, ${user.role}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900"
                  title={`${user.name} (${user.role})`}
                >
                  {initials || "U"}
                </span>
                <form action={logoutAction}>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                    type="submit"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto pb-1 lg:hidden">
              <Navigation mobile />
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
            <section
              aria-labelledby="dashboard-title"
              className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-emerald-800">Your neighborhood hub</p>
                <h1
                  className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl"
                  id="dashboard-title"
                >
                  Welcome, {firstName}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  Keep up with the issues that matter in your community.
                </p>
              </div>
              <div className="sm:pb-1">
                <ReportButton />
              </div>
            </section>

            <section aria-label="Report statistics" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map((statistic) => (
                <article
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
                  key={statistic.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">{statistic.label}</p>
                    <span className={`grid size-10 place-items-center rounded-xl ${statistic.tone}`}>
                      <Icon name={statistic.icon} />
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                    {reportData ? reportData.statistics[statistic.key] : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {reportData
                      ? "Your submitted reports"
                      : "Report data is temporarily unavailable"}
                  </p>
                </article>
              ))}
            </section>

            {!reportData && (
              <p
                aria-live="polite"
                className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                role="alert"
              >
                We couldn’t load your report data. Please refresh the dashboard
                to try again.
              </p>
            )}

            <section
              aria-labelledby="recent-reports-title"
              className="mt-8 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]"
              id="my-reports"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950" id="recent-reports-title">
                    Recent reports
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Follow the progress of issues you have raised.
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:self-auto"
                  href="/reports/mine"
                >
                  View all reports
                  <Icon className="size-4" name="arrow" />
                </Link>
              </div>

              {!reportData ? (
                <div className="px-5 py-10 text-center sm:px-8 sm:py-14">
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent reports are unavailable
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Your reports couldn’t be loaded right now. Please refresh
                    the page to try again.
                  </p>
                </div>
              ) : reportData.recentReports.length === 0 ? (
                <div className="px-5 py-10 text-center sm:px-8 sm:py-14">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                    <Icon className="size-7" name="pin" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">
                    No reports yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Reports you submit will appear here with their current status.
                  </p>
                  <Link
                    className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-800/20 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                    href="/reports/new"
                  >
                    Submit your first report
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {reportData.recentReports.map((report) => (
                    <li className="px-5 py-5 sm:px-6" key={report.id}>
                      <article>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                              {categoryLabels[report.category]}
                            </p>
                            <h3 className="mt-1 font-semibold text-slate-950">
                              {report.title}
                            </h3>
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
                            className="mt-4 h-auto max-h-64 w-full rounded-xl object-cover sm:max-w-lg"
                            height={480}
                            src={report.imageUrl}
                            unoptimized
                            width={800}
                          />
                        )}
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-medium text-slate-500">Location</dt>
                            <dd className="mt-1 text-slate-900">{report.location}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-slate-500">Submitted</dt>
                            <dd className="mt-1 text-slate-900">
                              <time dateTime={report.createdAt}>
                                {new Intl.DateTimeFormat(undefined, {
                                  dateStyle: "medium",
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
            </section>

            <section
              aria-labelledby="community-reports-title"
              className="mt-6 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6"
              id="community-reports"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-800">
                  <Icon name="community" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950" id="community-reports-title">
                    Community reports
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Community issue browsing will be available when report publishing and
                    discovery are connected.
                  </p>
                </div>
              </div>
            </section>

            <section
              aria-labelledby="reporting-title"
              className="mt-6 scroll-mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-900 p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
              id="reporting"
            >
              <div>
                <h2 className="font-semibold" id="reporting-title">
                  Help improve your neighborhood
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-50/85">
                  Share a local infrastructure issue and follow its status from this
                  dashboard.
                </p>
              </div>
              <Link
                className="mt-4 inline-flex min-h-10 w-fit shrink-0 items-center rounded-lg border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-0"
                href="/reports/new"
              >
                Report an issue
              </Link>
            </section>

            <footer className="py-7 text-center text-xs text-slate-500">
              Signed in as <span className="font-medium capitalize text-slate-700">{user.role}</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
