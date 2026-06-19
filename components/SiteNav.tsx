"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const shopLinks = [{ href: "/shop", label: "Shop" }];

const creatorLinks = [
  { href: "/create", label: "Create" },
  { href: "/preview", label: "Preview" },
  { href: "/shop", label: "Shop" },
];

export function SiteNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  const isCreatorRoute =
    pathname.startsWith("/create") || pathname.startsWith("/preview");
  const links = isCreatorRoute ? creatorLinks : shopLinks;

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/shop"
          className="font-bangers text-xl tracking-wide text-foreground"
        >
          Comic Forge
        </Link>
        <nav className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-comic-neue text-sm transition-colors hover:text-foreground ${
                pathname.startsWith(link.href)
                  ? "font-bold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
