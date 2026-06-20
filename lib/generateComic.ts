import Anthropic from "@anthropic-ai/sdk";

import type { Character, ComicPage, GeneratedComic, Panel } from "./types";

export interface GenerateComicInput {
  title: string;
  genre: string;
  synopsis: string;
  characters: Character[];
  pageCount?: number;
}

const COMIC_MODEL = "claude-sonnet-4-6";
const COMIC_GENERATION_MAX_TOKENS = 4000;
const MIN_COMIC_PAGE_COUNT = 2;

const SYSTEM_PROMPT = `You are a professional comic book writer and panel layout artist. 
You write gripping, cinematic comic scripts with real emotional weight, 
sharp dialogue, and dynamic action. You do NOT write generic superhero 
content. Every panel description should be vivid and specific. 
Dialogue must sound natural and character-specific based on the 
personality provided. Structure the story with a proper beginning, 
rising tension, climax and resolution. Make it feel like a real 
published comic.

Return strict JSON in this format:
{
  "title": string,
  "tagline": string,
  "pages": [
    {
      "pageNumber": number,
      "layout": "splash" | "two-panel" | "three-panel" | "four-panel" | "five-panel",
      "panels": [
        {
          "panelNumber": number,
          "size": "large" | "medium" | "small",
          "setting": string,
          "action": string,
          "mood": string,
          "characters": [string] (array of character names present in this panel),
          "dialogue": [
            {
              "character": string,
              "type": "speech" | "thought" | "narration",
              "text": string
            }
          ],
          "sfx": string | null,
          "caption": string | null
        }
      ]
    }
  ]
}

Rules:
- Return ONLY valid JSON — no markdown, no commentary.
- Vary page layouts across the comic (splash, two-panel, three-panel, four-panel, five-panel).
- Panel sizes must match the layout (e.g. splash page has one large panel).
- pageNumber and panelNumber start at 1 and increment sequentially.
- Include sfx and caption where dramatically appropriate; use null when not needed.
- characters array lists which named characters appear visually in each panel.

Output limits (critical):
- Keep responses concise: setting/action/mood under 120 characters, dialogue lines under 100 characters.
- Use 1-2 dialogue lines per panel maximum.
- Never exceed the requested page count.
- Your output MUST be complete, valid JSON. Always close every string, array, and object with proper brackets before stopping.
- If you are running low on space, shorten text fields — never leave JSON unclosed or truncated.`;

export class ComicGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComicGenerationError";
  }
}

function buildUserPrompt(input: GenerateComicInput): string {
  const pageCount = input.pageCount ?? 4;
  const characterList =
    input.characters.length > 0
      ? input.characters
          .map(
            (character) =>
              `- ${character.name} (${character.role}): Powers: ${character.powers || "none specified"}. Personality: ${character.personality || "none specified"}.`
          )
          .join("\n")
      : "No characters provided — invent fitting characters for the story.";

  return `Create a ${pageCount}-page comic book.

Title: ${input.title}
Genre: ${input.genre}

Full synopsis:
${input.synopsis}

Characters:
${characterList}

Number of pages requested: ${pageCount}

Keep all fields concise so the JSON fits in one response. Return exactly ${pageCount} pages with complete, closed JSON only.`;
}

function stripOptionalQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function getAnthropicApiKey(): string | undefined {
  const raw = process.env.ANTHROPIC_API_KEY;
  if (raw == null || raw.trim() === "") {
    return undefined;
  }

  return stripOptionalQuotes(raw.trim());
}

