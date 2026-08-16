/**
 * Minimum signal needed for the AI fit review to produce a meaningful
 * comparison rather than an all-"unknown" result. A CV file alone isn't
 * enough — skills must have been extracted from it (this now happens
 * automatically on upload, see registerCv in profile/actions.ts).
 */
export function isProfileReadyForReview(profile: {
  skills: string[] | null;
  experienceSummary: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return (profile.skills?.length ?? 0) > 0;
}
