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
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 5.25rem)"
    fontWeight: 500
    lineHeight: 0.85
    letterSpacing: "-0.035em"
    fontFeature: "tabular-nums lining-nums"
  display-lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 3.25rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  display-statement:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  display-section:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  display-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  nav:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  nav-drawer:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(0.625rem, 3vw, 0.875rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  body-lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-small:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
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
    typography: "{typography.nav}"
    padding: "0"
  nav-link-active:
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
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
- One neutral grotesque, Geist, at two weights: 500 displays, 400 everything read.
- The wordmark is her own lettering, scanned — not a typeface.
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

**Text Font:** Geist (variable, weight axis 100–900, with ui-sans-serif / system-ui
fallback), self-hosted via `next/font/local` from the Google Fonts latin subset —
this Next version does not carry Geist in `next/font/google`. One 29 KB file sets
every word on the site: headings, body, metadata, labels.

**There is no second family.** The wordmark is not set in a typeface at all — it
is Benedetta's own lettering, scanned (see Assets). That is why one 29 KB file is
the entire type payload, down from three families.

**Character:** Geist is a neutral grotesque and makes no argument of its own. That
is the trade this system accepted: it reads as current and gets out of the way of
the illustrations, and it gives up the hand-cut warmth that a serif was carrying.
The warmth now lives in exactly two places — the paper ground and the wordmark —
so neither is decoration any more. Removing either would leave a page with nothing
of the illustrator in it. The wordmark carries the larger share, and it can,
because it is genuinely her hand and not a face chosen to suggest one.

**Character, the risk:** a neutral grotesque on warm paper is one step from looking
like a product page. What keeps it from crossing that line here is the absence of
everything that usually comes with it — no cards, no fills, no shadows, no buttons.
If those arrive later, the type will stop reading as editorial restraint and start
reading as a SaaS template.

The signature is the one handmade thing on a page of neutral type, and it is the
real article: pencil on paper, grain and broken edges intact. It replaced a
display face that was imitating exactly this. That is the order the whole brand
runs on — analogue as the origin, digital as the delivery — and the wordmark is
now the first place a visitor meets it, before a single illustration has loaded.

### Hierarchy
- **Display Mark** (`{typography.display-mark}`): the year on the archive spine,
  at the tightest rung of the tracking ladder. Tabular figures. Defined but not
  currently rendered — the even grid replaced the year spine, and the role is kept
  because the archive may return to bands.
- **Display Lead** (`{typography.display-lead}`): the h1 of every interior page —
  work title, studio, contact, journal entry, 404 — and the large mail link on the
  contact page.
- **Display Statement** (`{typography.display-statement}`): the closing invitation
  at the foot of the archive and the studio page, measured to 68ch.
- **Display Section** (`{typography.display-section}`): section headings and list
  item titles (Instagram, journal entries, service names), the work and journal
  pagers, and the routes in the mobile drawer.
- **Display Title** (`{typography.display-title}`): work titles inside the archive
  grid. The tightest hierarchy in the system — it sits directly above its own
  client-and-medium line at 0.875rem, and only the weight step separates them.
- **Body Lead** (`{typography.body-lead}`): long-form prose in soft ink, capped at
  68ch.
- **Body / Body Small / Caption**: metadata, nav, links, footnotes.
- **Label** (`{typography.label}`, uppercase, faint ink): the small caps that head a
  list or name a field — "Sito", "Social", "Anno", "Tecnica", a journal date. It
  heads a list; it never sits above a heading.

### Named Rules
**The Tracking-Ladder Rule.** Geist has no optical-size axis, so the ladder that
Fraunces carried in `opsz` is carried in tracking instead: the larger the size, the
tighter the letter-spacing, because spacing scales with the body and at headline
size there is too much of it. The rungs are −0.035em at the year, −0.025em at a
headline, −0.015em at a section head, −0.01em at a work title, and normal at body
and below. A new display size picks the rung nearest its scale; nothing goes past
−0.04em.

**The Two-Weight Rule.** Geist ships at exactly two weights, with
`font-synthesis-weight: none` so nothing is ever faked. Body, metadata, and labels
are 400; every display role is 500. This is the one thing the old system did with a
second family, and it is not decoration: at a single weight a work title and its
own catalogue line are the same text, and the grid stops being scannable. 500 is
the lightest step that separates them; 600 makes a page of twelve works shout. A
third weight is not available — emphasis inside a role is scale, colour, and space.

**The Lettering-Is-Not-Type Rule.** The wordmark is an image and may never be
retyped in a typeface, however close the match looks. Anything that needs the
name in running text — a heading, a page title, `<title>`, an alt attribute — uses
the plain word "Illustrando" set in Geist like any other word. There is no third
font in this system and no font that stands in for her hand.

**The Nav-Inverts Rule.** The four routes are the one element that gets larger
on the desktop bar and smaller in the phone drawer, and the two sizes are
separate roles rather than one responsive value. On the bar the nav sits a step
above body-small so it holds its own under the wordmark; in the drawer it drops
to small text because the panel, the rules, and the stagger already carry the
hierarchy and the words do not need to. A drawer route is not a section heading:
it takes no rung of the tracking ladder, and its weight 500 is there for
legibility at 10px, not for emphasis.

**The Three-Gestures Rule.** A menu that opens on hover must also open by
keyboard and by touch, and the three are separate mechanisms, not one. Pointer
entry opens it only when `pointerType` is `mouse`, so a tap does not open and
close in the same gesture; the trigger is a real `button` with `aria-expanded`,
so Enter and Space work; and a tap toggles. Hover carries intent delays — 140ms
to open so crossing the label on the way elsewhere does not fire it, 300ms to
close so the trip from label to panel does not lose it. A closed panel is
`inert`, so nothing invisible is ever in the tab order. Where there is no hover
at all, the same content appears as an inline disclosure inside the drawer:
same content, the gesture the device has.

**The Unroll Rule.** A panel that changes height animates it by going from
`grid-template-rows: 0fr` to `1fr`, never by a `max-height` guess. The content
sets its own height, so a category added later cannot silently break the
transition or get clipped. The band unrolls over 420ms on the soft ease while
its ground, border, and blur fade in over the same beat, and the items inside
rise 0.5rem and fade on the site's 70ms stagger. Closing skips the stagger
entirely: arriving is a moment, leaving is not.

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
  at `{typography.nav}` with 2.5rem gaps; hover and the active route move them to
  full ink and draw the underline. Past `scrollY > 8` the bar takes paper/85, a blur, and a rule.
- **Wordmark:** `illustrando-wordmark.png`, Benedetta's lettering, sized by width
  because the asset is trimmed to the ink — 180px on phones, 240px from 768px, and
  150px in the footer. It ships with its intrinsic 740×147 on the element so the
  space is reserved before it loads and the header never jumps, and it is
  `priority` in the header because it sits in the first viewport. In the header
  the `<img>` takes `alt=""` and the accessible name comes from the link's
  `aria-label`; in the footer, where there is no link, the `alt` is "Illustrando".
- **Shop dropdown:** the one nav item that is a `button`, not a link — it has no
  page. Hovering or activating it unrolls a band from the bottom edge of the
  header, edge to edge. Full width is not a taste for scale, it is what the rest
  of the system leaves available: with no shadows and no four-sided borders, a
  narrow panel floating over artwork has nothing to draw its left and right
  edges with. Edge to edge there are no side edges to draw, and the band can
  borrow the material the header already uses when work passes beneath it —
  `{colors.paper}` at 95%, a blur, and one `{colors.line}` hairline along the
  bottom. It overlays rather than pushes: a menu that shifts the page down on
  hover is a trap, not a transition. Inside, the categories lay out 2 / 3 / 5
  across, each a name at `{typography.nav}` over a `{typography.caption}` line
  of material, with a terracotta dot appearing at the left on hover. **No
  scrim** — a scrim reads as modal, and this menu is not.
- **Mobile:** a two-hairline menu button (the hairlines match the icon stroke
  weight), opening a half-screen paper panel beside the header with routes at
  `{typography.nav-drawer}`, each on its own `{colors.line}` rule, and the address
  at the foot. Escape closes it; body scroll locks while open. The rows keep
  1rem of vertical padding whatever the type does, so the tappable target stays
  the same size as the words shrink.

### Specification List
- **Style:** a definition list opened and closed by `{colors.line}` hairlines, one
  rule per row. Label in small caps faint ink on the left, value right-aligned in
  0.875rem with tabular figures. No background, no zebra, no radius.

### Wordmark asset
The only raster the design system owns. `public/illustrando-wordmark.png` — 740×147,
26 KB, ink `{colors.ink}` carried entirely in the alpha channel so the pencil grain
survives as varying opacity rather than as a colour. Derived from
`design-source/Opera_senza_titolo.jpg`, a 300 dpi scan on white; the alpha comes
from inverting luminance with a 244 white point, which clears the JPEG ringing
around the stroke without flattening the grain. Trimmed to the ink box, with no
baked margin — the air around the wordmark is CSS. `design-source/README.md` holds
the full recipe so a new scan can be reprocessed identically.

Not vectorised, by decision: a trace would produce clean outlines and lose the
grain, which is the only thing separating this signature from a script font.

### Icons
Authored SVG only, in `src/components/Icon.tsx`: a 24-unit box, `currentColor`
stroke at 1.25, round caps and joins, default 20px (16px for the external arrow).
Six shapes exist — arrow left, arrow right, arrow up-right, mail, Instagram, close.

### The Archive (signature)
The homepage is a stack of year bands. Each band opens on a terracotta rule, carries
its year in the sticky spine with the terracotta work count beside it, and lays its
works in a balanced masonry. Each work is an image on a deep-paper plate that scales
to 1.03 over 900ms on hover, its title at `{typography.display-title}`, its category as a small-caps
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
- **Do** give any new display size its rung on the tracking ladder, and set it at
  weight 500 so it separates from the text around it.
- **Do** carry tabular lining figures on years, dates, and measurements.
- **Do** set a lateral column's content at `{typography.body-small}` when a
  small-caps label heads it. The work page's spec list, the contact aside, and
  the footer columns all read at that step; a side column left at body size is
  the one that looks wrong, not the three that agree.
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
- **Don't** let a full-width plate be taller than the screen. Where a work runs
  at the width of the spread, its own proportion decides how much of the spread
  it takes: at 1.2 and wider it reaches both margins, and below that it is
  capped by height and centred. Cropping is never the way out of a tall work.
- **Don't** put a kicker or eyebrow label above a heading. The small-caps label
  heads a list or names a field; a heading stands on its own.
- **Don't** use gradient text, or imitate paper grain in CSS. If grain is wanted it
  arrives as a real texture asset.
- **Don't** stand a unicode glyph in for an icon — not the arrow, not the menu, not
  the close.
- **Don't** reach past 500 for emphasis, or introduce a third weight. The ramp has
  two steps by decision and weight synthesis is off.
- **Don't** require JavaScript for a visual state that `:has()`, `:hover`, and
  `:focus-visible` can carry.
