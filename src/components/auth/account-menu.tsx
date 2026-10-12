"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, Shapes, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthStore } from "@/stores/auth-store";

/**
 * The signed-in navbar menu. Radix `Popover` over the avatar: Account, Designs,
 * Orders, Sign out — the four destinations plan.md Phase 3 puts on the navbar.
 *
 * Sign out navigates to the shop rather than leaving a stale page, because
 * several of the routes behind this menu are shopper-scoped and would otherwise
 * render a just-invalidated session.
 */
export function AccountMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  async function handleSignOut() {
    await signOut();
    router.push("/shop");
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="lux w-60 rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-2 [box-shadow:var(--inner-highlight)]"
      >
        <div className="flex items-center gap-3 rounded-[12px] px-2 py-2">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--lime)] text-[13px] font-medium text-[var(--ink)]"
          >
            {initial}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] text-[var(--ivory)]">{user?.name ?? "Account"}</span>
            <span className="truncate text-[11px] text-[var(--muted)]">{user?.email}</span>
          </span>
        </div>

        <div className="my-1 h-px bg-[var(--hairline)]" role="separator" />

        <ul className="flex flex-col gap-0.5">
          <MenuItem href="/account" icon={<User className="size-4" strokeWidth={1.5} aria-hidden />}>
            Account
          </MenuItem>
          <MenuItem href="/designs" icon={<Shapes className="size-4" strokeWidth={1.5} aria-hidden />}>
            Designs
          </MenuItem>
          <MenuItem href="/orders" icon={<Package className="size-4" strokeWidth={1.5} aria-hidden />}>
            Orders
          </MenuItem>
        </ul>

        <div className="my-1 h-px bg-[var(--hairline)]" role="separator" />

        <Button
          type="button"
          variant="ghost"
          onClick={handleSignOut}
          className="h-10 w-full justify-start gap-3 rounded-[12px] px-2 text-[13px] text-[var(--ivory)] hover:bg-[var(--surface-2)]"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
          Sign out
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-[12px] px-2 py-2 text-[13px] text-[var(--ivory)] transition-colors hover:bg-[var(--surface-2)]"
      >
        {icon}
        {children}
      </Link>
    </li>
  );
}
