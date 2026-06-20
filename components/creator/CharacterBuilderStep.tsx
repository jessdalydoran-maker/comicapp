"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Plus, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CHARACTER_ROLES,
  MAX_CHARACTERS,
  createEmptyCharacter,
  type CreateFormData,
} from "@/lib/createForm";
import type { Character, CharacterRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CharacterBuilderStepProps {
  data: CreateFormData;
  onChange: (updates: Partial<CreateFormData>) => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CharacterImageDropzone({
  imageBase64,
  onImageChange,
}: {
  imageBase64: string;
  onImageChange: (base64: string) => void;
}) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onImageChange(await readFileAsBase64(file));
      }
    },
    [onImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex h-32 w-32 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
        isDragActive
          ? "border-comic-yellow bg-comic-yellow/10"
          : "border-comic-yellow/40 bg-black/40 hover:border-comic-yellow"
      )}
    >
      <input {...getInputProps()} />
      {imageBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageBase64}
          alt="Character preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <ImagePlus className="mb-1 size-6 text-comic-yellow/70" />
          <span className="px-2 text-center font-comic-neue text-[10px] text-muted-foreground">
            Drop image or click
          </span>
        </>
      )}
    </div>
  );
}

export function CharacterBuilderStep({
  data,
  onChange,
}: CharacterBuilderStepProps) {
  function updateCharacters(characters: Character[]) {
    onChange({ characters });
  }

  function updateCharacter(index: number, updates: Partial<Character>) {
    updateCharacters(
      data.characters.map((character, i) =>
        i === index ? { ...character, ...updates } : character
      )
    );
  }

  function addCharacter() {
    if (data.characters.length >= MAX_CHARACTERS) return;
    updateCharacters([...data.characters, createEmptyCharacter()]);
  }

  function removeCharacter(index: number) {
    updateCharacters(data.characters.filter((_, i) => i !== index));
  }

  return (
    <Card className="comic-card border-comic-yellow bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="comic-heading text-3xl text-comic-yellow">
              Step 2: Characters
            </CardTitle>
            <CardDescription className="font-comic-neue text-muted-foreground">
              Add up to {MAX_CHARACTERS} characters. Images appear inside comic
              panels.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addCharacter}
            disabled={data.characters.length >= MAX_CHARACTERS}
            className="bg-comic-red text-white hover:bg-comic-red/90"
          >
            <Plus className="size-4" />
            Add Character
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-comic-yellow/30 py-12 text-center">
            <User className="mb-3 size-12 text-comic-yellow/50" />
            <p className="font-comic-neue text-muted-foreground">
              No characters yet. Add your first character to get started!
            </p>
            <Button
              type="button"
              onClick={addCharacter}
              className="mt-4 bg-comic-yellow text-black hover:bg-comic-yellow/90"
            >
              <Plus className="size-4" />
              Add First Character
            </Button>
          </div>
        ) : (
          data.characters.map((character, index) => (
            <div
              key={`character-${index}`}
              className="flex flex-col gap-4 rounded-lg border-2 border-comic-red/40 bg-black/40 p-4 sm:flex-row"
            >
              <CharacterImageDropzone
                imageBase64={character.imageBase64}
                onImageChange={(base64) =>
                  updateCharacter(index, { imageBase64: base64 })
                }
              />

              <div className="flex flex-1 flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label
                      htmlFor={`char-name-${index}`}
                      className="text-comic-yellow"
                    >
                      Name
                    </Label>
                    <Input
                      id={`char-name-${index}`}
                      value={character.name}
                      onChange={(event) =>
                        updateCharacter(index, { name: event.target.value })
                      }
                      placeholder="Character name"
                      className="border-comic-yellow/50 bg-black/50 font-comic-neue"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-comic-yellow">Role</Label>
                    <Select
                      value={character.role}
                      onValueChange={(value) =>
                        updateCharacter(index, {
                          role: value as CharacterRole,
                        })
                      }
                    >
                      <SelectTrigger className="w-full border-comic-yellow/50 bg-black/50 font-comic-neue text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="border-comic-yellow bg-[#111] text-white"
                      >
                        {CHARACTER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`char-powers-${index}`}
                    className="text-comic-yellow"
                  >
                    Powers
                  </Label>
                  <Textarea
                    id={`char-powers-${index}`}
                    value={character.powers}
                    onChange={(event) =>
                      updateCharacter(index, { powers: event.target.value })
                    }
                    placeholder="Super strength, telepathy, gadgets..."
                    rows={2}
                    className="border-comic-yellow/50 bg-black/50 font-comic-neue"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`char-personality-${index}`}
                    className="text-comic-yellow"
                  >
                    Personality
                  </Label>
                  <Textarea
                    id={`char-personality-${index}`}
                    value={character.personality}
                    onChange={(event) =>
                      updateCharacter(index, {
                        personality: event.target.value,
                      })
                    }
                    placeholder="Brave, sarcastic, mysterious..."
                    rows={2}
                    className="border-comic-yellow/50 bg-black/50 font-comic-neue"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeCharacter(index)}
                className="shrink-0 text-comic-red hover:bg-comic-red/20 hover:text-comic-red"
                aria-label={`Remove character ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}

        <p className="text-center font-comic-neue text-xs text-muted-foreground">
          {data.characters.length} / {MAX_CHARACTERS} characters
        </p>
      </CardContent>
    </Card>
  );
}
