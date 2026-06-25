"use client";

import type { ComicPage as ComicPageType, Panel } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ComicPanel } from "./ComicPanel";

interface ComicPageProps {
  page: ComicPageType;
  characterImages: Record<string, string>;
  characterNames: string[];
  onEditPanel?: (panel: Panel) => void;
}

function getLayoutGridClass(layout: ComicPageType["layout"]): string {
  switch (layout) {
    case "splash":
      return "grid h-full min-h-0 grid-cols-1 grid-rows-1 gap-1";
    case "two-panel":
      return "grid h-full min-h-0 grid-cols-1 grid-rows-2 gap-1";
    case "three-panel":
      return "grid h-full min-h-0 grid-cols-2 gap-1 [grid-template-rows:3fr_2fr]";
    case "four-panel":
      return "grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-1";
    case "five-panel":
      return "grid h-full min-h-0 grid-cols-3 gap-1 [grid-template-rows:2fr_3fr]";
    case "six-panel":
      return "grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-1";
    default:
      return "grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-1";
  }
}

function getPanelClass(layout: ComicPageType["layout"], index: number): string {
  switch (layout) {
    case "splash":
      return "col-span-1 row-span-1";
    case "two-panel":
      return "min-h-0";
    case "three-panel":
      return index === 0 ? "col-span-2 min-h-0" : "min-h-0";
    case "four-panel":
      return "min-h-0";
    case "five-panel":
      return index === 0 ? "col-span-3 min-h-0" : "min-h-0";
    case "six-panel":
      return "min-h-0";
    default:
      return "min-h-0";
  }
}

export function ComicPage({
  page,
  characterImages,
  characterNames,
  onEditPanel,
}: ComicPageProps) {
  const gridClass = getLayoutGridClass(page.layout);

  return (
    <div className="comic-page relative flex h-full w-full flex-col border-2 border-black bg-[#FFFDF5] p-1.5 text-black">
      <div className="comic-page-halftone pointer-events-none absolute inset-0" aria-hidden />
      <div className={cn("relative min-h-0 flex-1", gridClass)}>
        {page.panels.map((panel, index) => (
          <ComicPanel
            key={panel.panelNumber}
            panel={panel}
            characterImages={characterImages}
            characterNames={characterNames}
            onEdit={onEditPanel ? () => onEditPanel(panel) : undefined}
            className={getPanelClass(page.layout, index)}
          />
        ))}
      </div>
      <p className="relative z-10 mt-1 text-center font-bangers text-sm tracking-widest text-black">
        {page.pageNumber}
      </p>
    </div>
  );
}
