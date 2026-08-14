import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { CvExtractionSchema, type CvExtraction } from "./schemas";

export async function extractCvSkills(pdfBase64: string): Promise<CvExtraction> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(CvExtractionSchema),
      effort: "low",
    },
    system:
      "Extract a flat list of professional skills (technologies, methodologies, domains) and a concise 2-4 sentence summary of the candidate's experience from this CV.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { type: "text", text: "Extract skills and an experience summary from this CV." },
        ],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to extract skills from CV");
  }
  return response.parsed_output;
}
