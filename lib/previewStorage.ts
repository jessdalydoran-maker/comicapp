import {
  storeCharacterImagesFromForm,
  stripCharacterImagesForStorage,
} from "./characterImageStorage";
import type { PreviewState } from "./types";

const PREVIEW_KEY = "comic-forge-preview";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export async function savePreviewState(state: PreviewState): Promise<void> {
  if (!isClient()) return;

  const characterImageRefs = await storeCharacterImagesFromForm(
    state.formCharacters
  );

  const leanState = stripCharacterImagesForStorage({
    ...state,
    characterImages: characterImageRefs,
  });

  localStorage.setItem(PREVIEW_KEY, JSON.stringify(leanState));
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

export async function updatePreviewComic(
  comicData: PreviewState["comicData"]
): Promise<void> {
  const current = getPreviewState();
  if (!current) return;
  await savePreviewState({ ...current, comicData });
}
