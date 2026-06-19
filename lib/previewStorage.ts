import type { PreviewState } from "./types";

const PREVIEW_KEY = "comic-forge-preview";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function savePreviewState(state: PreviewState): void {
  if (!isClient()) return;
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
}

export function getPreviewState(): PreviewState | null {
  if (!isClient()) return null;

  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreviewState;
  } catch {
    return null;
  }
}

export function updatePreviewComic(
  comicData: PreviewState["comicData"]
): void {
  const current = getPreviewState();
  if (!current) return;
  savePreviewState({ ...current, comicData });
}
