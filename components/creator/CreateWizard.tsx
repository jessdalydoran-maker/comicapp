"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FolderOpen, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  initialFormData,
  toApiCharacters,
  type CreateFormData,
} from "@/lib/createForm";
import {
  hasCreateDraft,
  loadCreateDraftFormData,
  saveCreateDraft,
} from "@/lib/draftStorage";
import { getPriceForPages } from "@/lib/pricing";
import {
  compressCharacterImages,
  resolveCharacterImages,
} from "@/lib/characterImageStorage";
import { createSavedComic } from "@/lib/comicStorage";
import { savePreviewState } from "@/lib/previewStorage";
import type { GeneratedComic } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CharacterBuilderStep } from "./CharacterBuilderStep";
import { ReviewGenerateStep } from "./ReviewGenerateStep";
import { StorySetupStep } from "./StorySetupStep";

const STEPS = [
  { number: 1, label: "Story" },
  { number: 2, label: "Characters" },
  { number: 3, label: "Generate" },
] as const;

interface CreateWizardProps {
  onBackToLibrary?: () => void;
  onComicCreated?: () => void;
}

export function CreateWizard({ onBackToLibrary }: CreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftAvailable(hasCreateDraft());
  }, []);

  function updateFormData(updates: Partial<CreateFormData>) {
    setFormData((current) => ({ ...current, ...updates }));
  }

  function handleSaveDraft() {
    try {
      saveCreateDraft(formData);
      setDraftAvailable(true);
      setDraftMessage("Draft saved. Character images stay in this browser session.");
    } catch {
      setDraftMessage("Failed to save draft. Please try again.");
    }
  }

  function handleLoadDraft() {
    try {
      setFormData(loadCreateDraftFormData());
      setDraftMessage("Draft loaded.");
      setError(null);
    } catch {
      setDraftMessage("No saved draft found.");
    }
  }

  function canProceedFromStep1(): boolean {
    return Boolean(
      formData.title.trim() && formData.genre && formData.synopsis.trim()
    );
  }

  function canProceedFromStep2(): boolean {
    return (
      formData.characters.length > 0 &&
      formData.characters.every(
        (character) =>
          character.name.trim() &&
          character.powers.trim() &&
          character.personality.trim()
      )
    );
  }

  function goNext() {
    if (step === 1 && !canProceedFromStep1()) return;
    if (step === 2 && !canProceedFromStep2()) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          genre: formData.genre,
          synopsis: formData.synopsis,
          characters: toApiCharacters(formData.characters),
          pageCount: formData.pageCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to generate comic.");
      }

      const comicData = result.comicData as GeneratedComic;
      const apiCharacters = toApiCharacters(formData.characters);
      const resolvedImages = resolveCharacterImages(
        Object.fromEntries(
          formData.characters
            .filter((character) => character.name && character.imageBase64)
            .map((character) => [character.name, character.imageBase64])
        )
      );
      const compressedImages = await compressCharacterImages(resolvedImages);

      const savedComic = await createSavedComic({
        title: comicData.title,
        tagline: comicData.tagline,
        genre: formData.genre,
        pageCount: formData.pageCount,
        comicData,
        characterImages: compressedImages,
        synopsis: formData.synopsis,
        formCharacters: apiCharacters,
        status: "draft",
      });

      await savePreviewState({
        comicId: savedComic.id,
        genre: formData.genre,
        synopsis: formData.synopsis,
        pageCount: formData.pageCount,
        price: getPriceForPages(formData.pageCount),
        comicData,
        characterImages: Object.fromEntries(
          formData.characters
            .filter((character) => character.name && character.imageBase64)
            .map((character) => [character.name, character.name])
        ),
        formCharacters: apiCharacters,
      });

      router.push("/preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="text-center">
        {onBackToLibrary && (
          <div className="mb-4 flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={onBackToLibrary}
              className="border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
            >
              <ChevronLeft className="size-4" />
              Back to Create Options
            </Button>
          </div>
        )}
        <h1 className="comic-heading text-5xl text-comic-yellow sm:text-6xl">
          Comic Creator Studio
        </h1>
        <p className="mt-3 font-comic-neue text-muted-foreground">
          Build your story, cast your characters, and generate your comic.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            className="border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
          >
            <Save className="size-4" />
            Save Draft
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadDraft}
            disabled={!draftAvailable}
            className="border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10 disabled:opacity-40"
          >
            <FolderOpen className="size-4" />
            Load Draft
          </Button>
        </div>
        {draftMessage && (
          <p className="mt-3 font-comic-neue text-sm text-comic-yellow">
            {draftMessage}
          </p>
        )}
      </div>

      <nav aria-label="Wizard progress" className="flex justify-center gap-3">
        {STEPS.map((wizardStep) => {
          const isActive = step === wizardStep.number;
          const isComplete = step > wizardStep.number;

          return (
            <div
              key={wizardStep.number}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                isActive && "comic-step-active",
                isComplete && "comic-step-complete",
                !isActive && !isComplete && "comic-step-inactive"
              )}
            >
              <span className="font-bangers text-lg">{wizardStep.number}</span>
              <span className="hidden font-comic-neue sm:inline">
                {wizardStep.label}
              </span>
            </div>
          );
        })}
      </nav>

      {step === 1 && (
        <StorySetupStep data={formData} onChange={updateFormData} />
      )}
      {step === 2 && (
        <CharacterBuilderStep data={formData} onChange={updateFormData} />
      )}
      {step === 3 && (
        <ReviewGenerateStep
          data={formData}
          isLoading={isLoading}
          error={error}
          onGenerate={handleGenerate}
        />
      )}

      {step < 3 && (
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
            className="border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={goNext}
            disabled={
              (step === 1 && !canProceedFromStep1()) ||
              (step === 2 && !canProceedFromStep2())
            }
            className="bg-comic-yellow font-bold text-black hover:bg-comic-yellow/90"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 3 && !isLoading && (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            className="border-comic-yellow/50 bg-transparent text-comic-yellow hover:bg-comic-yellow/10"
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
