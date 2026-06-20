import { NextResponse } from "next/server";

import {
  ComicGenerationError,
  generateComic,
} from "@/lib/generateComic";
import type { Character } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
