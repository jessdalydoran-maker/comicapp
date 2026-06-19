import type { PublishedComic } from "./types";

const STORAGE_KEY = "comic-forge-published-comics";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getPublishedComics(): PublishedComic[] {
  if (!isClient()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PublishedComic[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPublishedComicById(id: string): PublishedComic | undefined {
  return getPublishedComics().find((comic) => comic.id === id);
}

export function savePublishedComic(comic: PublishedComic): void {
  if (!isClient()) return;

  const comics = getPublishedComics();
  const existingIndex = comics.findIndex((item) => item.id === comic.id);
  const next =
    existingIndex >= 0
      ? comics.map((item, index) => (index === existingIndex ? comic : item))
      : [comic, ...comics];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function generateComicId(): string {
  return crypto.randomUUID();
}
