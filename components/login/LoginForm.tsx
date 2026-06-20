"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginDebugInfo {
  status?: number;
  apiReached: boolean;
  apiVersion?: string;
  receivedPasswordLength?: number;
  expectedPasswordLength?: number;
  message?: string;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/create";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<LoginDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    const trimmedPassword = password.trim();
    const apiUrl = `${window.location.origin}/api/login`;

    console.log("[LoginForm] submitting", {
      apiUrl,
      passwordLength: trimmedPassword.length,
      redirect,
    });

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ password: trimmedPassword }),
      });

      const apiVersion = response.headers.get("X-Login-Api-Version") ?? undefined;
      const responseText = await response.text();
      let result: Record<string, unknown> = {};

      try {
        result = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        console.error("[LoginForm] non-JSON response", {
          status: response.status,
          responseText: responseText.slice(0, 200),
        });

        setDebugInfo({
          apiReached: response.status !== 404,
          status: response.status,
          apiVersion,
          message: "API did not return JSON",
        });
        setError(
          response.status === 404
            ? "Login API not found (404). The latest deployment may not be live yet."
            : "Login API returned an unexpected response."
        );
        return;
      }

      console.log("[LoginForm] API response", {
        status: response.status,
        ok: response.ok,
        result,
        apiVersion,
      });

      const resultDebug =
        result.debug && typeof result.debug === "object"
          ? (result.debug as Record<string, unknown>)
          : null;

      setDebugInfo({
        apiReached: true,
        status: response.status,
        apiVersion:
          apiVersion ??
          (typeof resultDebug?.apiVersion === "string"
            ? resultDebug.apiVersion
            : undefined),
        receivedPasswordLength:
          typeof resultDebug?.receivedPasswordLength === "number"
            ? resultDebug.receivedPasswordLength
            : undefined,
        expectedPasswordLength:
          typeof resultDebug?.expectedPasswordLength === "number"
            ? resultDebug.expectedPasswordLength
            : undefined,
      });

      if (!response.ok) {
        setError(
          typeof result.error === "string"
            ? result.error
            : "Wrong password. This is a private creator studio."
        );
        return;
      }

      window.location.assign(redirect);
    } catch (fetchError) {
      console.error("[LoginForm] fetch failed", fetchError);

      setDebugInfo({
        apiReached: false,
        message:
          fetchError instanceof Error ? fetchError.message : "Network error",
      });
      setError("Could not reach the login API. Check your connection and retry.");
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
              name="password"
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

          {debugInfo && (
            <pre className="overflow-x-auto rounded-lg border border-comic-yellow/30 bg-black/40 p-3 font-mono text-[10px] text-comic-yellow">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
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
