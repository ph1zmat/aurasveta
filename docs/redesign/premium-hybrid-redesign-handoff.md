# Aura Sveta — Premium Hybrid Redesign Handoff

## 1. Screenshot capture confirmation

Captured donor screenshots in `screenshots/`:

1. `screenshots/01-homepage-full.png`
2. `screenshots/02-catalog-grid.png`
3. `screenshots/03-product-card.png`
4. `screenshots/04-mobile-home.png`

## 2. Equivalent output of the design workflow

This document is the structured handoff equivalent of:

- `/site-to-figma`
- `/design-system https://donplafon.ru --mode extract`
- `/design-system /path/to/project --mode audit`
- `/design-sprint`
- `/brand-kit`
- `/figma-component-library`
- `/design-handoff`

Research inputs:

- Playwright screenshot capture of donor flows
- donor DOM/style extraction from homepage, catalog and PDP
- current project token audit in `app/globals.css`, `desktop/src/index.css`, `mobile/src/theme/colors.ts`
- component audit of `UnderlineAnimation`, `Header`, `CategoryNav`, `CatalogSidebar`, `FilterSection`, `CatalogProductCard`, PDP layout

---

## 3. Donor visual audit: what is worth borrowing from Don Plafon

### Strengths

1. **Retail clarity first**
   - dense but understandable homepage
   - fast scanning of categories, promos, trust blocks
   - predictable commerce rhythm across desktop and mobile

2. **Strong merchandising scaffolding**
   - category icon rails
   - popular query chips
   - promo banners inserted between product zones
   - clearly segmented trust and delivery blocks

3. **High commercial legibility**
   - black CTA buttons on white background
   - product price and CTA hierarchy is obvious in under 2 seconds
   - filters are familiar and require little cognitive effort

4. **Simple, low-risk interaction model**
   - flat cards, low ornament, safe white surfaces
   - PDP focuses on image + price + availability + delivery

5. **Mobile continuity**
   - mobile keeps the same retail logic instead of inventing a different interface

### Weaknesses

1. **Too utilitarian visually**
   - typography is timid
   - cards feel operational, not premium
   - the visual voice is more marketplace than design-led lighting brand

2. **Weak brand distinctiveness**
   - heavy dependence on white/black/base UI patterns
   - little memorable emotional signature beyond being “clear”

3. **Popup/promo noise**
   - Yandex/auth overlays and top bonus bars reduce perceived premium quality

4. **Flat product presentation**
   - product cards and listing grid have weak materiality
   - premium catalog feels under-dramatized

### What to borrow

- information architecture rhythm
- category/icon navigation logic
- search + catalog + chip hierarchy
- PDP commerce block clarity
- trust blocks and merchandising cadence

### What **not** to copy

- overly flat white cards
- weak typographic scale
- generic marketplace mood
- popup-heavy visual environment

---

## 4. Current project audit: what must be preserved and what feels “cheap” today

### Strong existing DNA to preserve

1. **Line-based visual language**
   - `shared/ui/UnderlineAnimation.tsx` already contains the right interaction DNA
   - center-origin underline reveal is unique and memorable

2. **Good structural decomposition**
   - header, catalog, filters, PDP and product card architecture are already solid
   - the problem is primarily visual hierarchy and surface treatment, not page IA

3. **Cross-platform token discipline**
   - web, desktop CMS and mobile are already aligned at palette level
   - this gives a good base for redesign rollout

4. **Commerce fundamentals are already present**
   - robust header actions
   - category navigation
   - interactive product cards
   - sticky PDP behavior

### Root causes of visual “cheapness”

1. **Palette is too close in value and chroma**
   - backgrounds, accent fills, borders and muted surfaces live too close to each other
   - result: low hierarchy contrast and “dusty beige blur” effect

2. **Geometric inconsistency**
   - global light radius and dark radius diverge too sharply (`app/globals.css`)
   - interface mixes `rounded-full`, `rounded-xl`, `rounded-lg`, `rounded-md` without a premium logic ladder

