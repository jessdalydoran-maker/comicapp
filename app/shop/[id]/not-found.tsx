import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ShopNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-bangers text-4xl">Comic Not Found</h1>
      <p className="text-muted-foreground">
        This listing may have been removed or the link is incorrect.
      </p>
      <Button asChild>
        <Link href="/shop">Back to Shop</Link>
      </Button>
    </div>
  );
}
