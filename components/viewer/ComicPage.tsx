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

function getPanelClass(layout: ComicPageType["layout"], index: number): string {
  switch (layout) {
    case "splash":
      return "col-span-1 row-span-1 h-full";
    case "two-panel":
      return "h-full min-h-0";
    case "three-panel":
      return index === 0 ? "col-span-2 row-span-1 min-h-0" : "min-h-0";
    case "four-panel":
      return "min-h-0";
    case "five-panel":
      return index === 0 ? "col-span-3 row-span-1 min-h-0" : "min-h-0";
    default:
      return "min-h-0";
  }
}

function getLayoutGridClass(layout: ComicPageType["layout"]): string {
  switch (layout) {
    case "splash":
      return "grid h-full grid-cols-1 grid-rows-1";
    case "two-panel":
      return "flex h-full min-h-0 flex-col gap-2";
    case "three-panel":
      return "grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2";
    case "four-panel":
      return "grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2";
    case "five-panel":
      return "grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-2";
    default:
      return "grid h-full grid-cols-2 grid-rows-2 gap-2";
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
    <div className="comic-page flex h-full w-full flex-col bg-comic-cream p-2 text-black">
      <div className={cn("min-h-0 flex-1", gridClass)}>
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
    </div>
  );
}
