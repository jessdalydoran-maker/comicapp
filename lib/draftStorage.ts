import type { CreateFormData } from "./createForm";
import { hydrateCreateFormCharacters } from "./characterImageStorage";
import type { CharacterRole } from "./types";

const DRAFT_KEY = "comic-forge-create-draft";

export interface CreateDraftCharacter {
  storageId: string;
  name: string;
  role: CharacterRole;
  powers: string;
  personality: string;
}

export interface CreateDraft {
  savedAt: string;
  title: string;
  genre: CreateFormData["genre"];
  synopsis: string;
  pageCount: CreateFormData["pageCount"];
  characters: CreateDraftCharacter[];
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function hasCreateDraft(): boolean {
  return getCreateDraft() != null;
}

export function getCreateDraft(): CreateDraft | null {
  if (!isClient()) return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateDraft;
  } catch {
    return null;
  }
}

export function saveCreateDraft(formData: CreateFormData): void {
  if (!isClient()) return;

  const draft: CreateDraft = {
    savedAt: new Date().toISOString(),
    title: formData.title,
    genre: formData.genre,
    synopsis: formData.synopsis,
    pageCount: formData.pageCount,
    characters: formData.characters.map(
      ({ storageId, name, role, powers, personality }) => ({
        storageId,
        name,
        role,
        powers,
        personality,
      })
    ),
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadCreateDraftFormData(): CreateFormData {
  const draft = getCreateDraft();
  if (!draft) {
    throw new Error("No saved draft found.");
  }

  const characters = hydrateCreateFormCharacters(
    draft.characters.map((character) => ({
      storageId: character.storageId,
      name: character.name,
      role: character.role,
      powers: character.powers,
      personality: character.personality,
      imageBase64: "",
    }))
  );

  return {
    title: draft.title,
    genre: draft.genre,
    synopsis: draft.synopsis,
    pageCount: draft.pageCount,
    characters,
  };
}

export function clearCreateDraft(): void {
  if (!isClient()) return;
  localStorage.removeItem(DRAFT_KEY);
}
