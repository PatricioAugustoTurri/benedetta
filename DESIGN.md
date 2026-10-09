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
  display-h1:
    fontFamily: "Caprasimo, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2rem, 4.4vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0"
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
    fontSize: "clamp(0.875rem, 4vw, 1.125rem)"
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
  action: "6px"
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
  work-plate:
    backgroundColor: "{colors.paper-deep}"
    rounded: "{rounded.none}"
    width: "100%"
  spec-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "0.75rem 0"
  field-label:
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    padding: "0"
  field-label-focus:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  field-control:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.625rem 0"
  button-commit:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.5rem"
  empty-slot:
    backgroundColor: "rgb(242 236 227 / 0.4)"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    width: "100%"
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
- One display face, Caprasimo, on page titles only — every `h1` a visitor sees.
- The wordmark is her own lettering, scanned — not a typeface.
- Hairline rules instead of cards, borders, or shadows.
- Zero corner radius on content; nothing is a container. One control is the
  exception and it is named — see The One Loud Thing.
- The archive dims around the work you are holding, in pure CSS.

## Colors

A warm, low-contrast paper palette with a single rust accent held in reserve so the
illustrations are the only fully saturated thing on screen.

### Primary
- **Terracotta Rule** (`{colors.accent}`): The one accent. It appears exactly twice
  per year band — as the top rule that opens the band and as the small uppercase
  work count under the year — and as hover ink on a work title in the diary and
  pager lists, the focus ring, and the text caret. It draws one outline and one
  fill, both on the same control — the `Chiedi info` button on a work page, whose
  1px terracotta edge fills on hover. See The One Loud Thing.

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
of state. It never becomes a background, a badge, or a block, and the only
full-colour field on any page is an illustration — with one named exception below,
which spends its colour on an outline and only fills under a pointer.

**The One Loud Thing.** There is exactly one closed shape on the site: the
`Chiedi info` button on a work page, repeated once, identically, as `Invia` at the
foot of the contact form. It is the only thing bordered on four sides,
the only corner radius on any content, and the only place terracotta becomes a
fill. Everywhere else the Rule-and-Mark Rule holds without exception.

It exists because the site has exactly one action. Nothing is sold, there is no
checkout, and every path a visitor can take ends in an email about a specific
piece — so the one control that starts that email is allowed to be the one loud
thing, and no second control ever earns the same permission.

**At rest it is a line, not a block.** A 1px `{colors.accent}` edge at
`{rounded.action}`, with the word and the drawn mail icon in terracotta on paper,
`0.625rem 1.25rem` of padding. Terracotta on paper and paper on terracotta both
measure 4.59:1, so either state clears the floor.

**Three forms were built before this one stuck**, and the order matters to anyone
who inherits this file. A solid terracotta block came first and was too much: a
saturated rectangle beside an illustration competes with it. The original mail icon
and underlined word came back for a turn and was too little for what the client
wanted this control to do. The outline is the settled answer — the fill did not
disappear, it moved to hover, where weight costs nothing because someone is already
pointing at it. The 6px radius is deliberately the gentlest step that still
registers: past it the shape starts reading as a pill, and this world owns none.

Its focus ring is **ink, not accent** — the one place in the system where it is.
An accent ring three pixels off a terracotta edge reads as a halo of itself rather
than as a ring.

An exception that can be named in a sentence is still a system; two are a habit.
The contact form's `Invia` is not a second exception but the other end of the same
one: `Chiedi info` carries the visitor to the form with the subject written, and
`Invia` opens the email — one action, drawn the same at both ends, from one class
string in `src/components/azione.ts`. It travels no further: the footer's address
and every future call to action stay as they are.

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

**Title Font:** Caprasimo, from `next/font/google` with the latin and latin-ext
subsets, on every `h1` a visitor sees — the work page, Studio, Contatti and the 404 —
through `.display-h1`. It is the site's only second family and it stays on that one
element. Everything else, including the `display-lead` step it replaces there and
every heading inside `/admin`, remains Geist: a display face at this weight on a
working screen is noise.

It carries **one weight, 400**, and that decides how it is used. Titles cannot take
the 500 the rest of the system spends to separate a heading from its text, because
asking a family for a weight it does not have makes the browser invent one by
thickening the strokes — and this system has weight synthesis off. Here the family
does the separating: beside Geist, this face needs no weight to be told apart.

Its tracking is **0, not the -0.025em of `display-lead`**. That negative step exists
because a grotesque opens up at display sizes; Caprasimo is already fitted for them,
and tightening it closes the contours that make it recognisable.

