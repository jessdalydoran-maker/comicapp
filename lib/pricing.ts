export const PAGE_COUNTS = [4, 8, 12, 16] as const;

export type PageCount = (typeof PAGE_COUNTS)[number];

const PAGE_PRICES: Record<PageCount, string> = {
  4: "£2.99",
  8: "£4.99",
  12: "£6.99",
  16: "£9.99",
};

export function getPriceForPages(pages: number): string {
  if (pages in PAGE_PRICES) {
    return PAGE_PRICES[pages as PageCount];
  }
  return PAGE_PRICES[8];
}
