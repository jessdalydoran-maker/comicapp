import { NextResponse } from "next/server";

import {
  ComicGenerationError,
  regeneratePage,
} from "@/lib/generateComic";
import type { Character, GeneratedComic } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { comicData, pageNumber, genre, synopsis, characters } = body as {
      comicData: GeneratedComic;
      pageNumber: number;
      genre: string;
      synopsis: string;
      characters: Character[];
    };

    if (!comicData || typeof pageNumber !== "number") {
      return NextResponse.json(
        { error: "comicData and pageNumber are required." },
        { status: 400 }
      );
    }

    const page = await regeneratePage({
      comic: comicData,
      pageNumber,
      genre: genre ?? "",
      synopsis: synopsis ?? "",
      characters: characters ?? [],
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof ComicGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to regenerate page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
