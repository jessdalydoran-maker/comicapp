"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { DialogueLine, DialogueType, Panel } from "@/lib/types";

interface PanelEditModalProps {
  panel: Panel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (panel: Panel) => void;
}

export function PanelEditModal({
  panel,
  open,
  onOpenChange,
  onSave,
}: PanelEditModalProps) {
  const [draft, setDraft] = useState<Panel | null>(panel);

  useEffect(() => {
    setDraft(panel);
  }, [panel]);

  if (!draft) return null;

  function updateField<K extends keyof Panel>(field: K, value: Panel[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function updateDialogue(
    index: number,
    field: keyof DialogueLine,
    value: string
  ) {
    setDraft((current) => {
      if (!current) return current;
      const dialogue = current.dialogue.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      );
      return { ...current, dialogue };
    });
  }

  function handleSave() {
    if (draft) {
      onSave(draft);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bangers text-2xl tracking-wide">
            Edit Panel {draft.panelNumber}
          </DialogTitle>
          <DialogDescription className="font-comic-neue">
            Change dialogue, action, or caption for this panel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-action">Action</Label>
            <Textarea
              id="edit-action"
              value={draft.action}
              onChange={(event) => updateField("action", event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-caption">Caption</Label>
            <Input
              id="edit-caption"
              value={draft.caption ?? ""}
              onChange={(event) =>
                updateField("caption", event.target.value || null)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Dialogue</Label>
            {draft.dialogue.map((line, index) => (
              <div
                key={`edit-dialogue-${index}`}
                className="grid gap-2 rounded border p-2 sm:grid-cols-2"
              >
                <Input
                  placeholder="Character"
                  value={line.character}
                  onChange={(event) =>
                    updateDialogue(index, "character", event.target.value)
                  }
                />
                <Select
                  value={line.type}
                  onValueChange={(value) =>
                    updateDialogue(index, "type", value as DialogueType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="speech">Speech</SelectItem>
                    <SelectItem value="thought">Thought</SelectItem>
                    <SelectItem value="narration">Narration</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Dialogue text"
                  value={line.text}
                  className="sm:col-span-2"
                  onChange={(event) =>
                    updateDialogue(index, "text", event.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Panel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
