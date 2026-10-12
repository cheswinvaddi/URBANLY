"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-sm text-red-700" role="alert">
      {messages[0]}
    </p>
  );
}

export function RegistrationForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="name">
          Full name
        </label>
        <input
          autoComplete="name"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          id="name"
          maxLength={80}
          name="name"
          required
          aria-describedby={state.errors?.name ? "name-error" : undefined}
          aria-invalid={Boolean(state.errors?.name?.length)}
        />
        <FieldError id="name-error" messages={state.errors?.name} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          id="email"
          maxLength={254}
          name="email"
          required
          type="email"
          aria-describedby={state.errors?.email ? "register-email-error" : undefined}
          aria-invalid={Boolean(state.errors?.email?.length)}
        />
        <FieldError id="register-email-error" messages={state.errors?.email} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="new-password"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          id="password"
          maxLength={72}
          name="password"
          required
          type="password"
          aria-describedby={state.errors?.password ? "register-password-error" : undefined}
          aria-invalid={Boolean(state.errors?.password?.length)}
        />
        <p className="mt-1 text-xs text-slate-500">
          Use at least 10 characters (maximum 72 UTF-8 bytes).
        </p>
        <FieldError id="register-password-error" messages={state.errors?.password} />
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-emerald-800 underline-offset-4 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      {registered && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          Your account is ready. Sign in to continue.
        </p>
      )}
      {state.message && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="email">
          Email address
        </label>
        <input
          autoComplete="email"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          id="email"
          maxLength={254}
          name="email"
          required
          type="email"
          aria-describedby={state.errors?.email ? "login-email-error" : undefined}
          aria-invalid={Boolean(state.errors?.email?.length)}
        />
        <FieldError id="login-email-error" messages={state.errors?.email} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-800" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          id="password"
          maxLength={72}
          name="password"
          required
          type="password"
          aria-describedby={state.errors?.password ? "login-password-error" : undefined}
          aria-invalid={Boolean(state.errors?.password?.length)}
        />
        <FieldError id="login-password-error" messages={state.errors?.password} />
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        New to Urbanly?{" "}
        <Link
          className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