**The wordmark is still not a typeface.** It is Benedetta's own lettering, scanned
(see Assets), so the page can carry a title, a wordmark and a body voice while only
two font files ship.

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
display face that was imitating exactly this. Most of her work is digital; the
wordmark is the one place the site shows her hand on paper, and the first thing a
visitor meets, before a single illustration has loaded.

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
- **Display Title** (`{typography.display-title}`): work titles in the grid that
  edits the archive, sharing a baseline with the year in small caps to their right
  and heading a working line at 0.75rem, where the weight step alone separates the
  two. It no longer appears on the public archive, which shows no words at all; the
  step survives because `/admin` still needs to name what it is editing.
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
to 2rem. Cells are square: what a visitor compares between one piece and the next is
the work, not the shape of its frame, and the work this archive holds is square, so
`object-cover` crops nothing. It stays in place for the landscape or very tall piece
that may arrive later. Bands pack greedily by aspect ratio and
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

The one four-sided border in the build is not around content: an **empty slot** —
the cell where the next work goes, and the image picker in the editor — is drawn
with a 1px *dashed* `{colors.line}` rectangle over `{colors.paper-deep}` at 40%.
Dashed carries the whole distinction: a solid rule separates things that exist, and
a solid box here would read as a work that failed to load; a dashed one outlines a
place where something can be put. It keeps a piece's proportion where the grid has
one (`4:5` from 640px) and goes landscape (`2:1`) on a single-column phone, where a
full-height cell would fill more than the screen before the first work appeared. On hover the
dashes and the ground warm toward terracotta at 50% — the slot is the only place a
dashed line exists, and the only place terracotta touches a four-sided border.

## Components

The public site has no buttons, no chips, and no cards: its only action is a link,
and its primary action is the `Chiedi info` control on a work page, which carries the
visitor to the contact form with the subject already written. Fields and one filled
button exist, and only on the two surfaces that write something down — the contact
form and the archive editor. Documenting what exists rather than inventing primitives.

### Links
- **Character:** a line that grows, not a control that lights up.
- **Style:** inherits text colour; a 1px pseudo-element underline scales from the
  left over 400ms on the soft ease. Real `<a>` underlines get 0.18em offset and 1px
  thickness so they clear the descenders.
- **Hover / Focus:** underline sweeps in on hover, `:focus-visible`, and
  `[data-active="true"]` — the active state is the same drawing as the hover, so a
  current nav item reads as already-hovered.
- **Primary action ("Chiedi info"):** the one exception to everything in this
  section — a bordered, rounded, terracotta control. See The One Loud Thing.

  **It navigates; it does not open a mail client.** It goes to
  `/contatti?opera=<slug>`, and that page reads the slug, looks the work up and
  hands the contact form its title as the subject. It used to be a `mailto:`, which
  asked the visitor to have a mail client configured — on a phone, or in webmail,
  that link often opens nothing and says nothing, so the single most important
  control on the site failed silently. A form is always visible. The slug travels
  rather than the title so the subject is the one she loaded, not text anybody can
  put in a URL, and so a saved link still names the work correctly after a rename;
  a slug that no longer resolves simply leaves the field empty.
- **External links:** the label plus the drawn diagonal-arrow icon, 16px, inline.

### Buttons
- **Character:** one weight of commit, and only where something is actually written
  down.
- **Shape:** a square block of ink — `{colors.ink}` ground, `{colors.paper}` label,
  zero radius, 0.75rem × 1.5rem of padding, at `{typography.body-small}`.
- **Where:** the commit action of a form and nowhere else — "Entrar", "Cargar la
  obra", "Guardar cambios". A form's secondary action ("Cancelar") stays an
  underlined link, so the two never look like a pair of buttons.
- **Hover / Disabled:** opacity to 85% on hover; 50% while the action is in flight,
  with the label in the present tense ("Guardando…"). No colour change, no lift.

**The Ink-Not-Terracotta Rule.** The one filled control in this system is filled with
ink. Terracotta stays a rule, a mark, and a word of state — a filled accent button
would make the loudest thing on screen something that is not an illustration.

**The Button-Earns-Its-Box Rule.** A filled block is the only box in a world that
separates with rules, so it is spent once per form, on the action that changes
something. Anything that only navigates is a link. A public page has no button.

