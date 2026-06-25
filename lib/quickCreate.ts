import type { Character, CharacterRole } from "./types";

export interface QuickCreateImage {
  filename: string;
  base64: string;
}

function normalizeFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").toLowerCase().replace(/[_-]/g, " ");
}

export function matchImagesToCharacters(
  characters: Character[],
  images: QuickCreateImage[]
): Record<string, string> {
  const result: Record<string, string> = {};
  const assignedImages = new Set<number>();
  const unassignedCharacters = [...characters];

  for (let i = 0; i < images.length; i++) {
    const normalized = normalizeFilename(images[i].filename);

    for (let c = 0; c < unassignedCharacters.length; c++) {
      const name = unassignedCharacters[c].name.toLowerCase();
      if (name && normalized.includes(name)) {
        result[unassignedCharacters[c].name] = images[i].base64;
        assignedImages.add(i);
        unassignedCharacters.splice(c, 1);
        break;
      }
    }
  }

  let imageIndex = 0;
  for (const character of unassignedCharacters) {
    while (imageIndex < images.length && assignedImages.has(imageIndex)) {
      imageIndex++;
    }
    if (imageIndex < images.length) {
      result[character.name] = images[imageIndex].base64;
      assignedImages.add(imageIndex);
      imageIndex++;
    }
  }

  return result;
}

export function charactersWithImages(
  characters: Character[],
  imageMap: Record<string, string>
): Character[] {
  return characters.map((character) => ({
    ...character,
    imageBase64: imageMap[character.name] ?? "",
  }));
}

export function getCharacterCountMessage(length: number): string | null {
  if (length >= 500) return "Perfect amount of detail!";
  if (length >= 300) return "Getting detailed!";
  if (length >= 100) return "Good start!";
  return null;
}

export function isValidCharacterRole(value: unknown): value is CharacterRole {
  return value === "hero" || value === "villain" || value === "sidekick";
}
