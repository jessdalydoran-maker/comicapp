"use client";

import { useEffect, useState } from "react";
import { BookOpen, Download, Eye, Plus, Store, Trash2, Upload } from "lucide-react";

import { FlipBook } from "@/components/viewer/FlipBook";
import { downloadComicPdf } from "@/components/viewer/PrintableComic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteSavedComic,
  getSavedComics,
  publishSavedComic,
  unpublishSavedComic,
} from "@/lib/comicStorage";
import type { SavedComic } from "@/lib/types";

interface MyComicsProps {
  onCreateNew: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MyComics({ onCreateNew }: MyComicsProps) {
  const [comics, setComics] = useState<SavedComic[]>([]);
  const [viewingComic, setViewingComic] = useState<SavedComic | null>(null);
  const [deletingComic, setDeletingComic] = useState<SavedComic | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  function refresh() {
    setComics(getSavedComics());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handlePublish(comic: SavedComic) {
    publishSavedComic(comic.id);
    setActionMessage(`"${comic.title}" is now live in the shop!`);
    refresh();
  }

  function handleUnpublish(comic: SavedComic) {
    unpublishSavedComic(comic.id);
    setActionMessage(`"${comic.title}" removed from the shop.`);
    refresh();
  }

  function handleDelete() {
    if (!deletingComic) return;
    deleteSavedComic(deletingComic.id);
    setActionMessage(`"${deletingComic.title}" deleted.`);
    setDeletingComic(null);
    refresh();
  }

  function handleDownloadPdf(comic: SavedComic) {
    downloadComicPdf({
      comicData: comic.comicData,
      characterImages: comic.characterImages,
      coverImage: comic.coverImage,
      genre: comic.genre,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="comic-heading text-5xl text-comic-yellow sm:text-6xl">
            My Comics
          </h1>
          <p className="mt-3 font-comic-neue text-muted-foreground">
            Manage your generated comics, publish to the shop, or download as PDF.
          </p>
        </div>
        <Button
          type="button"
          onClick={onCreateNew}
          className="bg-comic-yellow font-bangers text-lg text-black hover:bg-comic-yellow/90"
        >
          <Plus className="size-5" />
          Create New Comic
        </Button>
      </div>

      {actionMessage && (
        <p className="font-comic-neue text-sm font-medium text-comic-yellow">
          {actionMessage}
        </p>
      )}

      {comics.length === 0 ? (
        <div className="comic-card rounded-lg p-12 text-center">
          <BookOpen className="mx-auto size-12 text-comic-yellow/50" />
          <p className="mt-4 font-bangers text-2xl text-comic-yellow">
            No comics yet
          </p>
          <p className="mt-2 font-comic-neue text-muted-foreground">
            Create your first comic to see it here.
          </p>
          <Button
            type="button"
            onClick={onCreateNew}
            className="mt-6 bg-comic-red font-bangers text-lg text-white hover:bg-comic-red/90"
          >
            <Plus className="size-4" />
            Create New Comic
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {comics.map((comic) => (
            <div key={comic.id} className="comic-card flex flex-col overflow-hidden rounded-lg">
              <div className="relative aspect-[2/3] w-full bg-black">
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
                <Badge
                  className={`absolute right-2 top-2 font-comic-neue text-xs ${
                    comic.status === "published"
                      ? "bg-comic-red text-white"
                      : "bg-comic-yellow text-black"
                  }`}
                >
                  {comic.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bangers text-xl leading-tight text-comic-yellow">
                      {comic.title}
                    </h2>
                    <Badge variant="outline" className="shrink-0 border-comic-yellow/50 text-comic-yellow">
                      {comic.genre}
                    </Badge>
                  </div>
                  <p className="mt-1 font-comic-neue text-xs text-muted-foreground">
                    {comic.pageCount} pages · {formatDate(comic.createdAt)}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingComic(comic)}
                    className="border-comic-yellow/50 text-comic-yellow hover:bg-comic-yellow/10"
                  >
                    <Eye className="size-3.5" />
                    View Flipbook
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPdf(comic)}
                    className="border-comic-yellow/50 text-comic-yellow hover:bg-comic-yellow/10"
                  >
                    <Download className="size-3.5" />
                    Download PDF
                  </Button>
                  {comic.status === "draft" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePublish(comic)}
                      className="col-span-2 bg-comic-red font-comic-neue text-xs text-white hover:bg-comic-red/90"
                    >
                      <Upload className="size-3.5" />
                      Publish to Shop
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnpublish(comic)}
                      className="col-span-2 border-comic-red/50 text-comic-red hover:bg-comic-red/10"
                    >
                      <Store className="size-3.5" />
                      Unpublish
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingComic(comic)}
                    className="col-span-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={viewingComic !== null}
        onOpenChange={(open) => {
          if (!open) setViewingComic(null);
        }}
      >
        <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto border-comic-yellow/30 bg-black text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-bangers text-2xl text-comic-yellow">
              {viewingComic?.title}
            </DialogTitle>
            <DialogDescription className="font-comic-neue text-muted-foreground">
              {viewingComic?.tagline}
            </DialogDescription>
          </DialogHeader>
          {viewingComic && (
            <FlipBook
              comicData={viewingComic.comicData}
              characterImages={viewingComic.characterImages}
              genre={viewingComic.genre}
              coverImage={viewingComic.coverImage}
              formCharacters={viewingComic.formCharacters ?? []}
              synopsis={viewingComic.synopsis}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingComic !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingComic(null);
        }}
      >
        <DialogContent className="border-destructive/30 bg-black text-white">
          <DialogHeader>
            <DialogTitle className="font-bangers text-xl text-comic-red">
              Delete Comic?
            </DialogTitle>
            <DialogDescription className="font-comic-neue text-muted-foreground">
              This will permanently delete &ldquo;{deletingComic?.title}&rdquo;. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingComic(null)}
              className="border-comic-yellow/50 text-comic-yellow"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