### Inputs / Fields
- **Character:** a line you write on, not a box you fill in.
- **Style:** a small-caps label in faint ink (`{typography.label}`) above a
  transparent control carried on a single `{colors.line}` bottom rule, 0.625rem of
  vertical padding, no box, no fill, no radius, no four-sided border. The rule is the
  control's own `border-b`, so it measures exactly the field.
- **Size:** `{typography.body}` (1rem) is a floor, not a preference — under 16px
  Safari on iPhone zooms the page on focus and leaves it displaced.
- **Focus:** the bottom rule goes to full ink and the label follows it, through
  `group-has-[:focus]` on the field wrapper. The site's focus ring is otherwise
  untouched; it only squares off (radius 0, offset 2px) on `input`, `textarea`, and
  `select`, because a rounded ring around a seven-column field is a pill.
- **Error:** the bottom rule goes terracotta and the reason appears beneath it in
  terracotta at `{typography.caption}`. Error outranks focus by specificity — a field
  with a problem keeps saying so while the cursor is in it.
- **Hint:** an optional faint-ink `{typography.caption}` line between label and
  control. A hint is never a placeholder: a placeholder disappears exactly when it is
  needed.
- **Multiline:** `field-sizing-content` so the box grows with the text instead of
  scrolling inside itself; `resize-y` stays enabled for browsers without it.

**The One Field Rule.** There is one field drawing in this system, and both forms use
it verbatim — the contact form and the archive editor declare the same label and
control strings character for character. A third form does not invent a third
drawing; it lifts these two into a shared module and uses them.

### The Control Layer (Operate surfaces)
Editing sits on top of the published archive rather than beside it: `/admin` renders
the site's own grid — same three columns, same 4:5 plate, same 1.03 hover scale, same
title-and-year baseline — and adds exactly one layer, the controls. It also keeps
a caption line the public grid no longer has: technique, image count, and whether
the text is still missing. That is not drift to be tidied away — those are the
three things she needs while loading, and none of them is the visitor's business. The reason is
that the judgement being made while loading a work is how the piece reads next to the
others, and a list of text rows hides it. The one thing deliberately not inherited is
the entrance animation: on a working screen, a grid that re-stages itself after every
save puts half a second of choreography between her and the next thing she was doing.

**The Resting-Place Rule.** Any affordance revealed by hover must declare where it
sits when there is no pointer. Both the per-piece controls and the terracotta hover
hairline are scoped in `[@media(hover:hover)]`: with a pointer they ride over the
plate at zero opacity and appear on `group-hover` or `group-focus-within`; without
one they fall into flow on the caption line and are always visible. The query asks
about the device, not the width — a tablet is wide and still touched. This is not a
nicety: on a touch screen `:hover` latches after a tap, so an unscoped rule leaves a
piece at rest wearing terracotta, and terracotta here means state.

**The Confirm-In-Place Rule.** A destructive action asks in the row it belongs to,
never in a modal. The delete question takes the caption band beneath its own image —
solid paper over a `{colors.accent}` top rule, the work still visible above it — and
sets "Borrar" in terracotta against "Dejarla" in soft ink. That accent rule is the
only terracotta border outside a year band, and it is spent here because this is the
one action that cannot be undone.

- **Per-piece controls:** 2rem square targets on 95% paper, faint-ink icons at 16px;
  move and edit go to ink on hover, delete goes to terracotta. The grip is first in
  the group, because it is the one of the three that is held rather than tapped —
  the hand goes to it, not to it after passing the other two. The pencil duplicates
  the destination of the plate itself, so it carries `aria-hidden` and `tabIndex={-1}`
  rather than announcing the same work twice in a row.
- **Hover hairline:** a 1px `{colors.accent}` border drawn `inset-0` inside the
  plate, never as a `border` on it — a real border would shift the image one pixel on
  appearance and give the layer away.
- **Status mark:** the admin bar's state is a 4px dot, faint ink when the database
  answers and terracotta when it does not. Never green: in this system colour marks
  what wants attention, and "working" wants none.

**The Held-Piece Rule.** The order of the archive is hers, and she sets it by
dragging inside the grid it publishes to. Three drawings carry the whole gesture
and none of them is new to the system:

- **The piece in hand** is the same plate, lifted: solid `{colors.paper}` behind
  it, the `{colors.accent}` hairline at full strength instead of on hover, and the
  title in terracotta. This system owns no shadow to say "above", so opaque paper
  plus the state colour says it. It follows the pointer on `translate3d`, never on
  `left`/`top`.
