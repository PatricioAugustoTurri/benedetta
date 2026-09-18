---
name: Illustrando
description: El archivo de obra de una ilustradora, sobre papel cálido, con el año por espina.
colors:
  paper: "#faf7f2"
  paper-deep: "#f2ece3"
  ink: "#1c1a16"
  ink-soft: "#55504a"
  ink-faint: "#6f6861"
  line: "#e2dad0"
  accent: "#b4552f"
typography:
  display-mark:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 5.25rem)"
    fontWeight: 400
    lineHeight: 0.85
    letterSpacing: "-0.05em"
    fontVariation: "'opsz' 144, 'SOFT' 0, 'WONK' 1"
    fontFeature: "tabular-nums lining-nums"
  display-lead:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(2rem, 4.4vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 72, 'SOFT' 25, 'WONK' 1"
  display-statement:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
    fontVariation: "'opsz' 72, 'SOFT' 25, 'WONK' 1"
  display-section:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.025em"
    fontVariation: "'opsz' 32, 'SOFT' 20, 'WONK' 1"
  title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  body-lead:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  none: "0"
  focus: "2px"
  scrollbar: "99px"
spacing:
  gutter: "1.5rem"
  gutter-md: "2.5rem"
  gutter-xl: "4rem"
  column-gap: "1.5rem"
  column-gap-md: "2rem"
  band-gap: "1.25rem"
  band-gap-md: "1.75rem"
  section: "6rem"
  section-md: "8rem"
components:
  header:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "4rem"
  header-scrolled:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "4rem"
  nav-link:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-small}"
    padding: "0"
  nav-link-active:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
  link-underline:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "0"
  action-primary:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "0"
  label-rule:
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    padding: "0 0 1rem"
  year-band:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.25rem 0 0"
  year-count:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  work-plate:
    backgroundColor: "{colors.paper-deep}"
    rounded: "{rounded.none}"
    width: "100%"
  spec-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "0.75rem 0"
---

# Design System: Illustrando

## Overview

**Creative North Star: "El archivo sobre la mesa"**

This is a working archive laid out on warm paper, not a gallery with a foyer. The
first viewport is the body of work itself: a thin nav, then the year band, then
illustration. There is no hero sentence, no curated "selection", no button asking
to be pressed. The site's only saturated colour is the colour inside the
illustrations; every surface the system owns is paper, ink, a hairline rule, and
one terracotta mark that earns its rarity.

Density is editorial rather than dashboard: a wide 82rem shell with generous
gutters, a two-part grid of a sticky year spine on the left and a breathing
three-column masonry on the right, and horizontal hairlines doing all the
separating that boxes would otherwise do. Nothing is carded, nothing floats,
nothing is cropped — a work's own proportion is never overridden by the layout.

Material is flat and honest. Light mode only: a ground that changes colour changes
how an illustration reads, so there is no dark theme and no imitation paper
texture. Depth comes from hierarchy of rule colour and from one behaviour — hover
or focus a work and the rest of the archive recedes to 30% opacity, one work held
at a time.

