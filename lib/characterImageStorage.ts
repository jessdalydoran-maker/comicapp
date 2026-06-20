import type { Character, PreviewState } from "./types";
import type { CreateFormCharacter } from "./createForm";

const CHARACTER_IMAGE_PREFIX = "character-image-";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getCharacterImageStorageKey(name: string): string {
  return `${CHARACTER_IMAGE_PREFIX}${name.trim()}`;
}

export function getFormCharacterImageKey(
  name: string,
  storageId: string
): string {
  const trimmed = name.trim();
  if (trimmed) {
    return getCharacterImageStorageKey(trimmed);
  }

  return `${CHARACTER_IMAGE_PREFIX}${storageId}`;
}

async function storeImageAtKey(key: string, imageData: string): Promise<void> {
  try {
    sessionStorage.setItem(key, imageData);
    return;
  } catch (error) {
    console.warn("[characterImageStorage] sessionStorage quota exceeded, compressing", {
      key,
      error: error instanceof Error ? error.message : error,
    });
  }

  const compressed = await compressImageDataUrl(imageData);

  try {
    sessionStorage.setItem(key, compressed);
  } catch (error) {
    throw new Error(
      `Failed to store image even after compression.${
        error instanceof Error ? ` ${error.message}` : ""
      }`
    );
  }
}

export function getFormCharacterImage(
  name: string,
  storageId: string
): string | null {
  if (!isClient()) {
    return null;
  }

  return sessionStorage.getItem(getFormCharacterImageKey(name, storageId));
}

export async function storeFormCharacterImage(
  name: string,
  storageId: string,
  imageData: string
): Promise<void> {
  if (!isClient() || !imageData) {
    return;
  }

  await storeImageAtKey(getFormCharacterImageKey(name, storageId), imageData);
}

export function migrateFormCharacterImageStorage(
  oldName: string,
  newName: string,
  storageId: string
): void {
  if (!isClient()) {
    return;
  }

  const oldKey = getFormCharacterImageKey(oldName, storageId);
  const newKey = getFormCharacterImageKey(newName, storageId);

  if (oldKey === newKey) {
    return;
  }

  const imageData = sessionStorage.getItem(oldKey);
  if (imageData) {
    sessionStorage.setItem(newKey, imageData);
    sessionStorage.removeItem(oldKey);
  }
}

export function removeFormCharacterImageStorage(
  name: string,
  storageId: string
): void {
  if (!isClient()) {
    return;
  }

  sessionStorage.removeItem(getFormCharacterImageKey(name, storageId));
}

export function hydrateCreateFormCharacters(
  characters: CreateFormCharacter[]
): CreateFormCharacter[] {
  return characters.map((character) => ({
    ...character,
    imageBase64:
      getFormCharacterImage(character.name, character.storageId) ?? "",
  }));
}

export function isImageDataUrl(value: string): boolean {
  return value.startsWith("data:") || value.startsWith("http");
}

export function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is not supported in this browser."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => {
      reject(new Error("Failed to load image for compression."));
    };
    image.src = dataUrl;
  });
}

export function getCharacterImage(name: string): string | null {
  if (!isClient() || !name.trim()) {
    return null;
  }

  return sessionStorage.getItem(getCharacterImageStorageKey(name));
}

export function resolveCharacterImage(referenceOrData: string): string | null {
  if (!referenceOrData) {
    return null;
  }

  if (isImageDataUrl(referenceOrData)) {
    return referenceOrData;
  }

  return getCharacterImage(referenceOrData);
}

export async function storeCharacterImage(
  name: string,
  imageData: string
): Promise<void> {
  if (!isClient() || !name.trim() || !imageData) {
    return;
  }

  await storeImageAtKey(getCharacterImageStorageKey(name), imageData);
}

export async function storeCharacterImagesFromForm(
  characters: Character[]
): Promise<Record<string, string>> {
  const refs: Record<string, string> = {};

  for (const character of characters) {
    const name = character.name.trim();
    if (!name || !character.imageBase64) {
      continue;
    }

    if (isImageDataUrl(character.imageBase64)) {
      await storeCharacterImage(name, character.imageBase64);
    }

    refs[name] = name;
  }

  return refs;
}

export function resolveCharacterImages(
  refs: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [displayName, reference] of Object.entries(refs)) {
    const image =
      resolveCharacterImage(reference) ?? getCharacterImage(displayName);
    if (image) {
      resolved[displayName] = image;
    }
  }

  return resolved;
}

export function resolveFormCharacters(characters: Character[]): Character[] {
  return characters.map((character) => ({
    ...character,
    imageBase64:
      resolveCharacterImage(character.imageBase64) ??
      getCharacterImage(character.name) ??
      "",
  }));
}

export function stripCharacterImagesForStorage(
  state: PreviewState
): PreviewState {
  const characterImageRefs = Object.fromEntries(
    state.formCharacters
      .filter((character) => character.name.trim())
      .map((character) => [character.name.trim(), character.name.trim()])
  );

  return {
    ...state,
    characterImages: characterImageRefs,
    formCharacters: state.formCharacters.map((character) => ({
      ...character,
      imageBase64: character.name.trim(),
    })),
  };
}

export async function compressCharacterImages(
  images: Record<string, string>
): Promise<Record<string, string>> {
  const compressed: Record<string, string> = {};

  for (const [name, imageData] of Object.entries(images)) {
    if (!imageData) {
      continue;
    }

    compressed[name] = isImageDataUrl(imageData)
      ? await compressImageDataUrl(imageData)
      : imageData;
  }

  return compressed;
}

export function hydratePreviewState(state: PreviewState): PreviewState {
  return {
    ...state,
    characterImages: resolveCharacterImages(state.characterImages),
    formCharacters: resolveFormCharacters(state.formCharacters),
  };
}
