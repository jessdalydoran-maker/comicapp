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

  const captionLines = panel.caption ? [panel.caption] : [];
  const narrationLines = panel.dialogue.filter(
    (line) => line.type === "narration"
  );
  const speechLines = panel.dialogue.filter(
    (line) => line.type === "speech" || line.type === "thought"
  );

  return (
    <div
      className={`comic-panel relative flex min-h-0 flex-col overflow-hidden border-[3px] border-black bg-[#FFFDF5] ${className ?? ""}`}
    >
      {captionLines.length > 0 && (
        <div className="shrink-0 border-b-2 border-black bg-black px-2 py-1">
          {captionLines.map((text, index) => (
            <p
              key={`caption-${panel.panelNumber}-${index}`}
              className="font-comic-neue text-[9px] leading-tight text-[#FFD600]"
            >
              {text}
            </p>
          ))}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {narrationLines.length > 0 && (
          <div className="relative z-20 shrink-0 space-y-0.5 p-1">
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

        <div className="relative z-10 flex min-h-0 flex-1 items-end justify-center gap-0.5 overflow-hidden px-1 pb-0.5">
          {speechLines.length > 0 && (
            <div className="pointer-events-none absolute inset-x-1 top-1 z-30 flex flex-col gap-1">
              {speechLines.map((line, index) => (
                <SpeechBubble
                  key={`${panel.panelNumber}-dialogue-${index}`}
                  character={line.character}
                  text={line.text}
                  type={line.type}
                  side={getBubbleSide(line.character, panelCharacters, index)}
                />
              ))}
            </div>
          )}

          {panelCharacters.map((name, index) => {
            const image = characterImages[name];
            const isMulti = panelCharacters.length > 1;

            return image ? (
              <div
                key={`${panel.panelNumber}-char-wrap-${name}-${index}`}
                className={`relative flex h-full min-h-0 items-end justify-center ${
                  isMulti ? "flex-1" : "w-full"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={name}
                  className="max-h-[75%] w-full object-contain object-bottom drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]"
                />
              </div>
            ) : (
              <div
                key={`${panel.panelNumber}-placeholder-${index}`}
                className={`flex h-full min-h-0 items-end justify-center pb-2 ${
                  isMulti ? "flex-1" : "w-full"
                }`}
              >
                <span className="font-bangers text-xs text-black/40">
                  {name}
                </span>
              </div>
            );
          })}

          {panel.sfx && (
            <SfxText text={panel.sfx} seed={`${panel.panelNumber}-${panel.sfx}`} />
          )}
        </div>
      </div>

      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={onEdit}
          className="absolute right-1 top-1 z-40 h-5 border-black bg-white/90 px-1.5 font-comic-neue text-[8px] hover:bg-comic-yellow"
        >
          <Pencil className="size-2.5" />
          Edit
        </Button>
      )}
    </div>
  );
}
