const ITEMS = [
  {
    label: "Matching",
    body: "Resumes and job postings are embedded into 1024-dimensional vectors and stored in Postgres with pgvector. Matches rank by cosine distance, not keyword overlap.",
  },
  {
    label: "Processing",
    body: "Text extraction, OpenRouter-based skill parsing, and embedding generation run as background jobs on a BullMQ queue — off the request path.",
  },
  {
    label: "Infrastructure",
    body: "ECS Fargate, defined in Terraform. Every resource is in code; nothing was clicked into existence in a console.",
  },
  {
    label: "Deployment",
    body: "GitHub Actions deploys on merge to main, authenticated to AWS through OIDC — no long-lived credentials stored in CI.",
  },
];

export function BuiltWith() {
  return (
    <section className="border-t border-edge py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[760px] px-6">
        <h2 className="mb-2 font-display text-[clamp(24px,4vw,32px)] font-semibold tracking-[-0.026em] [font-variation-settings:'wdth'_86,'opsz'_40]">
          How it&apos;s built
        </h2>
        <p className="mb-10 max-w-[46ch] text-muted">The parts that do the real work.</p>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <div key={item.label}>
              <dt className="mb-1.5 text-sm font-semibold">{item.label}</dt>
              <dd className="text-[14px] leading-relaxed text-muted">{item.body}</dd>
            </div>
          ))}
        </dl>

        <a
          href="https://github.com/bahattinbober/job-platform-backend"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block text-sm font-semibold text-ink underline decoration-edge underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          View the source on GitHub
        </a>
      </div>
    </section>
  );
}
