/**
 * Minimum signal needed for the AI fit review to produce a meaningful
 * comparison rather than an all-"unknown" result. Requires either a CV on
 * file or a non-empty skills list.
 */
export function isProfileReadyForReview(profile: {
  skills: string[] | null;
  experienceSummary: string | null;
} | null | undefined, cvCount: number): boolean {
  if (!profile) return false;
  return cvCount > 0 || (profile.skills?.length ?? 0) > 0;
}
