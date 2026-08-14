# Dreamy Space

An interior design studio site, originally built as a faithful rebuild of
[creativenconcepts.com](https://creativenconcepts.com/) — same stack, layout, design tokens and
animations — and since rebranded, with a catalogue admin on FastAPI + Turso + Cloudinary.

## Stack

Matches the original build exactly:

- **Vite + React 19** — the original ships a Vite/React SPA
- **React Router 7** — same route table (`/`, `/about/:section`, `/services/:category/:slug`,
  `/modular-journey`, `/projects`, `/testimonials`, `/contact`)
- **Bootstrap 5.3** — the original's grid and utility layer
- **Framer Motion** — hero crossfade, scroll reveals, project lightbox
- **GSAP + ScrollTrigger** — the 3D card tilt in the "What We Offer" grid
- **Swiper** — service gallery carousel
- **react-icons** — nav carets, footer contact/social glyphs

## Design system

`src/styles/app.css` carries the original's design tokens verbatim:

```
--brand-50 #F1F1F1   --brand-500 #8e836f   --brand-950 #221f1b
--active-hover-color #906E49          --header-height 82px
```

Typography is Poppins (300–700) throughout; `.font-serif` is aliased to Poppins exactly as the
original does.

## Data

Live content is read from the same public API the original uses
(`https://api.creativenconcepts.com`):

| Endpoint | Used by |
| --- | --- |
| `/api/v1/company-settings` | navbar, footer, contact info, WhatsApp number |
| `/api/v1/projects` | portfolio grid |
| `/api/v1/team` | About → Our Team |
| `/api/v1/testimonials` | Client Stories |
| `/api/v1/contact-us` | contact form submission |

Static content — the service catalog, the 11-step modular journey, hero banners — lives under
`src/data/` and resolves its imagery through `import.meta.glob` over `src/assets/images/`, the same
way the original bundles it.

## Layout parity

Verified against the live site at 1440×1000: navbar height 95px, hero copy block, section rhythm,
and footer columns all land on the same coordinates.

## Running

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Client-side routing means any host must fall back to `index.html` for unknown paths.

## Assets

221 project/service/journey/banner images plus the brand logo wall and the About page background
video were pulled from the original deployment and restored to their source folder structure under
`src/assets/images/` and `public/`.
