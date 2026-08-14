import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_TEXT_LENGTH = 15_000;
const MIN_TEXT_LENGTH = 500;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type FetchJobPageResult =
  | { ok: true; text: string }
  | { ok: false; reason: "fetch_failed" | "insufficient_content" };

export async function fetchJobPageText(url: string): Promise<FetchJobPageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return { ok: false, reason: "fetch_failed" };
  } finally {
    clearTimeout(timeout);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    return { ok: false, reason: "fetch_failed" };
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, header, footer, nav, iframe").remove();

  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);

  if (text.length < MIN_TEXT_LENGTH) {
    return { ok: false, reason: "insufficient_content" };
  }

  return { ok: true, text };
}
