"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  Character,
  ComicPage as ComicPageType,
  GeneratedComic,
  Panel,
} from "@/lib/types";

import { ComicCover } from "./ComicCover";
import { ComicPage } from "./ComicPage";
import { PanelEditModal } from "./PanelEditModal";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

interface PageFlipInstance {
  flipNext: () => void;
  flipPrev: () => void;
  getCurrentPageIndex: () => number;
}

interface FlipBookHandle {
  flipNext: () => void;
  flipPrev: () => void;
}

interface FlipBookProps {
  comicData: GeneratedComic;
  characterImages: Record<string, string>;
  genre?: string;
  coverImage?: string;
  synopsis?: string;
  formCharacters?: Character[];
  onComicChange?: (comic: GeneratedComic) => void;
  onPageChange?: (pageIndex: number) => void;
  readOnly?: boolean;
  maxPages?: number;
}

const FlipBookPage = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
  }
>(function FlipBookPage({ children }, ref) {
  return (
    <div ref={ref} className="h-full w-full overflow-hidden">
      {children}
    </div>
  );
});

export const FlipBook = forwardRef<FlipBookHandle, FlipBookProps>(
  function FlipBook(
    {
      comicData,
      characterImages,
      genre,
      coverImage,
      synopsis,
      formCharacters = [],
      onComicChange,
      onPageChange,
      readOnly = false,
      maxPages,
    },
    ref
  ) {
    const bookRef = useRef<{ pageFlip: () => PageFlipInstance } | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [editingPanel, setEditingPanel] = useState<{
      pageNumber: number;
      panel: Panel;
    } | null>(null);

    const characterNames = formCharacters.length
      ? formCharacters.map((character) => character.name)
      : Object.keys(characterImages);

    const displayPages = maxPages
      ? comicData.pages.slice(0, maxPages)
      : comicData.pages;
    const displayComic = { ...comicData, pages: displayPages };
    const totalFlipPages = 1 + displayPages.length;
    const isCover = currentPageIndex === 0;
    const contentPage = !isCover ? displayPages[currentPageIndex - 1] : null;

    const handleFlip = useCallback(
      (event: { data: number }) => {
        setCurrentPageIndex(event.data);
        onPageChange?.(event.data);
      },
      [onPageChange]
    );

    useImperativeHandle(ref, () => ({
      flipNext: () => bookRef.current?.pageFlip().flipNext(),
      flipPrev: () => bookRef.current?.pageFlip().flipPrev(),
    }));

    function persistComic(updated: GeneratedComic) {
      onComicChange?.(updated);
    }

    function handlePanelSave(updatedPanel: Panel) {
      if (!editingPanel) return;

      const pages = comicData.pages.map((page) => {
        if (page.pageNumber !== editingPanel.pageNumber) return page;
        return {
          ...page,
          panels: page.panels.map((panel) =>
            panel.panelNumber === updatedPanel.panelNumber
              ? updatedPanel
              : panel
          ),
        };
      });

      persistComic({ ...comicData, pages });
      setEditingPanel(null);
    }

    async function handleRegeneratePage() {
      if (!contentPage || isRegenerating) return;

      setIsRegenerating(true);

      try {
        const response = await fetch("/api/generate/page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comicData,
            pageNumber: contentPage.pageNumber,
            synopsis,
            genre,
            characters: formCharacters,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to regenerate page.");
        }

        const regeneratedPage = result.page as ComicPageType;
        const pages = comicData.pages.map((page) =>
          page.pageNumber === regeneratedPage.pageNumber
            ? regeneratedPage
            : page
        );

        persistComic({ ...comicData, pages });
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to regenerate page."
        );
      } finally {
        setIsRegenerating(false);
      }
    }

    function getPageLabel(): string {
      if (isCover) return "Cover";
      return `Page ${currentPageIndex} of ${displayPages.length}`;
    }

    return (
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-full max-w-[520px]">
          <HTMLFlipBook
            ref={bookRef}
            width={480}
            height={640}
            size="stretch"
            minWidth={280}
            maxWidth={520}
            minHeight={400}
            maxHeight={700}
            showCover={true}
            mobileScrollSupport={true}
            className="mx-auto shadow-[8px_8px_0_#000]"
            onFlip={handleFlip}
          >
            <FlipBookPage>
              <ComicCover
                comic={displayComic}
                coverImage={coverImage}
                genre={genre}
              />
            </FlipBookPage>
            {displayPages.map((page) => (
              <FlipBookPage key={page.pageNumber}>
                <ComicPage
                  page={page}
                  characterImages={characterImages}
                  characterNames={characterNames}
                  onEditPanel={
                    readOnly
                      ? undefined
                      : (panel) =>
                          setEditingPanel({
                            pageNumber: page.pageNumber,
                            panel,
                          })
                  }
                />
              </FlipBookPage>
            ))}
          </HTMLFlipBook>
        </div>

        <div className="flex w-full max-w-[520px] flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              disabled={currentPageIndex === 0}
              className="border-black"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <span className="font-bangers text-lg tracking-wide text-foreground">
              {getPageLabel()}
            </span>

            <Button
              type="button"
              variant="outline"
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              disabled={currentPageIndex >= totalFlipPages - 1}
              className="border-black"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {!readOnly && !isCover && contentPage && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRegeneratePage}
              disabled={isRegenerating}
              className="w-full border-comic-red text-comic-red hover:bg-comic-red/10"
            >
              <RefreshCw
                className={`size-4 ${isRegenerating ? "animate-spin" : ""}`}
              />
              {isRegenerating
                ? "Regenerating page..."
                : `Regenerate Page ${contentPage.pageNumber}`}
            </Button>
          )}
        </div>

        {!readOnly && (
          <PanelEditModal
            panel={editingPanel?.panel ?? null}
            open={editingPanel !== null}
            onOpenChange={(open) => {
              if (!open) setEditingPanel(null);
            }}
            onSave={handlePanelSave}
          />
        )}
      </div>
    );
  }
);
