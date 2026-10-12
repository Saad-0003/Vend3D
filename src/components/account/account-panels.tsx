"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Package, Pencil, Plus, RotateCcw, Shapes, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DesignCard } from "@/components/designs/design-card";
import { initialsOf } from "@/lib/account/profile";
import { formatCents } from "@/lib/format";
import { formatOrderDate, type OrderRecord } from "@/lib/checkout/order";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useDesignsStore } from "@/stores/designs-store";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * The five `/account` panels.
 *
 * Orders and Saved designs read the same client stores their full screens use,
 * so they are real data and not fixtures. Profile, Addresses and Settings are
 * deliberately local state: this is the shell, and plan.md Phase 3 replaces
 * each one with a server action over the real account.
 */

/** Panel reveal: one per panel entry, rows inside stagger further where they can. */
const REVEAL = { inView: false, direction: "up", offset: 8, duration: 0.6, blur: "8px" } as const;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <BlurFade {...REVEAL} className="flex flex-col gap-8">
      {children}
    </BlurFade>
  );
}

function PanelTitle({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="lux-display text-[22px] text-[var(--ivory)]">{children}</h2>
      {description ? (
        <p className="max-w-[52ch] text-[14px] leading-[1.6] text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ profile */

export function ProfilePanel({ user }: { user: AuthUser }) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /** Local preview only — the file never leaves the browser (AGENTS.md §Security). */
  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Upload failed: PNG, JPG or SVG under 2 MB only");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  return (
    <Panel>
      <PanelTitle description="How you appear across the studio. A demo shell — nothing is sent anywhere yet.">
        Profile
      </PanelTitle>

      <div className="flex flex-wrap items-center gap-5">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--hairline-strong)]">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="lux-display text-[22px] text-[var(--ivory)]" aria-hidden>
              {initialsOf(name, user.email)}
            </span>
          )}
        </span>

        <div className="flex flex-col items-start gap-2">
          <Button
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
          >
            <Upload className="size-4" strokeWidth={1.5} aria-hidden />
            Upload photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => pick(e.target.files?.[0])}
            className="sr-only"
            aria-label="Upload a profile photo"
          />
          <p className="text-[12px] text-[var(--muted)]">PNG or JPG under 2 MB. Preview only.</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="account-name">
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </Field>
        <Field label="Email" htmlFor="account-email">
          <Input
            id="account-email"
            value={user.email}
            readOnly
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--muted)]"
          />
          <p className="text-[12px] text-[var(--faint)]">
            Changing an email needs verification — Phase 3.
          </p>
        </Field>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => toast.success("Profile updated", { description: name || user.email })}
          className="h-11 rounded-full bg-[var(--lime)] px-6 text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          Save changes
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------- orders */

export function OrdersPanel() {
  const orders = useOrdersStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <Panel>
        <PanelTitle description="Every demo order you place, with its items and shipping address.">
          Orders
        </PanelTitle>
        <EmptyState
          eyebrow="No orders yet"
          title="No orders yet."
          body="Check out with the demo card and the order lands here, ready to reorder."
          icon={<Package className="size-7" strokeWidth={1.5} aria-hidden />}
          action={
            <Button asChild className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
              <Link href="/shop">Browse the collection</Link>
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelTitle description="Expand an order for its items, address and a one-click reorder.">
        Orders
      </PanelTitle>

      <Accordion type="single" collapsible className="flex flex-col">
        {orders.map((order, index) => (
          <BlurFade key={order.id} {...REVEAL} delay={index * 0.05}>
            <AccordionItem value={order.id} className="border-[var(--hairline)] px-0">
              <AccordionTrigger className="py-5 hover:text-[var(--ivory)]">
                <span className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2 pr-2">
                  <span className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">{order.id}</span>
                  <span className="text-[13px] text-[var(--muted)]">{formatOrderDate(order.createdAt)}</span>
                  <span className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">
                    {formatCents(order.totalCents)}
                  </span>
                  <Badge
                    variant="outline"
                    className="lux-mono rounded-full border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] px-2.5 py-1 text-[10px] tracking-[0.14em] text-[var(--lime)] uppercase"
                  >
                    {order.status}
                  </Badge>
                </span>
              </AccordionTrigger>

              <AccordionContent className="flex flex-col gap-5">
                <ul className="flex flex-col gap-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] text-[var(--ivory)]">{item.name}</span>
                        <span className="lux-mono text-[11px] text-[var(--muted)]">
                          Qty {item.qty} · {formatCents(item.unitCents)}
                        </span>
                      </span>
                      <span className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">
                        {formatCents(item.qty * item.unitCents)}
                      </span>
                    </li>
                  ))}
                </ul>

                <address className="flex flex-col gap-1 rounded-[var(--inner-radius)] bg-[var(--surface-2)] p-4 text-[13px] leading-[1.6] text-[var(--muted)] not-italic">
                  <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
                    Shipped to
                  </span>
                  <span className="text-[var(--ivory)]">{order.address.fullName}</span>
                  <span>
                    {order.address.address}, {order.address.city} {order.address.postalCode}
                  </span>
                  <span>
                    {order.address.phone} · {order.cardBrand} •••• {order.cardLast4}
                  </span>
                </address>

                <Button
                  variant="ghost"
                  onClick={() => reorder(order)}
                  className="h-11 w-fit rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
                >
                  <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden />
                  Reorder
                </Button>
              </AccordionContent>
            </AccordionItem>
          </BlurFade>
        ))}
      </Accordion>
    </Panel>
  );
}

