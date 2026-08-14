import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cost-conscious default for this app's AI calls (job extraction, fit review,
// CV skill extraction) — chosen over Opus for a personal-scale project.
export const MODEL = "claude-sonnet-5";
