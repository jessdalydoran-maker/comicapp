export type CharacterRole = "hero" | "villain" | "sidekick";

export interface Character {
  name: string;
  role: CharacterRole;
  powers: string;
  personality: string;
  imageBase64: string;
}

export type DialogueType = "speech" | "thought" | "narration";

export interface DialogueLine {
  character: string;
  type: DialogueType;
  text: string;
}

export type PanelSize = "large" | "medium" | "small";

export type PageLayout =
  | "splash"
  | "two-panel"
  | "three-panel"
  | "four-panel"
  | "five-panel";

export interface Panel {
  panelNumber: number;
  size: PanelSize;
  setting: string;
  action: string;
  mood: string;
  characters: string[];
  dialogue: DialogueLine[];
  sfx: string | null;
  caption: string | null;
}

export interface ComicPage {
  pageNumber: number;
  layout: PageLayout;
  panels: Panel[];
}

export interface GeneratedComic {
  title: string;
  tagline: string;
  pages: ComicPage[];
}

export interface PreviewState {
  genre: string;
  synopsis: string;
  pageCount: number;
  price: string;
  comicData: GeneratedComic;
  /** Character name -> sessionStorage reference key (same as name). */
  characterImages: Record<string, string>;
  formCharacters: Character[];
}

export interface PublishedComic {
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
}

export interface PurchaseRecord {
  id: string;
  comicId: string;
  purchasedAt: string;
}