- **The landing place** is a dashed `{colors.line}` square over the vacated cell,
  at the size of a piece. It is the second legitimate dashed line here and it
  means what the first one means: nothing is in this slot, and something can go in.
- **The others** slide one slot on `transform` over 260ms on the soft ease — not
  the archive's 900ms, which is the speed of looking rather than of working.
  Nothing changes place in the document until she lets go: the cell boxes are
  measured once at pickup, and a layout that reflowed mid-gesture would drop the
  piece in the wrong square.

The grip is held, not toggled: there is no "reorder mode" to enter and leave,
because the ask was to reorder whenever and as often as she likes, and a mode
turns one move into three gestures. Everything the pointer does the keyboard does
too — space lifts, arrows move, space drops, Escape returns the piece — and every
interrupted gesture (`pointercancel`, a resize, an archive that changed
underneath) lands on *cancel*, never on save.

### Navigation
- **Header:** transparent, sticky, 4rem tall (5rem at 768px). Nav labels in soft ink
  at `{typography.nav}` with 2.5rem gaps; hover and the active route move them to
  full ink and draw the underline. Past `scrollY > 8` the bar takes paper/85, a blur, and a rule.
- **Wordmark:** `benedetta-zibetti-wordmark.png`, Benedetta's lettering of her own
  name on two lines, sized by width because the asset is trimmed to the ink —
  100px on phones, 136px from 768px, and 112px in the footer. It ships with its
  intrinsic 602×375 on the element so the space is reserved before it loads and
  the header never jumps, and it is `priority` in the header because it sits in
  the first viewport. In the header the `<img>` takes `alt=""` and the accessible
  name comes from the link's `aria-label`; in the footer, where there is no link,
  the `alt` is "Benedetta Zibetti" (`site.signature`) — the words the image shows.
- **Mobile:** a two-hairline menu button (the hairlines match the icon stroke
  weight), opening a half-screen paper panel beside the header with routes at
  `{typography.nav-drawer}`, each on its own `{colors.line}` rule, and the address
  at the foot. Escape closes it; body scroll locks while open. The rows keep
  1rem of vertical padding whatever the type does, so the tappable target is set
  by the padding and not by the word: it measured the same when these labels were
  a headline, when they were halved to 10px, and now at 14–18px. That is what
  makes the size a free decision for the client rather than an accessibility one.

- **Shop dropdown:** the one nav item that is two controls — the word links to
  `/shop`, a 16px chevron beside it is a `button` that unrolls a 19rem sheet centred
  under the label, hanging from the header's bottom hairline (side and bottom
  hairlines, full paper, no shadow). Mouse hover opens after 140ms and closes 220ms
  after leaving; touch and keyboard use the chevron; Escape returns focus to it. While
  open the header takes full paper and its hairline even at the top. Items stagger in
  at 70ms. In the phone drawer Shop is not split: the whole row is one `button`
  with the same chevron, and it unrolls in place (0fr→1fr, 380ms), pushing the
  routes below down. Categories sit indented one step smaller in faint ink, at
  400 and not in the display role; the last row, "Tutto lo Shop" in soft ink
  with an arrow, is the drawer's only door to `/shop`. Collapsed, the list is
  `inert`. The drawer always opens with Shop collapsed, on `/shop` too, and choosing any row
  — a category, "Tutto lo Shop", or a route outside the shop — collapses it as the
  drawer leaves (client, 2026-10-07).
  Categories go to `/shop/<categoria>`. See PRODUCT.md, "Tienda".

- **Cart (the bag):** a paper bag drawn in the icon stroke (1.25), not a supermarket
  trolley, with the count of distinct prints (cart lines, not copies) printed *inside*
  its body in 10px tabular figures, ink, never a red badge — nothing rounded sits on an icon in this system. Empty, the
  bag is empty: no zero. Desktop: absolutely on the header's right edge, vertically
  centred on the wordmark block, outside the nav row because it belongs to the whole
  masthead. Phone: the same bag in the bar, immediately left of the menu toggle at
  its height (touch areas abutting, 17px between the drawings), so the cart is always
  visible without opening anything. No drawer row and no word "Carrello" (client,
  2026-10-07), and no dot on the toggle — the bag carries its own number. **One authored motion:** only on add (a
  `carrello:aggiunto` event, never on load or cross-tab sync) the bag dips 2px and
  returns (520ms) while the new number rises 4px into place — only when a new line
  entered; another copy of a print already inside dips the bag and leaves the number
  still. Reduced motion drops both.

