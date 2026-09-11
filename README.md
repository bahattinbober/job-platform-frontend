# Job Platform Frontend

Live demo: https://bahattinbober.com — log in with `test@gmail.com` / `123456789`. The account comes preloaded with a sample CV, 23 job postings, and 19 LinkedIn connections.

The frontend for NOD. A user uploads a CV, the backend ranks matching job postings by semantic similarity, surfaces which of the user's LinkedIn connections work at those companies, and drafts a referral message to send them.

Built with Next.js 16 (App Router) and TypeScript, styled with Tailwind CSS v4. The landing page's network visualization runs on Three.js (three-forcegraph) with GSAP ScrollTrigger driving the scroll-based staging; Motion handles the smaller in-page animations elsewhere.

## Screens

- `/` — scroll-driven marketing landing page
- `/login`, `/register` — authentication
- `/upload` — CV upload
- `/matches` — ranked job matches
- `/roles/[id]` — role detail, network lookup, referral message

## Running locally

The backend must already be running — see [job-platform-backend](https://github.com/bahattinbober/job-platform-backend).

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

```bash
npm run dev
```

The app runs at http://localhost:3000.

## Current state

- Authentication stores the JWT in `localStorage`, not an httpOnly cookie. The backend returns the token in a JSON response body and sets no cookies; moving to cookie-based sessions is out of scope for now.
- The landing page's product illustrations (upload, matches, network, referral) render from mock data in `src/lib/mock.ts`. The actual product screens — `/upload`, `/matches`, `/roles/[id]` — call the live API.
- The app is hosted on Vercel; the backend runs on Railway.