**Key Characteristics:**
- Warm paper ground (#faf7f2), light only, no dark mode.
- Terracotta as rule and mark, never as a field.
- Fraunces on the optical axes it actually needs; Inter for everything read.
- Hairline rules instead of cards, borders, or shadows.
- Zero corner radius on content; nothing is a container.
- The archive dims around the work you are holding, in pure CSS.

## Colors

A warm, low-contrast paper palette with a single rust accent held in reserve so the
illustrations are the only fully saturated thing on screen.

### Primary
- **Terracotta Rule** (`{colors.accent}`): The one accent. It appears exactly twice
  per year band — as the top rule that opens the band and as the small uppercase
  work count under the year — and as hover ink on a work title in the diary and
  pager lists, the focus ring, and the text caret. It is never a fill.

### Neutral
- **Warm Paper** (`{colors.paper}`): The page ground everywhere, including the
  scrollbar track and the full-screen mobile menu.
- **Deep Paper** (`{colors.paper-deep}`): The plate an image sits on while it
  loads, and the only tonal step in the system.
- **Ink** (`{colors.ink}`): Body text default, titles, the year mark, the selection
  background (with paper as its text colour).
- **Soft Ink** (`{colors.ink-soft}`): Long-form prose, nav at rest, secondary
  metadata. 7.46:1 on paper.
- **Faint Ink** (`{colors.ink-faint}`): Small labels, captions, copyright, the
  scrollbar thumb on hover. 5.13:1 on paper — raised from an earlier value that sat
  below the 4.5:1 floor; that floor is binding for every new small text colour.
- **Line** (`{colors.line}`): Every rule on the site that is not a year rule —
  spec rows, footer, section heads, list separators, the scrolled header — plus the
  scrollbar thumb.

### Named Rules
**The Rule-and-Mark Rule.** Terracotta is applied to rules, marks, and single words
of state. It never becomes a background, a button fill, a badge, or a block. The
only full-colour field on any page is an illustration.

**The Two-Rank Rule Rule.** Hierarchy among hairlines is carried by colour, not
weight: every rule on the site is 1px, the year rule is terracotta, everything else
is `{colors.line}`. A new separator inherits `{colors.line}` unless it opens a year.

**The Ground-Is-Constant Rule.** One ground colour, light only. No dark mode, no
per-page tint, no gradient — a ground that shifts changes how the artwork reads.

## Typography

**Display Font:** Fraunces (variable, with ui-serif / Georgia fallback), self-hosted via `next/font`
**Body Font:** Inter (with ui-sans-serif / system-ui fallback), self-hosted via `next/font`

**Character:** Fraunces carries the warmth and the slightly wonky, hand-cut feel of
the work; Inter stays out of the way and reads. Weight is never used to shout —
there is one weight of each face, and scale plus optical size do the work.

### Hierarchy
- **Display Mark** (`{typography.display-mark}`): the year on the archive spine.
  Optical size 144, SOFT 0, WONK 1 — the crisp, high-contrast cut a numeral at 5rem
  needs. Tabular figures. Only the year uses it.
- **Display Lead** (`{typography.display-lead}`): the h1 of every interior page —
  work title, studio, contact, journal entry, 404. Optical size 72, SOFT 25.
- **Display Statement** (`{typography.display-statement}`): the closing invitation
  at the foot of the archive and the studio page, measured to 68ch.
- **Display Section** (`{typography.display-section}`): section headings and list
  item titles (Instagram, journal entries, service names). Optical size 32, SOFT 20
  — text-size type gets text-size optical modulation.
- **Title** (`{typography.title}`): work titles inside the archive grid.
- **Body Lead** (`{typography.body-lead}`): long-form prose in soft ink, capped at
  68ch.
- **Body / Body Small / Caption**: metadata, nav, links, footnotes.
- **Label** (`{typography.label}`, uppercase, faint ink): the small caps that head a
  list or name a field — "Sito", "Social", "Anno", "Tecnica", a journal date. It
  heads a list; it never sits above a heading.

### Named Rules
**The Optical-Ladder Rule.** Fraunces ships variable and every display size states
its own `opsz`/`SOFT`/`WONK`. A new display size picks the ladder rung nearest its
scale rather than inheriting one instance sitewide.

**The One-Weight Rule.** Both faces ship at a single weight and
`font-synthesis-weight: none`. Emphasis is scale, colour, and space — never a
bolder cut.

**The Tabular-Figures Rule.** Years, dates, dimensions, and any aligned numeral
carry `tabular-nums lining-nums`.

## Layout

An 82rem shell centred with gutters that open with the viewport: 1.5rem, 2.5rem at
768px, 4rem at 1280px. Breakpoints are 640 / 768 / 1280.

The archive is the spatial signature: a 12-column grid at ≥768px where columns 1–2
hold the year spine (sticky at `top: 7rem`, so the year stays with its band and
changes by cut, never by interpolation) and columns 3–12 hold a CSS multi-column
masonry — one column on phones, two at 640px, three at 1280px, gaps 1.5rem rising
to 2rem. Multi-column is chosen so every work keeps its true aspect ratio with no
crop and no gap between unequal heights. Bands pack greedily by aspect ratio and
emit their runs longest-first, so the ragged bottom edge falls against the outer
margin rather than opening a hole beside the year; the band's designated anchor
work is placed unshifted at the head of the leading run, so the author, not the
packing, decides what opens a year.

Interior pages use the same 12-column frame: a 7-column text measure on the left
and a 4-column aside starting at column 9. Long prose is capped at 68ch regardless
of column width.

Vertical rhythm is coarse and few-valued: 6rem between major sections (8rem at
768px), 1.25/1.75rem from a year rule to its first work, 3.5rem before the footer
rule. Mobile collapses the grid to a single stack; the year spine sits inline with
its count beside it rather than above.

## Elevation & Depth

**No shadows.** There is not a single `box-shadow` in the build, and depth is never
simulated. Separation comes from three devices: hairline rules, one tonal step
(`{colors.paper-deep}` under an image plate), and opacity as focus — the archive
drops every unhovered work to 30% so the held work advances by contrast rather than
by lift. The only layering effect in the system is the header, which is fully
transparent at rest and takes paper at 85%, a blur, and a `{colors.line}` rule once
`scrollY > 8` — it takes material only when there is artwork passing beneath it.

### Named Rules
**The No-Lift Rule.** Nothing casts a shadow, hard or soft. If a surface needs to
read as separate, give it a hairline or a tonal step; if it needs to read as
foregrounded, dim what surrounds it.

## Shapes

Square by decision. Content radius is zero everywhere: images, plates, the mobile
menu, the header, every list row. The only curves in the build are functional and
non-content — a 2px softening on the focus ring and a pill scrollbar thumb. There
are no cards, no panels, no boxes: the recurring silhouette is a full-bleed
rectangle of artwork over paper, separated from its neighbours by a 1px rule and
white space. Borders exist only as single-edge hairlines (`border-t`, `border-b`);
a four-sided border around content is not part of this language.

## Components

The system has no buttons, no chips, no cards, and no form inputs — the only action
is a link, and the primary action is a `mailto:` on a work page. Documenting what
exists rather than inventing primitives.

### Links
- **Character:** a line that grows, not a control that lights up.
- **Style:** inherits text colour; a 1px pseudo-element underline scales from the
  left over 400ms on the soft ease. Real `<a>` underlines get 0.18em offset and 1px
  thickness so they clear the descenders.
- **Hover / Focus:** underline sweeps in on hover, `:focus-visible`, and
  `[data-active="true"]` — the active state is the same drawing as the hover, so a
  current nav item reads as already-hovered.
- **Primary action ("Chiedi info"):** a drawn mail icon in faint ink beside a link
  held permanently underlined; the icon turns terracotta on hover. No fill, no box,
  no padding — it is a sentence you can click.
- **External links:** the label plus the drawn diagonal-arrow icon, 16px, inline.

### Navigation
- **Header:** transparent, sticky, 4rem tall (5rem at 768px). Nav labels in soft ink
  at 0.875rem with 2.5rem gaps; hover and the active route move them to full ink and
  draw the underline. Past `scrollY > 8` the bar takes paper/85, a blur, and a rule.
- **Wordmark:** "illustrando" in Fraunces, lowercase, 1.25rem (1.5rem at 768px).
- **Mobile:** a two-hairline menu button (the hairlines match the icon stroke
  weight), opening a full-screen paper panel below the header with routes at
  Fraunces 1.875rem, each on its own `{colors.line}` rule, and the address at the
  foot. Escape closes it; body scroll locks while open.

### Specification List
- **Style:** a definition list opened and closed by `{colors.line}` hairlines, one
  rule per row. Label in small caps faint ink on the left, value right-aligned in
  0.875rem with tabular figures. No background, no zebra, no radius.

### Icons
Authored SVG only, in `src/components/Icon.tsx`: a 24-unit box, `currentColor`
stroke at 1.25, round caps and joins, default 20px (16px for the external arrow).
Six shapes exist — arrow left, arrow right, arrow up-right, mail, Instagram, close.

### The Archive (signature)
The homepage is a stack of year bands. Each band opens on a terracotta rule, carries
its year in the sticky spine with the terracotta work count beside it, and lays its
works in a balanced masonry. Each work is an image on a deep-paper plate that scales
to 1.03 over 900ms on hover, its title in Fraunces, its category as a small-caps
label at the right of the same baseline, and its client and medium below in soft
ink. The signature behaviour is pure CSS with no client JavaScript: when any work is
hovered or focused, every other work and every other band's year mark falls to 30%
opacity over 550ms. Keyboard reaches the same state through `:focus-visible`.

### Reveal
Content enters by rising 1.25rem and fading in over 900ms on the soft ease, staged
by delay in 70–90ms steps down a list. It is a one-shot observer; the element stays
shown. Under `prefers-reduced-motion: reduce` the reveal is neutralised and every
animation and transition on the site collapses to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** keep terracotta to rules and marks, and let the illustration be the only
  full-colour field on the page.
- **Do** give every new small text colour ≥4.5:1 on `{colors.paper}` before it
  ships; `{colors.ink-faint}` is the floor value, not a starting point.
- **Do** separate with a 1px `{colors.line}` hairline and space. Terracotta rules
  are reserved for opening a year band.
- **Do** state the Fraunces optical axes for any new display size, picking the rung
  (144 / 72 / 32) nearest that scale.
- **Do** carry tabular lining figures on years, dates, and measurements.
- **Do** cap long-form prose at 68ch and set the page in the 82rem shell.
- **Do** draw new icons as SVG at stroke 1.25 in the 24-unit box.
- **Do** theme browser surfaces from the palette — selection, caret, scrollbars,
  focus ring — rather than leaving them at browser defaults.
- **Do** honour `prefers-reduced-motion` in any new motion.

### Don't:
- **Don't** fill anything with terracotta — no accent buttons, badges, chips, or
  blocks.
- **Don't** add a dark mode or tint the ground per page.
- **Don't** use a box-shadow, a faked lift, or a border on all four sides. Depth is
  rules, one tonal step, and opacity.
- **Don't** scaffold a page in cards. This world separates with rules and space.
- **Don't** crop an illustration to a fixed ratio; the grid adapts to the work.
- **Don't** put a kicker or eyebrow label above a heading. The small-caps label
  heads a list or names a field; a heading stands on its own.
- **Don't** use gradient text, or imitate paper grain in CSS. If grain is wanted it
  arrives as a real texture asset.
- **Don't** stand a unicode glyph in for an icon — not the arrow, not the menu, not
  the close.
- **Don't** reach for a heavier weight for emphasis; both faces ship one weight and
  weight synthesis is off.
- **Don't** require JavaScript for a visual state that `:has()`, `:hover`, and
  `:focus-visible` can carry.
