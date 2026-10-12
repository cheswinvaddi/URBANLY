import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f5f8f5] px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,65,45,0.45)] sm:p-9">
        <Link
          className="inline-flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-800 text-sm font-bold text-white">
            U
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-950">Urbanly</span>
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-slate-600">{description}</p>
        {children}
      </section>
    </main>
  );
}
