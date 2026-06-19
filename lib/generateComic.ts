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
- characters array lists which named characters appear visually in each panel.`;

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

Return only the JSON object.`;
}

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : trimmed;
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
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonPayload(text));
  } catch {
    throw new ComicGenerationError(
      "Failed to parse comic layout: response was not valid JSON."
    );
  }

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

export async function generateComic(
  input: GenerateComicInput
): Promise<GeneratedComic> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ComicGenerationError("ANTHROPIC_API_KEY is not configured.");
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

  let response;

  try {
    response = await client.messages.create({
      model: COMIC_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(input),
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Anthropic API request failed.";
    throw new ComicGenerationError(message);
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new ComicGenerationError("No text response received from Claude.");
  }

  return parseGeneratedComic(textBlock.text);
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
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonPayload(text));
  } catch {
    throw new ComicGenerationError(
      "Failed to parse regenerated page: response was not valid JSON."
    );
  }

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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new ComicGenerationError("ANTHROPIC_API_KEY is not configured.");
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
    throw new ComicGenerationError(message);
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new ComicGenerationError("No text response received from Claude.");
  }

  return parseGeneratedPage(textBlock.text, input.pageNumber);
}
