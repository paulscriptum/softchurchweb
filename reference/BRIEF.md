# soft.church — build brief

Paste this whole file into Cursor (Agent mode) with this folder open as the project root.

---

You are building the production website for **soft.church**. The approved design and all copy are in `reference/index.html` (open it in a browser first). Reproduce it faithfully as a real, maintainable codebase. Do not redesign.

## 1. What soft.church is

soft.church is a niche brand and community: *a quiet house for given things*.

- Every seventh day (Sunday) a **service** is released. A service contains artifacts:
  - **offering** — free, available for seven days (e.g. a phone wallpaper to download);
  - **keeping** — a paid edition in a meaningful number (333, 33, 12 or 3);
  - **relic** — a 1/1, sold by auction.
- There will be exactly 333 services. Then the project closes ("the doors close").
- Artifact types: **sign** (image), **psalm** (ambient mix), **instrument** (small software tool), **object** (physical item, later).
- The brand speaks about God through gratitude and presence, never by preaching. The tone is quiet, short and declarative.
- The community lives on Instagram (@soft.church) and on this site.

## 2. The task

Build a one-page landing site with these sections, in this order, exactly as in the reference:

1. **header**: logo `soft·church` (the dot is the brand mark, see 6.1); nav anchors: about, objects, manifesto, witness.
2. **hero**: large blurred dot, the line "everything is given. some of it is kept.", meta "service 001/333 · the seventh day", and a countdown (see 6.3).
3. **about**: five statements, one per screen, revealed softly on scroll (see 6.4).
4. **objects**: dense grid of artifacts with service number, kind, title, meta line and an action (receive / keep / bid / upcoming).
5. **manifesto**: "statement 000", theses 0–10, ending "amen. 333". Copy is final; keep it verbatim.
6. **footer**: "become a witness" email signup, links (instagram, the archive, statement 000), and the bottom line "received with gratitude. · 333 · © 2026 soft.church".

## 3. Stack

- Next.js, latest stable, App Router, TypeScript, React Server Components by default.
- Tailwind CSS for styling; design tokens as CSS variables (section 5) mapped into the Tailwind theme. No UI kits or component libraries.
- Fully static where possible (SSG). Deploy target: Vercel.
- Content in typed files under `/content`. No CMS yet.
- Font: Inter 300/400 via `next/font` as a **placeholder**. Isolate it behind one CSS variable `--font-brand` in one file, because a custom brand font will replace it.
- Allowed extra dependency: `date-fns-tz` (or plain `Intl`) for the countdown. Ask me before adding anything else.

Suggested structure (propose yours before coding if you disagree):

```
app/layout.tsx           fonts, metadata, theme attribute
app/page.tsx             composes the sections
app/api/witness/route.ts email signup stub
components/BlurDot.tsx
components/Header.tsx
components/Hero.tsx
components/Countdown.tsx      (client)
components/Statements.tsx     (client: scroll reveal)
components/ObjectsGrid.tsx
components/ObjectCard.tsx
components/CollectButton.tsx  (the action; later swapped for a marketplace widget)
components/Manifesto.tsx
components/Footer.tsx
components/WitnessForm.tsx    (client)
components/ThemeToggle.tsx    (client)
content/artifacts.ts
content/manifesto.ts
content/statements.ts
config/site.ts                current service, service day/time, totals, links
public/objects/*.jpg          grid images (from reference/objects)
public/wallpapers/*.png       full-size files for offerings (from wallpapers/)
```

## 4. Data model

```ts
type Kind = 'offering' | 'keeping' | 'relic';
type ArtifactType = 'sign' | 'psalm' | 'instrument' | 'object';
type Status = 'open' | 'upcoming' | 'kept' | 'closed';

interface Artifact {
  id: string;            // e.g. 'melting-dot'
  service: number;       // 1..333
  kind: Kind;
  type: ArtifactType;
  title: string;         // lowercase
  image: string;         // /objects/...
  alt: string;
  status: Status;
  edition?: 333 | 33 | 12 | 3 | 1;
  kept?: number;         // editions already kept
  price?: string;        // display string, e.g. '33 €'; unknown → '[PRICE]'
  href?: string;         // external collect / auction url (marketplace, added later)
  download?: string;     // offerings: /wallpapers/...
  guest?: string;        // guest artist name, shown as 'guest: name'
}
```

Seed `content/artifacts.ts` with the six artifacts from the reference.