### Shop
- **Product grid:** the archive cell exactly — 4:5 crop, slow 3% zoom, the archive's
  few-pixel gap (4–8px) — and, like the archive, not a single word: no title, no
  price (client, 2026-10-07; the earlier caption with "da 10 €" is gone). Name and
  starting price live in the link's accessible name and on the print's own page.
  Sections open on a hairline with the name in the section-display role; an empty
  prints section still renders, saying so, with a link to the contact form.
- **Print mockup on hover:** a print with a mockup (the sheet hung in a room) keeps it
  over the cover at zero opacity. When the pointer rests for one second the camera
  steps back: the mockup settles from 1.08 scale and 6px blur to sharp over 0.9–1.4s on
  the soft ease. The second is the point — sweeping across the grid changes nothing;
  only lingering does. It leaves at once in 450ms. Keyboard focus shows it with the
  same wait; reduced motion keeps only the swap; with no hover pointer the mockup is
  `display: none` and never downloads. Alt is empty: the cover already names the work.
- **Print page carousel:** a print with a mockup turns its plate into a carousel —
  the artwork first, the mockup last. Native horizontal scroll with snap (finger and
  trackpad keep the system's inertia), no arrows; 48px 4:5 thumbnails under the plate,
  right-aligned from tablet up, the current one full opacity with a 1px ink rule
  drawn beneath, the rest at 55%. One frame for every slide, sized by the artwork's
  own ratio under the 78vh cap, so swiping never changes the height. The mockup is
  served at the print's exact dimensions (Cloudinary `c_fill,ar_W:H,g_auto` — a
  room, not the work, so it can lose wall), in the carousel and in the viewer alike;
  the artwork is never cropped. Each
  slide still opens the viewer, which includes the mockup. Without a mockup the page
  keeps the work layout.
- **Services (Illustrazioni Personalizzate, Ritratti Illustrati):** not products. Two
  fixed pages, never a list. On `/shop` they sit first under "Su commissione" as two
  cells of the same 3-column grid (4:5 cover, title, two lines of text, "Scopri come
  funziona"); a service without images shows paper-deep with its name. The service
  page (`/shop/<servizio>`) is the `.opera` composition with only «Chiedi info» in the
  aside, which stays right under the text (`.opera--servizio`: top-aligned on desktop,
  before the plates on phones). Text splits into paragraphs on blank lines.
- **Print page:** the work page's `.opera` composition (name and text, first plate,
  pairs, fullscreen viewer) with the aside swapped. Prints: a radio list of formats on
  hairlines — name left, price right — whose mark is a ring with an accent centre;
  then the primary action "Aggiungi al carrello" (same shape as «Chiedi info») and a
  `role="status"` line that confirms and links to the cart. A print made from a work
  links back to it, and the work page says "Disponibile come stampa".
- **Cart page:** lines on hairlines (4:5 thumb, title, format · unit price, a 32px
  −/n/+ stepper, line total, "Togli"); a sticky aside with the shipping zone as the
  same radio list, then Subtotale/Spedizione/Totale as a Specification List and the
  full-width primary action. The page renders nothing until mounted, so it never
  flashes "vuoto" for a cart that lives in localStorage.
- **Discount code (cart):** between the shipping zone and the totals, one closed
  line, "Hai un codice sconto?" with a 14px chevron, that unrolls (0fr→1fr,
  420ms) into the One Field drawing: small-caps label, a single bottom rule
  owned by the row, the code in tabular uppercase, and "Applica" as an
  underlined word at the end of that rule — never a second button, the form's
  only box is the payment. Error outranks focus (rule, label and caption go
  terracotta). Applied, the field disappears and the code becomes a row of the
  totals between Subtotale and Spedizione: "Codice BENZIBET98" with the amount
  in terracotta (a word of state) and a caption line with what it covers and
  "Togli"; the row rises 4px into place (520ms, none under reduced motion).
- **The ticket (Admin Ordini):** every order carries "Biglietto", its personal
  code, set at `text-xl` 500 with 0.08em tracking so it can be copied by hand
  onto the card in the parcel, with its terms in a faint caption. "Modifica"
  opens code / sconto / scade il in place, on the same field drawing and the
  admin's small ink commit. A used code is struck through and names, in
  terracotta, the order it came back with.
- **Admin Shop:** tabs Opere | Shop | Ordini in the admin bar (count beside each;
  orders count only those to ship, in accent). Two parts: "Su commissione" — two
  service rows that only open the edit form (no add, delete or reorder; a missing text
  or image is flagged in accent) — and "Stampe" — rows with status and price list,
  ↑/↓ forms instead of drag, and the archive's dashed tile stretched into "Nuova
  stampa".

