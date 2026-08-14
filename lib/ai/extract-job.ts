import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { ExtractedJobSchema, type ExtractedJob } from "./schemas";

export async function extractJobFromText(
  pageText: string,
  sourceUrl: string
): Promise<ExtractedJob> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(ExtractedJobSchema),
      effort: "low",
    },
    system:
      "You extract structured job posting data from raw web page text. Only use information present in the text — do not invent details. Use null for any field you cannot determine from the text.",
    messages: [
      {
        role: "user",
        content: `Source URL: ${sourceUrl}\n\nPage text:\n${pageText}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to extract job data from page text");
  }
  return response.parsed_output;
}
