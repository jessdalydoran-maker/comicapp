import { parseComicJsonResponse } from "../lib/generateComic";

const sample = JSON.stringify({
  title: "Night Watch",
  tagline: "The city never sleeps",
  pages: [
    {
      pageNumber: 1,
      layout: "two panel",
      panels: [
        {
          panelNumber: 1,
          size: "big",
          setting: "Rooftop",
          action: "Hero looks out",
          mood: "tense",
          characters: ["Alex"],
          dialogue: [
            {
              character: "Alex",
              type: "inner",
              text: "Tonight changes everything.",
            },
          ],
          sfx: undefined,
          caption: "",
        },
        {
          panelNumber: 2,
          setting: "Alley",
          action: "Villain emerges",
          mood: "dark",
          characters: ["Rex"],
          dialogue: [],
        },
      ],
    },
  ],
});

const comic = parseComicJsonResponse(sample);
console.log("parse ok:", comic.title, "pages:", comic.pages.length);
console.log(
  "normalized layout:",
  comic.pages[0].layout,
  "sfx:",
  comic.pages[0].panels[0].sfx
);
