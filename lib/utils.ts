import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function parseApiJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "Empty response from server."
        : `Server error (${response.status}). Please try again.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "Invalid response from server. Please try again."
        : `Server error (${response.status}). Please try again.`
    );
  }
}
