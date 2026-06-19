import type { PurchaseRecord, PublishedComic } from "./types";
import { getPublishedComicById } from "./shopStorage";

const PURCHASES_KEY = "comic-forge-purchases";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getPurchases(): PurchaseRecord[] {
  if (!isClient()) return [];

  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PurchaseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPurchaseById(id: string): PurchaseRecord | undefined {
  return getPurchases().find((purchase) => purchase.id === id);
}

export function savePurchase(purchase: PurchaseRecord): void {
  if (!isClient()) return;

  const purchases = getPurchases();
  localStorage.setItem(PURCHASES_KEY, JSON.stringify([purchase, ...purchases]));
}

export function hasPurchasedComic(comicId: string): PurchaseRecord | undefined {
  return getPurchases().find((purchase) => purchase.comicId === comicId);
}

export function getComicForPurchase(
  purchaseId: string
): { purchase: PurchaseRecord; comic: PublishedComic } | null {
  const purchase = getPurchaseById(purchaseId);
  if (!purchase) return null;

  const comic = getPublishedComicById(purchase.comicId);
  if (!comic) return null;

  return { purchase, comic };
}

export function createPurchase(comicId: string): PurchaseRecord {
  const purchase: PurchaseRecord = {
    id: crypto.randomUUID(),
    comicId,
    purchasedAt: new Date().toISOString(),
  };
  savePurchase(purchase);
  return purchase;
}
