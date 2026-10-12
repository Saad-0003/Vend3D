import { Logo } from "@/components/shared/logo";
import { CartButton } from "@/components/shared/cart-button";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { NavAuthButton } from "@/components/shared/nav-auth-button";

/**
 * Sticky storefront header. Auth state is Phase 3: the avatar opens a sign-in
 * dialog when signed out and the account menu when signed in, with the cart
 * badge alongside. `NavAuthButton` is the one client island here, so the sticky
 * shell itself still renders server-side.
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
          <NavAuthButton />
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
