"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FlipBook } from "@/components/viewer/FlipBook";
import { Button } from "@/components/ui/button";
import { getComicForPurchase } from "@/lib/purchaseStorage";

interface ReadPageClientProps {
  purchaseId: string;
}

export function ReadPageClient({ purchaseId }: ReadPageClientProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState<
    ReturnType<typeof getComicForPurchase> | null
  >(null);

  useEffect(() => {
    setData(getComicForPurchase(purchaseId));
    setIsLoaded(true);
  }, [purchaseId]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-zinc-900">
        <p className="font-comic-neue text-zinc-400">Loading your comic...</p>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { comic } = data;

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bangers text-3xl tracking-wide text-comic-yellow">
              {comic.comicData.title}
            </h1>
            <p className="font-comic-neue text-sm text-zinc-400">
              Full edition · {comic.pages} pages
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-zinc-600 font-comic-neue text-zinc-200"
          >
            <Link href={`/shop/${comic.id}`}>Back to Shop</Link>
          </Button>
        </div>

        <FlipBook
          comicData={comic.comicData}
          characterImages={comic.characterImages}
          genre={comic.genre}
          coverImage={comic.coverImage}
          readOnly
        />
      </div>
    </div>
  );
}
