---
name: Vend3D
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c7c7bf'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#91918a'
  outline-variant: '#464742'
  surface-tint: '#c8c6c2'
  primary: '#ffffff'
  on-primary: '#30312e'
  primary-container: '#e4e2dd'
  on-primary-container: '#656461'
  inverse-primary: '#5f5e5b'
  secondary: '#c2ed30'
  on-secondary: '#293500'
  secondary-container: '#a7d000'
  on-secondary-container: '#435500'
  tertiary: '#ffffff'
  on-tertiary: '#342f31'
  tertiary-container: '#e9e0e2'
  on-tertiary-container: '#696365'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e4e2dd'
  primary-fixed-dim: '#c8c6c2'
  on-primary-fixed: '#1b1c19'
  on-primary-fixed-variant: '#474744'
  secondary-fixed: '#c7f337'
  secondary-fixed-dim: '#acd60e'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#e9e0e2'
  tertiary-fixed-dim: '#cdc4c6'
  on-tertiary-fixed: '#1e1b1c'
  on-tertiary-fixed-variant: '#4a4547'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '500'
    lineHeight: 72px
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 46px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
  metric-mono:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2rem
  margin: 1.5rem
  margin-desktop: 5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 5rem
  space-3xl: 9rem
---

## Brand & Style

This design system establishes an ultra-minimal, quiet, and futuristic environment for 3D product customization and spatial retail. It blends the precise industrial utility of Teenage Engineering and Nothing with the editorial serenity of Aesop and the frictionless craft of Apple, Linear, and Vercel. 

The interface steps out of the light to make the physical product rendering the sole protagonist. Surfaces are quiet, typography speaks at an ambient volume, and interactions feel tactile, deliberate, and weightless. 

### Design Principles
- **Invisibility over Decor:** If a frame, border, or label can be removed without losing orientation, eliminate it. Spatial margins and light differences replace visible dividing infrastructure.
- **Instrumental Restraint:** The UI resembles an exacting physical measuring instrument or audio deck—calibrated, quiet, and free of clutter.
- **Atmospheric Contrast:** Monochromatic canvas with rare, electric micro-signals. The system never shouts; state changes are crisp, silent, and instantaneous.
- **Human Warmth in Dark Canvas:** Dark surfaces are warm-tinted obsidian rather than harsh cold black; light surfaces echo raw parchment and limestone rather than sterile laboratory white.

## Colors

The palette operates on a strict monochromatic discipline accented by a single high-voltage functional tone. 

### Color Architecture

#### Dark Canvas (Default)
- **Background:** `#0A0A0B` (Deep Obsidian)
- **Surface:** `#121214` (Recessed Panel)
- **Surface Raised:** `#1A1A1D` (Elevated Deck)
- **Hairline / Border:** `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.05)`
- **Text Primary:** `#EDEDED`
- **Text Muted:** `#7C7C82`

#### Light Canvas (Alternative)
- **Background:** `#F7F5F0` (Limestone Wash)
- **Surface:** `#FFFFFF` (Pure Alabaster)
- **Surface Raised:** `#EFECE5` (Warm Bone)
- **Hairline / Border:** `rgba(0, 0, 0, 0.07)`
- **Text Primary:** `#0F0F10`
- **Text Muted:** `#7A7872`

### Accent Discipline: Electric Lime (`#C6F135`)
Acid Lime is an operative signal, never an aesthetic wash. It is strictly constrained to four functional touchpoints:
1. Active color/material swatch outer selection ring (1.5px offset).
2. Live studio status micro-dot (6px fixed diameter).
3. Active viewport manipulation tool indicator pip.
4. Range slider active fill track and precision scrub head.

Under no circumstances is Lime used as a full button background, typography fill, large card fill, or visual badge container.

## Typography

Typography prioritizes quiet structural authority and mechanical legibility using Geist across all hierarchy tiers.

### Rules of Expression
- **Sentence Case Only:** Never use uppercase tracking for field labels, section headers, or tool tips. UI copy reads as standard natural language (e.g., "Camera position", "Matte finish", "Add to bag").
- **Display Restraint:** Headline weights cap strictly at weight `500` (Medium). No ultra-heavy weights or decorative geometric displays are permitted.
- **Tabular Figures:** All pricing, physical dimensions, coordinate readouts, and scale percentages must be set with tabular lining figures (`font-variant-numeric: tabular-nums`) to prevent layout shifts during viewport interaction and real-time computation.
- **Tight Kerning:** Large headlines employ negative letter-spacing to produce an integrated, architectural silhouette that mirrors engineered hardware.

## Layout & Spacing

The layout philosophy divides into two distinct operational contexts: the **Studio Canvas** (a fixed-aspect, zero-chrome spatial environment) and the **Storefront Flow** (an editorial, expansively paced vertical scroll).

