create table if not exists public.user_study_session (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_levels text[] not null default array['N5']::text[],
  queue_word_ids integer[] not null default '{}'::integer[],
  current_index integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_study_session_levels_valid
    check (selected_levels <@ array['N1','N2','N3','N4','N5']::text[]),
  constraint user_study_session_non_negative
    check (current_index >= 0 and correct >= 0 and wrong >= 0)
);

alter table public.user_study_session enable row level security;

create policy "study_session_own_read"
on public.user_study_session
for select
to authenticated
using (auth.uid() = user_id);

create policy "study_session_own_insert"
on public.user_study_session
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "study_session_own_update"
on public.user_study_session
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "study_session_own_delete"
on public.user_study_session
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_user_study_session_updated
on public.user_study_session(updated_at desc);
