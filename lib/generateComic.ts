import Anthropic from "@anthropic-ai/sdk";

import type { Character, ComicPage, DialogueType, GeneratedComic, PageLayout, Panel } from "./types";

export interface GenerateComicInput {
  title: string;
  genre: string;
  synopsis: string;
  characters: Character[];
  pageCount?: number;
}

export interface QuickCreateGenerateInput {
  story: string;
  genre: string;
  pageCount?: number;
  imageFilenames?: string[];
}

export interface QuickCreateGenerateResult {
  comicData: GeneratedComic;
  characters: Character[];
}

const COMIC_MODEL = "claude-sonnet-4-6";
const COMIC_GENERATION_MAX_TOKENS = 8192;
const MIN_COMIC_PAGE_COUNT = 2;

const SYSTEM_PROMPT = `You are a professional comic book writer with 20 years experience writing for Marvel and DC. You write cinematic, emotionally gripping comics with sharp dialogue, real character voice, and dynamic action sequences.

RULES YOU MUST FOLLOW:
- Every character must speak in their own distinct voice based on their personality
- Dialogue must be punchy, natural and never generic
- Every panel must have a clear visual purpose - establish, action, reaction, or reveal
- Use varied panel layouts - splash pages for big moments, tight panels for tension, wide panels for action
- Include proper comic techniques: cliffhangers between pages, visual callbacks, dramatic irony
- SFX words must be creative and specific to the action (not just BOOM or POW)
- Caption boxes should read like a narrator with personality
- Each page must end on a reason to turn to the next page
- The story must have proper three act structure
- Action sequences must be broken into clear beat-by-beat panels
- Emotional moments need breathing room - don't rush them
- NEVER use clichéd superhero dialogue
- Make it feel like a real published comic someone would pay for

Return strict JSON in this format:
{
  "title": string,
  "tagline": string,
  "pages": [
    {
      "pageNumber": number,
      "layout": "splash" | "two-panel" | "three-panel" | "four-panel" | "five-panel" | "six-panel",
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
- Vary page layouts across the comic (splash, two-panel, three-panel, four-panel, five-panel, six-panel).
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

const QUICK_CREATE_INTERPRETATION_PROMPT = `${SYSTEM_PROMPT}

QUICK CREATE MODE — ADDITIONAL INSTRUCTIONS:

The user has provided a free-text story description instead of structured fields. Before writing the comic, you must:

1. READ the story input and extract:
   - Character names (look for capitalised names or names described as heroes/villains)
   - Each character's role (hero/villain/sidekick) based on context
   - Each character's powers based on descriptions
   - Each character's personality based on how they are described
   - The plot structure (beginning, conflict, resolution)
   - The genre/tone from context clues

2. EXPAND intelligently on what's provided:
   - If powers are mentioned briefly, expand them into vivid comic-ready descriptions
   - If personality isn't described, infer it from the character's role and powers
   - Fill in scene details, locations, and atmosphere
   - Add sub-plots and character moments that fit naturally
   - Make the story bigger and more cinematic than the input

3. CHARACTER IMAGE MATCHING (for reference — images are assigned client-side):
   - Uploaded images are listed in order; match characters by order of first mention in the story
   - If an image filename contains a character name, that image belongs to that character
   - List characters in your "characters" array in order of first mention in the story

Your JSON response MUST include a top-level "characters" array BEFORE "pages":
{
  "title": string,
  "tagline": string,
  "characters": [
    {
      "name": string,
      "role": "hero" | "villain" | "sidekick",
      "powers": string,
      "personality": string
    }
  ],
  "pages": [ ... same page structure as above ... ]
}