### Layout System
- **Studio Interface:** Floating, anchored panels with fixed margins from viewport bounds. The 3D viewport extends edge-to-edge under glass overlays. Controls dock to bottom corners and screen-center anchors without framing chrome.
- **Storefront Grid:** A 12-column fluid grid on desktop (`1440px+` container max-width) with generous gutters of `2rem` and wide safe-margins of `5rem`. Tablet adopts an 8-column layout (`1.5rem` gutters), and mobile condenses to a 4-column layout (`1rem` gutters, `1.5rem` margins).
- **Macro Rhythm:** Major editorial transitions require breathing room between `7.5rem` (`120px`) and `11.25rem` (`180px`). This empty space mirrors gallery exhibition walls and separates product variants without dividers.

## Elevation & Depth

Visual depth is conveyed through light permeation and tonal separation rather than layered box shadows. 

### Levels of Depth
- **Level 0 (Stage Ground):** The base color `#0A0A0B` (or `#F7F5F0`). Serves as the infinite ambient backdrop.
- **Level 1 (Docked Surfaces):** `#121214`. Deep solid containers with hairline borders (`1px solid rgba(255, 255, 255, 0.08)`). No drop shadow.
- **Level 2 (Active Studio Overlays):** Frosted floating glass. 
  - Fill: `rgba(18, 18, 20, 0.65)` in dark mode / `rgba(255, 255, 255, 0.70)` in light mode.
  - Backdrop Filter: `blur(24px) saturate(180%)`.
  - Border: `1px solid rgba(255, 255, 255, 0.12)`.
  - Shadow: `0 20px 40px -15px rgba(0, 0, 0, 0.5)`.
- **Level 3 (Modal Dialogs & Command Sheets):** `#1A1A1D` with `blur(32px)` canvas masking behind.
- **Floor Contact Shadows (3D Space):** Soft, highly diffused contact shadows underneath the rendered product (`filter: blur(40px)`, opacity `0.45`), anchoring the object directly into the web page floor.

## Shapes

The design system combines sculptural curves with ergonomic touchpoints:

- **Large Interactive Canvas & Panels:** Radii between `28px` and `32px`. Gives substantial components a tactile, cast-molded profile.
- **Inputs, Sliders & Swatch Enclosures:** Fixed `16px` radius. Fits the human finger pad naturally while staying distinct from panel enclosures.
- **Primary Actions, Filter Tags & Floating Pills:** Full pill (`rounded-full` / `9999px`). Provides clear affordance of single-tap interactive units.
- **Hairline Precision:** Internal dividers and framing elements must never exceed `1px` in physical thickness, rendered as sub-pixel translucent outlines.

## Components

### Buttons
- **Primary Action (Dark Mode):** Solid off-white `#F2F0EB` fill, deep dark text `#0A0A0B`. Pill shape (`rounded-full`), height `48px`, horizontal padding `24px`. Geist weight `500`. No drop shadows; on hover, shifts subtly to opacity `0.92` with a `scale(0.99)` press interaction.
- **Secondary Action:** Glass pill. Fill `rgba(255, 255, 255, 0.06)`, text `#EDEDED`, border `1px solid rgba(255, 255, 255, 0.10)`. Hover: `rgba(255, 255, 255, 0.10)`.
- **Ghost Action:** No fill, no border. Muted text `#7C7C82`, transitioning to `#EDEDED` on hover.

### Material & Color Swatches
- **Swatch Structure:** Circular or squircle tokens (`40px` diameter) with real texture maps or matte color fills.
- **Selection State:** Surrounded by an outer `1.5px` border separated by a `2px` transparent gap. When active, this ring lights up in Acid Lime `#C6F135`. Inactive swatches feature no outer border until hovered.

### Form Inputs & Viewport Controllers
- **Text Inputs:** Height `48px`, `16px` corner radius. Fill `#121214`, border `1px solid rgba(255, 255, 255, 0.08)`. Placeholder color `#7C7C82`. Active focus state transitions border to `#EDEDED` with zero outer glowing halo.
- **Numeric Precision Steppers:** Embedded directly into the input container. Tabular typography, accompanied by micro minus/plus controls that emerge on mouse hover.
- **Range Scrubbers:** Track height `4px` in `rgba(255, 255, 255, 0.12)`. Active scrubbed segment filled with `#C6F135`. Thumb is an off-white `16px` circular pill with an inset tactile dimple.

### Cards & Configuration Modules
- **Editorial Cards:** Flat `#121214` surface, `28px` corner radius, zero shadow. Content is aligned with generous inner padding (`2rem`).
- **Floating Studio HUD:** Detached floating bar centered at the bottom of the viewport containing camera angle presets, wireframe toggles, and lighting environments. Frosted glass (`blur(24px)`), pill-shaped, hairline border.
- **Live Status Indicator:** A single `6px` circular badge illuminated with `#C6F135`, accompanied by `label-sm` text stating system states (e.g., "model loaded", "ready to mill").