"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/app/ui/icons";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="login-form flex flex-col">
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[#153c57]"
          htmlFor="email"
        >
          Work email
        </label>
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400"
            name="mail"
          />
          <input
            autoComplete="email"
            className="field-control has-leading-icon"
            id="email"
            name="email"
            placeholder="you@clinic.com"
            required
            type="email"
          />
        </div>
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[#153c57]"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400"
            name="lock"
          />
          <input
            autoComplete="current-password"
            className="field-control has-leading-icon has-trailing-control"
            id="password"
            minLength={8}
            name="password"
            placeholder="Enter your password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#edf8f9] hover:text-[#0b8791]"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            <Icon
              className="h-5 w-5"
              name={showPassword ? "eye-off" : "eye"}
            />
          </button>
        </div>
      </div>
      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <button
        className="button-primary mt-1 w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
