# ZoOoM

A video conferencing app built as a Zoom clone, using [Next.js](https://nextjs.org/) 14 (App Router) with [Clerk](https://clerk.com/) for authentication and [Stream](https://getstream.io/video/) for real-time video.

> **Status: work in progress.** See [Known limitations](#known-limitations).

## Features

- **Instant meetings** — create and join a call immediately
- **Scheduled meetings** — set a description and start time, then share the generated link
- **Join by link** — paste a meeting URL to join
- **Personal room** — a stable, linkable room per user
- **Meeting room** — device preview with mic and camera toggle, plus an "join with mic and camera off" option
- **Call history** — upcoming and previous meetings, split by `starts_at`
- **Recordings** — lists recordings stored on Stream and links out to each one's hosted playback URL
- **Copy meeting link** to clipboard on creation

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14.2.3 (App Router, Server Components) |
| UI | React 18, TypeScript 5 |
| Styling | Tailwind CSS 3.4, custom `dark-*` palette in `tailwind.config.ts` |
| Components | shadcn/ui (`default` style, slate base) on Radix UI |
| Auth | Clerk 5 (`@clerk/nextjs`) |
| Video | Stream Video (`@stream-io/video-react-sdk`) |
| Scheduling UI | `react-datepicker` |
| Icons | `lucide-react` |

## Prerequisites

- **Node.js 24.x** — pinned via `engines` in `package.json`. Earlier versions will build but Vercel rejects them; see [Deployment](#deployment).
- A Clerk application
- A Stream Video application

## Getting started

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env.local
```

Then fill in `.env.local` with your keys. `.env*.local` is gitignored, so this file is safe to keep uncommitted.

**3. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to Clerk's sign-in page.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend key (`pk_…`). Read by `clerkMiddleware` on every request. |
| `CLERK_SECRET_KEY` | Yes | Clerk backend key (`sk_…`). Used by `clerkMiddleware` and the token server action. |
| `NEXT_PUBLIC_STREAM_API_KEY` | Yes | Stream frontend key, exposed to the browser. |
| `STREAM_SECRET_KEY` | Yes | Stream server key. Never sent to the client. |
| `NEXT_PUBLIC_BASE_URL` | Recommended | Absolute origin used to build shareable meeting links. Links will be malformed without it. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional | Overrides where Clerk sends unauthenticated users. Defaults to `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional | Overrides Clerk's sign-up destination. Defaults to `/sign-up`. |

Values must be copied **exactly** as issued. A trailing space or newline copied out of a dashboard will cause Clerk's key parser to throw at runtime — see [Troubleshooting](#troubleshooting).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (includes ESLint and type checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint only |

## Routes

| Route | Description | Protected |
| --- | --- | --- |
| `/` | Dashboard with meeting launcher | Yes |
| `/upcoming` | Scheduled, not-yet-started meetings | Yes |
| `/previous` | Ended meetings | Yes |
| `/recordings` | Meeting recordings | Yes |
| `/personal-room` | Your personal, persistent room | Yes |
| `/meeting/[id]` | In-call room (setup, then meeting) | Yes |
| `/sign-in` | Clerk sign-in | No |
| `/sign-up` | Clerk sign-up | No |

Protected routes are enforced in `middleware.ts` via `createRouteMatcher`, which redirects unauthenticated visitors to sign-in.

## How authentication and video connect

Two independent services are involved, joined by a short-lived token:

1. `middleware.ts` wraps every request in `clerkMiddleware`, which validates the Clerk session cookie and calls `auth().protect()` on protected routes.
2. `providers/StreamClientProvider.tsx` builds a `StreamVideoClient` once Clerk reports a signed-in user.
3. That client needs a Stream token, which it requests from the `tokenProvider` server action in `action/stream.action.ts`. The action runs server-side, calls Clerk's `currentUser()`, and mints a token with `STREAM_SECRET_KEY`. The Stream secret never reaches the browser.

`useGetCalls` (`hooks/useGetCalls.ts`) queries calls where the user is creator or a member, then partitions them into upcoming and ended by comparing `starts_at` against the current time.

## Project structure

```
app/
  layout.tsx              Root layout, ClerkProvider + theming
  (auth)/                Unauthenticated routes
  (root)/                Authenticated shell
    (home)/              Dashboard and call-history pages
    meeting/[id]/        In-call room
action/stream.action.ts   Server action that mints Stream tokens
components/              App components
  ui/                    shadcn/ui primitives
constants/               Sidebar links and avatar images
hooks/                   useGetCalls, useGetCallById
lib/utils.ts             cn() class-name helper
providers/               StreamVideoProvider
middleware.ts            Clerk route protection
```

Route groups (`(auth)`, `(root)`, `(home)`) keep shared layouts without affecting the URL.

## Deployment

The app deploys to Vercel with no framework configuration.

**Node version is the one thing that will bite you.** `package.json` pins `"engines": { "node": "24.x" }`. Vercel disabled Node 20 for new builds on October 1, 2026, so a project without this pin fails to build with an error about a discontinued Node version. Specify a major version only — Vercel rejects `major.minor.patch` in `engines` with *"only major Node.js Version can be selected"*.

Set the version in **both** places, since a project still on Node 20 in project settings may be rejected before `engines` is consulted:

1. `engines.node` in `package.json` (already committed)
2. Project Settings → Build and Deployment → Node.js Version

Changing `engines` alone does not bust Vercel's build cache. On the first deploy after this change, use **Redeploy** with the build cache unchecked.

## Troubleshooting

**Every page returns `500 MIDDLEWARE_INVOCATION_FAILED`**

`clerkMiddleware` throws synchronously if either Clerk key is missing or blank, and the error is not caught, so Vercel replaces the whole site with an error page. The middleware matcher (`/((?!.*\..*|_next).*)`) covers effectively all routes, which is why the failure looks total rather than localized.

Check, in order:

1. Both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set on the **same** environment the deployment uses (Preview and Production are configured separately).
2. The values have no stray whitespace or newline.
3. The deployment was **redeployed** after the keys were added. Vercel does not inject newly added variables into existing deployments.

Read the actual exception in Vercel's **Runtime Logs** — it names the missing key explicitly (`Missing secretKey` / `Missing publishableKey`).

**The build succeeds but the site is broken**

`next build` passes even with no Clerk keys configured. Every route renders dynamically (each shows `ƒ` in the build output), so nothing reaches Clerk server-side during the build, and `ClerkProvider` does not validate keys at build time. A green build therefore says nothing about whether auth works.

If the page hangs on a spinner rather than rendering, check for a missing `NEXT_PUBLIC_STREAM_API_KEY`: `StreamClientProvider` renders `<Loader />` until Clerk reports a signed-in user and the client is constructed, and it throws `Stream API key is missing` if the key is absent.

## Known limitations

- The "Upcoming Meeting at 12:30 PM" banner on the dashboard is a hardcoded placeholder, not wired to real data.
- Screen sharing and in-app recording are not implemented; the recordings page only surfaces recordings created on Stream and hands off to Stream's hosted player.
- Recording playback uses `router.push()` with an absolute external URL, which the App Router treats as a route path rather than a full navigation, so the Play button may not leave the app as intended.
- Meeting links are built from `NEXT_PUBLIC_BASE_URL`, which is not validated — a wrong value yields broken share links rather than an error.
