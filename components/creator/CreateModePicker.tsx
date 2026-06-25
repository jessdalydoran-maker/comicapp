"use client";

import { ChevronLeft, ListOrdered, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CreateModePickerProps {
  onSelectQuickCreate: () => void;
  onSelectWizard: () => void;
  onBackToLibrary: () => void;
}

export function CreateModePicker({
  onSelectQuickCreate,
  onSelectWizard,
  onBackToLibrary,
}: CreateModePickerProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={onBackToLibrary}
          className="mb-6 border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
        >
          <ChevronLeft className="size-4" />
          Back to My Comics
        </Button>

        <div className="text-center">
          <h1 className="comic-heading text-5xl text-comic-yellow sm:text-6xl">
            Create a Comic
          </h1>
          <p className="mt-3 font-comic-neue text-muted-foreground">
            Choose how you want to build your story.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSelectQuickCreate}
          className="comic-card group flex flex-col items-center rounded-lg p-8 text-center transition-transform hover:scale-[1.02]"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-comic-red/20 ring-2 ring-comic-red">
            <Zap className="size-8 text-comic-red" />
          </div>
          <h2 className="font-bangers text-3xl text-comic-yellow">Quick Create</h2>
          <p className="mt-3 font-comic-neue text-sm leading-relaxed text-muted-foreground">
            Dump your whole story in one go — characters, plot, powers, twists.
            Drop images and let the AI figure out the rest.
          </p>
          <span className="mt-4 font-bangers text-sm uppercase tracking-wider text-comic-red">
            Fastest way in
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectWizard}
          className="comic-card group flex flex-col items-center rounded-lg p-8 text-center transition-transform hover:scale-[1.02]"
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-comic-yellow/20 ring-2 ring-comic-yellow">
            <ListOrdered className="size-8 text-comic-yellow" />
          </div>
          <h2 className="font-bangers text-3xl text-comic-yellow">Step by Step</h2>
          <p className="mt-3 font-comic-neue text-sm leading-relaxed text-muted-foreground">
            Walk through story setup, character builder, and review — full
            control over every detail before generation.
          </p>
          <span className="mt-4 font-bangers text-sm uppercase tracking-wider text-comic-yellow">
            Full control
          </span>
        </button>
      </div>
    </div>
  );
}
