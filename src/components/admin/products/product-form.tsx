"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert, Plus, Save, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ModelPreview } from "@/components/admin/products/model-preview";
import { readAsDataUrl, UploadZone } from "@/components/admin/products/upload-zone";
import { useDirtyLeave } from "@/components/admin/products/use-dirty-leave";
import { getProductConfig } from "@/lib/products/config";
import { slugify } from "@/lib/admin/catalog-ops";
import { catalogAdminService, type CatalogProductDraft } from "@/lib/admin/catalog-service";
import {
  ADMIN_CATEGORY_VALUES,
  ADMIN_PRODUCT_STATUSES,
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  MODEL_ACCEPT,
  MODEL_MAX_BYTES,
  adminCustomizationSchema,
  adminProductFormSchema,
  centsToDollars,
  dollarsToCents,
  isModelFile,
  type AdminAttachment,
  type AdminCustomization,
  type AdminDecalZone,
  type AdminPart,
  type AdminProduct,
  type AdminProductFormValues,
  type AdminProductStatus,
} from "@/lib/admin/product-schema";

/** Editable part row: mesh names stay raw text until save parses them. */
type PartRow = {
  id: string;
  label: string;
  color: string;
  meshText: string;
  finishable: boolean;
  glossFrom: number;
  glossTo: number;
};

const STATUS_LABELS: Record<AdminProductStatus, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

const MAX_PARTS = 12;
const MAX_ZONES = 6;

function rowsFromParts(list: AdminPart[]): PartRow[] {
  return list.map((part) => ({
    id: part.id,
    label: part.label,
    color: part.color,
    meshText: part.meshNames.join(", "),
    finishable: part.finishable,
    glossFrom: part.gloss[0],
    glossTo: part.gloss[1],
  }));
}

