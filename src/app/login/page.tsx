"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

const inputClass =
  "w-full rounded-[2px] border border-edge bg-paper px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/matches");
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[420px] px-6 pb-24 pt-16">
      <Link
        href="/"
        className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
      >
        NOD
      </Link>

      <h1 className="mb-1.5 mt-10 font-display text-[26px] font-semibold tracking-[-0.02em]">
        Sign in
      </h1>
      <p className="mb-8 text-sm text-muted">Pick up where you left off.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {fieldErrors.email && <p className="mt-1.5 text-[12.5px] text-muted">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[12.5px] font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-[12.5px] text-muted">{fieldErrors.password}</p>
          )}
        </div>

        {errorMessage && <p className="text-[13px] text-muted">{errorMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 cursor-pointer rounded-[2px] border border-signal bg-signal px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-ink underline decoration-edge underline-offset-4 transition-colors hover:decoration-ink"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
