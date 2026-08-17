import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { RequirementsExtractionSchema, type Requirement } from "./schemas";
import type { FitReviewJobInput } from "./review-fit";

const SYSTEM_PROMPT = `You decompose a job posting into a flat list of atomic, independently-evaluable requirements.

For each requirement:
- text: a single, specific requirement stated or clearly implied by the posting (e.g. "5+ years of product design experience", "Experience with Figma", "Based in the EU or able to work EU business hours")
- type: one of skill, experience, domain, seniority, location, work_authorization, salary, other
- importance: "required" if the posting treats it as a must-have, "preferred" if it's listed as a nice-to-have or bonus

Split compound requirements into separate items rather than bundling them. Do not invent requirements that aren't stated or clearly implied by the posting. Assign each requirement a short stable id: "req-1", "req-2", etc.`;

// Candidate-independent, so this only needs to run once per job posting —
// callers should cache and reuse the result across re-reviews.
export async function extractRequirements(job: FitReviewJobInput): Promise<Requirement[]> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 3072,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(RequirementsExtractionSchema),
      effort: "low",
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify(job, null, 2),
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to extract job requirements");
  }
  return response.parsed_output.requirements;
}
