import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-16 sm:px-6">
      <section className="w-full max-w-5xl rounded-[2rem] border border-emerald-950/10 bg-white px-6 py-12 shadow-[0_24px_80px_-44px_rgba(15,65,45,0.45)] sm:px-12 sm:py-16">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-800 text-sm font-bold text-white">
            U
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-950">Urbanly</span>
        </div>
        <div className="mt-16 max-w-2xl sm:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Better neighborhoods start together
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Make your neighborhood heard.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Report local infrastructure issues, follow their progress, and help make
            public spaces work better for everyone.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href="/register"
            >
              Create an account
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
