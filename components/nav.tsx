"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";

const links = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

export function Nav({ email }: { email: string | undefined }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <span className="font-heading text-sm font-semibold">Job Seeker</span>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {email && <span className="text-sm text-muted-foreground">{email}</span>}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" className="md:hidden">
                <MenuIcon className="size-4" />
                <span className="sr-only">Menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                  <span className={isActive ? "font-medium text-foreground" : undefined}>
                    {link.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            {email && <DropdownMenuLabel className="text-muted-foreground">{email}</DropdownMenuLabel>}
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
