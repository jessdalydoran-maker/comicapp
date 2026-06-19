"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { initialFormData, type CreateFormData } from "@/lib/createForm";
import { getPriceForPages } from "@/lib/pricing";
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

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFormData(updates: Partial<CreateFormData>) {
    setFormData((current) => ({ ...current, ...updates }));
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
          characters: formData.characters,
          pageCount: formData.pageCount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to generate comic.");
      }

      const comicData = result.comicData as GeneratedComic;
      const characterImages = Object.fromEntries(
        formData.characters
          .filter((character) => character.name && character.imageBase64)
          .map((character) => [character.name, character.imageBase64])
      );

      savePreviewState({
        genre: formData.genre,
        synopsis: formData.synopsis,
        pageCount: formData.pageCount,
        price: getPriceForPages(formData.pageCount),
        comicData,
        characterImages,
        formCharacters: formData.characters,
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
        <h1 className="comic-heading text-5xl text-comic-yellow sm:text-6xl">
          Comic Creator Studio
        </h1>
        <p className="mt-3 font-comic-neue text-muted-foreground">
          Build your story, cast your characters, and generate your comic.
        </p>
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
