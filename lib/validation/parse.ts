export function parseCommaList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseNullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseNullableInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * One case study per line, formatted as "Label | https://example.com".
 * Lines missing the separator are skipped.
 */
export function parseCaseStudies(
  value: FormDataEntryValue | null
): { label: string; url: string }[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      return { label: label ?? "", url: url ?? "" };
    })
    .filter((entry) => entry.url.length > 0);
}

export function formatCaseStudies(entries: { label: string; url: string }[]): string {
  return entries.map((e) => `${e.label} | ${e.url}`).join("\n");
}

export function parseLineList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
