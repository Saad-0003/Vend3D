"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Copy,
  PackageOpen,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectAdminProducts } from "@/lib/admin/catalog-ops";
import { catalogAdminService } from "@/lib/admin/catalog-service";
import {
  ADMIN_CATEGORY_VALUES,
  type AdminCategory,
  type AdminProduct,
  type AdminProductStatus,
} from "@/lib/admin/product-schema";
import { formatCents } from "@/lib/format";
import { formatOrderDate } from "@/lib/checkout/order";

/**
 * The admin products list (plan.md Phase 1B U5). Rows read through the
 * `CatalogAdminService` seam (static catalog merged with this browser's
 * records); Phase 10 swaps the service body, never this screen.
 *
 * The four shipped states: loading skeleton, populated, "no matches"
 * empty variant (filters are the only realistic empty here — the catalog
 * seed always provides rows) and the storage-blocked error with retry.
 */
export function ProductsScreen() {
  const [all, setAll] = useState<AdminProduct[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [filters, setFilters] = useState<{
    query: string;
    category: AdminCategory | "All";
    status: string;
  }>({ query: "", category: "All", status: "all" });

  const load = useCallback(() => {
    setPhase("loading");
    let cancelled = false;
    catalogAdminService
      .listProducts()
      .then((list) => {
        if (cancelled) return;
        setAll(list);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (phase === "loading") return <ProductsSkeleton />;
  if (phase === "error") {
    return (
      <ErrorState
        title="We couldn't read the product list"
        body="This browser blocked or lost its local stores. Try again — if it keeps happening, reload the page once and check that this browser allows site data."
        onRetry={load}
      />
    );
  }

  return (
    <ProductsContent all={all} filters={filters} onFilters={setFilters} reload={load} />
  );
}

function ProductsContent({
  all,
  filters,
  onFilters,
  reload,
}: {
  all: AdminProduct[];
  filters: { query: string; category: AdminCategory | "All"; status: string };
  onFilters: React.Dispatch<
    React.SetStateAction<{ query: string; category: AdminCategory | "All"; status: string }>
  >;
  reload: () => void;
}) {
  const visible = all.length ? selectAdminProducts(all, filters) : [];
  const hasFilters =
    filters.query.trim() !== "" || filters.category !== "All" || filters.status !== "all";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Back office"
        title="Products."
        intro="Everything the storefront can sell, plus the drafts this browser is still shaping."
      />

      <p
        data-testid="admin-products-banner"
        className="lux-mono rounded-full border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-2.5 text-[11px] tracking-[0.08em] text-[var(--muted)]"
      >
        Changes are saved in this browser only and will publish to the database in Phase&nbsp;4.
      </p>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex w-full flex-wrap items-center gap-3 min-[560px]:w-auto min-[560px]:flex-nowrap">
          <div className="relative min-w-0 flex-1 min-[560px]:w-64 min-[560px]:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--faint)]"
              strokeWidth={1.5}
              aria-hidden
            />
            <Input
              value={filters.query}
              onChange={(event) => onFilters((f) => ({ ...f, query: event.target.value }))}
              placeholder="Search name or slug"
              aria-label="Search products"
              data-testid="admin-products-search"
              className="h-11 rounded-full bg-[var(--surface-1)] pl-10 text-[14px]"
            />
          </div>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              onFilters((f) => ({ ...f, category: value as AdminCategory | "All" }))
            }
          >
            <SelectTrigger
              aria-label="Filter by category"
              className="h-11 w-[9.5rem] rounded-full bg-[var(--surface-1)] text-[13px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {ADMIN_CATEGORY_VALUES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          asChild
          className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[15px] text-[var(--ink)] hover:bg-[var(--ivory)]/90"
        >
          <Link href="/admin/products/new" data-testid="admin-new-product-link">
            <Plus className="mr-1 size-4" strokeWidth={1.5} aria-hidden />
            New product
          </Link>
        </Button>
      </div>

      <Tabs
        value={filters.status}
        onValueChange={(value) => onFilters((f) => ({ ...f, status: value }))}
      >
        <TabsList aria-label="Filter by status">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        hasFilters ? (
          <EmptyState
            eyebrow="No matches"
            title="Nothing fits those filters."
            body="Try a different search, category or status — or clear the filters to see the whole list."
            icon={<PackageOpen className="size-7" strokeWidth={1.5} aria-hidden />}
            action={
              <Button
                variant="outline"
                className="h-11 rounded-full px-6"
                onClick={() => onFilters({ query: "", category: "All", status: "all" })}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            eyebrow="No products yet"
            title="The list is empty."
            body="Nothing is loaded in this browser yet. Reload to re-read the catalog seed."
            icon={<PackageOpen className="size-7" strokeWidth={1.5} aria-hidden />}
            action={
              <Button className="h-11 rounded-full px-6" onClick={reload}>
                Reload
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="lux-mono pl-5 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Product
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Category
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Price
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Status
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Updated
                </TableHead>
                <TableHead className="lux-mono pr-5 text-right text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => (
                <ProductRow key={product.id} product={product} reload={reload} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- chips */

const STATUS_LABELS: Record<AdminProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

const STATUS_CHIP_CLASSES: Record<AdminProductStatus, string> = {
  active:
    "border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] text-[var(--lime)]",
  draft:
    "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ivory)]",
  archived:
    "border-[var(--hairline)] bg-transparent text-[var(--faint)]",
};

/* -------------------------------------------------------------------- row */

function ProductRow({ product, reload }: { product: AdminProduct; reload: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const thumb = product.cardImage?.dataUrl ?? product.fallbackImage ?? null;

  function act(run: () => Promise<unknown>, success: string) {
    setBusy(true);
    run()
      .then(() => {
        toast(success);
        reload();
      })
      .catch((error: unknown) => {
        toast(error instanceof Error ? error.message : "That didn't save. Try again.");
      })
      .finally(() => setBusy(false));
  }

  const archive = () =>
    act(
      () => catalogAdminService.setProductStatus(product.id, "archived"),
      `Archived "${product.name}"`,
    );

  return (
    <TableRow data-testid="admin-product-row" data-product-id={product.id} className="group">
      <TableCell className="pl-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)]">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URLs / static catalog chips
              <img src={thumb} alt="" className="size-full object-cover" />
            ) : (
              <PackageOpen className="size-4 text-[var(--faint)]" strokeWidth={1.5} aria-hidden />
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <Link
              href={`/admin/products/${product.id}`}
              title={product.name}
              className="max-w-[14rem] truncate text-[14px] text-[var(--ivory)] underline-offset-4 group-hover:text-[var(--lime)] group-hover:underline"
            >
              {product.name}
            </Link>
            <span
              className="lux-mono max-w-[14rem] truncate text-[11px] text-[var(--faint)]"
              title={product.slug}
            >
              /{product.slug}
            </span>
          </span>
        </div>
      </TableCell>
      <TableCell className="text-[13px] text-[var(--muted)]">{product.category}</TableCell>
      <TableCell className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">
        {formatCents(product.priceCents)}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          data-testid="admin-product-status"
          className={`lux-mono rounded-full px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${STATUS_CHIP_CLASSES[product.status]}`}
        >
          {STATUS_LABELS[product.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-[13px] whitespace-nowrap text-[var(--muted)]">
        {formatOrderDate(product.updatedAt)}
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-[12px] text-[var(--ivory)] hover:bg-[var(--surface-2)]"
          >
            <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}>
              <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden />
              Edit
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              act(
                () => catalogAdminService.duplicateProduct(product.id),
                `Duplicated "${product.name}"`,
              )
            }
            className="h-8 rounded-full px-2.5 text-[12px] text-[var(--ivory)] hover:bg-[var(--surface-2)]"
          >
            <Copy className="size-3.5" strokeWidth={1.5} aria-hidden />
            Duplicate
          </Button>
          {product.status === "archived" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                act(
                  () => catalogAdminService.setProductStatus(product.id, "active"),
                  `Restored "${product.name}"`,
                )
              }
              className="h-8 rounded-full px-2.5 text-[12px] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              <ArchiveRestore className="size-3.5" strokeWidth={1.5} aria-hidden />
              Restore
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              data-testid="admin-archive-button"
              onClick={() => setConfirming(true)}
              className="h-8 rounded-full px-2.5 text-[12px] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              <Archive className="size-3.5" strokeWidth={1.5} aria-hidden />
              Archive
            </Button>
          )}
        </div>
      </TableCell>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{product.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving takes it out of the storefront list. Nothing is deleted — restore any
              time from this row.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it listed</AlertDialogCancel>
            <AlertDialogAction
              data-testid="admin-archive-confirm"
              onClick={(event) => {
                event.preventDefault();
                setConfirming(false);
                archive();
              }}
            >
              Archive product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TableRow>
  );
}

/* ---------------------------------------------------------------- skeleton */

function ProductsSkeleton() {
  return (
    <div role="status" aria-label="Loading products" className="flex flex-col gap-8">
      <Skeleton className="h-6 w-36 rounded-full" />
      <Skeleton className="h-10 w-full max-w-xl rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="h-11 w-64 rounded-full" />
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none border-b border-[var(--hairline)]" />
        ))}
      </div>
    </div>
  );
}
