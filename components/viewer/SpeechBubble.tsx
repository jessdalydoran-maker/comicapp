import type { DialogueType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SpeechBubbleProps {
  character: string;
  text: string;
  type: DialogueType;
  side: "left" | "right";
}

export function SpeechBubble({
  character,
  text,
  type,
  side,
}: SpeechBubbleProps) {
  if (type === "narration") {
    return (
      <div className="w-full px-1">
        <div className="rounded border-2 border-black bg-comic-yellow px-2 py-1 shadow-[2px_2px_0_#000]">
          <p className="font-comic-neue text-[8px] leading-tight text-black">
            {text}
          </p>
        </div>
      </div>
    );
  }

  if (type === "thought") {
    return (
      <div
        className={cn(
          "relative max-w-[90%]",
          side === "left" ? "mr-auto self-start" : "ml-auto self-end"
        )}
      >
        <div className="relative rounded-[50%] border-2 border-black bg-white px-3 py-2 shadow-[2px_2px_0_#000]">
          <p className="font-bangers text-[7px] uppercase tracking-wide text-comic-red">
            {character}
          </p>
          <p className="font-comic-neue text-[9px] leading-tight text-black">
            {text}
          </p>
          <span
            className={cn(
              "absolute -bottom-3 size-2 rounded-full border-2 border-black bg-white",
              side === "left" ? "left-4" : "right-4"
            )}
            aria-hidden
          />
          <span
            className={cn(
              "absolute -bottom-5 size-1.5 rounded-full border-2 border-black bg-white",
              side === "left" ? "left-2" : "right-2"
            )}
            aria-hidden
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative max-w-[90%]",
        side === "left" ? "mr-auto self-start" : "ml-auto self-end"
      )}
    >
      <div
        className={cn(
          "relative rounded-xl border-2 border-black bg-white px-2 py-1.5 shadow-[2px_2px_0_#000]",
          side === "left" ? "rounded-bl-sm" : "rounded-br-sm"
        )}
      >
        <p className="font-bangers text-[7px] uppercase tracking-wide text-comic-red">
          {character}
        </p>
        <p className="font-comic-neue text-[9px] leading-tight text-black">
          {text}
        </p>
        <span
          className={cn(
            "absolute -bottom-2 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-black",
            side === "left" ? "left-3" : "right-3"
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -bottom-[5px] h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-white",
            side === "left" ? "left-[13px]" : "right-[13px]"
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function getBubbleSide(
  characterName: string,
  characterNames: string[],
  lineIndex: number
): "left" | "right" {
  const characterIndex = characterNames.findIndex(
    (name) => name.toLowerCase() === characterName.toLowerCase()
  );

  if (characterIndex >= 0) {
    return characterIndex % 2 === 0 ? "left" : "right";
  }

  return lineIndex % 2 === 0 ? "left" : "right";
}

export function SfxText({ text }: { text: string }) {
  return (
    <p
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] font-bangers text-xl uppercase leading-none text-comic-yellow drop-shadow-[2px_2px_0_#E8192C] [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]"
      aria-hidden
    >
      {text}
    </p>
  );
}
