"use client";

import { useState } from "react";

import { CreateModePicker } from "./CreateModePicker";
import { CreateWizard } from "./CreateWizard";
import { MyComics } from "./MyComics";
import { QuickCreate } from "./QuickCreate";

type StudioView = "library" | "mode-picker" | "quick-create" | "wizard";

export function CreateStudio() {
  const [view, setView] = useState<StudioView>("library");

  if (view === "wizard") {
    return (
      <CreateWizard
        onBackToLibrary={() => setView("mode-picker")}
        onComicCreated={() => setView("library")}
      />
    );
  }

  if (view === "quick-create") {
    return <QuickCreate onBack={() => setView("mode-picker")} />;
  }

  if (view === "mode-picker") {
    return (
      <CreateModePicker
        onSelectQuickCreate={() => setView("quick-create")}
        onSelectWizard={() => setView("wizard")}
        onBackToLibrary={() => setView("library")}
      />
    );
  }

  return <MyComics onCreateNew={() => setView("mode-picker")} />;
}
