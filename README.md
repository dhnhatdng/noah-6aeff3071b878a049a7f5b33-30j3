# Breakpoint Connect

Wallet-first networking for Breakpoint attendees: create a profile, get
**Smart Matchmaking** suggestions, discover people, connect, check in to the
live event, and keep building together in the Collaboration Hub.

> **Demo build.** This app runs entirely in the browser with fictional demo
> data. There is no backend, no real AI service, and no on-chain program
> yet — see [Demo-data honesty](#demo-data-honesty) and
> [What is NOT real yet](#what-is-not-real-yet).

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 3 + shadcn/ui (Radix) + Framer Motion
- React Router 6
- Solana: `@solana/web3.js`, wallet-adapter (Devnet by default)
- Supabase client is installed but **not connected** (see below)

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
| `VITE_AUTH_API_URL` | *(empty)* | Auth backend for nonce/verify — pending, not configured. |

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
4. **Discover** (`/discover`) — browse the 30 demo profiles and send
   connection requests.
5. **Connections** (`/connections`) — accept the simulated incoming
   requests, see sent/accepted requests.
6. **Collaboration** (`/collaboration`) — create a collaboration, invite
   accepted connections, add shared notes, delete it when done.
7. **Live Event** (`/live`) — check in (stored locally), see the demo
   attendee count and the sample agenda.

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
```

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
- **Demo agenda** — the Live Event agenda is labelled "Demo agenda —
  sample sessions" with generic sessions only (Opening, Matchmaking
  mixer, Builder workshop, Demo day). No real Breakpoint dates, speakers
  or venues are claimed.
- **Attendee count** — 30 demo profiles + you, once you check in.

## What is NOT real yet

- **Supabase is not connected.** The client library is installed and a
  mapping layer exists (`src/lib/profile/supabaseMapping.ts`), but no
  Supabase URL/key is configured and profiles are stored locally.
- **Auth backend pending.** Wallet sign-in nonce/verify (`VITE_AUTH_API_URL`)
  and Google sign-in are not configured; guest mode is the working path.
- **No AI service.** Matchmaking is the deterministic scorer above.
- **No on-chain program.** Anchor is a dependency, but no program is
  deployed or called; wallet connection is Devnet by default and used
  for identity display only.
- **No real event data.** Live Event schedule, check-in and attendee list
  are local demo state, not connected to any Breakpoint event system.