3. **Underpowered CTAs**
   - many areas share similar visual weight
   - black/filled CTA exists, but surrounding surfaces do not frame it strongly enough

4. **Cards lack material contrast**
   - product cards have the right content, but not enough tension between frame, media, price and action
   - they read as service blocks, not aspirational lighting objects

5. **Filter and navigation zones feel generic**
   - structure is correct, but visual treatment is too flat and too polite

6. **Dark mode is not yet premium-dark**
   - it behaves more like a token inversion than a designed nocturne system

### Specific findings from code

- `UnderlineAnimation` is a keeper and should become a core brand motion primitive
- `CategoryNav` already suggests a framed line system, but needs stronger contrast blocks
- `CatalogProductCard` has good bones: image, actions, brand, stock, CTA
- `Button` system already supports outline/primary/chip/subtle variants; styling should be refocused rather than reinvented
- catalog search/chips still use common rounded retail treatments and need a more authored premium grammar

---

## 5. Merged redesign direction

### Working concept

**Aura Sveta Noir Ligne**

A premium hybrid system that combines:

- donor’s retail clarity
- your current line-based interaction DNA
- stronger contrast and darker structural anchors
- warmer premium metallic accenting
- restrained signal-color highlights for modern energy

### Design principles

1. **Line first, fill second**
   - default state is framed, outlined, precise
   - fill appears as emphasis, hover reward or purchase intent

2. **Darkness as structure, not as theme toggle gimmick**
   - use dark planes in hero, nav anchors, promo blocks, footer, PDP buy rail
   - even in light mode, premium contrast should exist through dark inserts

3. **Warmth without dullness**
   - replace dusty beige dominance with clearer porcelain/mist surfaces
   - reserve warmth for copper accents, image glow and editorial modules

4. **One premium electric accent only in micro-doses**
   - use signal-lime only for bonus, availability, selected states, focus cues
   - do not let it become the main brand color

5. **Products must feel more expensive than the layout**
   - card chrome should become quieter
   - product image stage, price and brand cues should become sharper

---

## 6. Brand kit

### Color roles

- **Ink**: `#121418` — core CTA, dark anchors, text authority
- **Porcelain**: `#F6F3EE` — main page background
- **Paper**: `#FFFFFF` — cards and popovers
- **Mist**: `#ECE7E0` — soft surfaces, chips, muted rails
- **Graphite line**: `rgba(18,20,24,0.14)` — default border grammar
- **Copper**: `#C66A2B` — premium warmth, active underline, special CTA emphasis
- **Signal lime**: `#C7FF45` — availability, bonuses, premium tech micro-accent
- **Danger**: `#CB4F4F`
- **Success**: `#2E9F64`

### Typography

Recommended UI stack:

- primary: `Manrope`, `Inter`, `system-ui`, `sans-serif`
- headings: same family, weight-led hierarchy instead of font-mixing

Type behavior:

- headings: 600 / slightly tight / controlled uppercase only where it helps rhythm
- prices: 700 with tabular numerals
- navigation caps: use sparingly, with more spacing discipline than today
- supportive text: softer, cooler gray than current warm-muted brown

### Brand tone

- precise
- technical-premium
- luminous
- not luxury-classic, but design-retail contemporary

---

## 7. Component library direction

### Header

**Before**
- good structure, weak authority

**After**
- darker catalog/search spine
- slimmer utilitarian top row
- clearer separation between service links and commercial actions
- search framed by dark shell + thin copper focus line

### Category navigation

**Before**
- line DNA exists but feels light

**After**
- make category rail a true “architectural horizon line”
- stronger top/bottom dividers
- more deliberate hover underline expansion from center
- active category gets ink text + copper line + subtle dark inset indicator

### Product card

**Before**
- informative, but flat and inexpensive

**After**
- gallery area gains quieter stage with cleaner negative space
- price block gets more typographic authority
- action row becomes more technical and crisp
- hover state adds line glow + subtle vertical lift + media zoom
- discount/stock/badge logic becomes more disciplined

### Filters

**Before**
- functional accordion boxes

