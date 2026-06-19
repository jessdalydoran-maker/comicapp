"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createPurchase, hasPurchasedComic } from "@/lib/purchaseStorage";

interface BuyButtonProps {
  comicId: string;
  price: string;
  className?: string;
}

export function BuyButton({ comicId, price, className }: BuyButtonProps) {
  const router = useRouter();
  const existingPurchase = hasPurchasedComic(comicId);

  function handleBuy() {
    // TODO: Connect Stripe
    const purchase = createPurchase(comicId);
    router.push(`/read/${purchase.id}`);
  }

  if (existingPurchase) {
    return (
      <Button
        asChild
        className={
          className ?? "w-full bg-comic-yellow font-bangers text-black hover:bg-comic-yellow/90"
        }
      >
        <Link href={`/read/${existingPurchase.id}`}>Read Now</Link>
      </Button>
    );
  }

  return (
    <Button className={className ?? "w-full font-bangers"} onClick={handleBuy}>
      Buy Now · {price}
    </Button>
  );
}
