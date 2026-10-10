import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { CartButton } from "@/components/shared/cart-button";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

/**
 * Sticky storefront header. Auth state is a Phase 3 concern: until then the
 * avatar is a static entry point to `/login` and the cart badge shows zero.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-1 sm:px-6">
      <div className="bg-background/80 ring-foreground/10 mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-6 rounded-full px-4 ring-1 backdrop-blur-xl sm:px-5">
        <Logo />

        <nav aria-label="Main">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-1">
          <CartButton />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Account"
            className="bg-primary text-primary-foreground hover:bg-primary/85 size-8 rounded-full"
          >
            <Link href="/login">
              <User className="size-4" strokeWidth={1.5} />
            </Link>
          </Button>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
