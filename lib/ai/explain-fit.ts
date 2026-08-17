import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { FitExplanationSchema, type Requirement, type EvidenceMatch, type Recommendation } from "./schemas";
import type { FitReviewJobInput } from "./review-fit";

const SYSTEM_PROMPT = `You write a short, grounded explanation of a job-fit assessment that has already been scored by a separate deterministic step. Do not restate, second-guess, or imply a different score than the one given — write 2-3 sentences explaining WHY it landed there, referencing the strongest matches and the most significant gaps.`;

export async function explainFit(
  job: FitReviewJobInput,
  requirements: Requirement[],
  matches: EvidenceMatch[],
  score: number,
  recommendation: Recommendation
): Promise<string> {
  const matchById = new Map(matches.map((m) => [m.requirementId, m]));
  const annotated = requirements.map((r) => ({ ...r, match: matchById.get(r.id) ?? null }));

  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(FitExplanationSchema),
      effort: "low",
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Job\n${job.title} at ${job.companyName}\n\n## Computed score\n${score}/100 (${recommendation})\n\n## Requirements and their evidence matches\n${JSON.stringify(annotated, null, 2)}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to generate fit explanation");
  }
  return response.parsed_output.summary;
}