/** Puts every line of a past order back in the cart, at its ordered price. */
function reorder(order: OrderRecord) {
  const addLine = useCartStore.getState().addLine;
  for (const item of order.items) {
    addLine({
      slug: item.slug,
      name: item.name,
      configuration: item.configuration,
      thumbnail: item.thumbnail ?? "",
      qty: item.qty,
      unitCents: item.unitCents,
    });
  }
  useCartStore.getState().setDrawerOpen(true);
  toast("Back in your cart", {
    description: `${order.itemCount} item${order.itemCount === 1 ? "" : "s"} from ${order.id}.`,
  });
}

/* ----------------------------------------------------------- saved designs */

export function SavedDesignsPanel() {
  const designs = useDesignsStore((s) => s.designs);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (designs.length === 0) {
    return (
      <Panel>
        <PanelTitle description="Configurations you saved in the studio, with their price and palette.">
          Saved designs
        </PanelTitle>
        <EmptyState
          eyebrow="Nothing saved yet"
          title="Nothing shaped yet."
          body="Save a design from the studio and it appears here, ready to reopen or order."
          icon={<Shapes className="size-7" strokeWidth={1.5} aria-hidden />}
          action={
            <Button asChild className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
              <Link href="/studio">Start designing</Link>
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelTitle description="Your four most recent designs. The library has the full set.">
        Saved designs
      </PanelTitle>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {designs.slice(0, 4).map((design) => (
          <DesignCard key={design.id} design={design} now={now} />
        ))}
      </ul>

      {designs.length > 4 ? (
        <Button asChild variant="ghost" className="h-11 w-fit rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
          <Link href="/designs">Open all {designs.length} designs</Link>
        </Button>
      ) : null}
    </Panel>
  );
}

/* ---------------------------------------------------------------- addresses */

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

const BLANK_ADDRESS: Omit<Address, "id"> = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
};

export function AddressesPanel() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);
  const [adding, setAdding] = useState(false);
  const open = adding || editing !== null;

  function save(next: Omit<Address, "id">) {
    if (editing) {
      setAddresses((list) => list.map((a) => (a.id === editing.id ? { ...a, ...next } : a)));
      toast.success("Address updated", { description: next.label });
    } else {
      setAddresses((list) => [{ ...next, id: `a-${Date.now().toString(36)}` }, ...list]);
      toast.success("Address added", { description: next.label });
    }
    setEditing(null);
    setAdding(false);
  }

  return (
    <Panel>
      <PanelTitle description="Demo shipping addresses. Phase 9 stores them on the account.">
        Addresses
      </PanelTitle>

      {addresses.length === 0 ? (
        <EmptyState
          eyebrow="No addresses yet"
          title="No addresses yet."
          body="Add one now and checkout will pre-fill the shipping form."
          icon={<MapPin className="size-7" strokeWidth={1.5} aria-hidden />}
          action={
            <Button
              onClick={() => setAdding(true)}
              className="h-11 rounded-full bg-[var(--lime)] px-6 text-[var(--ink)] hover:bg-[var(--lime)]/90"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
              Add address
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {addresses.map((address, index) => (
              <BlurFade key={address.id} {...REVEAL} delay={index * 0.05}>
                <div className="flex items-start justify-between gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="lux-eyebrow text-[var(--lime)]">{address.label}</span>
                    <span className="text-[14px] text-[var(--ivory)]">{address.fullName}</span>
                    <span className="text-[13px] leading-[1.6] text-[var(--muted)]">
                      {address.address}, {address.city} {address.postalCode}
                    </span>
                    <span className="text-[13px] text-[var(--muted)]">{address.phone}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${address.label} address`}
                      onClick={() => setEditing(address)}
                      className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
                    >
                      <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${address.label} address`}
                      onClick={() => {
                        setAddresses((list) => list.filter((a) => a.id !== address.id));
                        toast("Address deleted", { description: address.label });
                      }}
                      className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--destructive)]"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                    </Button>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>

          <Button
            onClick={() => setAdding(true)}
            variant="ghost"
            className="h-11 w-fit rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            Add address
          </Button>
        </>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setAdding(false);
            setEditing(null);
          }
        }}
      >
        {/* Keyed so switching between "add" and a saved address remounts the
            draft instead of carrying the previous form's values over. */}
        <AddressDialog key={editing?.id ?? "new"} initial={editing} onSave={save} />
      </Dialog>
    </Panel>
  );
}