### Specification List
- **Style:** a definition list opened and closed by `{colors.line}` hairlines, one
  rule per row. Label in small caps faint ink on the left, value right-aligned in
  0.875rem with tabular figures. No background, no zebra, no radius.

### Wordmark asset
The only raster the design system owns. `public/benedetta-zibetti-wordmark.png` —
602×375, 32 KB, ink `{colors.ink}` carried entirely in the alpha channel so the
stroke grain survives as varying opacity rather than as a colour. Derived from
`design-source/Nome_Sito.jpg`, a scan on white; the alpha comes from inverting
luminance with a 244 white point, which clears the JPEG ringing around the stroke
without flattening the grain. Trimmed to the ink box, with no baked margin — the
air around the wordmark is CSS. `design-source/README.md` holds the full recipe so
a new scan can be reprocessed identically. It replaced the earlier "illustrando"
lettering (`illustrando-wordmark.png`) and was chosen over a one-line "Zibetti"
trial (`zibetti-wordmark.png`, from `Nome_Sito 2.jpg`); both are kept in
`public/` but no longer rendered: the site now signs with her name, while "Illustrando" stays the name in
`<title>`, the copyright line and the Instagram handle.

Not vectorised, by decision: a trace would produce clean outlines and lose the
grain, which is the only thing separating this signature from a script font.

### Icons
Authored SVG only, in `src/components/Icon.tsx`: a 24-unit box, `currentColor`
stroke at 1.25, round caps and joins, default 20px (16px for the external arrow).
Twelve shapes exist — arrow left, arrow right, arrow up, arrow up-right, mail,
Instagram, close, copy, and the four the admin added: plus, pencil, trash, move.
The admin's four live in the same file on purpose: a second icon set at another
stroke weight is exactly what this file exists to prevent, and the loading
screen has to look drawn by the same hand as the site.

**Move** is a four-way arrow, not the three stacked rules a list handle usually
wears — those rules are already the mobile menu button, and one drawing for
"open the navigation" and "pick up this piece" is how someone taps one meaning
the other. It is also truer: the archive is a grid, and a piece moves on two
axes. Its cross stops at 13 of the 24 units so the glyph carries the same
optical weight as the pencil and the trash beside it; reaching the frame made
it the heaviest of the three and broke the group.

### The Archive
The homepage is one flat grid, three across from 1024px and two everywhere below
it, phones included. No grouping, no spine. It is never one across: a single-column
archive on a phone costs a gesture per work to see the next, and what makes this read
as an archive rather than as one piece after another is seeing several at once. Each
work is an image on a deep-paper plate that scales to 1.03 over 900ms on hover.

**The grid holds no words.** No title, no year, no medium, at any width. They left one
at a time, each at the client's request, until nothing was left but the work. What a
piece is, the visitor reads by opening it; here they look at it.

The white between cells follows the words out, and that is one decision rather than
two. With a caption under each cell the surrounding white was what made a cell a
record, separate from its neighbour; with the caption gone that same white leaves the
works floating loose on the paper. So the gap is set in proportion and not in pixels —
about 2% of the cell's width at every size, 4px against a phone's 169px cell and 8px
against a desktop's 389px one. That is the least that keeps two light-ground works from
fusing into one blur, and it is what makes the page read as a wall of work.

Nothing is lost by the silence: the work page is one tap away, and each link carries
`aria-label="<title>, <year>"`, so the grid names its works to a screen reader at every
width even though it shows no words to anyone else.

**The cell is 4:5 at every width, and the crop is the decision.** The work in this
archive is square, so a square cell would crop nothing; 4:5 takes a fifth of each
piece's width, on a phone and on a 27-inch monitor alike. The client chose vertical
knowing that, first on phones and then everywhere, and the reason it stays at 4:5
rather than 3:4 is exactly this: 3:4 would take a quarter. Anyone who wants a piece
whole opens it, where the plate runs at its true proportion and crops nothing.

It is one ratio and not a seam at 640px, because a seam meant the same work was
framed two different ways depending on which screen it was met on.

**The ratio is one object in three places.** The archive cell, the work pager's
neighbour plates and the grid inside `/admin` all draw it, and they move together. The
editor's case is the strongest: that screen exists so she can judge how a piece will
look published, and showing her a crop the site does not ship would leave it doing the
opposite of what its whole shape is for.

