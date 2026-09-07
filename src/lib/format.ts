export function formatSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    .toUpperCase();
}
