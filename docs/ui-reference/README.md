# UI reference pack

Human-supplied design material for Vend3D. **Reference and asset source — never reformat, and
never copy mockup code into the app.**

- [`DESIGN.md`](./DESIGN.md) — storefront brand system (canonical). `globals.css` implements it.
- [`DESIGN_STUDIO.md`](./DESIGN_STUDIO.md) — 3D studio brand system, for Phases 5–6.
- [`HOMEPAGE.md`](./HOMEPAGE.md) — the shipped `/` design spec, transcribed from the human's
  full-scroll storefront screens.
- [`logo.png`](./logo.png) — the brand artwork (isometric cube mark + `vend3d` lockup). The cube is
  cropped from it into `public/brand/logo-mark.png`; the wordmark is set as live text.
- [`assets/`](./assets) — the five product-photography renders the storefront ships.

`docs/ui-reference` is listed in `.prettierignore`. `npm run format` must never rewrite these
files; if it starts touching them, that ignore entry was lost.

## What was removed and why

On 2026-10-04 the human re-supplied the storefront direction as three full-scroll screen captures
and asked for the pack to be pruned to what those screens need. The four `stitch_*` export
folders — 30 screen mockups from the previous design generation (storefront, catalog, product
detail, auth, customizer, cart, checkout, orders, admin) — were deleted. They documented a
superseded design and the human is re-supplying each section's screen as its phase runs; the
old-generation screens are recorded in `DECISIONS.md` (D-022) rather than kept as dead weight.

## Assets

| File | Used by |
|---|---|
| `assets/heavyweight-boxy-tee.png` | collection card, `/products/[id]` placeholder |
| `assets/luna-glazed-mug.png` | collection card |
| `assets/structured-6-panel-cap.png` | collection card |
| `assets/insulated-steel-bottle.png` | collection card, hero media |
| `assets/studio-scene.png` | launch banner backdrop |

The same five files are served from `public/products/` and `public/images/` — the copies in
`public/` are the ones the app imports (see DECISIONS D-021).

## Rules for future mockups

- One folder per screen, named `<route>_<screen>`, each with `code.html` + `screen.png`.
- Never paste assets into `public/` by hand — add them to `assets/` and copy, so provenance
  stays obvious.
- Prose in `DESIGN.md` is canonical over the YAML frontmatter (DECISIONS D-010).

## Known gaps

- No 404 / error-boundary screen: `not-found.tsx` and the `error.tsx` reset follow `DESIGN.md`.
- Screens for Phases 3–14 are not in the pack yet.