/** Stable serialization for the dirty snapshot (key order is ours). */
function serialize(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * The product create/edit form (plan.md Phase 1B U5). Basics run through
 * react-hook-form + zod; the customization list and uploads are local state
 * validated through their zod schemas on save. Both funnel into the one
 * `CatalogAdminService` seam. Leaving with changes is guarded exactly like
 * the studio (`useDirtyLeave`), and the sticky Save/Discard bar mirrors the
 * dirty state.
 */
export function ProductForm({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
  const router = useRouter();

  const [phase, setPhase] = useState<"loading" | "ready" | "missing">("loading");
  const [record, setRecord] = useState<AdminProduct | null>(null);
  const [bundledGlb, setBundledGlb] = useState<string | null>(null);

  const [parts, setParts] = useState<PartRow[]>([]);
  const [zones, setZones] = useState<AdminDecalZone[]>([]);
  const [engraveEnabled, setEngraveEnabled] = useState(false);
  const [partErrors, setPartErrors] = useState<Record<string, string | undefined>>({});
  const [zoneErrors, setZoneErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [model, setModel] = useState<AdminAttachment | null>(null);
  const [cardImage, setCardImage] = useState<AdminAttachment | null>(null);
  const [baseline, setBaseline] = useState<{
    parts: string;
    zones: string;
    engrave: boolean;
    model: string;
    card: string;
  } | null>(null);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLFormElement | null>(null);

  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: { name: "", slug: "", category: "Apparel", description: "", price: "", status: "draft" },
  });
  const { register, trigger, watch, setValue, formState } = form;

  /* -------------------------------------------------------------- load */
  useEffect(() => {
    let cancelled = false;
    function resetFrom(source: AdminProduct, bundled: string | null) {
      setValue("name", source.name, { shouldDirty: false });
      setValue("slug", source.slug, { shouldDirty: false });
      setValue("category", source.category, { shouldDirty: false });
      setValue("description", source.description, { shouldDirty: false });
      // A fresh draft starts blank so the required-price rule is felt plainly.
      setValue("price", source.priceCents ? centsToDollars(source.priceCents) : "", {
        shouldDirty: false,
      });
      setValue("status", source.status, { shouldDirty: false });
      const rows = rowsFromParts(source.parts);
      setParts(rows);
      setZones(source.decalZones.map((zone) => ({ ...zone })));
      setEngraveEnabled(source.engraveEnabled);
      setModel(source.model ?? null);
      setCardImage(source.cardImage ?? null);
      setSlugLocked(false);
      setPartErrors({});
      setZoneErrors({});
      setGeneralError(null);
      setBaseline({
        parts: serialize(rows),
        zones: serialize(source.decalZones),
        engrave: source.engraveEnabled,
        model: source.model?.dataUrl ?? bundled ?? "",
        card: source.cardImage?.dataUrl ?? "",
      });
    }

    if (mode === "create") {
      const blank: AdminProduct = {
        id: "",
        slug: "",
        name: "",
        description: "",
        category: "Apparel",
        priceCents: 0,
        status: "draft",
        parts: [],
        decalZones: [],
        engraveEnabled: false,
        updatedAt: new Date().toISOString(),
      };
      setRecord(blank);
      resetFrom(blank, null);
      setPhase("ready");
      return () => {
        cancelled = true;
      };
    }
    catalogAdminService
      .getProduct(productId!)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setPhase("missing");
          return;
        }
        const bundled = getProductConfig(found.id)?.model.glb ?? null;
        setRecord(found);
        setBundledGlb(bundled);
        resetFrom(found, bundled);
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("missing");
      });
    return () => {
      cancelled = true;
    };
    // One-time load per mode/productId; the resets above read local state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId]);

  /* Slug auto-follows the name until the admin deliberately edits it (create). */
  const nameValue = watch("name");
  useEffect(() => {
    if (mode === "create" && !slugLocked) {
      setValue("slug", slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugLocked, mode, setValue]);

  /* ------------------------------------------------------------- dirty */
  const customization: AdminCustomization = useMemo(
    () => ({
      parts: parts.map((row) => ({
        id: row.id.trim(),
        label: row.label.trim(),
        color: row.color,
        meshNames: row.meshText.split(",").map((t) => t.trim()).filter(Boolean),
        finishable: row.finishable,
        gloss: [row.glossFrom, row.glossTo] as [number, number],
      })),
      decalZones: zones.map((zone) => ({ ...zone, id: zone.id.trim() })),
      engraveEnabled,
    }),
    [parts, zones, engraveEnabled],
  );

  const live = {
    parts: serialize(parts),
    zones: serialize(zones),
    engrave: engraveEnabled,
    model: model?.dataUrl ?? bundledGlb ?? "",
    card: cardImage?.dataUrl ?? "",
  };
  const dirty =
    formState.isDirty ||
    (baseline !== null &&
      (live.parts !== baseline.parts ||
        live.zones !== baseline.zones ||
        live.engrave !== baseline.engrave ||
        live.model !== baseline.model ||
        live.card !== baseline.card));

  const { pendingHref, dismiss, navigate } = useDirtyLeave(dirty);

  /** Back to the loaded record (or a blank draft). Also used by "Discard & leave". */
  function reduceToBaseline() {
    form.reset({
      name: record?.name ?? "",
      slug: record?.slug ?? "",
      category: record?.category ?? "Apparel",
      description: record?.description ?? "",
      price: record?.priceCents ? centsToDollars(record.priceCents) : "",
      status: record?.status ?? "draft",
    });
    const rows = rowsFromParts(record?.parts ?? []);
    setParts(rows);
    setZones((record?.decalZones ?? []).map((zone) => ({ ...zone })));
    setEngraveEnabled(record?.engraveEnabled ?? false);
    setModel(record?.model ?? null);
    setCardImage(record?.cardImage ?? null);
    setBaseline({
      parts: serialize(rows),
      zones: serialize(record?.decalZones ?? []),
      engrave: record?.engraveEnabled ?? false,
      model: record?.model?.dataUrl ?? bundledGlb ?? "",
      card: record?.cardImage?.dataUrl ?? "",
    });
    setPartErrors({});
    setZoneErrors({});
    setGeneralError(null);
    toast("Changes discarded");
  }

  /* --------------------------------------------------------------- save */
  /** Validates both layers with zod, writes through the seam; true on success. */
  async function persist(): Promise<boolean> {
    const basicValid = await trigger(undefined, { shouldFocus: true });
    if (!basicValid) return false;

    const parsed = adminCustomizationSchema.safeParse(customization);
    if (!parsed.success) {
      showCustomizationErrors(parsed.error.issues);
      return false;
    }
    setPartErrors({});
    setZoneErrors({});
    setGeneralError(null);

    const cents = dollarsToCents(watch("price"));
    if (!cents.ok) return false; // unreachable once basicValid; defensive

    const draft: CatalogProductDraft = {
      slug: watch("slug").trim(),
      name: watch("name").trim(),
      description: watch("description").trim(),
      category: watch("category"),
      priceCents: cents.cents,
      status: watch("status"),
      parts: customization.parts,
      decalZones: customization.decalZones,
      engraveEnabled: customization.engraveEnabled,
      model: model ?? undefined,
      cardImage: cardImage ?? undefined,
      fallbackImage: record?.fallbackImage,
    };

    setSaving(true);
    try {
      const result =
        mode === "create"
          ? await catalogAdminService.createProduct(draft)
          : await catalogAdminService.updateProduct(productId!, draft);
      if (!result.ok) {
        toast(result.error);
        return false;
      }
      toast(mode === "create" ? "Product created" : "Changes saved");
      router.push("/admin/products");
      return true;
    } catch (error) {
      // Storage quota and blocked-store failures surface here verbatim: the
      // messages in the service are already actionable.
      toast(error instanceof Error ? error.message : "Saving failed. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persist();
  }

  /** The leave dialog's "Save & leave": save, then follow the intercepted link. */
  async function saveThen(href: string) {
    const ok = await persist();
    dismiss();
    if (ok) navigate(href);
  }

  function showCustomizationErrors(
    issues: readonly { path: readonly PropertyKey[]; message: string }[],
  ) {
    const nextParts: Record<string, string | undefined> = {};
    const nextZones: Record<string, string | undefined> = {};
    let general: string | null = null;
    for (const issue of issues) {
      const [area, index, field] = issue.path;
      if (area === "parts" && typeof index === "number") {
        const key = `${index}.${String(field)}`;
        if (!(key in nextParts)) nextParts[key] = issue.message;
      } else if (area === "decalZones" && typeof index === "number") {
        const key = `${index}.${String(field)}`;
        if (!(key in nextZones)) nextZones[key] = issue.message;
      } else {
        general = issue.message;
      }
    }
    setPartErrors(nextParts);
    setZoneErrors(nextZones);
    setGeneralError(general);

    // Focus-first-error for the customization block: basics already passed
    // validation for submit to reach here, so this list is the surface left.
    window.requestAnimationFrame(() => {
      const first = containerRef.current?.querySelector<HTMLElement>('[data-invalid="true"]');
      if (!first) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      first.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      first.focus({ preventScroll: true });
    });
  }

  /* ----------------------------------------------- part / zone editing */
  function updatePart(index: number, patch: Partial<PartRow>) {
    setParts((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setPartErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) if (key.startsWith(`${index}.`)) next[key] = undefined;
      return next;
    });
  }

  function addPart() {
    if (parts.length >= MAX_PARTS) {
      toast(`Up to ${MAX_PARTS} customizable parts`);
      return;
    }
    setParts((rows) => [
      ...rows,
      {
        id: `part-${rows.length + 1}`,
        label: "",
        color: "#c6f135",
        meshText: "",
        finishable: false,
        glossFrom: 0,
        glossTo: 35,
      },
    ]);
  }

  function removePart(index: number) {
    if (parts.length === 1) return;
    setParts((rows) => rows.filter((_, i) => i !== index));
    setPartErrors({});
  }

  function updateZone(index: number, patch: Partial<AdminDecalZone>) {
    setZones((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setZoneErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) if (key.startsWith(`${index}.`)) next[key] = undefined;
      return next;
    });
  }

  function addZone() {
    if (zones.length >= MAX_ZONES) {
      toast(`Up to ${MAX_ZONES} decal zones`);
      return;
    }
    setZones((rows) => [
      ...rows,
      { id: `zone-${rows.length + 1}`, label: "", partId: parts[0]?.id.trim() ?? "" },
    ]);
  }

  function removeZone(index: number) {
    setZones((rows) => rows.filter((_, i) => i !== index));
    setZoneErrors({});
  }

  /* ----------------------------------------------------------------- UI */
  const descriptionValue = watch("description");
  const nameError = formState.errors.name?.message;
  const slugError = formState.errors.slug?.message;
  const categoryError = formState.errors.category?.message;
  const descriptionError = formState.errors.description?.message;
  const priceError = formState.errors.price?.message;
  const statusError = formState.errors.status?.message;

  const previewModelUrl = model?.dataUrl ?? bundledGlb;
  const previewKey = model ? `${model.name}:${model.sizeBytes}` : previewModelUrl ? "bundled" : "none";
  const previewCents = dollarsToCents(watch("price"));

  const title = mode === "create" ? "New product." : "Edit product.";
  const intro =
    mode === "create"
      ? "Shape from scratch — basics, model, customization and card image in one place."
      : `Fine-tune “${record?.name ?? ""}”.`;

  if (phase === "loading") {
    return (
      <div role="status" aria-label="Loading product form" className="flex flex-col gap-8">
        <Skeleton className="h-6 w-36 rounded-full" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-[var(--card-radius)]" />
        ))}
      </div>
    );
  }

  if (phase === "missing") {
    return (
      <div className="flex flex-col items-start gap-6">
        <PageHeader
          eyebrow="Back office"
          title="Product not found."
          intro="The link in the URL doesn't match anything this browser knows."
        />
        <Button asChild variant="outline" className="h-11 rounded-full px-6">
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 size-4" strokeWidth={1.5} aria-hidden />
            Back to products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form ref={containerRef} noValidate onSubmit={save} className="flex flex-col gap-8">
      <PageHeader eyebrow="Back office" title={title} intro={intro} />

      <p
        data-testid="admin-products-banner"
        className="lux-mono rounded-full border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-2.5 text-[11px] tracking-[0.08em] text-[var(--muted)]"
      >
        Changes are saved in this browser only and will publish to the database in Phase&nbsp;4.
      </p>

      {/* -------------------------------------------------------- basics */}
      <Section eyebrow="Section 01" title="Basics">
        <div className="grid gap-6 min-[768px]:grid-cols-2">
          <Field label="Name" error={nameError} htmlFor="f-name">
            <Input
              id="f-name"
              data-testid="admin-product-name"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "f-name-error" : undefined}
              className="h-11 bg-[var(--surface-2)]"
              {...register("name")}
            />
          </Field>
          <Field
            label="Slug"
            error={slugError}
            htmlFor="f-slug"
            hint={
              mode === "create" && !slugLocked
                ? "Auto-built from the name; locks once you edit it."
                : "Lowercase letters, numbers, dashes."
            }
          >
            <Input
              id="f-slug"
              data-testid="admin-product-slug"
              aria-invalid={!!slugError}
              aria-describedby={slugError ? "f-slug-error" : undefined}
              className="h-11 bg-[var(--surface-2)] font-mono text-[13px]"
              {...register("slug", { onChange: () => setSlugLocked(true) })}
            />
          </Field>
          <Field label="Category" error={categoryError} htmlFor="f-category">
            {/* Hidden registered inputs carry the value; the Select drives it. */}
            <input type="hidden" aria-hidden tabIndex={-1} {...register("category")} />
            <Select
              value={watch("category")}
              onValueChange={(value) =>
                setValue("category", value as AdminProductFormValues["category"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id="f-category"
                aria-invalid={!!categoryError}
                className="h-11 rounded-[var(--inner-radius)] bg-[var(--surface-2)] text-[14px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_CATEGORY_VALUES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Price"
            error={priceError}
            htmlFor="f-price"
            hint="In dollars, stored as whole cents (12.99 → 1299)."
          >
            <Input
              id="f-price"
              data-testid="admin-product-price"
              inputMode="decimal"
              placeholder="12.99"
              aria-invalid={!!priceError}
              aria-describedby={priceError ? "f-price-error" : undefined}
              className="h-11 bg-[var(--surface-2)]"
              {...register("price")}
            />
          </Field>
          <Field
            label="Status"
            error={statusError}
            htmlFor="f-status"
            hint="Archived takes the product out of the storefront list."
          >
            <input type="hidden" aria-hidden tabIndex={-1} {...register("status")} />
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as AdminProductFormValues["status"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id="f-status"
                aria-invalid={!!statusError}
                className="h-11 rounded-[var(--inner-radius)] bg-[var(--surface-2)] text-[14px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_PRODUCT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field
          label="Description"
          error={descriptionError}
          htmlFor="f-description"
          hint={`${descriptionValue.length}/400`}
        >
          <Textarea
            id="f-description"
            aria-invalid={!!descriptionError}
            aria-describedby={descriptionError ? "f-description-error" : undefined}
            rows={4}
            className="bg-[var(--surface-2)]"
            {...register("description")}
          />
        </Field>
      </Section>

      {/* ----------------------------------------------------- 3D model */}
      <Section eyebrow="Section 02" title="3D model">
        <div className="grid gap-8 min-[768px]:grid-cols-2">
          <UploadZone
            label="GLB upload"
            hint="The model file the studio renders for this product."
            acceptedLabel=".glb / .gltf"
            maxBytes={MODEL_MAX_BYTES}
            accept={MODEL_ACCEPT}
            value={model}
            validateType={isModelFile}
            variant="model"
            inputTestId="admin-model-upload-input"
            onPick={async (file) => {
              try {
                const dataUrl = await readAsDataUrl(file);
                setModel({ name: file.name, sizeBytes: file.size, dataUrl });
              } catch {
                toast("The file could not be read.");
              }
            }}
            onRemove={() => setModel(null)}
          />
          <ModelPreview
            preview={{
              id: record?.id ?? "",
              slug: watch("slug") || "preview",
              name: watch("name") || "Preview product",
              description: descriptionValue || "Live preview",
              priceCents: previewCents.ok ? previewCents.cents : 0,
              category: watch("category"),
              parts: customization.parts,
              decalZones: zones.map((zone) => ({ ...zone })),
              engraveEnabled,
            }}
            modelUrl={previewModelUrl}
            modelKey={previewKey}
          />
        </div>
      </Section>

      {/* ----------------------------------------------- customization */}
      <Section eyebrow="Section 03" title="Customization">
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Customizable parts ({parts.length}/{MAX_PARTS})
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="admin-add-part"
              onClick={addPart}
              className="h-9 rounded-full px-4"
            >
              <Plus className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden />
              Add part
            </Button>
          </div>

          {parts.map((row, index) => (
            <div
              key={`part-${index}`}
              className="flex flex-col gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-4"
            >
              <div className="grid gap-4 min-[768px]:grid-cols-[1fr_10rem]">
                <Field label="Part label" error={partErrors[`${index}.label`]} htmlFor={`p-${index}-label`}>
                  <Input
                    id={`p-${index}-label`}
                    data-invalid={!!partErrors[`${index}.label`] || undefined}
                    aria-invalid={!!partErrors[`${index}.label`]}
                    className="h-10 bg-[var(--surface-1)]"
                    value={row.label}
                    onChange={(event) => updatePart(index, { label: event.target.value })}
                  />
                </Field>
                <Field label="Part id" error={partErrors[`${index}.id`]} htmlFor={`p-${index}-id`}>
                  <Input
                    id={`p-${index}-id`}
                    data-invalid={!!partErrors[`${index}.id`] || undefined}
                    aria-invalid={!!partErrors[`${index}.id`]}
                    className="h-10 bg-[var(--surface-1)] font-mono text-[12px]"
                    value={row.id}
                    onChange={(event) => updatePart(index, { id: event.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 min-[768px]:grid-cols-[14rem_1fr]">
                <Field
                  label="Default colour"
                  error={partErrors[`${index}.color`]}
                  htmlFor={`p-${index}-color`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      id={`p-${index}-color`}
                      data-testid={`admin-part-color-${index}`}
                      data-invalid={!!partErrors[`${index}.color`] || undefined}
                      aria-invalid={!!partErrors[`${index}.color`]}
                      type="color"
                      value={row.color}
                      aria-label={`Default colour for part ${row.label || index + 1}`}
                      onChange={(event) => updatePart(index, { color: event.target.value })}
                      className="size-10 cursor-pointer rounded-[var(--inner-radius)] border border-[var(--hairline-strong)] bg-[var(--surface-1)] p-1"
                    />
                    <Input
                      aria-label="Default colour hex"
                      data-testid={`admin-part-hex-${index}`}
                      className="h-10 bg-[var(--surface-1)] font-mono text-[12px]"
                      value={row.color}
                      onChange={(event) => updatePart(index, { color: event.target.value })}
                      spellCheck={false}
                    />
                  </div>
                </Field>
                <Field
                  label="Mesh names"
                  error={partErrors[`${index}.meshNames`]}
                  htmlFor={`p-${index}-mesh`}
                  hint="Comma-separated, matching the GLB."
                >
                  <Input
                    id={`p-${index}-mesh`}
                    data-invalid={!!partErrors[`${index}.meshNames`] || undefined}
                    aria-invalid={!!partErrors[`${index}.meshNames`]}
                    className="h-10 bg-[var(--surface-1)] font-mono text-[12px]"
                    value={row.meshText}
                    placeholder="Fabric_Body, Fabric_Sleeve"
                    onChange={(event) => updatePart(index, { meshText: event.target.value })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-[13px] text-[var(--ivory)]">
                  <Switch
                    checked={row.finishable}
                    onCheckedChange={(checked) => updatePart(index, { finishable: checked })}
                    aria-label={`Finishable part ${row.label || index + 1}`}
                  />
                  Finishable (matte–glossy)
                </label>
                {row.finishable ? (
                  <div className="flex items-center gap-2">
                    <label className="lux-mono flex items-center gap-2 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                      From
                      <GlossInput
                        value={row.glossFrom}
                        onValue={(value) =>
                          updatePart(index, {
                            glossFrom: value,
                            glossTo: Math.max(value, row.glossTo),
                          })
                        }
                      />
                    </label>
                    <label className="lux-mono flex items-center gap-2 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                      To
                      <GlossInput
                        value={row.glossTo}
                        onValue={(value) =>
                          updatePart(index, {
                            glossTo: value,
                            glossFrom: Math.min(value, row.glossFrom),
                          })
                        }
                      />
                    </label>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove part ${row.label || index + 1}`}
                  disabled={parts.length === 1}
                  onClick={() => removePart(index)}
                  className="ml-auto size-9 rounded-full text-[var(--muted)] hover:text-[var(--ivory)] disabled:opacity-40"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
                </Button>
              </div>
            </div>
          ))}
          {generalError ? (
            <p role="alert" className="flex items-center gap-2 text-[12px] text-[#ffb4ab]">
              <CircleAlert className="size-3.5" aria-hidden />
              {generalError}
            </p>
          ) : null}

          {/* ------------------------------------------------- zones */}
          <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-[var(--hairline)] pt-5">
            <span className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Decal zones ({zones.length}/{MAX_ZONES})
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="admin-add-zone"
              disabled={parts.length === 0}
              onClick={addZone}
              className="h-9 rounded-full px-4"
            >
              <Plus className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden />
              Add zone
            </Button>
          </div>

          {zones.map((zone, index) => (
            <div
              key={`zone-${index}`}
              className="grid gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-4 min-[768px]:grid-cols-[1fr_1fr_10rem_auto]"
            >
              <Field label="Zone label" error={zoneErrors[`${index}.label`]} htmlFor={`z-${index}-label`}>
                <Input
                  id={`z-${index}-label`}
                  data-testid={`admin-zone-label-${index}`}
                  data-invalid={!!zoneErrors[`${index}.label`] || undefined}
                  aria-invalid={!!zoneErrors[`${index}.label`]}
                  className="h-10 bg-[var(--surface-1)]"
                  value={zone.label}
                  onChange={(event) => updateZone(index, { label: event.target.value })}
                />
              </Field>
              <Field label="Zone id" error={zoneErrors[`${index}.id`]} htmlFor={`z-${index}-id`}>
                <Input
                  id={`z-${index}-id`}
                  data-invalid={!!zoneErrors[`${index}.id`] || undefined}
                  aria-invalid={!!zoneErrors[`${index}.id`]}
                  className="h-10 bg-[var(--surface-1)] font-mono text-[12px]"
                  value={zone.id}
                  onChange={(event) => updateZone(index, { id: event.target.value })}
                />
              </Field>
              <Field label="Paints part" error={zoneErrors[`${index}.partId`]} htmlFor={`z-${index}-part`}>
                <Select value={zone.partId} onValueChange={(value) => updateZone(index, { partId: value })}>
                  <SelectTrigger
                    id={`z-${index}-part`}
                    data-testid={`admin-zone-part-${index}`}
                    data-invalid={!!zoneErrors[`${index}.partId`] || undefined}
                    aria-invalid={!!zoneErrors[`${index}.partId`]}
                    className="h-10 rounded-[var(--inner-radius)] bg-[var(--surface-1)] text-[13px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customization.parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove zone ${zone.label || index + 1}`}
                onClick={() => removeZone(index)}
                className="mt-auto size-9 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
              >
                <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </div>
          ))}

          {/* ------------------------------------------- engraving */}
          <label className="flex items-center justify-between gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-4 text-[13px] text-[var(--ivory)]">
            <span>
              <span className="block">Engraving</span>
              <span className="block text-[12px] leading-snug text-[var(--muted)]">
                Lets shoppers etch short text via the studio&rsquo;s engrave control.
              </span>
            </span>
            <Switch
              checked={engraveEnabled}
              onCheckedChange={setEngraveEnabled}
              aria-label="Enable engraving"
              data-testid="admin-engrave-switch"
            />
          </label>
        </div>
      </Section>

      {/* ------------------------------------------------ card image */}
      <Section eyebrow="Section 04" title="Card image">
        <div className="grid gap-8 min-[768px]:grid-cols-2">
          <UploadZone
            label="Product card image"
            hint="Shown on the shop grid and search cards."
            acceptedLabel=".png / .jpg / .webp"
            maxBytes={IMAGE_MAX_BYTES}
            accept={IMAGE_ACCEPT}
            value={cardImage}
            validateType={(file) => /^image\/(png|jpe?g|webp)$/i.test(file.type)}
            inputTestId="admin-image-upload-input"
            onPick={async (file) => {
              try {
                const dataUrl = await readAsDataUrl(file);
                setCardImage({ name: file.name, sizeBytes: file.size, dataUrl });
              } catch {
                toast("The file could not be read.");
              }
            }}
            onRemove={() => setCardImage(null)}
          />
          <div className="flex flex-col gap-3">
            <span className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Preview
            </span>
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
              {cardImage?.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URLs, never optimized uploads
                <img src={cardImage.dataUrl} alt="Uploaded card image" className="size-full object-cover" />
              ) : record?.fallbackImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- static catalog asset
                <img src={record.fallbackImage} alt="Published catalog image" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-[12px] text-[var(--faint)]">
                  No image yet
                </div>
              )}
            </div>
            {!cardImage && record?.fallbackImage ? (
              <p className="text-[12px] text-[var(--muted)]">
                Published catalog image — an upload here replaces it once saved.
              </p>
            ) : null}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ sticky bar */}
      <div className="sticky bottom-5 z-20 flex flex-wrap items-center gap-4 rounded-full border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface-1)_88%,transparent)] px-5 py-3 [box-shadow:var(--inner-highlight)] backdrop-blur">
        <span
          data-testid="admin-product-dirty-state"
          className="lux-mono flex items-center gap-2 text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase"
        >
          {dirty ? (
            <>
              <CircleAlert className="size-3.5 text-[var(--lime)]" aria-hidden />
              Unsaved changes
            </>
          ) : (
            "All changes saved"
          )}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={!dirty || saving}
            data-testid="admin-product-discard"
            onClick={reduceToBaseline}
            className="h-11 rounded-full px-5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
          >
            Discard
          </Button>
          <Button
            type="button"
            disabled={saving}
            data-testid="admin-product-save"
            onClick={() => containerRef.current?.requestSubmit()}
            className="h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
          >
            <Save className="mr-1.5 size-4" strokeWidth={1.5} aria-hidden />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* --------------------------------------- leave with changes */}
      <AlertDialog
        open={pendingHref !== null}
        onOpenChange={(open) => (!open ? dismiss() : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              This product has changes that haven&rsquo;t been saved yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button
              type="button"
              variant="ghost"
              className="text-[var(--muted)]"
              data-testid="admin-leave-discard"
              onClick={() => {
                reduceToBaseline();
                dismiss();
                navigate(pendingHref!);
              }}
            >
              Discard &amp; leave
            </Button>
            <AlertDialogAction
              data-testid="admin-leave-save"
              onClick={(event) => {
                event.preventDefault();
                void saveThen(pendingHref!);
              }}
            >
              Save &amp; leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/* ----------------------------------------------------------------- pieces */

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 max-[560px]:p-4 [box-shadow:var(--inner-highlight)]">
      <div className="flex flex-col gap-1">
        <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
          {eyebrow}
        </span>
        <h2 className="lux-display text-[20px] text-[var(--ivory)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
          {label}
        </Label>
        {hint && !error ? (
          <span className="lux-mono text-[10px] tracking-[0.08em] text-[var(--faint)]">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-[12px] text-[#ffb4ab]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GlossInput({ value, onValue }: { value: number; onValue: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      step={1}
      value={value}
      aria-label="Gloss value, 0 to 100"
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onValue(Math.min(100, Math.max(0, next)));
      }}
      className="lux-mono lux-tabular h-9 w-16 rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-center text-[12px] text-[var(--ivory)] outline-none focus-visible:outline-2 focus-visible:outline-[var(--lime)]"
    />
  );
}
