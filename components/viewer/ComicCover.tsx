import type { GeneratedComic } from "@/lib/types";

interface ComicCoverProps {
  comic: GeneratedComic;
  coverImage?: string;
  genre?: string;
}

export function ComicCover({ comic, coverImage, genre }: ComicCoverProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt={`${comic.title} cover`}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      ) : (
        <div className="halftone-bg absolute inset-0 bg-comic-cream" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <div className="relative flex h-full flex-col items-center justify-end p-6 text-center">
        <h2 className="font-bangers text-4xl leading-none text-comic-yellow drop-shadow-[4px_4px_0_#E8192C] sm:text-5xl">
          {comic.title}
        </h2>
        {comic.tagline && (
          <p className="mt-2 font-comic-neue text-sm italic text-white/90">
            {comic.tagline}
          </p>
        )}
        {genre && (
          <p className="mt-2 font-bangers text-lg uppercase tracking-widest text-white/90">
            {genre}
          </p>
        )}
      </div>
    </div>
  );
}
