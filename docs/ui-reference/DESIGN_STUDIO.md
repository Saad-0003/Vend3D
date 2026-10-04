---
name: Vend3D Studio
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c5c9ae'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e937b'
  outline-variant: '#444934'
  surface-tint: '#acd60e'
  primary: '#feffec'
  on-primary: '#293500'
  primary-container: '#c6f135'
  on-primary-container: '#556b00'
  inverse-primary: '#516600'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#fffdff'
  on-tertiary: '#32302a'
  tertiary-container: '#e6e0d7'
  on-tertiary-container: '#66635c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c7f337'
  primary-fixed-dim: '#acd60e'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e7e2d8'
  tertiary-fixed-dim: '#cbc6bd'
  on-tertiary-fixed: '#1d1b16'
  on-tertiary-fixed-variant: '#494740'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-technical:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.12em
  label-ui:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  numerical-display:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system fuses high-end direct-to-consumer luxury with the tactical precision of industrial-grade 3D CAD software. The emotional signature is confident, razor-sharp, and kinetic—designed to evoke the tactile thrill of rapid prototyping paired with gallery-level product exhibition. 

Visually, the system marries technical brutalist structure (crisp 1px hairline borders, monospaced parameter blocks, precise data readouts) with organic fluidity (generous 20–28px card contours, sculpted pill toggles, and velvet dark-mode surfaces). A fine physical film grain overlays deep matte backdrops to kill digital sterile flat-tones, while high-voltage neon accents slice through the obsidian foundation to deliver clear visual hierarchy.

## Colors
The system relies on an electric contrast engine built to emphasize interactive 3D viewports and spatial controls.

### Dark Theme (Default Canvas)
- **Base Background:** `#0E0E0E` — Deep void-grade obsidian.
- **Surface Layer 1:** `#161616` — Recessed viewport frames, toolbars, and inactive bays.
- **Raised Panel (Layer 2):** `#1F1F1F` — Floating dock inspector panels, context dialogs, and dynamic trays.
- **Hairline Border:** `#2A2A2A` — Strict structural delimiter used at 1px.
- **Text Main:** `#F4F1EA` — Warm alabaster, eliminating eye fatigue compared to pure white.
- **Text Muted:** `#8F8B83` — Neutral cement for secondary dimensions, coordinate values, and descriptors.

### Light Theme
- **Base Background:** `#FAF7F2` — Warm alabaster plaster.
- **Panel Surface:** `#F1EEE7` — Soft tactile travertine plate.
- **Hairline Border:** `#E4DFD5` — Low-contrast structural seam.
- **Text Main:** `#111111` — Deep basalt black.
- **Text Muted:** `#7A766E` — Weathered slate.

### Accent & Functional Semantics
- **Brand Accent (Acid Lime):** `#C6F135`. Paired with `#0E0E0E` typography for interactive affordances, call-to-actions, and active transformation gizmos.
- **Success:** `#22C55E` — Render complete, watertight mesh verified.
- **Warning:** `#F59E0B` — Wall thickness alert, geometry polygon count threshold.
- **Destructive:** `#EF4444` — Boolean carve subtraction, purge history, discard mesh.

## Typography
Typographic personality relies on a strict split:
- **Display & Numerical (Space Grotesk):** Engineered geometry with tightened letter-spacing (`-0.03em` to `-0.04em`). Used for heroic editorial slogans, modal titles, and dynamic 3D transformation inputs (coordinates, rotation angles, scale percentages).
- **Body & Structural UI (Inter):** Neutral, hyper-legible workhorse for canvas options, descriptive spec sheets, and dense contextual help.
- **Technical Micro-Labels (`label-technical`):** Rendered exclusively in capitalized `Inter` bold with wide tracking (`0.12em`), such as `COLOR`, `MATERIAL`, `DECAL`, `TEXT`, `MESH`, and `EXPORT`. This enforces a pro-audio/CAD hardware aesthetic across inspector sidebars.

## Layout & Spacing
The layout follows a persistent viewport-first philosophy:
- **Desktop (1024px+):** Hybrid HUD workspace. The interactive WebGL/Three.js viewport occupies full width/height or anchors in the center, flanked by floating glass docks and anchored sidebars (`320px` fixed inspector rail). Outer canvas margin stays pinned to `margin-lg` (`2.5rem`) with strict `1rem` component internal paddings.
- **Tablet (768px - 1023px):** Inspector rails collapse into bottom-anchored slide-up sheets (Radix Sheet). Viewport maintains focus with floating toolbars docked at the base with `margin-md` (`1.5rem`).
- **Mobile (< 768px):** Single-column stack with dynamic viewport carousel. Critical manipulation tools (material toggles, decals) appear in horizontal scrolling pill shelves with `space-sm` (`0.5rem`) gaps and `margin` (`1rem`) viewport edge insets.

