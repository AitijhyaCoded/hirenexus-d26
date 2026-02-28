# HireNexus

HireNexus is a web application for structured candidate evaluation and hiring workflows. It provides AI-assisted evaluation flows, job and candidate management, reporting, and Firebase-backed authentication and storage.

## Key Features
- AI-driven evaluation flows and report generation
- Candidate and job management UI
- Role-aware pages for evaluations, reports, and job listings
- Firebase Auth and Firestore data storage
- Reusable UI components and hooks (Tailwind + React + Next.js + TypeScript)

## Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Firebase (Auth + Firestore)

## Quick Start (development)

1. Install dependencies

```bash
npm install
```

2. Configure Firebase
- Create a Firebase project and enable Auth + Firestore
- Add your Firebase config to `src/firebase/config.ts` or supply the environment variables your app expects

3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Environment & Configuration
- See `src/firebase/config.ts` for the expected Firebase config shape.
- Keep secrets out of version control; use `.env.local` for local env vars.

## Project Layout
- `src/app/` — Next.js pages and layouts
- `src/components/` — UI components and design system
- `src/firebase/` — Firebase initialization and utilities
- `src/ai/` — AI flows and utilities
- `src/hooks/` — Custom React hooks

## NPM Scripts
- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run start` — Start production server after build

## Contributing
PRs and issues are welcome. Follow any repository contribution guidelines if present.

## License
Add a `LICENSE` file or state your preferred license here.

---
Would you like me to:
- Add an example `.env.local.example` with the required Firebase keys?
- Create an `ENVIRONMENT.md` listing env vars and Firebase setup steps?
- Start the dev server now and help fix any startup errors?

Tell me which option you'd like next.