The "characters" array is required in quick create mode. Use the same character names consistently in panel "characters" arrays and dialogue.`;

function sanitizeApiCharacters(characters: Character[]): Character[] {
  return characters.map(({ name, role, powers, personality }) => ({
    name,
    role,
    powers,
    personality,
    imageBase64: "",
  }));
}

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

function normalizeDialogueType(value: unknown): DialogueType {
  if (value === "thought" || value === "narration" || value === "speech") {
    return value;
  }
  return "speech";
}

function normalizePanelSize(value: unknown): Panel["size"] {
  if (value === "large" || value === "medium" || value === "small") {
    return value;
  }
  return "medium";
}

function normalizeLayout(value: unknown): PageLayout {
  if (typeof value !== "string") {
    return "four-panel";
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (VALID_LAYOUTS.has(normalized)) {
    return normalized as PageLayout;
  }

  return "four-panel";
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(value);
}

function normalizeComicPayload(parsed: unknown): unknown {
  if (!isRecord(parsed) || !Array.isArray(parsed.pages)) {
    return parsed;
  }

  return {
    ...parsed,
    title: typeof parsed.title === "string" ? parsed.title.trim() : parsed.title,
    tagline:
      typeof parsed.tagline === "string" ? parsed.tagline.trim() : parsed.tagline,
    pages: parsed.pages.map((page, pageIndex) => {
      if (!isRecord(page) || !Array.isArray(page.panels)) {
        return page;
      }

      return {
        ...page,
        pageNumber:
          typeof page.pageNumber === "number" ? page.pageNumber : pageIndex + 1,
        layout: normalizeLayout(page.layout),
        panels: page.panels.map((panel, panelIndex) => {
          if (!isRecord(panel)) {
            return panel;
          }

          const dialogue = Array.isArray(panel.dialogue)
            ? panel.dialogue
                .filter(isRecord)
                .map((line) => ({
                  character:
                    typeof line.character === "string" ? line.character.trim() : "",
                  type: normalizeDialogueType(line.type),
                  text: typeof line.text === "string" ? line.text.trim() : "",
                }))
                .filter((line) => line.character && line.text)
            : [];

          const characters = Array.isArray(panel.characters)
            ? panel.characters
                .filter((item): item is string => typeof item === "string")
                .map((name) => name.trim())
                .filter(Boolean)
            : [];

          return {
            ...panel,
            panelNumber:
              typeof panel.panelNumber === "number"
                ? panel.panelNumber
                : panelIndex + 1,
            size: normalizePanelSize(panel.size),
            setting:
              typeof panel.setting === "string" ? panel.setting.trim() : "",
            action: typeof panel.action === "string" ? panel.action.trim() : "",
            mood: typeof panel.mood === "string" ? panel.mood.trim() : "",
            characters,
            dialogue,
            sfx: normalizeNullableString(panel.sfx),
            caption: normalizeNullableString(panel.caption),
          };
        }),
      };
    }),
  };
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
  "six-panel",
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
  const raw = parseJsonRobustly(text, "parseGeneratedComic");
  const parsed = normalizeComicPayload(raw);

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

function isExtractedCharacter(
  value: unknown
): value is Omit<Character, "imageBase64"> {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    value.name.trim() !== "" &&
    (value.role === "hero" ||
      value.role === "villain" ||
      value.role === "sidekick" ||
      value.role === undefined)
  );
}

function toExtractedCharacter(
  value: Omit<Character, "imageBase64"> | Record<string, unknown>
): Character {
  const role =
    value.role === "hero" ||
    value.role === "villain" ||
    value.role === "sidekick"
      ? value.role
      : "hero";

  return {
    name: String(value.name).trim(),
    role,
    powers:
      typeof value.powers === "string" && value.powers.trim()
        ? value.powers.trim()
        : "Unspecified powers",
    personality:
      typeof value.personality === "string" && value.personality.trim()
        ? value.personality.trim()
        : "Determined",
    imageBase64: "",
  };
}

function parseQuickCreateResponse(text: string): QuickCreateGenerateResult {
  const parsed = parseJsonRobustly(text, "parseQuickCreateResponse");

  if (!isRecord(parsed)) {
    throw new ComicGenerationError(
      "Failed to parse comic layout: expected a JSON object."
    );
  }

  const comicData = parseGeneratedComic(text);

  let characters: Character[] = [];

  if (Array.isArray(parsed.characters) && parsed.characters.length > 0) {
    characters = parsed.characters
      .filter(isExtractedCharacter)
      .map((character) => toExtractedCharacter(character));
  }

  if (characters.length === 0) {
    const names = new Set<string>();
    for (const page of comicData.pages) {
      for (const panel of page.panels) {
        for (const name of panel.characters) {
          if (name.trim()) names.add(name.trim());
        }
        for (const line of panel.dialogue) {
          if (line.character.trim()) names.add(line.character.trim());
        }
      }
    }
    characters = Array.from(names).map((name) => ({
      name,
      role: "hero" as const,
      powers: "Unknown",
      personality: "Determined",
      imageBase64: "",
    }));
  }

  return { comicData, characters };
}

/** @internal Used by parse smoke tests */
export function parseComicJsonResponse(text: string): GeneratedComic {
  return parseGeneratedComic(text);
}

function buildQuickCreateUserPrompt(input: QuickCreateGenerateInput): string {
  const pageCount = input.pageCount ?? 8;
  const imageList =
    input.imageFilenames && input.imageFilenames.length > 0
      ? input.imageFilenames
          .map((filename, index) => `${index + 1}. ${filename}`)
          .join("\n")
      : "No character images uploaded.";

  return `Create a ${pageCount}-page comic from this free-text story description.

