# JLPT Vocab App

A free web app to study JLPT vocabulary (N5 -> N1) with flashcards, guest mode, login-based progress tracking, and per-user session resume.

## Features

- Study by JLPT level (`N5` to `N1`)
- Flashcard flow with known/unknown actions
- Guest mode on `/study` (no login required)
- Logged-in progress persistence in Supabase
- Resume last learning session after logout/browser close
- Stats dashboard by level
- Reset progress by level from `/stats`
- Pronunciation + example sentence enrichment on card flip
- POS (part of speech) badge shown on front side of card

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Supabase (Postgres, Auth, RLS, Edge Functions)
- Deployment: Vercel (frontend), Supabase Cloud (backend)

## Project Structure

- `frontend/` - Vite app
- `supabase/migrations/` - SQL migrations
- `supabase/functions/` - Edge Functions
- `vocab/` - JLPT CSV sources

## Local Development

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Fill env values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

4. Run dev server:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Run SQL migrations in `supabase/migrations/` in order.
3. Deploy Edge Function(s) in `supabase/functions/`.
4. In Auth settings:
- Enable Email provider.
- Set Site URL and Redirect URLs for local + production domains.

## Vercel Deployment

1. Import this repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Build settings:
- Build Command: `npm run build`
- Output Directory: `dist`
4. Add environment variables in Vercel project:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
5. Deploy.

## Auth Redirect URLs

In Supabase Auth URL Configuration, add at least:

- `http://localhost:5173` (local)
- `https://<your-vercel-domain>` (production)
- Optional explicit route URLs such as `/study`, `/login`, `/register`

## Notes

- Guest users can study immediately, but progress is not persisted.
- Logged-in users get persistent `progress` and `user_study_session` state.
- Example sentence and pronunciation enrichment are cached for reuse.
