import {
  compressCharacterImages,
  storeCharacterImage,
} from "./characterImageStorage";
import { createSavedComic } from "./comicStorage";
import { getPriceForPages } from "./pricing";
import { savePreviewState } from "./previewStorage";
import type { Character, GeneratedComic } from "./types";

export interface PersistAfterGenerateInput {
  comicData: GeneratedComic;
  genre: string;
  pageCount: number;
  synopsis: string;
  formCharacters: Character[];
  characterImages: Record<string, string>;
}

export async function persistAfterGenerate(
  input: PersistAfterGenerateInput
): Promise<{ comicId?: string; warning?: string }> {
  const {
    comicData,
    genre,
    pageCount,
    synopsis,
    formCharacters,
    characterImages,
  } = input;

  for (const character of formCharacters) {
    if (character.name && character.imageBase64) {
      try {
        await storeCharacterImage(character.name, character.imageBase64);
      } catch (error) {
        console.warn("[persistAfterGenerate] Failed to store character image", {
          name: character.name,
          error,
        });
      }
    }
  }

  let comicId: string | undefined;
  let compressedImages = characterImages;

  try {
    compressedImages = await compressCharacterImages(characterImages);
    const savedComic = await createSavedComic({
      title: comicData.title,
      tagline: comicData.tagline,
      genre,
      pageCount,
      comicData,
      characterImages: compressedImages,
      synopsis,
      formCharacters,
      status: "draft",
    });
    comicId = savedComic.id;
  } catch (error) {
    console.error("[persistAfterGenerate] Failed to save comic to library", error);
  }

  try {
    await savePreviewState({
      comicId,
      genre,
      synopsis,
      pageCount,
      price: getPriceForPages(pageCount),
      comicData,
      characterImages: Object.fromEntries(
        formCharacters
          .filter((character) => character.name && character.imageBase64)
          .map((character) => [character.name, character.name])
      ),
      formCharacters,
    });
  } catch (error) {
    console.error("[persistAfterGenerate] Failed to save preview state", error);
    throw new Error(
      "Comic generated but failed to save preview. Check browser storage space and try again."
    );
  }

  return {
    comicId,
    warning: comicId
      ? undefined
      : "Comic generated but could not be added to My Comics (storage may be full).",
  };
}
