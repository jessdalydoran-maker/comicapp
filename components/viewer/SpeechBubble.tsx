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
      <div className="w-full max-w-[70%]">
        <div className="rounded border-2 border-black bg-[#FFD600] px-2 py-1">
          <p className="font-bangers text-[10px] leading-tight tracking-wide text-black">
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
          "relative max-w-[70%]",
          side === "left" ? "mr-auto self-start" : "ml-auto self-end"
        )}
      >
        <div className="relative rounded-[50%] border-2 border-black bg-white px-3 py-2">
          <p className="font-comic-neue text-[11px] font-bold italic leading-tight text-black">
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
          <span
            className={cn(
              "absolute -bottom-6 size-1 rounded-full border border-black bg-white",
              side === "left" ? "left-1" : "right-1"
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
        "relative max-w-[70%]",
        side === "left" ? "mr-auto self-start" : "ml-auto self-end"
      )}
    >
      <div
        className={cn(
          "relative rounded-[20px] border-2 border-black bg-white px-2.5 py-1.5",
          side === "left" ? "rounded-bl-sm" : "rounded-br-sm"
        )}
      >
        <p className="font-bangers text-[8px] uppercase tracking-wide text-comic-red">
          {character}
        </p>
        <p className="font-comic-neue text-[11px] font-bold leading-tight text-black">
          {text}
        </p>
        <span
          className={cn(
            "absolute -bottom-2 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-black",
            side === "left" ? "left-4" : "right-4"
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -bottom-[5px] h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-white",
            side === "left" ? "left-[17px]" : "right-[17px]"
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

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function SfxText({ text, seed }: { text: string; seed?: string }) {
  const rotation = ((hashSeed(seed ?? text) % 21) - 10);

  return (
    <p
      className="pointer-events-none absolute left-1/2 top-[35%] z-20 -translate-x-1/2 font-bangers text-[2rem] uppercase leading-none text-[#FFD600]"
      style={{
        transform: `translateX(-50%) rotate(${rotation}deg)`,
        WebkitTextStroke: "2px black",
        paintOrder: "stroke fill",
        textShadow: "2px 2px 0 #000",
      }}
      aria-hidden
    >
      {text}
    </p>
  );
}
