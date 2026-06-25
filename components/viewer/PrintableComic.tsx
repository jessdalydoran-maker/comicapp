"use client";

import { createRoot } from "react-dom/client";

import type { GeneratedComic } from "@/lib/types";

import { ComicCover } from "./ComicCover";
import { ComicPage } from "./ComicPage";

interface PrintableComicProps {
  comicData: GeneratedComic;
  characterImages: Record<string, string>;
  coverImage?: string;
  genre?: string;
}

function PrintableComic({
  comicData,
  characterImages,
  coverImage,
  genre,
}: PrintableComicProps) {
  const characterNames = Object.keys(characterImages);

  return (
    <>
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
    </>
  );
}

export function downloadComicPdf(options: PrintableComicProps): void {
  const styleId = "comic-print-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body > *:not(#comic-pdf-print-root) { display: none !important; }
        #comic-pdf-print-root { display: block !important; }
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
      @media screen {
        #comic-pdf-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          opacity: 0;
          pointer-events: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  let root = document.getElementById("comic-pdf-print-root");
  if (root) {
    root.remove();
  }

  root = document.createElement("div");
  root.id = "comic-pdf-print-root";
  document.body.appendChild(root);

  const reactRoot = createRoot(root);
  reactRoot.render(<PrintableComic {...options} />);

  requestAnimationFrame(() => {
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        reactRoot.unmount();
        root?.remove();
      }, 1000);
    }, 500);
  });
}
