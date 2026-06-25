"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { GeneratedComic } from "@/lib/types";

import { ComicCover } from "./ComicCover";
import { ComicPage } from "./ComicPage";

interface ComicPrintViewProps {
  comicData: GeneratedComic;
  characterImages: Record<string, string>;
  coverImage?: string;
  genre?: string;
  onReady?: () => void;
}

export function ComicPrintView({
  comicData,
  characterImages,
  coverImage,
  genre,
  onReady,
}: ComicPrintViewProps) {
  const characterNames = Object.keys(characterImages);

  useEffect(() => {
    const timer = setTimeout(() => onReady?.(), 500);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div className="comic-print-container">
      <div className="comic-print-page">
        <ComicCover
          comic={comicData}
          coverImage={coverImage}
          genre={genre}
          issueNumber={1}
        />
      </div>
      {comicData.pages.map((page) => (
        <div key={page.pageNumber} className="comic-print-page">
          <ComicPage
            page={page}
            characterImages={characterImages}
            characterNames={characterNames}
          />
        </div>
      ))}
    </div>
  );
}

interface ComicPrintPortalProps {
  open: boolean;
  comicData: GeneratedComic;
  characterImages: Record<string, string>;
  coverImage?: string;
  genre?: string;
  onClose: () => void;
}

export function ComicPrintPortal({
  open,
  comicData,
  characterImages,
  coverImage,
  genre,
  onClose,
}: ComicPrintPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const style = document.createElement("style");
    style.id = "comic-pdf-print-styles";
    style.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body > *:not(#comic-print-root) { display: none !important; }
        #comic-print-root { display: block !important; }
        .comic-print-page {
          width: 210mm;
          height: 297mm;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
        }
        .comic-print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById("comic-pdf-print-styles")?.remove();
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div id="comic-print-root">
      <ComicPrintView
        comicData={comicData}
        characterImages={characterImages}
        coverImage={coverImage}
        genre={genre}
        onReady={() => {
          window.print();
          setTimeout(onClose, 500);
        }}
      />
    </div>,
    document.body
  );
}

export function downloadComicPdf(
  comicData: GeneratedComic,
  characterImages: Record<string, string>,
  options?: { coverImage?: string; genre?: string }
): void {
  const event = new CustomEvent("comic-download-pdf", {
    detail: { comicData, characterImages, ...options },
  });
  window.dispatchEvent(event);
}
