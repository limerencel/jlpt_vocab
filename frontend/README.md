# JLPT Vocab Frontend

## Setup

1. Copy env vars:

```bash
cp .env.example .env
```

2. Fill `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Install and run:

```bash
npm install
npm run dev
```

## Required Supabase config

- Auth provider: enable Email provider.
- Redirect URL for local dev: `http://localhost:5173`.
- Redirect URL for production: your Vercel domain.

## Implemented pages

- `/login`
- `/register`
- `/study` (protected)
- `/stats` (protected)

## Backend RPCs used

- `record_answer(p_word_id integer, p_is_correct boolean)`
- `get_progress_stats()`

## Card enrichment flow

- On card flip, frontend calls edge function `get-word-enrichment` with `wordId`.
- Edge function checks `public.word_enrichment` cache first.
- Cache miss: fetches example sentence from Tatoeba API and builds pronunciation URL, then stores in cache.
- UI then shows the example and enables pronunciation playback.