Genre: ${input.genre}
Number of pages: ${pageCount}

Uploaded character images (in upload order):
${imageList}

STORY DESCRIPTION:
${input.story}

Extract all characters, expand the story cinematically, and return complete JSON with title, tagline, characters array, and exactly ${pageCount} pages.`;
}

async function requestQuickCreateFromAnthropic(
  client: Anthropic,
  input: QuickCreateGenerateInput,
  pageCount: number
): Promise<AnthropicComicResponse> {
  const response = await client.messages.create({
    model: COMIC_MODEL,
    max_tokens: COMIC_GENERATION_MAX_TOKENS,
    system: QUICK_CREATE_INTERPRETATION_PROMPT,
    messages: [
      {
        role: "user",
        content: buildQuickCreateUserPrompt({ ...input, pageCount }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new ComicGenerationError("No text response received from Claude.");
  }

  return {
    text: textBlock.text,
    stopReason: response.stop_reason,
  };
}

export async function generateComicQuickCreate(
  input: QuickCreateGenerateInput
): Promise<QuickCreateGenerateResult> {
  const apiKey = getAnthropicApiKey();

  if (!apiKey) {
    throw new ComicGenerationError(
      "ANTHROPIC_API_KEY is not configured. Add it in your environment variables."
    );
  }

  if (!input.story?.trim()) {
    throw new ComicGenerationError("Story description is required.");
  }

  if (!input.genre?.trim()) {
    throw new ComicGenerationError("Genre is required.");
  }

  const client = new Anthropic({ apiKey });
  const requestedPageCount = input.pageCount ?? 8;
  let attemptPageCount = requestedPageCount;
  let lastError: ComicGenerationError | undefined;

  while (attemptPageCount >= MIN_COMIC_PAGE_COUNT) {
    let response: AnthropicComicResponse;

    try {
      response = await requestQuickCreateFromAnthropic(
        client,
        input,
        attemptPageCount
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Anthropic API request failed.";
      throw new ComicGenerationError(message);
    }

    try {
      return parseQuickCreateResponse(response.text);
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
        attemptPageCount = Math.max(MIN_COMIC_PAGE_COUNT, attemptPageCount - 2);
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
  const sanitizedInput = {
    ...input,
    characters: sanitizeApiCharacters(input.characters),
  };

  while (attemptPageCount >= MIN_COMIC_PAGE_COUNT) {
    let response: AnthropicComicResponse;

    try {
      response = await requestComicFromAnthropic(
        client,
        sanitizedInput,
        attemptPageCount
      );
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
