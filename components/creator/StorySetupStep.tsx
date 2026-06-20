"use client";

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
  GENRES,
  PAGE_COUNTS,
  type CreateFormData,
} from "@/lib/createForm";
import { getPriceForPages } from "@/lib/pricing";

interface StorySetupStepProps {
  data: CreateFormData;
  onChange: (updates: Partial<CreateFormData>) => void;
}

export function StorySetupStep({ data, onChange }: StorySetupStepProps) {
  const price = getPriceForPages(data.pageCount);

  return (
    <Card className="comic-card border-comic-yellow bg-card">
      <CardHeader>
        <CardTitle className="comic-heading text-3xl text-comic-yellow">
          Step 1: Story Setup
        </CardTitle>
        <CardDescription className="font-comic-neue text-muted-foreground">
          Set the stage for your comic adventure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-comic-yellow">
            Comic Title
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="The Legend of..."
            className="border-comic-yellow/50 bg-black/50 font-comic-neue focus-visible:ring-comic-yellow"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-comic-yellow">Genre</Label>
          <Select
            value={data.genre || undefined}
            onValueChange={(value) =>
              onChange({ genre: value as CreateFormData["genre"] })
            }
          >
            <SelectTrigger className="w-full border-comic-yellow/50 bg-black/50 font-comic-neue text-white">
              <SelectValue placeholder="Pick a genre" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="border-comic-yellow bg-[#111] text-white"
            >
              {GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis" className="text-comic-yellow">
            Story Synopsis
          </Label>
          <Textarea
            id="synopsis"
            value={data.synopsis}
            onChange={(event) => onChange({ synopsis: event.target.value })}
            placeholder="What happens in this comic? This synopsis drives the AI script generation..."
            rows={6}
            className="border-comic-yellow/50 bg-black/50 font-comic-neue focus-visible:ring-comic-yellow"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-comic-yellow">Number of Pages</Label>
          <Select
            value={String(data.pageCount)}
            onValueChange={(value) =>
              onChange({
                pageCount: Number(value) as CreateFormData["pageCount"],
              })
            }
          >
            <SelectTrigger className="w-full border-comic-yellow/50 bg-black/50 font-comic-neue text-white">
              <SelectValue placeholder="Select page count" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="border-comic-yellow bg-[#111] text-white"
            >
              {PAGE_COUNTS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} pages · {getPriceForPages(count)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="font-comic-neue text-sm text-comic-yellow">
            Price: {price}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
