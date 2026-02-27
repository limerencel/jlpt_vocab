create table if not exists public.word_enrichment (
  word_id integer primary key references public.words(id) on delete cascade,
  example_ja text,
  example_en text,
  pronunciation_url text,
  source text not null default 'jisho',
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.word_enrichment enable row level security;

create policy if not exists "word_enrichment_read_authenticated"
on public.word_enrichment
for select
to authenticated
using (true);

create index if not exists idx_word_enrichment_updated
on public.word_enrichment (updated_at desc);