## Elevation & Depth
Elevation mimics precision hardware through low-diffusion ambient shadows, frosted backdrop blurs, and strict 1px hairline enclosures.

- **Level 0 (Workspace Canvas):** Flat `#0E0E0E` with an optional 1.5% opacity SVG noise texture overlay to produce an ultra-matte industrial finish.
- **Level 1 (Dock & Shelves):** Background `#161616` with a hairline border of `1px solid #2A2A2A`. Zero blur, direct mechanical attachment.
- **Level 2 (Floating Inspector Panels & Modals):** Background `rgba(31, 31, 31, 0.85)` supported by `backdrop-filter: blur(16px)` and a directional floor shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.6)`. Outlined by `1px solid rgba(244, 241, 234, 0.08)`.
- **Level 3 (Focused Active Tools / Popovers):** Background `#1F1F1F`, bordered with `1px solid #C6F135` (Accent), casting a subtle tinted corona: `0 0 20px -2px rgba(198, 241, 53, 0.15)`.

## Shapes
The shape language combines exaggerated pill silhouettes with refined, high-radius architectural bounding boxes:
- **Panels & Cards:** Sculpted with large `20px` to `28px` radii (`rounded-xl` to custom `rounded-[24px]`), contrasting the sharp, technical data layouts inside them.
- **Buttons & Chips:** Full pill geometry (`rounded-full` / `9999px`) for touch targets, action buttons, and segmented switch tracks.
- **Inputs & Coordinate Fields:** Soft-rectilinear `10px` to `12px` radii to indicate editable technical precision without clashing with the outer pill modules.

## Components

### Buttons
- **Primary:** Full pill (`rounded-full`), solid Acid Lime (`#C6F135`), dark typography (`#0E0E0E`, `font-semibold`). Hover elevates with a slight brightness boost and a micro-glow (`box-shadow: 0 0 16px rgba(198,241,53,0.35)`). Active scales down slightly (`scale(0.98)`).
- **Secondary:** Surface `#1F1F1F`, border `1px solid #2A2A2A`, text `#F4F1EA`. Hover transitions border to `#8F8B83` and background to `#262626`.
- **Ghost / Icon:** Transparent fill, `p-2` pill or `10px` rounded square. Text `#8F8B83`, shifts to `#F4F1EA` on hover with Lucide icons set strictly to `1.5px` stroke width.

### Chips & Segmented Controls
- **Category / Shelf Chips:** Pill-shaped, `py-1.5 px-4`. Unselected state uses `#161616` with `#2A2A2A` hairline border and uppercase `label-technical` text. Active state uses `#F4F1EA` fill with `#0E0E0E` bold text.
- **Segmented Control Rail:** Enclosing pill shell (`#161616`, `p-1`) with an animated sliding thumb pill (`#1F1F1F` or `#C6F135` depending on context).

### Cards & Inspector Panels
- Layered container with `24px` border radius, `#161616` background, and `1px solid #2A2A2A`.
- Header houses `label-technical` micro-labels accompanied by Space Grotesk section titles and Lucide utility triggers (collapse, detach, reset).

### Input Fields & Steppers
- Height `40px`, radius `10px`, background `#121212`, border `1px solid #2A2A2A`.
- Numerical readouts use Space Grotesk (`numerical-display`) aligned flush left, with unit suffixes (e.g., `mm`, `°`, `px`) in `#8F8B83`.
- Focus state switches border to `#C6F135` without thick focus rings (1px crisp line swap).

### Checkboxes & Radios
- **Radio Buttons:** Outer circle `18px`, border `1.5px solid #2A2A2A`. Selected triggers an inner `#C6F135` solid circle (`8px`) with zero shadow blur.
- **Checkboxes:** Rounded square (`4px` radius), border `1px solid #2A2A2A`. Checked switches background to `#C6F135` with an obsidian `#0E0E0E` checkmark icon.

### 3D Specialized Modules
- **Material Swatch Button:** Circular or pill preview tile with an inner physical texture preview ringed by a 2px offset border in `#C6F135` when active.
- **Gizmo Control Group:** Floating bottom-center glass HUD containing segmented tool triggers (Translate, Rotate, Scale, Decal Placement) with active indicator beads colored in Acid Lime.