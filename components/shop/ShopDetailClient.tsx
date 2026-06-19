"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuyButton } from "@/components/shop/BuyButton";
import { FlipBook } from "@/components/viewer/FlipBook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasPurchasedComic } from "@/lib/purchaseStorage";
import { getPublishedComicById } from "@/lib/shopStorage";
import type { PublishedComic } from "@/lib/types";

interface ShopDetailClientProps {
  id: string;
}

export function ShopDetailClient({ id }: ShopDetailClientProps) {
  const [comic, setComic] = useState<PublishedComic | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    const found = getPublishedComicById(id);
    setComic(found ?? null);
    const purchase = hasPurchasedComic(id);
    setPurchaseId(purchase?.id ?? null);
    setIsLoaded(true);
  }, [id]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-comic-neue text-muted-foreground">
          Loading comic...
        </p>
      </div>
    );
  }

  if (!comic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="border-zinc-600 font-comic-neue text-zinc-200"
          >
            <Link href="/shop">← Back to Shop</Link>
          </Button>
          <Badge variant="secondary">{comic.genre}</Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="relative mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-lg border-4 border-black">
              {comic.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comic.coverImage}
                  alt={`${comic.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="halftone-bg flex h-full items-center justify-center bg-comic-cream p-4">
                  <span className="font-bangers text-2xl text-black">
                    {comic.title}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-center">
              <p className="font-bangers text-4xl text-comic-yellow">
                {comic.price}
              </p>
              <BuyButton
                comicId={comic.id}
                price={comic.price}
                className="mt-4 w-full bg-comic-red font-bangers text-white hover:bg-comic-red/90"
              />
              {purchaseId && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-3 w-full border-comic-yellow font-bangers text-comic-yellow"
                >
                  <Link href={`/read/${purchaseId}`}>Read Now</Link>
                </Button>
              )}
              <p className="mt-3 font-comic-neue text-xs text-zinc-500">
                Secure checkout powered by Stripe (coming soon)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="font-bangers text-5xl tracking-wide text-comic-yellow">
                {comic.title}
              </h1>
              <p className="mt-2 font-comic-neue text-lg italic text-zinc-300">
                {comic.tagline}
              </p>
            </div>
            <p className="max-w-2xl font-comic-neue leading-relaxed text-zinc-300">
              A {comic.genre.toLowerCase()} comic · {comic.pages} pages of
              action-packed storytelling.
            </p>
            <p className="font-comic-neue text-sm text-zinc-500">
              {comic.pages} pages
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="font-bangers text-2xl tracking-wide text-white">
            Free Preview — First 2 Pages
          </h2>
          <FlipBook
            comicData={comic.comicData}
            characterImages={comic.characterImages}
            genre={comic.genre}
            coverImage={comic.coverImage}
            readOnly
            maxPages={2}
          />
        </section>
      </div>
    </div>
  );
}
