"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { ChevronLeft, ImagePlus, Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES, LOADING_MESSAGES, type Genre } from "@/lib/createForm";
import { getPriceForPages, PAGE_COUNTS, type PageCount } from "@/lib/pricing";
import { persistAfterGenerate } from "@/lib/persistAfterGenerate";
import {
  charactersWithImages,
  getCharacterCountMessage,
  matchImagesToCharacters,
  type QuickCreateImage,
} from "@/lib/quickCreate";
import type { Character, GeneratedComic } from "@/lib/types";
import { cn, parseApiJsonResponse } from "@/lib/utils";

interface QuickCreateProps {
  onBack: () => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function QuickCreate({ onBack }: QuickCreateProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [story, setStory] = useState("");
  const [genre, setGenre] = useState<Genre>(GENRES[0]);
  const [pageCount, setPageCount] = useState<PageCount>(8);
  const [images, setImages] = useState<QuickCreateImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(200, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [story, adjustTextareaHeight]);

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = await Promise.all(
      acceptedFiles.map(async (file) => ({
        filename: file.name,
        base64: await readFileAsBase64(file),
      }))
    );
    setImages((current) => [...current, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  const trimmedStory = story.trim();
  const hasStory = trimmedStory.length >= 50;
  const hasGenre = genre.trim().length > 0;
  const hasPageCount = PAGE_COUNTS.includes(pageCount);
  const canGenerate = hasStory && hasGenre && hasPageCount && !isLoading;

  async function handleGenerate() {
    if (isLoading) return;

    if (!hasStory) {
      setError("Please write at least 50 characters for your story.");
      return;
    }

    if (!hasGenre) {
      setError("Please pick a genre.");
      return;
    }

    if (!hasPageCount) {
      setError("Please pick a page count.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quickCreate: true,
          story: trimmedStory,
          genre: genre.trim(),
          pageCount,
          imageFilenames: images.map((img) => img.filename),
        }),
      });

      const result = await parseApiJsonResponse<{
        comicData?: GeneratedComic;
        characters?: Character[];
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to generate comic.");
      }

      const comicData = result.comicData as GeneratedComic;
      const extractedCharacters = (result.characters ?? []) as Character[];
      const imageMap = matchImagesToCharacters(extractedCharacters, images);
      const formCharacters = charactersWithImages(
        extractedCharacters,
        imageMap
      );

      const { warning } = await persistAfterGenerate({
        comicData,
        genre,
        pageCount,
        synopsis: story.trim(),
        formCharacters,
        characterImages: imageMap,
      });

      if (warning) {
        setError(warning);
      }

      router.push("/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  const encouragement = getCharacterCountMessage(story.length);
  const price = getPriceForPages(pageCount);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isLoading}
        className="mb-6 w-fit border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
      >
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div className="mb-6 text-center">
        <h1 className="comic-heading text-4xl text-comic-yellow sm:text-5xl">
          Quick Create
        </h1>
        <p className="mt-2 font-comic-neue text-sm text-muted-foreground">
          Tell your whole story in one shot — the AI handles the rest.
        </p>
      </div>

      <div className="comic-card flex flex-1 flex-col gap-6 rounded-lg p-6">
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            disabled={isLoading}
            placeholder="Tell me your story... describe your characters, what happens, any powers, personalities, villains, plot twists. The more you write the better your comic will be."
            className="w-full resize-none overflow-hidden rounded-lg border-2 border-comic-yellow/40 bg-black/60 px-4 py-4 font-comic-neue text-base leading-relaxed text-white placeholder:text-muted-foreground focus:border-comic-yellow focus:outline-none focus:ring-1 focus:ring-comic-yellow"
            rows={8}
          />
          <div className="flex items-center justify-between font-comic-neue text-xs">
            <span className="text-muted-foreground">
              {story.length} characters
              {story.length < 50 && story.length > 0 && (
                <span className="ml-2 text-comic-red">
                  (min 50 to generate)
                </span>
              )}
            </span>
            {encouragement && (
              <span className="font-medium text-comic-yellow">
                {encouragement}
              </span>
            )}
          </div>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragActive
              ? "border-comic-yellow bg-comic-yellow/10"
              : "border-comic-yellow/40 bg-black/40 hover:border-comic-yellow/70"
          )}
        >
          <input {...getInputProps()} disabled={isLoading} />
          <ImagePlus className="mx-auto size-10 text-comic-yellow/70" />
          <p className="mt-3 font-comic-neue text-sm text-muted-foreground">
            Drop your character images here — the AI will match them to your
            characters automatically
          </p>
          <p className="mt-1 font-comic-neue text-xs text-muted-foreground/70">
            PNG, JPG, WEBP — multiple files accepted
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div
                key={`${image.filename}-${index}`}
                className="relative size-20 overflow-hidden rounded-md ring-2 ring-comic-yellow/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.base64}
                  alt={image.filename}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isLoading}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/80 p-0.5 text-white hover:bg-comic-red"
                  aria-label={`Remove ${image.filename}`}
                >
                  <X className="size-3" />
                </button>
                <span className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-1 py-0.5 font-comic-neue text-[8px] text-white">
                  {image.filename}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Label className="text-comic-yellow">Pages</Label>
            <div className="flex gap-2">
              {PAGE_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setPageCount(count)}
                  className={cn(
                    "rounded-md border-2 px-4 py-2 font-bangers text-lg transition-colors",
                    pageCount === count
                      ? "border-comic-yellow bg-comic-yellow text-black"
                      : "border-comic-yellow/30 bg-black/40 text-comic-yellow hover:border-comic-yellow/60"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="font-comic-neue text-xs text-comic-yellow">{price}</p>
          </div>

          <div className="min-w-[160px] flex-1 space-y-2">
            <Label className="text-comic-yellow">Genre</Label>
            <Select
              value={genre}
              onValueChange={(value) => setGenre(value as Genre)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full border-comic-yellow/50 bg-black/50 font-comic-neue text-white">
                <SelectValue placeholder="Pick a genre" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="border-comic-yellow bg-[#111] text-white"
              >
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Claude is reading your story and building your comic...
            </p>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="h-14 w-full bg-comic-red font-bangers text-xl text-white hover:bg-comic-red/90 disabled:opacity-40"
          >
            <Sparkles className="size-5" />
            Generate My Comic
          </Button>
        )}
      </div>
    </div>
  );
}
