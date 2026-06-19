"use client";

import { useCallback, useEffect, useState } from "react";

import { ComicCard } from "@/components/shop/ComicCard";
import { getPublishedComics } from "@/lib/shopStorage";
import type { PublishedComic } from "@/lib/types";

export function ShopPageClient() {
  const [comics, setComics] = useState<PublishedComic[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshComics = useCallback(() => {
    setComics(getPublishedComics());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refreshComics();
  }, [refreshComics]);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <div>
        <h1 className="font-bangers text-5xl tracking-wide text-foreground">
          Comic Shop
        </h1>
        <p className="mt-2 font-comic-neue text-muted-foreground">
          Browse published comics from the forge.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bangers text-3xl tracking-wide">
            Published Comics
          </h2>
          <p className="font-comic-neue text-sm text-muted-foreground">
            {comics.length} comic{comics.length === 1 ? "" : "s"}
          </p>
        </div>

        {!isLoaded ? (
          <p className="font-comic-neue text-muted-foreground">
            Loading comics...
          </p>
        ) : comics.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-comic-neue text-muted-foreground">
              No comics published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
