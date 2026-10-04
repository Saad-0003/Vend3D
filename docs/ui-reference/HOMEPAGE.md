# Landing page — shipped design spec

The source of truth for `/`, transcribed from the full-scroll storefront screens the human
supplied on 2026-10-04. Implementation lives in `src/components/landing/*`; when code and this
document disagree, this document wins and the code is fixed.

Global rules come from [`DESIGN.md`](./DESIGN.md) (tokens, accent discipline, type scale).
The purple/indigo frame around the supplied screen captures is a Google Stitch selection
highlight and is **not** part of the design.

## Shell

- **Header:** floating pill, `max-w-[1400px]`, `h-14`, rounded-full, hairline ring, blurred
  background, inset `4px` from the viewport top. Left: the brand lockup — the isometric cube mark
  cropped from the supplied artwork (`public/brand/logo-mark.png`, rendered 22px tall) followed by
  the wordmark set in Geist semibold with tight tracking: `vend` in the primary text colour and
  `3d` in Acid Lime. Centre: pill nav (`Shop`, `Studio`, `Designs`) where the active item sits on
  `bg-foreground/[0.08]`; hidden below `md`, replaced by a dropdown trigger. Right: cart button
  with a lime count dot, then a filled circular avatar linking to `/login`.
- **Footer:** rounded `[28px]` hairline panel. Left column: wordmark, the line
  "See it. Shape it. Own it.", a one-sentence description, three circular social links.
  Then `Platform` and `Support` link columns, then `Dispatch bulletin` with an email field and a
  lime `Join` button. Newsletter has no backend (email is out of scope) and says so in a toast.
- Page background is the stage colour; every panel is `#121214` or `#1A1A1D` with a 1px
  `rgba(255,255,255,0.08)` ring. Shadows are used only on the frosted overlays.

## 1. Hero

Full-bleed `[28px]/[32px]` panel, subtle top light gradient, two-column at `lg`.

- Left: pill badge with a lime dot reading `Next-gen realtime 3D studio` (11px, uppercase,
  `0.14em`); headline on three lines — `See it.` / `Shape it.` / `Own it.` — the last line in
  Acid Lime, `font-medium`, `leading-[0.94]`, `-0.04em`; one supporting paragraph; two CTAs
  (`Start designing` primary off-white pill with dark text, `Shop` glass pill with a hairline
  border); a rating row of five lime stars, `4.9` in tabular figures, `from 2,000+ makers`, and a
  hairline rule that fills the remaining width.
- Right: a vertical colorway rail of five 24px circles sits half-outside the media card — the
  selected swatch carries a 2px lime ring with a 2px offset. The media card is square, `rounded-2xl`,
  hairline ring, and carries a `Drag to rotate` pill (lime dot, blurred black) in its top-right
  corner. Under the card, right-aligned, three feature chips (`360° interactive view`,
  `Matte 1.8/6 food-grade steel`, `Precision laser engraving`).
- Bottom strip: hairline top border, then a `justify-between` row of six uppercase 11px specs —
  Heavyweight cotton, Glazed stoneware, Insulated flasks, Structured caps, Real-time UV mapping,
  Zero minimums.

## 2. Engineered precision

Centred eyebrow (`Engineered precision`, lime, uppercase), headline
`Built for tactile perfection.`, sub-line about the high-fidelity physics engine. Four equal
cards, each `[20px]` radius, hairline ring, `p-6`, containing: a 20px lime icon, a micro-visual,
a `title-md` heading, a `body-md` muted paragraph.

| Card | Icon | Micro-visual |
|---|---|---|
| Precision color | pen | full-width gradient track |
| Material physics | sun | `Matte 20%` — track with lime thumb — `Glossy` |
| Custom decals | crop | lime dashed pill `Drag SVG or PNG` |
| Laser engraving | sliders | mono pill `DEPTH: 0.12mm FIBER` |

## 3. Hardware collection

Left-aligned eyebrow (`Hardware collection`) over the headline `Blanks engineered to endure.`;
right-aligned lime link `Browse full archive →`. Four product cards:

- Square `object-cover` image, `[20px]` card radius, hairline ring.
- Hover: the card lifts `-translate-y-2` over 300ms with a deep contact shadow
  (`0 28px 60px -28px rgba(0,0,0,0.95)`) and the ring brightens; the image scales to `1.04` over
  500ms. Keep the lift — flat cards read as unfinished at this card size.
- Rating pill `★ 5.0` (lime star) in a blurred black chip, top-right, overlapping the image.
- Body: name (left) and price (right, tabular figures, muted).
- Footer row: three 14px colorway dots (first one ringed in lime with an offset) and a
  `Customize` glass pill.

Placeholder data (images from `assets/`, prices as strings — see DECISIONS D-019/D-021):
Heavyweight Boxy Tee `$48.00`, Luna Glazed Mug `$28.00`, Structured 6-Panel Cap `$36.00`,
Insulated Steel Bottle `$42.00`.

## 4. Three simple steps

Centred eyebrow `Three simple steps` over `From 3D viewport to your studio.` Three cards, at least
`260px` tall with `p-8`, each carrying an oversized translucent step number (`01`, `02`, `03`,
`text-foreground/[0.05]`, 96px, anchored bottom-right), a 10-unit rounded icon tile with a lime
icon, a `title-md` heading and a `body-md` paragraph pushed to the bottom (`mt-auto`) so the three
baselines align: **Pick** (select a blank), **Shape** (adjust materials, calibrate pigments, apply
vector artwork), **Own** (laser-etched or screenprinted, dispatched in 48 hours).

## 5. Capability stats

Four compact cards in one row: `Zero minimums`, `Sub-millimeter print`, `Real-time proofing`,
`Carbon neutral dispatch` — lime icon, `title-md` heading, `body-md` paragraph.

## 6. Launch banner

`[28px]` panel with `assets/studio-scene.png` as a 45%-opacity backdrop under a left-to-right
stage gradient. Content: five lime stars with `5.0 (28)`, headline
`Creators launch drops without waiting.`, then a glass `See all reviews ↗` pill and a solid lime
`Launch Your Canvas` pill. Below a hairline, three testimonial cards (blurred, `[16px]` radius):
stars, quote, and a footer with the company name plus a lime uppercase `READ ALL`.

## Responsive behaviour

- `≥1024px`: hero two columns, feature/collection/stat grids at their full column counts.
- `768–1023px`: hero stacks, cards drop to two columns.
- `<768px`: single column everywhere, nav collapses into a dropdown, hero media follows the copy,
  colorway rail stays attached to the media card's left edge.