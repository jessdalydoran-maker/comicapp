import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublishedComic } from "@/lib/types";

interface ComicCardProps {
  comic: PublishedComic;
}

export function ComicCard({ comic }: ComicCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/shop/${comic.id}`} className="block">
        <div className="relative aspect-[2/3] w-full bg-muted">
          {comic.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comic.coverImage}
              alt={`${comic.title} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="halftone-bg flex h-full items-center justify-center bg-comic-cream p-4">
              <span className="font-bangers text-xl text-black">
                {comic.title}
              </span>
            </div>
          )}
        </div>
      </Link>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/shop/${comic.id}`}>
            <CardTitle className="font-bangers transition-colors hover:text-comic-red">
              {comic.title}
            </CardTitle>
          </Link>
          <Badge variant="secondary">{comic.genre}</Badge>
        </div>
        <CardDescription className="font-comic-neue line-clamp-2">
          {comic.tagline}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-comic-neue text-xs text-muted-foreground">
          {comic.pages} pages
        </p>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center font-bangers text-2xl text-comic-red">
          {comic.price}
        </p>
      </CardFooter>
    </Card>
  );
}
