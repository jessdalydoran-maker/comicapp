import type { GeneratedComic } from "@/lib/types";

interface ComicCoverProps {
  comic: GeneratedComic;
  coverImage?: string;
  genre?: string;
  issueNumber?: number;
}

export function ComicCover({
  comic,
  coverImage,
  genre,
  issueNumber = 1,
}: ComicCoverProps) {
  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-black bg-black">
      <div className="comic-cover-halftone pointer-events-none absolute inset-0" aria-hidden />

      {coverImage && (
        <div className="absolute inset-x-0 bottom-24 top-16 flex items-center justify-center px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={`${comic.title} hero`}
            className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-full border-2 border-[#FFD600] bg-comic-red px-3 py-1">
        <span className="font-bangers text-sm tracking-wider text-white">
          #{issueNumber}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-6 pt-16 text-center">
        <h2
          className="font-bangers text-4xl leading-none text-[#FFD600] sm:text-5xl"
          style={{ textShadow: "4px 4px 0 #E8192C, -1px -1px 0 #000" }}
        >
          {comic.title}
        </h2>
        {comic.tagline && (
          <p className="mt-2 font-comic-neue text-sm italic text-white/90">
            {comic.tagline}
          </p>
        )}
        {genre && (
          <p className="mt-2 font-bangers text-base uppercase tracking-[0.2em] text-white/80">
            {genre}
          </p>
        )}
        <p className="mt-4 font-comic-neue text-xs uppercase tracking-widest text-white/60">
          Created with Comic Forge
        </p>
      </div>
    </div>
  );
}
