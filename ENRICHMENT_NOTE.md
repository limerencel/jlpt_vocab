# Pronunciation + Example Sentence Notes

This note documents the previous implementation for card enrichment.

## Goal

When a user flips a word card:
- fetch pronunciation data
- fetch an example sentence
- cache the result in Supabase Postgres to avoid repeated API calls

## Data source used previously

1. Pronunciation:
- Built a direct audio URL using LanguagePod101 dictionary endpoint:
`https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=<word>&kana=<reading>`
- If audio playback failed in browser, frontend fell back to browser TTS (`ja-JP`).

2. Example sentence:
- Queried Tatoeba API (free, no API key):
`https://tatoeba.org/en/api_v0/search?from=jpn&to=eng&query=<word>&sort=relevance&limit=5`
- Picked the first usable Japanese sentence and English translation.

## Cache table (Supabase)

Table: `public.word_enrichment`

Columns:
- `word_id` (PK, FK -> `words.id`)
- `example_ja`
- `example_en`
- `pronunciation_url`
- `source`
- `fetched_at`
- `updated_at`

The function upserts this table on cache miss, then returns cached data on next request.

## Edge Function used

Deployed function slug that worked: `get-word-enrichment-v2`

Flow:
1. Receive `wordId`
2. Read `words` row (`word`, `reading`)
3. Check `word_enrichment` cache
4. Cache hit: return cached payload
5. Cache miss: fetch Tatoeba sentence + build pronunciation URL, upsert cache, return payload

## Frontend integration pattern

On card flip:
1. Call function endpoint:
`POST /functions/v1/get-word-enrichment-v2`
2. Body:
```json
{"wordId": 136}
```
3. Headers used:
- `Content-Type: application/json`
- `apikey: <VITE_SUPABASE_ANON_KEY>`
- `Authorization: Bearer <user_access_token>` (kept for consistency, though v2 had gateway JWT disabled)
4. Render on back of card:
- Play pronunciation button
- Example JA + EN text
- Optional `Cached` badge when response contains `fromCache: true`

## Why cache mattered

- reduced repeated network calls for same word
- improved card flip speed after first fetch
- reduced external API dependency during study sessions
