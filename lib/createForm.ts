import type { Character, CharacterRole } from "./types";
import { PAGE_COUNTS, type PageCount } from "./pricing";

export const GENRES = [
  "Action",
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Comedy",
  "Drama",
  "Mystery",
] as const;

export const MAX_CHARACTERS = 8;

export const CHARACTER_ROLES: CharacterRole[] = ["hero", "villain", "sidekick"];

export const LOADING_MESSAGES = [
  "Drawing your world...",
  "Inking the panels...",
  "Adding speech bubbles...",
  "Coloring the action...",
  "Lettering the dialogue...",
  "Putting it all together...",
] as const;

export type Genre = (typeof GENRES)[number];

export interface CreateFormData {
  title: string;
  genre: Genre | "";
  synopsis: string;
  pageCount: PageCount;
  characters: Character[];
}

export const initialFormData: CreateFormData = {
  title: "",
  genre: "",
  synopsis: "",
  pageCount: 8,
  characters: [],
};

export function createEmptyCharacter(): Character {
  return {
    name: "",
    role: "hero",
    powers: "",
    personality: "",
    imageBase64: "",
  };
}

export { PAGE_COUNTS };
