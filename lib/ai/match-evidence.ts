import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { EvidenceMatchingSchema, type EvidenceMatch, type Requirement } from "./schemas";
import type { FitReviewProfileInput } from "./review-fit";

const SYSTEM_PROMPT = `You evaluate how well a candidate's background supports each requirement of a job. You do not score or rank anything — you only classify the evidence. A separate deterministic step turns your classifications into a score.

For every requirement given, produce exactly one match:
- matchLevel: "strong" (clearly supported by the candidate's background), "partial" (related experience exists but doesn't fully meet the requirement), "gap" (requirement appears unmet), or "unknown" (cannot be determined from the available information)
- matchBasis: how the evidence supports the requirement — "direct" (candidate has done this exact thing before), "transferable" (candidate's experience is in a closely related but not identical context), or "inferred" (plausible given the candidate's background but not explicitly stated). Use null when matchLevel is "gap" or "unknown".
- evidence: one grounded sentence citing the specific part of the candidate's background that supports (or fails to support) this requirement
- confidence: 0-1, how confident you are in this classification given the available information

Do not invent evidence the candidate's profile doesn't support. When information is genuinely absent, use "unknown" rather than guessing.`;

export async function matchEvidence(
  candidate: FitReviewProfileInput,
  requirements: Requirement[]
): Promise<EvidenceMatch[]> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(EvidenceMatchingSchema),
      effort: "medium",
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Requirements\n${JSON.stringify(requirements, null, 2)}\n\n## Candidate\n${JSON.stringify(candidate, null, 2)}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to match candidate evidence against requirements");
  }
  return response.parsed_output.matches;
}
