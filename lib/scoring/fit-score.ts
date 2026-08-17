import type { Requirement, EvidenceMatch, Recommendation } from "@/lib/ai/schemas";

/**
 * The only place fit-score numbers come from. Deterministic and tunable:
 * change a weight here and every future review reflects it immediately and
 * identically across candidates — no prompt-engineering required, and the
 * same requirements + evidence always produce the same score.
 */
export const SCORING_CONFIG = {
  // How much a requirement counts toward the total, by how the job posting
  // framed it.
  importanceWeight: {
    required: 1,
    preferred: 0.5,
  },
  // How much credit a requirement earns, by how well the evidence supports it.
  matchLevelScore: {
    strong: 1,
    partial: 0.6,
    gap: 0,
    unknown: 0.4,
  },
  // Applied on top of matchLevelScore based on *how* the evidence supports
  // the requirement — e.g. bumping this from 0.85 to something else is the
  // whole fix if transferable experience should count for more or less.
  matchBasisMultiplier: {
    direct: 1,
    transferable: 0.85,
    inferred: 0.7,
  },
} as const;

export const RECOMMENDATION_THRESHOLDS: { min: number; recommendation: Recommendation }[] = [
  { min: 85, recommendation: "strong_apply" },
  { min: 70, recommendation: "apply" },
  { min: 50, recommendation: "consider" },
  { min: 30, recommendation: "low_priority" },
  { min: 0, recommendation: "skip" },
];

export function recommendationFromScore(score: number): Recommendation {
  return RECOMMENDATION_THRESHOLDS.find((t) => score >= t.min)?.recommendation ?? "skip";
}

export function computeFitScore(
  requirements: Requirement[],
  matches: EvidenceMatch[]
): { score: number; recommendation: Recommendation } {
  const matchById = new Map(matches.map((m) => [m.requirementId, m]));

  let earned = 0;
  let possible = 0;

  for (const req of requirements) {
    const weight = SCORING_CONFIG.importanceWeight[req.importance];
    possible += weight;

    const match = matchById.get(req.id);
    if (!match) continue;

    const basisMultiplier = match.matchBasis
      ? SCORING_CONFIG.matchBasisMultiplier[match.matchBasis]
      : 1;
    earned +=
      weight * SCORING_CONFIG.matchLevelScore[match.matchLevel] * basisMultiplier * match.confidence;
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  return { score, recommendation: recommendationFromScore(score) };
}
