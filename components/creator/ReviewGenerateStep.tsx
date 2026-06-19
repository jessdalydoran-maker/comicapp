"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LOADING_MESSAGES, type CreateFormData } from "@/lib/createForm";
import { getPriceForPages } from "@/lib/pricing";

interface ReviewGenerateStepProps {
  data: CreateFormData;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export function ReviewGenerateStep({
  data,
  isLoading,
  error,
  onGenerate,
}: ReviewGenerateStepProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const price = getPriceForPages(data.pageCount);

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <Card className="comic-card border-comic-yellow bg-card">
      <CardHeader>
        <CardTitle className="comic-heading text-3xl text-comic-yellow">
          Step 3: Generate
        </CardTitle>
        <CardDescription className="font-comic-neue text-muted-foreground">
          Double-check your comic details, then bring it to life.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border-2 border-comic-red/40 bg-black/40 p-6">
          <SummaryRow label="Title" value={data.title} highlight />
          <SummaryRow label="Genre" value={data.genre} />
          <SummaryRow label="Pages" value={`${data.pageCount} pages`} />
          <SummaryRow label="Price" value={price} highlight />
          <div>
            <p className="mb-1 font-comic-neue text-sm font-medium text-comic-yellow">
              Synopsis
            </p>
            <p className="font-comic-neue text-sm leading-relaxed text-muted-foreground">
              {data.synopsis}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 font-comic-neue text-sm font-medium text-comic-yellow">
            Characters ({data.characters.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.characters.map((character, index) => (
              <div
                key={`review-char-${index}`}
                className="flex items-center gap-3 rounded-lg border border-comic-yellow/30 bg-black/40 p-3"
              >
                {character.imageBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={character.imageBase64}
                    alt={character.name}
                    className="size-14 rounded-md object-cover ring-2 ring-comic-red"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-md bg-muted font-comic-neue text-xs text-muted-foreground">
                    No img
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bangers text-comic-yellow">
                    {character.name || "Unnamed"}
                  </p>
                  <p className="font-comic-neue text-xs capitalize text-comic-red">
                    {character.role}
                  </p>
                  <p className="line-clamp-2 font-comic-neue text-xs text-muted-foreground">
                    {character.personality || "No personality"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-comic-red bg-comic-red/10 px-4 py-3 font-comic-neue text-sm text-comic-red">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-comic-yellow/50 py-12">
            <Loader2 className="size-10 animate-spin text-comic-yellow" />
            <p className="comic-heading text-2xl text-comic-yellow">
              {LOADING_MESSAGES[messageIndex]}
            </p>
            <p className="font-comic-neue text-sm text-muted-foreground">
              Claude is crafting your comic panels...
            </p>
          </div>
        ) : (
          <Button
            type="button"
            onClick={onGenerate}
            className="h-12 w-full bg-comic-red font-bangers text-lg text-white hover:bg-comic-red/90"
          >
            <Sparkles className="size-5" />
            Generate My Comic
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-comic-yellow/10 pb-3 last:border-0 last:pb-0">
      <span className="font-comic-neue text-sm text-comic-yellow">{label}</span>
      <span
        className={
          highlight
            ? "comic-heading text-right text-xl text-white"
            : "text-right font-comic-neue text-sm text-muted-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
