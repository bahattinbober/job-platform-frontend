"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UploadPanel } from "@/components/UploadPanel";

export default function UploadPage() {
  return (
    <RequireAuth>
      <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <AppHeader
          right={
            <Link
              href="/matches"
              className="text-[12.5px] text-muted transition-colors hover:text-ink"
            >
              Back to matches
            </Link>
          }
        />

        <section className="pt-12">
          <UploadPanel />
        </section>
      </main>
    </RequireAuth>
  );
}