function AddressDialog({
  initial,
  onSave,
}: {
  initial: Address | null;
  onSave: (address: Omit<Address, "id">) => void;
}) {
  const [draft, setDraft] = useState<Omit<Address, "id">>(initial ?? BLANK_ADDRESS);
  const complete =
    draft.fullName.trim() !== "" &&
    draft.address.trim() !== "" &&
    draft.city.trim() !== "" &&
    draft.postalCode.trim() !== "";

  const set = (key: keyof Omit<Address, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <DialogContent className="lux gap-5 rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-[var(--ivory)] [box-shadow:var(--inner-highlight)] sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle className="lux-display text-[22px]">
          {initial ? "Edit address" : "Add an address"}
        </DialogTitle>
        <DialogDescription className="text-[var(--muted)]">
          Used to pre-fill checkout. Stored in this browser until Phase 9.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" htmlFor="address-label">
          <Input
            id="address-label"
            value={draft.label}
            onChange={set("label")}
            placeholder="Home"
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </Field>
        <Field label="Full name" htmlFor="address-name">
          <Input
            id="address-name"
            value={draft.fullName}
            onChange={set("fullName")}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </Field>
        <Field label="Street address" htmlFor="address-street">
          <Input
            id="address-street"
            value={draft.address}
            onChange={set("address")}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)] sm:col-span-2"
          />
        </Field>
        <Field label="City" htmlFor="address-city">
          <Input
            id="address-city"
            value={draft.city}
            onChange={set("city")}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </Field>
        <Field label="Postal code" htmlFor="address-postal">
          <Input
            id="address-postal"
            value={draft.postalCode}
            onChange={set("postalCode")}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </Field>
        <Field label="Phone" htmlFor="address-phone">
          <Input
            id="address-phone"
            value={draft.phone}
            onChange={set("phone")}
            className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)] sm:col-span-2"
          />
        </Field>
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)]">
            Cancel
          </Button>
        </DialogClose>
        <Button
          disabled={!complete}
          onClick={() => onSave(draft)}
          className="h-11 rounded-full bg-[var(--lime)] px-6 text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          Save address
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ----------------------------------------------------------------- settings */

export function SettingsPanel() {
  const [marketing, setMarketing] = useState(false);
  const [remember, setRemember] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const signOut = useAuthStore((s) => s.signOut);

  /** Mock delete: there is no account to delete yet, so it clears the demo data. */
  async function deleteAccount() {
    useDesignsStore.setState({ designs: [] });
    useOrdersStore.setState({ orders: [] });
    useCartStore.setState({ lines: [] });
    await signOut();
    toast("Account deleted", { description: "Everything stored in this browser was cleared." });
  }

  return (
    <Panel>
      <PanelTitle description="Preferences are held for this browser only until accounts get a backend.">
        Settings
      </PanelTitle>

      <div className="flex flex-col gap-5">
        <SettingRow
          id="setting-marketing"
          title="Marketing emails"
          description="Occasional studio notes and new blanks. Off by default."
          checked={marketing}
          onChange={setMarketing}
        />
        <SettingRow
          id="setting-remember"
          title="Remember configuration"
          description="Keep the last studio settings on this device."
          checked={remember}
          onChange={setRemember}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-6">
        <h3 className="lux-display text-[18px] text-[var(--destructive)]">Delete account</h3>
        <p className="max-w-[52ch] text-[13px] leading-[1.6] text-[var(--muted)]">
          Removes the demo account together with its designs and orders in this browser. There is no
          backend yet, so this is a local reset.
        </p>
        <Button
          variant="ghost"
          onClick={() => setConfirming(true)}
          className="h-11 w-fit rounded-full px-5 text-[var(--destructive)] ring-1 ring-[color-mix(in_srgb,var(--destructive)_40%,transparent)] hover:bg-[var(--destructive)]/10"
        >
          <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
          Delete account
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="lux gap-5 rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-[var(--ivory)] [box-shadow:var(--inner-highlight)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="lux-display text-[22px]">Delete your account?</DialogTitle>
            <DialogDescription className="text-[var(--muted)]">
              Your designs and orders in this browser are cleared and you are signed out. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)]">
                Keep account
              </Button>
            </DialogClose>
            <Button
              onClick={deleteAccount}
              className="h-11 rounded-full bg-[var(--destructive)] px-5 text-[var(--ink)] hover:bg-[var(--destructive)]/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

function SettingRow({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id} className="text-[14px] text-[var(--ivory)]">
          {title}
        </Label>
        <p className="text-[13px] leading-[1.6] text-[var(--muted)]">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1" />
    </div>
  );
}