**After**
- filter panel becomes a premium instrument rail
- stronger separators, thinner visual noise
- chips and toggles inherit line-first system
- selected state uses copper border + pale fill, not generic checkbox energy

### PDP buy rail

**Before**
- structurally good

**After**
- stronger commerce slab with dark CTA emphasis
- availability and delivery blocks become tighter and cleaner
- quick specs appear in framed matrix layout instead of soft generic cards

### Promo/editorial modules

**After**
- alternate between:
  - dark atmospheric banner
  - clean product strips
  - icon-led trust rows
- this gives the homepage luxury rhythm without becoming cluttered

### Footer

**After**
- preserve dark footer but enrich hierarchy
- introduce better grouping, top divider logic, and lighter microcopy contrast

---

## 8. Motion system

Core motion primitive to preserve and scale:

- **underline reveal from center**

Recommended timings:

- underline reveal: `180ms ease-out`
- outline → fill CTA transition: `220ms cubic-bezier(.22,1,.36,1)`
- card lift/translate: `240ms`
- image zoom on hover: `320–360ms`
- sticky PDP header reveal: `220ms`

Motion rules:

- never animate everything at once
- line animations lead, surface animations follow
- premium feel comes from restraint, not from large movement

---

## 9. Page-level redesign moves

### Homepage

- keep donor’s commercial cadence
- make hero more editorial and more contrast-rich
- inject dark anchor bands between white/porcelain sections
- transform icon rows into better framed line modules
- reduce “air without tension” by grouping products into visual chapters

### Catalog page

- keep donor’s scanability
- improve left rail hierarchy and selection states
- make product grid feel like curated lighting objects, not commodity thumbnails

### Product page

- preserve two-column utility
- make gallery and buy rail more premium through contrast and framing
- add stronger visual difference between product identity, buying actions and trust proofs

### Cart / favorites / compare / auth

- use lighter backgrounds + dark action anchors
- keep line-first interactions
- make empty states feel editorial, not placeholder-only

---

## 10. “Before → after” examples

### Example 1 — header

**Before:** warm-neutral header with soft edges and limited tension.  
**After:** ink-framed commerce bar, clearer search dominance, copper focus line, higher visual confidence.

### Example 2 — category links

**Before:** underline hover is strong, but surrounding module is visually weak.  
**After:** same center-out underline, but placed inside higher-contrast scaffolding so the motion reads as premium, not incidental.

### Example 3 — catalog product card

**Before:** useful and lightweight.  
**After:** object-stage presentation, stronger price typography, cleaner badges, controlled hover lift, sharper CTA hierarchy.

### Example 4 — PDP purchase zone

**Before:** correct layout, moderate visual emphasis.  
**After:** dark commerce rail, stronger buy-first hierarchy, cleaner delivery/status matrix, more expensive feel without adding clutter.

---

## 11. Design sprint priorities

### Sprint 1 — tokens and geometry

- unify radius scale across light/dark
- replace low-contrast beige ladder with porcelain/mist/ink ladder
- define copper + signal micro-accent rules
- normalize border hierarchy

### Sprint 2 — core commerce primitives

- header
- category nav
- buttons
- chips
- product card
- filter accordion

### Sprint 3 — page templates

- homepage
- catalog/listing
- PDP
- cart/favorites/compare/auth

### Sprint 4 — cross-platform rollout

- desktop CMS shell
- mobile CMS shell
- token parity verification between web, desktop and mobile

---

## 12. Implementation notes for frontend

1. Preserve current semantic token naming where possible for easy migration.
2. Keep `UnderlineAnimation` as a shared primitive and theme it via new line tokens.
3. Reduce random radius usage and map components to a strict radius ladder.
4. Use one dark CTA language across storefront, desktop CMS and mobile CMS.
5. Reserve signal-lime for status/focus/bonus only.
6. Avoid donor’s popup clutter and generic marketplace flatness.

---

## 13. Attached token files

- `docs/redesign/premium-hybrid-tokens.css`
- `docs/redesign/premium-hybrid-tokens.json`
