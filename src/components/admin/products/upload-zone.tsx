"use client";

import { useCallback, useRef, useState } from "react";
import { FileWarning, Replace, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes, type AdminAttachment } from "@/lib/admin/product-schema";
import { cn } from "@/lib/utils";

/**
 * The shared drag-and-drop upload zone (plan.md Phase 1B U5). Type and size
 * are validated the moment a file lands — inline, before anything reaches the
 * service — and the selection is presented as name + size with Replace and
 * Remove, so a wrong file never advances silently.
 *
 * Keyboard path: the zone is a button that opens the file dialog; the same
 * validation runs on the picked file. `prefers-reduced-motion` needs no work:
 * there is no motion, only a border change on hover/drag.
 */
export function UploadZone({
  label,
  hint,
  acceptedLabel,
  maxBytes,
  accept,
  value,
  onPick,
  onRemove,
  validateType,
  variant,
  inputTestId,
  className,
}: {
  label: string;
  hint: string;
  /** Human phrase for the accepted types, shown under the button row. */
  acceptedLabel: string;
  maxBytes: number;
  accept: string;
  value: AdminAttachment | null;
  /** Raw File in, validated attachment out — reading/persisting is the caller's job. */
  onPick: (file: File) => Promise<void>;
  onRemove: () => void;
  validateType: (file: File) => boolean;
  /** Accent colour of the drop border; models lime, images keep hairline. */
  variant?: "model" | "image";
  /** Stable hook for tests/e2e to set files without opening the picker. */
  inputTestId?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (file: File | undefined) => {
      if (!file || busy) return;
      if (!validateType(file)) {
        setError(`Wrong file type. Only ${acceptedLabel} are accepted.`);
        return;
      }
      if (file.size > maxBytes) {
        setError(
          `Too large: ${Math.round(file.size / 1024)} KB. The demo keeps uploads under ${Math.round(maxBytes / 1024)} KB.`,
        );
        return;
      }
      setError(null);
      setBusy(true);
      try {
        await onPick(file);
      } finally {
        setBusy(false);
      }
    },
    [acceptedLabel, busy, maxBytes, onPick, validateType],
  );

  const dropAccent =
    variant === "model"
      ? "border-dashed border-[color-mix(in_srgb,var(--lime)_45%,transparent)]"
      : "border-dashed border-[var(--hairline-strong)]";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        {label}
      </span>

      {value ? (
        <div className="flex items-center gap-3 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-3 [box-shadow:var(--inner-highlight)]">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--lime)]">
            <Upload className="size-4" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] text-[var(--ivory)]" title={value.name}>
              {value.name}
            </span>
            <span className="lux-mono lux-tabular text-[11px] text-[var(--muted)]">
              {formatBytes(value.sizeBytes)}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => inputRef.current?.click()}
              className="h-9 rounded-full px-3 text-[12px] text-[var(--ivory)] ring-1 ring-[var(--hairline)] hover:bg-[var(--surface-2)]"
            >
              <Replace className="size-3.5" strokeWidth={1.5} aria-hidden />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={onRemove}
              className="size-9 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
            >
              <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void pick(event.dataTransfer.files[0]);
          }}
          aria-label={label}
          className={cn(
            "flex min-h-32 flex-col items-center justify-center gap-2 rounded-[var(--inner-radius)] border bg-[var(--surface-1)] p-6 text-center transition-colors duration-300",
            dropAccent,
            dragging && "bg-[var(--surface-2)]",
          )}
        >
          <Upload
            className={cn("size-5", variant === "model" ? "text-[var(--lime)]" : "text-[var(--muted)]")}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="text-[13px] text-[var(--ivory)]">Drag &amp; drop, or click to choose</span>
          <span className="max-w-xs text-[12px] leading-snug text-[var(--muted)]">{hint}</span>
        </button>
      )}

      {error ? (
        <p role="alert" className="flex items-center gap-2 text-[12px] text-[#ffb4ab]">
          <FileWarning className="size-3.5" strokeWidth={1.5} aria-hidden />
          {error}
        </p>
      ) : null}

      <p className="lux-mono text-[10px] tracking-[0.14em] text-[var(--faint)] uppercase">
        {acceptedLabel} · up to {Math.round((maxBytes / 1024) * 10) / 10} KB · stays in this browser
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        data-testid={inputTestId}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void pick(file);
        }}
      />
    </div>
  );
}

/** FileReader → data URL; rejects on read failure so the caller can show it. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}
