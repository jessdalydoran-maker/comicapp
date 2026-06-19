"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/create";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ?? "Wrong password. This is a private creator studio."
        );
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="comic-create flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border-[3px] border-comic-yellow bg-black shadow-[4px_4px_0_#E8192C]">
            <Lock className="size-8 text-comic-yellow" />
          </div>
          <h1 className="comic-heading text-5xl text-comic-yellow">
            Creator Studio
          </h1>
          <p className="font-comic-neue text-muted-foreground">
            Private access only. Enter the creator password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="comic-card space-y-6 rounded-lg p-8 text-left"
        >
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="font-comic-neue text-sm font-medium text-comic-yellow"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter creator password"
              autoComplete="current-password"
              className="border-comic-yellow/50 bg-black/50 font-comic-neue focus-visible:ring-comic-yellow"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-comic-red bg-comic-red/10 px-4 py-3 font-comic-neue text-sm text-comic-red">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="h-12 w-full bg-comic-red font-bangers text-xl text-white hover:bg-comic-red/90"
          >
            <Zap className="size-5" />
            {isLoading ? "Checking..." : "Enter Studio"}
          </Button>
        </form>
      </div>
    </div>
  );
}
