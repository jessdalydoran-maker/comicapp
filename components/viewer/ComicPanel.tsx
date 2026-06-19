"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Panel } from "@/lib/types";

import { getBubbleSide, SfxText, SpeechBubble } from "./SpeechBubble";

interface ComicPanelProps {
  panel: Panel;
  characterImages: Record<string, string>;
  characterNames: string[];
  onEdit?: () => void;
  className?: string;
}

export function ComicPanel({
  panel,
  characterImages,
  characterNames,
  onEdit,
  className,
}: ComicPanelProps) {
  const panelCharacters = panel.characters.length
    ? panel.characters
    : characterNames.slice(0, 1);

  const narrationLines = panel.dialogue.filter(
    (line) => line.type === "narration"
  );
  const speechLines = panel.dialogue.filter(
    (line) => line.type !== "narration"
  );

  return (
    <div
      className={`comic-panel relative flex min-h-0 flex-col border-[3px] border-black bg-comic-cream ${className ?? ""}`}
    >
      {panel.caption && (
        <div className="border-b-[3px] border-black bg-comic-yellow px-2 py-1">
          <p className="font-comic-neue text-[8px] font-bold leading-tight text-black">
            {panel.caption}
          </p>
        </div>
      )}

      <div className="border-b-[3px] border-black bg-black px-1.5 py-0.5">
        <p className="truncate font-comic-neue text-[8px] font-bold uppercase tracking-wider text-comic-cream">
          {panel.setting}
        </p>
      </div>

      <div className="halftone-bg relative flex min-h-0 flex-1 flex-col p-1.5">
        {narrationLines.length > 0 && (
          <div className="mb-1 space-y-1">
            {narrationLines.map((line, index) => (
              <SpeechBubble
                key={`narration-${panel.panelNumber}-${index}`}
                character={line.character}
                text={line.text}
                type="narration"
                side="left"
              />
            ))}
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 items-center justify-center gap-1 overflow-hidden border-[3px] border-black bg-black/5">
          {panelCharacters.map((name, index) => {
            const image = characterImages[name];
            return image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${panel.panelNumber}-char-${name}-${index}`}
                src={image}
                alt={name}
                className="h-full max-h-full min-h-0 flex-1 object-cover object-top"
              />
            ) : (
              <div
                key={`${panel.panelNumber}-placeholder-${index}`}
                className="flex h-full flex-1 items-center justify-center bg-black/10 p-2"
              >
                <span className="font-bangers text-[10px] text-black/50">
                  {name}
                </span>
              </div>
            );
          })}

          {panel.sfx && <SfxText text={panel.sfx} />}
        </div>

        {panel.action && (
          <p className="mt-1 line-clamp-2 font-comic-neue text-[7px] italic leading-tight text-black/70">
            {panel.action}
          </p>
        )}

        {speechLines.length > 0 && (
          <div className="mt-auto space-y-1 pt-1">
            {speechLines.map((line, index) => (
              <SpeechBubble
                key={`${panel.panelNumber}-dialogue-${index}`}
                character={line.character}
                text={line.text}
                type={line.type}
                side={getBubbleSide(line.character, characterNames, index)}
              />
            ))}
          </div>
        )}
      </div>

      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onEdit}
          className="absolute right-1 top-1 h-5 border-black bg-white/90 px-1.5 font-comic-neue text-[8px] hover:bg-comic-yellow"
        >
          <Pencil className="size-2.5" />
          Edit
        </Button>
      )}
    </div>
  );
}
