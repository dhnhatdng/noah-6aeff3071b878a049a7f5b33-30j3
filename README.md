# Breakpoint Connect

Wallet-first networking for Breakpoint attendees: create a profile, get
**Smart Matchmaking** suggestions, discover people, connect, check in to the
live event, and keep building together in the Collaboration Hub.

> **Two modes.** Without Supabase keys the app runs in **demo mode**:
> fictional demo data in this browser only (see
> [Demo-data honesty](#demo-data-honesty)). With `VITE_SUPABASE_URL` /
> `VITE_SUPABASE_ANON_KEY` set and the migration applied, profiles,
> connections, messages, meetings, collaborations and event check-in are
> stored in Supabase and shared between real users — see
> [Supabase setup](#supabase-setup). There is still no on-chain program
> and matchmaking is a deterministic scorer, not AI — see
> [What is NOT real yet](#what-is-not-real-yet).

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 3 + shadcn/ui (Radix) + Framer Motion
- React Router 6
- Solana: `@solana/web3.js`, wallet-adapter (Devnet by default)
- Supabase: `@supabase/supabase-js` (anonymous auth + Postgres + Storage).
  Connected when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set;
  otherwise the app runs in demo mode (see below)

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

### Environment

Copy `.env.example` to `.env` and fill in your own values. Never commit a
real key — `.env` and `.env.local` are git-ignored.

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_SOLANA_RPC_URL` | public Devnet cluster URL | Optional custom RPC (recommended for mainnet). |
| `VITE_SOLANA_NETWORK` | `devnet` | `devnet` / `testnet` / `mainnet-beta` |
| `VITE_ENABLE_GUEST_MODE` | `true` | `false` requires a wallet connection for app access. |
| `VITE_SUPABASE_URL` | *(empty — demo mode)* | Supabase project URL. With `VITE_SUPABASE_ANON_KEY` enables live mode. |
| `VITE_SUPABASE_ANON_KEY` | *(empty — demo mode)* | Supabase **public anon key only** — never a service-role key. |
| `VITE_GOOGLE_AUTH_ENABLED` | `false` | `true` enables the "Continue with Google" button — requires the Google sign-in setup below. |
| `VITE_AUTH_API_URL` | *(empty)* | Auth backend for nonce/verify — pending, not configured. |

### Supabase setup

Do these in order. Without them the app runs in demo mode (localStorage
only) — it will not error, it just will not share data between users.

1. **Create a free Supabase project** at
   [supabase.com](https://supabase.com) (free tier is enough).
2. **Enable Anonymous sign-ins:** Dashboard → Authentication →
   Sign-in providers → Anonymous → enable. The app signs users in
   anonymously; every row is owned by that anonymous user id.
3. **Run the migration:** Dashboard → SQL editor → paste and run
   `supabase/migrations/0001_init.sql` from this repo. It creates the
   `profiles`, `connections`, `messages`, `meetings`, `collaborations`
   (+ members, notes), `event_checkins` and `event_sessions` tables with
   Row Level Security, and seeds the two verified Breakpoint program
   themes (Day 1 — The Supercycle Today; Day 2 — AI agents and consumer
   apps). Re-running it is safe.
4. **Create the avatars bucket:** Dashboard → Storage → New bucket,
   name `avatars`, toggle **Public ON**, so profile photos can be
   uploaded and served via public URL.
5. **Set the env vars** in `.env` (copy `.env.example` first):
   `VITE_SUPABASE_URL=https://your-project.supabase.co` and
   `VITE_SUPABASE_ANON_KEY=your-public-anon-key` (Project Settings →
   API). Never commit real keys — `.env` and `.env.local` are
   git-ignored.
6. Restart `npm run dev`. The top bar shows "Connected — Supabase"
   instead of "Demo mode".

### Google sign-in (optional)

The "Continue with Google" button is code-ready but disabled by default
("Not set up yet") — it needs a Google OAuth client, which only the
project owner can create. No Google credentials exist in this repo.

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   create/select a project → **APIs & Services → Credentials** → **Create
   Credentials → OAuth client ID** → application type **Web application**.
   Add the authorized redirect URI
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (replace `<your-project-ref>` with the subdomain of your Supabase
   project URL). Note the **Client ID** and **Client Secret**.
2. **Supabase Dashboard → Authentication → Providers → Google:** enable
   the provider and paste the Client ID + Client Secret from step 1.
3. **Supabase Dashboard → Authentication → URL Configuration:** add your
   app's login URL to **Redirect URLs**, e.g.
   `https://<your-vercel-domain>/login` (and
   `http://localhost:5173/login` for local development).
4. **Enable it in the app:** set `VITE_GOOGLE_AUTH_ENABLED=true` in
   `.env` locally, or in Vercel (Project → Settings → Environment
   Variables) and redeploy. The button becomes clickable and starts the
   Google flow; after Google redirects back to `/login`, the Supabase
   session is picked up automatically and the user is signed in with the
   Google identity as their profile owner (a wallet can still be linked
   later from Settings).

> **Security note:** an earlier `.env` containing a `VITE_SOLANA_RPC_URL`
> key was committed to public git history (under the old, wrong key name
> `VITE_REACT_APP_SOLANA_RPC_URL`, which the code never read). The file has
> since been removed from tracking with `git rm --cached .env`, but removing
> it from the index does **not** erase it from history. **Rotate that RPC
> key in Helius** (or wherever it was issued) and treat the old value as
> compromised. The code reads `VITE_SOLANA_RPC_URL` only — see
> `src/lib/config.ts`.

## Demo script

1. **Guest mode** — open the app without a wallet (guest mode is on by
   default) and continue as a guest.
2. **Create profile** — fill in basics, skills, goals, and the
   matchmaking questions (name, role, skills, goals, offers/needs).
3. **Smart Matchmaking** (`/matchmaking`) — ranked suggestions with a
   score breakdown for each match.
4. **Discover** (`/discover`) — browse profiles and send connection
   requests (30 demo profiles in demo mode; real Supabase profiles in
   live mode).
5. **Connections** (`/connections`) — accept the simulated incoming
   requests (demo mode) or real requests (live mode), see
   sent/accepted requests.
6. **Messages** (`/messages`) — message an accepted connection.
7. **Meetings** (`/meetings`) — propose a meeting for Nov 15–17 at
   Olympia London and accept or decline proposals.
8. **Collaboration** (`/collaboration`) — create a collaboration, invite
   accepted connections, add shared notes, delete it when done. In live
   mode invited members see it in their own Hub.
9. **Live Event** (`/live`) — read the verified Breakpoint 2026 facts
   (Nov 15–17, Olympia London, "Token Supercycle") and check in. In
   demo mode the check-in is local and the attendee count is the 30
   demo profiles + you; in live mode the check-in is saved to Supabase
   and the count is real.

## Deployment

### GitHub Pages

1. Push to the `full-product` branch — `.github/workflows/pages.yml`
   runs `npm ci`, builds with the project-subpath base, and deploys
   `dist/` to Pages.
2. Enable Pages once in the repo settings: Settings → Pages → Build
   and deployment → Source: **GitHub Actions**.
3. The site is served at
   `https://dhnhatdng.github.io/noah-6aeff3071b878a049a7f5b33-30j3/`.
   Deep links (e.g. `/live`) work via `public/404.html` + the restore
   script in `index.html`.
4. For live (Supabase) mode on Pages, set the two `VITE_` vars as
   repository secrets and add them to the workflow's build `env`
   (they are build-time vars — the anon key is public by design, but
   keep it in secrets rather than in the repo).

### Vercel (alternative)

1. Import the repo in Vercel (framework preset: Vite).
2. Set **Production Branch to `full-product`** (Project → Settings →
   Git → Production Branch). The default branch `main` still contains
   the old code (including `react-copy-to-clipboard`, which conflicts
   with React 19 and fails `npm install` on Vercel) — do not deploy `main`.
3. Set environment variables `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Project → Settings → Environment
   Variables) for live mode; without them the deployment runs in demo
   mode.
4. Deploy (pushing to `full-product` auto-deploys). `vercel.json` rewrites all routes to `/index.html`, so
   deep links work.

## Architecture / data model

```
src/
  pages/            Overview, Profile, Matchmaking, Discover, LiveEvent,
                    Connections, Collaboration, Settings, Login
  components/       ui (shadcn), layout, profile, matchmaking,
                    connections, overview, wallet, auth, providers
  hooks/            useProfile, useConnections, useCollaborations,
                    useSession, useWalletConnect, …
  lib/
    config.ts              env-driven runtime config (network, RPC, guest mode)
    profile/               profile types, validation, repository,
                           demoProfiles.ts (30 fictional profiles)
    matchmaking/scoring.ts deterministic weighted scorer (see below)
    connections/store.ts   versioned localStorage store for connections
    collaborations/store.ts versioned localStorage store for collaborations
    liveEvent/store.ts     versioned localStorage store for check-in
    supabase/              Supabase repositories (profiles, connections,
                           messages, meetings, collaborations) + client
                           (null when unconfigured) + realtime subscriptions
```

**What is real now vs demo mode**

| Feature | Demo mode (no Supabase keys) | Live mode (Supabase configured) |
| --- | --- | --- |
| Profiles | localStorage, this browser only | Supabase `profiles` (+ `avatars` bucket photos) |
| Connections | 30 demo profiles, simulated incoming requests | Real profiles, real requests, realtime |
| Messages / Meetings | localStorage only | Supabase rows, realtime |
| Collaborations | localStorage, demo members only | Supabase rows, real members, shared notes, realtime |
| Live Event check-in | localStorage; count = 30 demo profiles + you | Supabase `event_checkins`; count is the real row count |
| Live Event facts | Verified Breakpoint 2026 facts (dates, venue, theme, speakers) in both modes | Program overview read from `event_sessions` when available, same two verified theme rows otherwise |

The Live Event facts (Breakpoint 2026, Nov 15–17, Olympia London,
"Token Supercycle", 8,000+ attendees from 100+ countries, Anatoly
Yakovenko and Lily Liu) are verified facts shown in both modes. The
full schedule — session times, other speakers, venues — is on the
official site (solana.com/breakpoint) and is not reproduced here.

**Local stores** (all `localStorage`, all versioned, all read/write wrapped
in try/catch, synced across tabs via the `storage` event):

| Store | Key | Contents |
| --- | --- | --- |
| Connections | `bc:v1:connections` | connection records (`sent`/`received`, `pending`/`accepted`), seeded owners |
| Collaborations | `bc:v1:collaborations` | collaborations (name, description, member demo-profile ids) + shared notes |
| Live event | `bc:v1:live-event` | checked-in flag + check-in time |
| Profile | *(see `src/lib/profile/repository.ts`)* | the local user profile |

All stores are scoped by the local profile id (`ownerId`), so deleting and
recreating a profile starts clean.

**Smart Matchmaking scoring** (`src/lib/matchmaking/scoring.ts`) is a
deterministic weighted scorer — goals 30%, skills 25%, projects 20%,
mutual value 15%, shared interests 10%. The same profile always produces
the same scores, ranking and explanations. No AI service is involved;
the UI says so ("DEMO MATCHING — No AI service is connected").

## Demo-data honesty

- **30 fictional demo profiles** (`src/lib/profile/demoProfiles.ts`) —
  invented people and organisations, flagged `isDemo` and rendered with a
  "DEMO USER" label. They are not Breakpoint attendees.
- **Deterministic scoring** — see above; no AI, no LLM, no external
  matching service.
- **localStorage only** — profiles, connections, collaborations, notes and
  check-in live in this browser only. Nothing is sent to real people:
  sent connection requests stay pending, incoming requests are simulated
  locally, collaboration invitations are never sent.
- **Demo agenda** — in demo mode only, the Live Event agenda is labelled
  "Demo agenda — sample sessions" with generic sessions only (Opening,
  Matchmaking mixer, Builder workshop, Demo day). No real Breakpoint
  dates, speakers or venues are claimed there; the real program overview
  (Day 1 — The Supercycle Today; Day 2 — AI agents and consumer apps)
  is shown separately in both modes.
- **Attendee count** — in demo mode, 30 demo profiles + you, once you
  check in. In live mode the count is the real number of rows in
  `event_checkins`.

## What is NOT real yet

- **No on-chain program.** Anchor is a dependency, but no program is
  deployed or called; wallet connection is Devnet by default and used
  for identity display only.
- **No Google sign-in.** Sign-in is anonymous (Supabase) or guest mode;
  wallet sign-in exists as a client-side flow only.
- **SIWS verification is client-side only.** Sign-In With Solana
  verification happens in the browser — move it server-side before
  treating a verified wallet as proof of ownership in production.
- **No moderation.** Profiles, messages, notes and check-ins are not
  reviewed; anyone with the link can create content in live mode.
- **Live features untested against a real Supabase project.** The
  Supabase wiring (profiles, connections, messages, meetings,
  collaborations, check-ins) is implemented and type-checked, but
  until keys are set and the migration is run against a real project,
  the live paths have not been exercised end to end.
- **Auth backend pending.** Wallet sign-in nonce/verify (`VITE_AUTH_API_URL`)
  and Google sign-in are not configured; guest mode is the working path.
- **No AI service.** Matchmaking is the deterministic scorer above.
- **No real event integration beyond check-in.** The Live Event page
  shows verified Breakpoint 2026 facts and a Supabase check-in count;
  it is not connected to any official Breakpoint ticketing or schedule
  system, and the full schedule lives on solana.com/breakpoint.
