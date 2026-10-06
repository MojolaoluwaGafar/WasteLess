# WasteLess

**Good food shouldn't end up in the bin.**

WasteLess connects households, restaurants and food banks to share surplus food
with people nearby, and keeps every kitchen one step ahead of its expiry dates.
Anyone can list food they won't finish; people and organisations nearby
request it; the donor accepts one and confirms the handover with a pickup
code. A pantry tracker counts down best-before dates at home and suggests
recipes for what's about to turn. Every number on the impact report comes from
real handovers and pantry outcomes.

It is an npm-workspaces monorepo with a Vite React frontend and a TypeScript
Express API on MongoDB.

## 1. Why it matters

- 1.05 billion tonnes of food were wasted worldwide in 2022, about a fifth of
  all food available to people (UNEP Food Waste Index Report 2024).
- 783 million people faced hunger the same year.
- Food that's lost or wasted causes 8–10% of global greenhouse gas emissions.

Most of that waste happens in homes and food businesses, a loaf and a
cancelled event at a time. WasteLess works at exactly that scale.

## 2. What it does

| For | Features |
| --- | --- |
| **Everyone** | Browse and search free food by area and category; **Rescue today** lane for food that expires at midnight; public **impact report** with weekly trend and top areas; storage guide for 20+ foods, including West African staples |
| **Donors** | List food in a minute (photo, category, quantity, best-before, pickup area, notes) behind a **food-safety pledge**; review requests with messages; accept one (which reserves the listing); confirm handover with the collector's **4-digit pickup code**; waiting requests stay as a fallback |
| **Collectors** | Request with a message; contact details and pickup code appear only once accepted; WhatsApp / call / email the donor in one tap; leave a **thank-you note** that appears on the donor's public profile |
| **Businesses & organisations** | Restaurants, caterers and shops (business) and food banks, shelters and communities (organisation) get a badge on every listing and request, and a "From businesses" filter |
| **Every kitchen** | **Pantry tracker** grouped by urgency; category and best-before suggested as you type; resolve items as used, given away, wasted, or **share it** as a listing; **"Use it up" recipe ideas** (AI with `GROQ_API_KEY`, built-in guide otherwise) |
| **Your progress** | Dashboard with what needs doing (requests to answer, pickups, food to use), kg saved, meals, CO₂e, and seven milestones |

## 3. Repository map

```text
apps/
  Client/              Vite + React 19 + Tailwind v4 web app (@wasteless/client)
    src/Pages/         Home, Browse, Listing, Share, Pantry, Dashboard, Impact, Profile, Tips, Auth
    src/Components/    Buttons, fields, cards, badges, charts, uploads
    src/API/           One axios client + a service per area
  Server/              TypeScript Express + MongoDB API (@wasteless/server)
    src/Routes/        Every route, in one file
    src/controller/    Request parsing (Zod) -> services
    src/Services/      The rules: listings, requests, pantry, impact, ideas, auth
    src/Models/        Mongoose models
    src/emails/        Branded email templates
packages/
  shared/              Types shared by Client and Server: the one place to edit them
scripts/
  sync-shared.mjs      Copies packages/shared into each app (src/types/shared.ts)
  publish.mjs          Publishes an app to the repository its host deploys from
render.yaml            Optional one-click Render setup for both apps (not used by the live site)
```

## 4. Getting started

You need Node 20+ and a MongoDB database (MongoDB Atlas free tier works).

```powershell
npm install                                       # from the repo root, installs every workspace
copy apps\Server\.env.example apps\Server\.env    # then fill in MONGO_URI and JWT_SECRET_KEY
npm run dev                                       # API on :5050, web app on :5173
```

The Client needs no `.env` locally; it talks to the API on port 5050. Copy
`apps/Client/.env.example` to `apps/Client/.env` to turn on Google sign-in.

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the web app together |
| `npm run typecheck` | Type checks every workspace |
| `npm run build` | Builds every workspace |
| `npm run seed` | Demo data: 4 accounts (incl. a restaurant and a food bank), live listings, 7 weeks of handovers, a stocked pantry. Needs `SEED_PASSWORD`; sign in as `demo@wasteless.app`. **Use a demo database, not the live one.** |
| `npm run migrate:legacy` | Moves food tracked in the first version into pantry history by hand. The Server also does this on every start. |
| `npm run sync:shared` | Copies the shared types into each app (`build` and `typecheck` run it first) |
| `npm run publish:server` / `publish:client` | Publishes an app to its live repository (see Deployment) |

## 5. How the rules work

- **Listings** are `available` → `reserved` (donor accepted a request) →
  `collected` (handover confirmed with the pickup code). A cancelled or
  declined reservation makes the listing available again. Expired listings
  disappear from Browse. Reserving is atomic, so one listing can't be
  accepted for two people.
- **Privacy.** Phone and email are only revealed between a donor and the
  person they accepted. Profiles show names, shares and thank-you notes only.
- **Impact** is calculated on request from pantry outcomes and collected
  listings (never stored counters), with no double counting for food listed
  from the pantry. CO₂e uses 2.5 kg per kg of food; a meal is 0.5 kg.
- **Security.** Bcrypt passwords, JWTs revoked on password change,
  hashed single-use reset tokens (30 min), Google ID tokens verified against
  the client ID, rate limits on sign-in, resets, requests and uploads, photos
  uploaded through the API (signed) and only accepted from our Cloudinary
  account, and only whitelisted fields accepted on every write.

## 6. Deployment

**Live today** (since 2026-10-06): each app is published to the original
repository and deploys from there.

| App | Repository | Host |
| --- | --- | --- |
| `apps/Client` | `MojolaoluwaGafar/foodwastereduction-frontend` | Vercel, https://foodwastereduction.vercel.app |
| `apps/Server` | `MojolaoluwaGafar/foodwastereduction-backend` | Render, https://foodwastereduction-backend.onrender.com |

This repository is the source; those two are only what the hosts build from.
To publish a change:

```powershell
npm run publish:server -- "What changed" --push   # Render deploys the API
npm run publish:client -- "What changed" --push   # Vercel deploys the web app
```

Leave out `--push` to commit without deploying (the clone is in `.deploy/`).
Publish the Server first when both change. The script copies the app into
a clone of its repository (never `.env`, `node_modules` or `dist`), keeps that
repository's lockfile, and refuses to commit secrets. Render runs
`npm install` (which compiles the TypeScript) and starts `node server.js`;
the old environment names (`JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`,
`VITE_BACKEND_URL`) still work.

**Moving to one repository later:** both apps can also deploy to Render from [`render.yaml`](./render.yaml): **New →
Blueprint**, pick the repo, then fill in `MONGO_URI`, the Cloudinary keys,
`BREVO_API_KEY` / `EMAIL_FROM`, `CLIENT_URL` on the API and `VITE_BASE_URL`
on the web app. In MongoDB Atlas → Network Access, allow `0.0.0.0/0`.
`/api/health` reports whether the database is connected.

The existing Vercel site keeps working too: set its root directory to
`apps/Client` and add `VITE_BASE_URL`. The API allows
`foodwastereduction*.vercel.app` already.

A free Render API sleeps when idle; open `/api/health` a minute before a demo.
