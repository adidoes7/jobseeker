// Shared by the desktop table (server component) and the mobile card list
// (client component) — kept dependency-free so either can import it without
// pulling server-only code into the client bundle.

export const REMOTE_STATUS_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  unknown: "—",
};

export const SOURCE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  company_website: "Company site",
  referral: "Referral",
  indeed: "Indeed",
  recruiter: "Recruiter",
  other: "Other",
};

export const STATUS_COLOR: Record<string, string> = {
  applied: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  recruiter_screening: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  first_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  hr_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  technical_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  interview_process: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  assignment_case_study: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  final_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  ghosted: "bg-muted text-muted-foreground",
  abandoned: "bg-muted text-muted-foreground",
  position_closed: "bg-muted text-muted-foreground",
};

export function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return "—";
  const range = [min, max].filter((v): v is number => v !== null).join(" – ");
  return currency ? `${range} ${currency}` : range;
}