Display rules (derive them, don't hardcode per card):

- Numbers are always zero-padded to three digits: `service 001`, `001/333`.
- Line 1: `service {nnn} · {kind}`.
- Line 2: title.
- Line 3:
  - offering → `{type} · free for seven days`
  - keeping → `{type} · kept by {kept} of {edition}`; if upcoming → `{type} · {edition} keepers`
  - relic → `{type} · 1/1 · auction`
  - add ` · guest: {name}` when `guest` is set.
- Action:
  - offering + open → `receive`, downloads `download`
  - keeping + open → `keep · {price}`, links to `href`
  - relic + open → `bid`, links to `href`
  - upcoming → the weekday it opens (`sunday`) if it is the next service, otherwise `soon`. Muted, **not a link** (span with `aria-disabled`).
  - kept → `kept`, muted.
- Adding a new artifact must only require one new object in `content/artifacts.ts`.

## 5. Design tokens

```css
/* light (default) */
--bg: #FAFAF8; --fg: #121010; --muted: #6B6872; --body: #2E2B2A; --line: #E3E0DB;
/* dark = "inverse": white on near-black */
--bg: #0E0C0C; --fg: #F4F2EE; --muted: #A29D97; --body: #D9D5CF; --line: #2E2A28;
```

- Type: weight 300 by default, 400 for titles and labels. Sizes: 13 (small and meta), 14 (nav), 16 (body), 24, 30 (statements), 36 (hero). Large sizes get letter-spacing between -0.015em and -0.02em.
- Layout: content max-width 1200px; about 760px; manifesto 620px. Side padding 24px; section padding 120px.
- Objects grid: `repeat(auto-fill, minmax(150px, 1fr))`, gap 48px/28px. This gives about 6 columns on desktop and 2 on phones. Images use aspect ratio 6:13 with object-fit cover.
- Hit targets at least 44px. The tokens already pass 4.5:1 contrast; keep it that way.
- Focus is visible but subtle: 1px outline in `--fg`, offset 4px.

## 6. Behaviour

1. **BlurDot**: a circle filled with `currentColor` and blurred with CSS `filter: blur()`. Blur = **8.2% of the diameter** (brand constant). Props: `size`, optional `blurRatio`. Used in the logo (6px), as about separators (10px) and in the hero (260px).
2. **Theme**: light is the default. An "invert" text button in the footer switches to dark by setting `data-theme="dark"` on `<html>`, and the choice persists in localStorage. Prevent a flash of the wrong theme on load with a tiny inline script in `<head>`. Do not follow `prefers-color-scheme`.
3. **Countdown**: under the hero meta, show e.g. `next service in 2d 04h 17m` until the next service time. Put `SERVICE_WEEKDAY` (Sunday) and `SERVICE_TIME` (12:00) in `config/site.ts`, timezone Europe/Berlin. **TODO: the owner has not fixed the time yet; keep it configurable.** It is a client component, updates once a minute, has no layout shift (reserve the width) and renders a static fallback on the server.
4. **Scroll reveal** (about statements): fade from opacity 0 to 1 with an 8px upward move when 30% of the statement is visible, using IntersectionObserver, 600ms ease-out, once per statement. With `prefers-reduced-motion`, no animation. Content must be visible without JS.
5. **Witness form**: POST `{ email }` to `/api/witness`. The route validates the email and returns 200. The provider is a **TODO stub** (Buttondown, Resend or ConvertKit later), with one clearly marked function to replace. Show inline states in the brand voice: `received.` on success, `try again.` on error. No modals, no toasts.
6. **Navigation**: anchor links with smooth scroll (disabled under reduced motion). The header is not sticky.
7. **Images**: `next/image`, lazy below the fold, with `--line` as a placeholder background.

## 7. Copy rules (strict)

- All copy is **lowercase**, including the brand name.
- Use the brand dictionary only:
  - **service**: the weekly release; **the seventh day**: Sunday;
  - **offering**: free; **keeping**: paid edition; **relic**: 1/1 auction;
  - **keeper**: someone who owns an artifact; **witness**: a subscriber or follower; **guest**: an invited artist;
  - **sign / psalm / instrument / object**: artifact types;
  - **the archive**: the past services; **grace period**: the seven-day sale window.
- Never write these words in our own UI: drop, sale, buy now, limited, exclusive, hype, community, content, NFT, mint, holder, collection, "don't miss", "link in bio". Third-party marketplace widgets may say "mint"; that is fine.
- No exclamation marks, no emoji, no hashtags. Short declarative sentences. Statements may end with `333`.
- Copy the manifesto and all section text verbatim from the reference.

## 8. Meta and SEO

- Title `soft.church`. Description: `a quiet house for given things. one service every seventh day. 333 in total.`
- OG image 1200×630: a blurred dot centered on `--bg`. Generate it with `next/og`.
- Favicon and app icon: a **compact** dot. Use a bigger dot and lighter blur (about 4% of diameter), because the full blur turns to grey mush at 16px. Provide light and dark variants.
- `lang="en"`, semantic landmarks (`header`, `nav`, `main`, `section` with labels, `footer`).

## 9. Out of scope for now (prepare, don't build)

- Payments and wallets. `CollectButton` only renders a link to `href`. Keep its interface (`artifact` in, UI out) so it can later be swapped for a marketplace mint widget (Manifold) without touching the cards.
- CMS, accounts, the archive page (link out to `https://333objects.com`), physical shop.

## 10. Acceptance criteria

- Visually matches `reference/index.html` at 1440px and 390px widths, in both themes.
- No horizontal scroll at 320px.
- Lighthouse mobile: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO = 100.
- Full keyboard navigation with visible focus. `prefers-reduced-motion` is respected.
- All copy follows section 7. Grep the codebase for the forbidden words before finishing.
- `npm run build` and `npm run lint` pass with no errors.

## 11. How to work

1. Read `reference/index.html` and list anything ambiguous before writing code.
2. Propose the file tree and component list, then wait for my OK.
3. Implement section by section, in page order. After each section, tell me what to check in the browser.
4. Finish with a short report: what was built, the TODOs left (service time, email provider, marketplace links, prices), and how to deploy to Vercel with the domain soft.church.
