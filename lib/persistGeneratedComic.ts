import {
  compressCharacterImages,
  storeCharacterImage,
} from "./characterImageStorage";
import { createSavedComic } from "./comicStorage";
import { getPriceForPages } from "./pricing";
import { savePreviewState } from "./previewStorage";
import type { Character, GeneratedComic } from "./types";

export interface PersistGeneratedComicInput {
  comicData: GeneratedComic;
  genre: string;
  pageCount: number;
  synopsis: string;
  formCharacters: Character[];
  characterImages: Record<string, string>;
}

export interface PersistGeneratedComicResult {
  comicId?: string;
  saveWarning?: string;
}

export async function storeFormCharacterImages(
  characters: Character[]
): Promise<void> {
  for (const character of characters) {
    if (character.name && character.imageBase64) {
      await storeCharacterImage(character.name, character.imageBase64);
    }
  }
}

export async function persistGeneratedComic(
  input: PersistGeneratedComicInput
): Promise<PersistGeneratedComicResult> {
  let comicId: string | undefined;
  let saveWarning: string | undefined;

  try {
    const compressedImages = await compressCharacterImages(
      input.characterImages
    );

    const savedComic = await createSavedComic({
      title: input.comicData.title,
      tagline: input.comicData.tagline,
      genre: input.genre,
      pageCount: input.pageCount,
      comicData: input.comicData,
      characterImages: compressedImages,
      synopsis: input.synopsis,
      formCharacters: input.formCharacters,
      status: "draft",
    });

    comicId = savedComic.id;
  } catch (error) {
    console.warn("[persistGeneratedComic] Failed to save comic to library", error);
    saveWarning =
      "Comic generated, but could not save to My Comics (browser storage may be full).";
  }

  try {
    await savePreviewState({
      comicId,
      genre: input.genre,
      synopsis: input.synopsis,
      pageCount: input.pageCount,
      price: getPriceForPages(input.pageCount),
      comicData: input.comicData,
      characterImages: Object.fromEntries(
        input.formCharacters
          .filter((character) => character.name && character.imageBase64)
          .map((character) => [character.name, character.name])
      ),
      formCharacters: input.formCharacters,
    });
  } catch (error) {
    console.warn("[persistGeneratedComic] Failed to save preview state", error);
    throw new Error(
      "Comic generated but preview could not be saved. Try clearing browser storage and retry."
    );
  }

  return { comicId, saveWarning };
}
