import {
  getPublishedSavedComics,
  getSavedComicById,
} from "./comicStorage";
import type { PublishedComic, SavedComic } from "./types";

export { generateComicId } from "./comicStorage";

function toPublishedComic(comic: SavedComic): PublishedComic {
  return {
    id: comic.id,
    title: comic.title,
    tagline: comic.tagline,
    genre: comic.genre,
    pages: comic.pageCount,
    price: comic.price,
    publishedAt: comic.updatedAt,
    coverImage: comic.coverImage,
    comicData: comic.comicData,
    characterImages: comic.characterImages,
  };
}

export function getPublishedComics(): PublishedComic[] {
  return getPublishedSavedComics().map(toPublishedComic);
}

export function getPublishedComicById(id: string): PublishedComic | undefined {
  const comic = getSavedComicById(id);
  if (!comic || comic.status !== "published") return undefined;
  return toPublishedComic(comic);
}

/** @deprecated Use publishSavedComic from comicStorage instead */
export function savePublishedComic(comic: PublishedComic): void {
  // Kept for backward compatibility — publishing now goes through comicStorage
  void comic;
}
