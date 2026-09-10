"use client";

import Link from "next/link";

export default function RoleDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <div className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
        <Link
          href="/"
          className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
        >
          NOD
        </Link>
      </div>

      <div className="pt-14">
        <h1 className="mb-2 font-display text-[26px] font-semibold tracking-[-0.02em]">
          Couldn&apos;t load this role
        </h1>
        <p className="max-w-[46ch] text-sm text-muted">{error.message}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 cursor-pointer rounded-[2px] border border-signal bg-signal px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
