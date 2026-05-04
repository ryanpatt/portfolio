# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **React 18 + TypeScript** via Vite
- **Tailwind CSS** for styling (custom design tokens in `tailwind.config.js`)
- **vite-plugin-pwa** for PWA / installability (service worker auto-generated)
- No router — single-page scroll layout with `IntersectionObserver` for active section tracking
- Deployed on **Vercel** (`ryans-apps/ryanpatt` project), connected to GitHub `ryanpatt/portfolio`
- Custom domain: **ryanpatt.com** (DNS A record must point `ryanpatt.com` → `76.76.21.21` in Cloudflare)

## Commands

```bash
npm run dev      # local dev server
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # preview production build locally
vercel --prod    # deploy to production
```

## Architecture

```
src/
  data/content.ts          # all site content (nav, skills, experience, integrations, projects, apps)
  hooks/useActiveSection.ts # IntersectionObserver hook → which section is in viewport
  components/
    Nav.tsx                 # fixed sidebar; position ('left'|'right') stored in localStorage
    sections/               # one component per page section, each has id= for scroll targeting
  App.tsx                   # layout: flex row of <Nav> + <main>; manages nav position state + mobile menu
  index.css                 # CSS custom props, Tailwind layers, reveal animation class
```

## Design tokens

Custom Tailwind colors: `bg`, `surface`, `card`, `card-hover`, `gold`, `gold-light`, `gold-dark`, `ink`, `muted`, `border-subtle`.  
Custom fonts: `font-display` (Outfit), `font-sans` (Inter) — loaded via Google Fonts in `index.html`.

## Content updates

All copy lives in `src/data/content.ts`. To add a project, push to the `projects` array. To update experience/integrations, edit their respective arrays. No code changes elsewhere needed.

## Nav position

User preference is persisted to `localStorage` key `navPosition` (`'left'` | `'right'`). Toggle button is at the bottom of the sidebar.

## Scroll reveal

Elements with className `reveal` animate in on scroll via an `IntersectionObserver` in `App.tsx`. Add the class to any new section element to opt in.
