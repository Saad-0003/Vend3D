"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { AccountBodySkeleton } from "@/components/ui/route-skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firstNameOf } from "@/lib/account/profile";
import { useAuthStore } from "@/stores/auth-store";
import { useDesignsStore } from "@/stores/designs-store";
import { useOrdersStore } from "@/stores/orders-store";
import {
  AddressesPanel,
  OrdersPanel,
  ProfilePanel,
  SavedDesignsPanel,
  SettingsPanel,
} from "@/components/account/account-panels";

const TABS = ["profile", "orders", "designs", "addresses", "settings"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  profile: "Profile",
  orders: "Orders",
  designs: "Saved designs",
  addresses: "Addresses",
  settings: "Settings",
};

/** SSR-safe media query — `false` on the first paint, then hydrated. */
function useMediaQuery(q: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(q);
    setMatches(m.matches);
    const on = () => setMatches(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return matches;
}

/**
 * `/account` — the signed-in home plan.md Phase 3 sends `?next=` to by default.
 *
 * The vertical tab list is a stacked nav on desktop and a horizontally
 * scrollable chip row below `lg`; the orientation prop follows the same
 * breakpoint so Radix's arrow-key navigation always matches what is on screen.
 *
 * The panel card is the landing-page card recipe (28px radius, hairline,
 * `--surface-1`, inner highlight) rather than a new surface — DESIGN.md rule 3.
 *
 * Everything behind these tabs is a shell for now: profile, addresses and
 * settings hold local state, orders and designs read the same client stores
 * their full screens use, and Phase 3's server session replaces both.
 */
export function AccountScreen() {
  const user = useAuthStore((s) => s.user);
  const designCount = useDesignsStore((s) => s.designs.length);
  const orderCount = useOrdersStore((s) => s.orders.length);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [ready, setReady] = useState(false);

  // Both stores persist with `skipHydration`, so the panels must be handed a
  // hydrated store rather than reading an empty one on the first paint.
  useEffect(() => {
    useDesignsStore.persist.rehydrate();
    useOrdersStore.persist.rehydrate();
    setReady(true);
  }, []);

  // `RequireAuth` only mounts this once a session exists, so the null branch is
  // here for the type system rather than a reachable state.
  if (!user) return null;

  return (
    <PageShell aria-label="Account" className="lux flex flex-col gap-10">
      <PageHeader
        eyebrow="Account"
        title={`Hi, ${firstNameOf(user.name, user.email)}.`}
        intro="Your profile, orders and saved designs. This demo keeps them in this browser until Phase 3 wires them to a real account."
      />

      {!ready ? (
        <div role="status" aria-label="Loading account">
          <AccountBodySkeleton />
        </div>
      ) : (
        <Tabs
          defaultValue="profile"
          orientation={isDesktop ? "vertical" : "horizontal"}
          className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10"
        >
          <TabsList
            variant="line"
            aria-label="Account sections"
            className="h-auto w-full min-w-0 justify-start gap-1 overflow-x-auto bg-transparent p-0 lg:w-56 lg:shrink-0 lg:overflow-visible"
          >
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="shrink-0 rounded-full px-4 py-2 text-[13px] whitespace-nowrap text-[var(--muted)] hover:text-[var(--ivory)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--ivory)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--hairline-strong)]"
              >
                {TAB_LABELS[tab]}
                {tab === "orders" || tab === "designs" ? (
                  <span className="lux-mono lux-tabular ml-2 text-[11px] text-[var(--faint)]">
                    {tab === "orders" ? orderCount : designCount}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-w-0 flex-1 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-8">
            <TabsContent value="profile" className="mt-0">
              <ProfilePanel user={user} />
            </TabsContent>
            <TabsContent value="orders" className="mt-0">
              <OrdersPanel />
            </TabsContent>
            <TabsContent value="designs" className="mt-0">
              <SavedDesignsPanel />
            </TabsContent>
            <TabsContent value="addresses" className="mt-0">
              <AddressesPanel />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <SettingsPanel />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </PageShell>
  );
}
