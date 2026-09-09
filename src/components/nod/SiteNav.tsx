"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#moments", label: "How it works" },
  { href: "#network-moment", label: "Network" },
  { href: "#referral", label: "Referral" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="rounded-full border border-white/15 bg-[#0a0b0c] px-3.5 py-1.5 font-display text-[15px] font-bold tracking-[-0.01em] text-white/95 backdrop-blur-md [font-variation-settings:'wdth'_90] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          NOD
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-white/15 bg-[#0a0b0c] px-1.5 py-1.5 backdrop-blur-md md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/upload"
            className="rounded-full border border-signal bg-signal px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Upload your CV
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0a0b0c] text-white backdrop-blur-md md:hidden"
        >
          <span className="relative block h-[10px] w-[16px]" aria-hidden>
            <span
              className={`absolute left-0 top-0 h-px w-full bg-current transition-transform ${open ? "translate-y-[4.5px] rotate-45" : ""}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform ${open ? "-translate-y-[4.5px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="mx-5 mt-1 rounded-2xl border border-white/15 bg-[#0a0b0c] p-3 backdrop-blur-md md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-white/85 transition-colors hover:bg-white/10"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/upload"
              onClick={() => setOpen(false)}
              className="mt-1.5 rounded-lg border border-signal bg-signal px-3 py-2.5 text-center text-[14px] font-semibold text-surface"
            >
              Upload your CV
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