function stripMarkdownCodeBlocks(text: string): string {
  let result = text.trim();

  const fenced = result.match(/```(?:json|JSON)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }

  result = result.replace(/^```(?:json|JSON)?\s*\r?\n?/i, "");
  result = result.replace(/\r?\n?```\s*$/i, "");

  return result.trim();
}

function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  const slice = text.slice(start).trimEnd();
  const stack: ("object" | "array")[] = [];
  let inString = false;
  let escaped = false;

  for (let index = 0; index < slice.length; index++) {
    const char = slice[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      stack.push("object");
    } else if (char === "[") {
      stack.push("array");
    } else if (char === "}") {
      if (stack[stack.length - 1] === "object") {
        stack.pop();
      }
    } else if (char === "]") {
      if (stack[stack.length - 1] === "array") {
        stack.pop();
      }
    }
  }

  if (stack.length === 0 && !inString) {
    return null;
  }

  let repaired = slice;

  if (inString) {
    repaired += '"';
  }

  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*"?\s*$/, "");
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*[^,}\]]*$/, "");
  repaired = repaired.replace(/,\s*"[^"]*"?\s*$/, "");
  repaired = repaired.replace(/,\s*$/, "");
  repaired = repaired.replace(/:\s*$/, ": null");

  while (stack.length > 0) {
    const kind = stack.pop();
    repaired += kind === "array" ? "]" : "}";
  }

  return repaired;
}

function buildJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const stripped = stripMarkdownCodeBlocks(trimmed);
  const repairedFromStripped = repairTruncatedJson(stripped);
  const repairedFromTrimmed = repairTruncatedJson(trimmed);
  const candidates = [
    trimmed,
    stripped,
    extractBalancedJsonObject(stripped),
    extractBalancedJsonObject(trimmed),
    repairedFromStripped,
    repairedFromTrimmed,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return Array.from(new Set(candidates));
}

function logJsonParseFailure(
  context: string,
  rawText: string,
  candidates: string[],
  lastError: Error | undefined
): void {
  const apiKey = getAnthropicApiKey();

  console.error(`[generateComic] ${context}: failed to parse JSON`, {
    responseLength: rawText.length,
    responsePreview: rawText.slice(0, 2000),
    candidatesTried: candidates.length,
    candidatePreviews: candidates.map((candidate) => candidate.slice(0, 500)),
    parseError: lastError?.message ?? "Unknown parse error",
    anthropicApiKeyConfigured: Boolean(apiKey),
    anthropicApiKeyLength: apiKey?.length ?? 0,
  });
}

function parseJsonRobustly(
  text: string,
  context: string
): unknown {
  const candidates = buildJsonCandidates(text);
  let lastError: Error | undefined;

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Unknown JSON parse error");
    }
  }

  logJsonParseFailure(context, text, candidates, lastError);

  throw new ComicGenerationError(
    `Failed to parse comic layout: response was not valid JSON.${
      lastError ? ` (${lastError.message})` : ""
    }`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDialogueLine(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.character === "string" &&
    typeof value.text === "string" &&
    (value.type === "speech" ||
      value.type === "thought" ||
      value.type === "narration")
  );
}

function isPanel(value: unknown): value is Panel {
  return (
    isRecord(value) &&
    typeof value.panelNumber === "number" &&
    (value.size === "large" ||
      value.size === "medium" ||
      value.size === "small") &&
    typeof value.setting === "string" &&
    typeof value.action === "string" &&
    typeof value.mood === "string" &&
    Array.isArray(value.characters) &&
    value.characters.every((item) => typeof item === "string") &&
    Array.isArray(value.dialogue) &&
    value.dialogue.every(isDialogueLine) &&
    (value.sfx === null || typeof value.sfx === "string") &&
    (value.caption === null || typeof value.caption === "string")
  );
}

const VALID_LAYOUTS = new Set([
  "splash",
  "two-panel",
  "three-panel",
  "four-panel",
  "five-panel",
]);

function isComicPage(value: unknown): value is ComicPage {
  return (
    isRecord(value) &&
    typeof value.pageNumber === "number" &&
    typeof value.layout === "string" &&
    VALID_LAYOUTS.has(value.layout) &&
    Array.isArray(value.panels) &&
    value.panels.length > 0 &&
    value.panels.every(isPanel)
  );
}

function parseGeneratedComic(text: string): GeneratedComic {
  const parsed = parseJsonRobustly(text, "parseGeneratedComic");

  if (!isRecord(parsed)) {
    throw new ComicGenerationError(
      "Failed to parse comic layout: expected a JSON object."
    );
  }

  if (typeof parsed.title !== "string" || !parsed.title.trim()) {
    throw new ComicGenerationError(
      "Failed to parse comic layout: missing or invalid title."
    );
  }

  if (typeof parsed.tagline !== "string") {
    throw new ComicGenerationError(
      "Failed to parse comic layout: missing or invalid tagline."
    );
  }

  if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    throw new ComicGenerationError(
      "Failed to parse comic layout: pages must be a non-empty array."
    );
  }

  if (!parsed.pages.every(isComicPage)) {
    throw new ComicGenerationError(
      "Failed to parse comic layout: invalid page or panel structure."
    );
  }

  return {
    title: parsed.title.trim(),
    tagline: parsed.tagline.trim(),
    pages: parsed.pages as ComicPage[],
  };
}

function isTruncationParseError(error: unknown): boolean {
  if (!(error instanceof ComicGenerationError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("unexpected end of json input") ||
    message.includes("unterminated string")
  );
}

function isResponseTruncated(text: string, stopReason: string | null): boolean {
  return (
    stopReason === "max_tokens" ||
    (text.includes("{") && extractBalancedJsonObject(text) === null)
  );
}

interface AnthropicComicResponse {
  text: string;
  stopReason: string | null;
}

async function requestComicFromAnthropic(
  client: Anthropic,
  input: GenerateComicInput,
  pageCount: number
): Promise<AnthropicComicResponse> {
  const response = await client.messages.create({
    model: COMIC_MODEL,
    max_tokens: COMIC_GENERATION_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt({ ...input, pageCount }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    console.error("[generateComic] No text block in Anthropic response", {
      contentTypes: response.content.map((block) => block.type),
      stopReason: response.stop_reason,
      pageCount,
    });
    throw new ComicGenerationError("No text response received from Claude.");
  }

  if (response.stop_reason === "max_tokens") {
    console.warn("[generateComic] Response truncated at max_tokens", {
      pageCount,
      maxTokens: COMIC_GENERATION_MAX_TOKENS,
      responseLength: textBlock.text.length,
      responsePreview: textBlock.text.slice(-500),
    });
  }

  return {
    text: textBlock.text,
    stopReason: response.stop_reason,
  };
}

export async function generateComic(
  input: GenerateComicInput
): Promise<GeneratedComic> {
  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.error("[generateComic] ANTHROPIC_API_KEY is missing or empty", {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });
    throw new ComicGenerationError(
      "ANTHROPIC_API_KEY is not configured. Add it in your environment variables."
    );
  }

  if (!input.title?.trim()) {
    throw new ComicGenerationError("Title is required.");
  }

  if (!input.genre?.trim()) {
    throw new ComicGenerationError("Genre is required.");
  }

  if (!input.synopsis?.trim()) {
    throw new ComicGenerationError("Synopsis is required.");
  }

  const client = new Anthropic({ apiKey });
  const requestedPageCount = input.pageCount ?? 4;
  let attemptPageCount = requestedPageCount;
  let lastError: ComicGenerationError | undefined;

  while (attemptPageCount >= MIN_COMIC_PAGE_COUNT) {
    let response: AnthropicComicResponse;

    try {
      response = await requestComicFromAnthropic(client, input, attemptPageCount);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Anthropic API request failed.";
      console.error("[generateComic] Anthropic API request failed", {
        message,
        pageCount: attemptPageCount,
        apiKeyConfigured: true,
        apiKeyLength: apiKey.length,
      });
      throw new ComicGenerationError(message);
    }

    try {
      const comic = parseGeneratedComic(response.text);

      if (attemptPageCount < requestedPageCount) {
        console.warn("[generateComic] Generated fewer pages after retry", {
          requestedPageCount,
          generatedPageCount: comic.pages.length,
          attemptPageCount,
        });
      }

      return comic;
    } catch (error) {
      if (!(error instanceof ComicGenerationError)) {
        throw error;
      }

      lastError = error;
      const truncated = isResponseTruncated(response.text, response.stopReason);
      const parseLooksTruncated = isTruncationParseError(error);

      if (
        (truncated || parseLooksTruncated) &&
        attemptPageCount > MIN_COMIC_PAGE_COUNT
      ) {
        const nextPageCount = Math.max(
          MIN_COMIC_PAGE_COUNT,
          attemptPageCount - 2
        );
        console.warn("[generateComic] Retrying comic generation with fewer pages", {
          previousPageCount: attemptPageCount,
          nextPageCount,
          stopReason: response.stopReason,
          parseError: error.message,
        });
        attemptPageCount = nextPageCount;
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ??
    new ComicGenerationError(
      "Failed to generate comic after retries with reduced page count."
    )
  );
}

export interface RegeneratePageInput {
  comic: GeneratedComic;
  pageNumber: number;
  genre: string;
  synopsis: string;
  characters: Character[];
}

function buildRegeneratePageUserPrompt(input: RegeneratePageInput): string {
  const { comic, pageNumber, genre, synopsis, characters } = input;

  const characterList = characters
    .map(
      (character) =>
        `- ${character.name} (${character.role}): Powers: ${character.powers}. Personality: ${character.personality}.`
    )
    .join("\n");

  const otherPages = comic.pages
    .filter((page) => page.pageNumber !== pageNumber)
    .map(
      (page) =>
        `Page ${page.pageNumber} (${page.layout}): ${page.panels.map((panel) => panel.action).join(" | ")}`
    )
    .join("\n");

  const targetIndex = comic.pages.findIndex(
    (page) => page.pageNumber === pageNumber
  );
  const targetPage = comic.pages[targetIndex];
  const previousPage =
    targetIndex > 0 ? comic.pages[targetIndex - 1] : undefined;
  const nextPage =
    targetIndex >= 0 && targetIndex < comic.pages.length - 1
      ? comic.pages[targetIndex + 1]
      : undefined;

  return `Regenerate page ${pageNumber} for this comic. Keep the same layout style: ${targetPage?.layout ?? "four-panel"}.

Title: ${comic.title}
Tagline: ${comic.tagline}
Genre: ${genre}
Synopsis: ${synopsis}

Characters:
${characterList || "No characters listed."}

Story context from other pages:
${otherPages || "No other pages."}

${previousPage ? `Previous page (${previousPage.pageNumber}): ${previousPage.panels.map((panel) => panel.action).join("; ")}` : "This is the first page."}
${nextPage ? `Next page (${nextPage.pageNumber}): ${nextPage.panels.map((panel) => panel.action).join("; ")}` : "This is the last page."}

Return only a JSON object for the single regenerated page with pageNumber, layout, and panels array.`;
}

function parseGeneratedPage(text: string, expectedPageNumber: number): ComicPage {
  const parsed = parseJsonRobustly(text, "parseGeneratedPage");

  if (!isRecord(parsed)) {
    throw new ComicGenerationError(
      "Failed to parse regenerated page: expected a JSON object."
    );
  }

  const pageCandidate: unknown = isComicPage(parsed)
    ? parsed
    : isRecord(parsed) && isComicPage(parsed.page)
      ? parsed.page
      : null;

  if (!pageCandidate || !isComicPage(pageCandidate)) {
    throw new ComicGenerationError(
      "Failed to parse regenerated page: invalid page structure."
    );
  }

  return {
    ...pageCandidate,
    pageNumber: expectedPageNumber,
  };
}

export async function regeneratePage(
  input: RegeneratePageInput
): Promise<ComicPage> {
  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    console.error("[generateComic] ANTHROPIC_API_KEY is missing or empty", {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
    });
    throw new ComicGenerationError(
      "ANTHROPIC_API_KEY is not configured. Add it in your environment variables."
    );
  }

  if (!input.comic?.pages?.length) {
    throw new ComicGenerationError("Comic must have existing pages.");
  }

  const pageExists = input.comic.pages.some(
    (page) => page.pageNumber === input.pageNumber
  );

  if (!pageExists) {
    throw new ComicGenerationError(
      `Page ${input.pageNumber} not found in comic.`
    );
  }

  const client = new Anthropic({ apiKey });

  let response;

  try {
    response = await client.messages.create({
      model: COMIC_MODEL,
      max_tokens: 4096,
      system: `${SYSTEM_PROMPT}\n\nYou are regenerating a SINGLE page only. Return one page object with pageNumber, layout, and panels.`,
      messages: [
        {
          role: "user",
          content: buildRegeneratePageUserPrompt(input),
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Anthropic API request failed.";
    console.error("[generateComic] Anthropic page regeneration failed", {
      message,
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
    });
    throw new ComicGenerationError(message);
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    console.error("[generateComic] No text block in page regeneration response", {
      contentTypes: response.content.map((block) => block.type),
      stopReason: response.stop_reason,
    });
    throw new ComicGenerationError("No text response received from Claude.");
  }

  return parseGeneratedPage(textBlock.text, input.pageNumber);
}