> **Removed, in three passes:** first the medium, which repeated "Digitale" down a
> page where most pieces share a technique and so told nobody anything; then the
> title and year on phones; then the title and year everywhere. Each went at the
> client's request. All three still live on the work page — the title as its
> heading, the year and the medium in its spec list — which is where someone goes
> to ask what a piece is. The markup went with them rather than being hidden by a
> media query: a caption kept alive behind `hidden` is the same dormant code this
> file has had to delete once already.

**The sequence is authored, not computed.** Which piece opens the archive, and
which sits beside which, is a curatorial decision and it is hers: she makes it by
dragging in `/admin`, and it is stored per work. The year is a fact on the caption
line and orders nothing. It used to — the grid ran newest-year-first and, within a
year, by whichever row number the table had handed out. That is an order nobody
chose, on a page whose whole job is the order in which the work is met.

Cells share one shape because what a visitor compares between one piece and the next
is the work, not the frame around it; `object-cover` keeps that true for the landscape
or very tall piece that may arrive later. With no caption to carry it, hover is the whole of
the grid's feedback: the plate holds still and the image inside it scales to 1.03 over
900ms, clipped by the plate so a piece never spills into the 8px beside it.

> **Removed:** the year-band archive — a stack of bands each opening on a terracotta
> rule, its year in a sticky spine, and every other work plus every other band's year
> mark falling to 30% opacity while one work was hovered. It was specified here and
> its CSS sat in `globals.css` for three commits without a component ever using it;
> it was built once, shown to the client, and taken out at their request. The rules
> (`.archive`, `.year-band`, `.year-mark`, `.work`) were deleted with it rather than
> left dormant a second time. Git holds both the stylesheet and the component.

### The Work Page
The order is a decision and it reads in one line: back to the archive, the name and
its text, the first plate, the other plates, the spec list, the neighbours. That is the
DOM order and the phone's order, where everything is one column. Name before work,
because the visitor arrives from a grid that shows no words — they tapped an image
without knowing what it was called. The text rides with the name, at the client's
request: a catalogue standfirst of one to three lines at `{typography.body-lead}` in
soft ink, capped at 68ch.

**From 768px the same order folds into two columns** (`.opera` in globals.css, one
grid with named areas, so screen readers and the keyboard follow the same thread as
the eye). Left, the reading column: title, text, and beneath them the spec list with
`Chiedi info`. Right, the first plate. Below both, full width, the remaining plates two
by two. The reading column is 5 of 12 on tablet and 4 of 12 from 1024px — room for a
title and a spec row, never enough to compete with the work — and the gap between the
columns (2.5rem, 4rem from 1024px) is wider than a grid gutter because it separates
two different things, text and work, not two equal pieces.

The two columns share a top and a bottom line. The title is trimmed to its cap height
(`text-box: trim-start cap alphabetic`) so its letters start on the plate's top edge,
not ten pixels under it; and the spec list aligns to the end of its row, so when the
plate is taller than the text, `Chiedi info` closes on the plate's foot. When the text
is the taller one, the spec list simply follows it at its 2.5rem minimum.

The first plate keeps its 78vh cap and `object-contain`, top-aligned and flush with
the shell's right edge, so its outer margin never changes whatever the proportion.

**The remaining plates are justified rows**, never a ragged grid. Each row's pieces grow
in proportion to their own width/height ratio (`--r`, flex-grow over a zero basis), so
they take one shared height and fill the shell exactly, uncropped. One step —
`--opera-passo`, 1.5rem on phones and 2rem from 768px — separates every image from
the next in both directions: first plate to rows, row to row, piece to piece. An odd
count closes on a row of three, justified the same way, so no piece is ever left alone
at half width towering over the rows above; the one exception is a single remaining
image, which takes half a row on the left as if it had a partner.

A work without a description draws no paragraph; nothing else moves. A work with a
single image draws no lower grid.

### The Viewer
Every plate on a work page is a button that opens it full screen. A 2rem paper square
at 92% sits 0.75rem inside each image's bottom-right corner with the drawn `Expand`
icon in ink — the only filled tile over an image, zero radius, no shadow, needed
because a bare icon would drown in the artwork's colours. Under the pointer or focus
it inverts, ink ground and paper arrow. The icon lives inside the button and is hidden
from assistive tech: one control and one tab stop per image.

