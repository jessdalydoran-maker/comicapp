import { compressCharacterImages } from "./characterImageStorage";
import { getPriceForPages } from "./pricing";
import type { Character, GeneratedComic, SavedComic } from "./types";

const STORAGE_KEY = "comic-forge-comics";
const LEGACY_SHOP_KEY = "comic-forge-published-comics";

function isClient(): boolean {
  return typeof window !== "undefined";
}

function migrateLegacyPublishedComics(): void {
  if (!isClient()) return;

  try {
    const raw = localStorage.getItem(LEGACY_SHOP_KEY);
    if (!raw) return;

    const legacy = JSON.parse(raw) as Array<{
      id: string;
      title: string;
      tagline: string;
      genre: string;
      pages: number;
      price: string;
      publishedAt: string;
      coverImage: string;
      comicData: GeneratedComic;
      characterImages: Record<string, string>;
    }>;

    if (!Array.isArray(legacy) || legacy.length === 0) return;

    const existing = getSavedComicsRaw();
    const existingIds = new Set(existing.map((comic) => comic.id));

    for (const item of legacy) {
      if (existingIds.has(item.id)) continue;

      existing.push({
        id: item.id,
        title: item.title,
        tagline: item.tagline,
        genre: item.genre,
        pageCount: item.pages,
        price: item.price,
        status: "published",
        createdAt: item.publishedAt,
        updatedAt: item.publishedAt,
        coverImage: item.coverImage,
        comicData: item.comicData,
        characterImages: item.characterImages,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore migration errors
  }
}

function getSavedComicsRaw(): SavedComic[] {
  if (!isClient()) return [];

  migrateLegacyPublishedComics();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedComic[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistComics(comics: SavedComic[]): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comics));
}

export function getSavedComics(): SavedComic[] {
  return getSavedComicsRaw().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSavedComicById(id: string): SavedComic | undefined {
  return getSavedComicsRaw().find((comic) => comic.id === id);
}

export function getPublishedSavedComics(): SavedComic[] {
  return getSavedComics().filter((comic) => comic.status === "published");
}

export function generateComicId(): string {
  return crypto.randomUUID();
}

export interface CreateSavedComicInput {
  title: string;
  tagline: string;
  genre: string;
  pageCount: number;
  comicData: GeneratedComic;
  characterImages: Record<string, string>;
  coverImage?: string;
  synopsis?: string;
  formCharacters?: Character[];
  status?: SavedComic["status"];
}

export async function createSavedComic(
  input: CreateSavedComicInput
): Promise<SavedComic> {
  const compressedImages = await compressCharacterImages(input.characterImages);
  const coverImage =
    input.coverImage ?? Object.values(compressedImages)[0] ?? "";
  const now = new Date().toISOString();

  const comic: SavedComic = {
    id: generateComicId(),
    title: input.title,
    tagline: input.tagline,
    genre: input.genre,
    pageCount: input.pageCount,
    price: getPriceForPages(input.pageCount),
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    coverImage,
    comicData: input.comicData,
    characterImages: compressedImages,
    synopsis: input.synopsis,
    formCharacters: input.formCharacters,
  };

  const comics = getSavedComicsRaw();
  persistComics([comic, ...comics]);

  return comic;
}

export function updateSavedComic(
  id: string,
  updates: Partial<Omit<SavedComic, "id" | "createdAt">>
): SavedComic | undefined {
  const comics = getSavedComicsRaw();
  const index = comics.findIndex((comic) => comic.id === id);
  if (index < 0) return undefined;

  const updated: SavedComic = {
    ...comics[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  comics[index] = updated;
  persistComics(comics);

  return updated;
}

export async function updateSavedComicData(
  id: string,
  comicData: GeneratedComic
): Promise<SavedComic | undefined> {
  return updateSavedComic(id, { comicData });
}

export function publishSavedComic(id: string): SavedComic | undefined {
  return updateSavedComic(id, { status: "published" });
}

export function unpublishSavedComic(id: string): SavedComic | undefined {
  return updateSavedComic(id, { status: "draft" });
}

export function deleteSavedComic(id: string): boolean {
  const comics = getSavedComicsRaw();
  const next = comics.filter((comic) => comic.id !== id);
  if (next.length === comics.length) return false;
  persistComics(next);
  return true;
}
