import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/profile", label: "Profile" },
];

export function Nav({ email }: { email: string | undefined }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <span className="font-heading text-sm font-semibold">Job Seeker</span>
          <nav className="flex items-center gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="text-sm text-muted-foreground">{email}</span>}
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