The viewer is a native `<dialog>` opened with `showModal()` and it sits **on paper, not
black** — the Ground-Is-Constant Rule holds here too. Three bands: the title and a
close cross on top, the whole image in the middle (`object-contain`, never cropped,
never upscaled past the stage), and `‹ 2 / 6 ›` at the foot with the counter in the
label style. Arrow keys and the foot arrows step through the work's images and stop at
the ends; a horizontal swipe does the same on touch; Esc, the cross, or a tap on the
paper around the image closes it, and focus returns to the plate that opened it. It
fades in over 220ms and each image settles from 0.985 as it arrives.

### The Work Pager
The foot of a work page offers the two neighbours in the archive's own order,
one per side, and each of them shows the piece: label, title, and beneath it the
same 4:5 deep-paper plate the grid uses, at 7rem wide on a phone and 9rem from
768px, scaling to 1.03 over 900ms on hover with the title going terracotta
alongside it. A name alone is not an offer — the visitor came for the work, and
"Carnevale andino" tells someone who has not seen it nothing. With the piece
visible, going on is a decision rather than a guess.

The plate crops like the grid and unlike the work above it, and the two are not
in conflict: the page's own plate is where the piece is looked at, so it runs at
its true proportion, uncropped; the pager is where one is chosen, and choosing
compares the work rather than the shape of its frame. It follows the archive's
ratio whenever that changes — a neighbour framed differently from the grid would
not be recognised as the piece the visitor is about to arrive at.

The pair sits in a 48rem band centred under a full-width hairline. Split across
the 82rem shell it was two objects pinned to opposite edges with eight hundred
pixels of paper between them — read as two stray things sharing a line, not as
two options. Both columns are full-height flex with the plate pushed to the
bottom, so a title that wraps to three lines on a phone does not drop its plate
below its neighbour's; the difference is absorbed in the air above the plate,
where it does not read as an error. The empty side is still drawn at the ends of
the archive, so "Successiva" never slides to the centre.

### Reveal
Content enters by rising 1.25rem and fading in over 900ms on the soft ease, staged
by delay in 70–90ms steps down a list. It is a one-shot observer; the element stays
shown. Under `prefers-reduced-motion: reduce` the reveal is neutralised and every
animation and transition on the site collapses to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** keep terracotta to rules and marks, and let the illustration be the only
  full-colour field on the page. The single exception is named in The One Loud
  Thing, and naming it is what keeps it an exception.
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
- **Do** give every hover-revealed control a no-pointer resting place under
  `[@media(hover:hover)]`, and test it where `:hover` latches.
- **Do** land every interrupted gesture on cancel. A drag the browser took away, a
  window that resized mid-move, a list that changed underneath — none of those is
  a decision, and writing one down produces an archive she did not arrange and
  cannot tell she has.
- **Do** build a screen that edits the archive out of the archive's own drawing —
  same grid, same plate, same caption line — and add only the control layer.
- **Do** let an empty collection say what will fill it, in the language and voice of
  the surface it sits on: Italian to the visitor ("L'archivio è in preparazione"),
  working Spanish on the editor screens.
- **Do** keep a form's commit action a filled ink block and its escape an underlined
  link, so the two never read as a pair of buttons.

### Don't:
- **Don't** fill anything with terracotta at rest. One control fills on hover and
  it is already built; a second accent button, badge, chip or block is the thing
  this rule exists to stop, because the first one only works while it is the only
  one.
- **Don't** add a dark mode or tint the ground per page.
- **Don't** use a box-shadow, a faked lift, or a border on all four sides — the one
  bordered control is named in The One Loud Thing, and it carries no shadow either.
  Depth is rules, one tonal step, and opacity.
- **Don't** scaffold a page in cards. This world separates with rules and space.
- **Don't** crop an illustration to a fixed ratio without saying what the crop buys.
  The archive's 4:5 takes a fifth of each piece's width — the work is square, so a
  square cell would take nothing — and that is written down as a decision, at the
  gentlest ratio that still reads as vertical. A crop nobody argued for is the one
  this rule is against.
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
- **Don't** open a modal to confirm a destructive action; ask in the row, under the
  thing being destroyed, where it can still be seen.
- **Don't** put a filled button on a public page beyond the one that starts an
  enquiry about a work — and that one is filled only under a pointer — or give a
  form more than one.
- **Don't** box a field. A field is a label over a single bottom rule, and its size
  does not go below 16px.
- **Don't** use a dashed line for anything but an empty slot, and never a solid
  four-sided border around content. There are exactly two empty slots: the
  new-work cell and the place a dragged piece will land. A third use has to mean
  the same thing or it is not this line.
