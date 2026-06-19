"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Upload } from "lucide-react";

import { FlipBook } from "@/components/viewer/FlipBook";
import { Button } from "@/components/ui/button";
import {
  getPreviewState,
  updatePreviewComic,
} from "@/lib/previewStorage";
import {
  generateComicId,
  savePublishedComic,
} from "@/lib/shopStorage";
import type { GeneratedComic, PreviewState } from "@/lib/types";

export function PreviewViewer() {
  const router = useRouter();
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  useEffect(() => {
    setPreviewState(getPreviewState());
  }, []);

  const handleComicChange = useCallback((comicData: GeneratedComic) => {
    updatePreviewComic(comicData);
    setPreviewState((current) =>
      current ? { ...current, comicData } : current
    );
  }, []);

  async function handlePublish() {
    if (!previewState) return;

    setIsPublishing(true);
    setPublishMessage(null);

    try {
      const coverImage =
        Object.values(previewState.characterImages)[0] ?? "";

      const published = {
        id: generateComicId(),
        title: previewState.comicData.title,
        tagline: previewState.comicData.tagline,
        genre: previewState.genre,
        pages: previewState.pageCount,
        price: previewState.price,
        publishedAt: new Date().toISOString(),
        coverImage,
        comicData: previewState.comicData,
        characterImages: previewState.characterImages,
      };

      savePublishedComic(published);
      setPublishMessage(`"${published.title}" is live in the shop!`);

      setTimeout(() => {
        router.push("/shop");
      }, 1200);
    } catch {
      setPublishMessage("Failed to publish. Please try again.");
      setIsPublishing(false);
    }
  }

  if (!previewState) {
    return (
      <div className="comic-create flex min-h-screen flex-col items-center justify-center px-4">
        <p className="font-bangers text-2xl text-comic-yellow">
          No comic to preview
        </p>
        <p className="mt-2 font-comic-neue text-muted-foreground">
          Generate a comic in the Creator Studio first.
        </p>
        <Button asChild className="mt-6 bg-comic-yellow text-black">
          <Link href="/create">Go to Creator Studio</Link>
        </Button>
      </div>
    );
  }

  const coverImage =
    Object.values(previewState.characterImages)[0] ?? undefined;

  return (
    <div className="comic-create min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="comic-heading text-3xl text-comic-yellow sm:text-4xl">
              {previewState.comicData.title}
            </h1>
            <p className="font-comic-neue text-sm text-muted-foreground">
              {previewState.comicData.tagline}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-comic-yellow/50 text-comic-yellow"
          >
            <Link href="/create">Back to Studio</Link>
          </Button>
        </div>

        <FlipBook
          comicData={previewState.comicData}
          characterImages={previewState.characterImages}
          genre={previewState.genre}
          coverImage={coverImage}
          synopsis={previewState.synopsis}
          formCharacters={previewState.formCharacters}
          onComicChange={handleComicChange}
        />

        <div className="comic-card space-y-4 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Store className="size-5 text-comic-yellow" />
            <div>
              <h2 className="font-bangers text-2xl text-comic-yellow">
                Ready to sell?
              </h2>
              <p className="font-comic-neue text-sm text-muted-foreground">
                Publish at {previewState.price} · {previewState.pageCount}{" "}
                pages
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-12 w-full bg-comic-red font-bangers text-xl text-white hover:bg-comic-red/90"
          >
            <Upload className="size-5" />
            {isPublishing ? "Publishing..." : "Publish to Shop"}
          </Button>

          {publishMessage && (
            <p className="font-comic-neue text-sm font-medium text-comic-yellow">
              {publishMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
