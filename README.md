# Novan Water — Landing Site

Premium bilingual (EN ⇄ AR) landing page for Novan Water, implemented from the
Claude Design handoff bundle in `design_bundle/` (v3 — "Porcelain & Petrol").

## Stack

- **[Astro 5](https://astro.build)** — static HTML output, zero framework runtime.
  The page ships only one small vanilla-TS module for interactions, so LCP and
  Lighthouse scores stay maximal.
- **TypeScript** (strict) for the interaction layer: [src/scripts/main.ts](src/scripts/main.ts)
- **One global design-system stylesheet**: [src/styles/global.css](src/styles/global.css)
  (oklch palette, grain textures, reveal/motion system, RTL rules)
- No other dependencies.

## Commands

| Command           | Action                                  |
| ----------------- | --------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Dev server at `localhost:4321`          |
| `npm run build`   | Production build to `./dist/`           |
| `npm run preview` | Preview the production build locally    |

## Structure

```
src/
  layouts/Base.astro        head, fonts, language restore, SEO meta
  pages/index.astro         section order
  components/               one component per section
    Header.astro            fixed nav + EN/AR toggle + mobile menu
    Hero.astro              full-bleed hero, rotating scroll badge
    Credentials.astro       awards/certifications bar
    Story.astro             "Our Source" editorial
    Stats.astro             animated counters
    Range.astro             product cards (Path-style hover swap)
    Films.astro             carousel — centered film focused, rest faded
    Process.astro           purity process steps
    Sustain.astro           responsibility section
    Community.astro         community cards
    Voices.astro            Path-style testimonial band + partners
    Cta.astro               distributor call-to-action
    WaterFooter.astro       Path-style water footer (single gentle wave)
    WhatsApp.astro          floating WhatsApp button
    Lightbox.astro          YouTube film lightbox
  scripts/main.ts           all interactions (reveals, parallax, carousel…)
  styles/global.css         the design system
```

## Content placeholders to replace

- **Photos** — Unsplash placeholders; swap the `src` URLs in the components.
- **Films** — YouTube IDs in [Films.astro](src/components/Films.astro) (`films` array).
- **WhatsApp number** — `phone` in [WhatsApp.astro](src/components/WhatsApp.astro).
- **Phone/email** — in [Cta.astro](src/components/Cta.astro) and
  [WaterFooter.astro](src/components/WaterFooter.astro).

## Bilingual content

Every translatable element carries `data-en` / `data-ar` attributes; the toggle
swaps text, `lang` and `dir` (full RTL) client-side and persists the choice in
`localStorage` (restored before first paint in `Base.astro`).
