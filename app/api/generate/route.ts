import { NextResponse } from "next/server";

import {
  ComicGenerationError,
  generateComic,
  generateComicQuickCreate,
} from "@/lib/generateComic";
import type { Character } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.quickCreate === true) {
      const { story, genre, pageCount, imageFilenames } = body as {
        story: string;
        genre: string;
        pageCount?: number;
        imageFilenames?: string[];
      };

      if (!story?.trim() || !genre?.trim()) {
        return NextResponse.json(
          { error: "story and genre are required for quick create." },
          { status: 400 }
        );
      }

      const result = await generateComicQuickCreate({
        story: story.trim(),
        genre: genre.trim(),
        pageCount,
        imageFilenames: imageFilenames ?? [],
      });

      return NextResponse.json({
        comicData: result.comicData,
        characters: result.characters,
      });
    }

    const { title, genre, synopsis, characters, pageCount } = body as {
      title: string;
      genre: string;
      synopsis: string;
      characters: Character[];
      pageCount?: number;
    };

    if (!title?.trim() || !genre?.trim() || !synopsis?.trim()) {
      return NextResponse.json(
        { error: "title, genre, and synopsis are required." },
        { status: 400 }
      );
    }

    const comicData = await generateComic({
      title: title.trim(),
      genre: genre.trim(),
      synopsis: synopsis.trim(),
      characters: characters ?? [],
      pageCount,
    });

    return NextResponse.json({ comicData });
  } catch (error) {
    if (error instanceof ComicGenerationError) {
      console.error("[/api/generate]", error.message);
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate comic.";
    console.error("[/api/generate] Unexpected error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
