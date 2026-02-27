create or replace function public.get_progress_stats()
returns table (
  level text,
  seen_words integer,
  known_words integer,
  learning_words integer,
  known_rate numeric(5,2)
)
language sql
stable
security invoker
set search_path = public
as $$
with levels(level) as (
  values ('N5'::text), ('N4'::text), ('N3'::text), ('N2'::text), ('N1'::text)
),
base as (
  select
    l.level,
    count(w.id) as total_words,
    count(p.id) as seen_words,
    count(*) filter (where p.status = 'known') as known_words,
    count(*) filter (where p.status = 'learning') as learning_words
  from levels l
  left join public.words w
    on w.level = l.level
  left join public.progress p
    on p.word_id = w.id
   and p.user_id = auth.uid()
  group by l.level
),
overall as (
  select
    'ALL'::text as level,
    count(w.id) as total_words,
    count(p.id) as seen_words,
    count(*) filter (where p.status = 'known') as known_words,
    count(*) filter (where p.status = 'learning') as learning_words
  from public.words w
  left join public.progress p
    on p.word_id = w.id
   and p.user_id = auth.uid()
),
unioned as (
  select
    b.level,
    b.seen_words::integer as seen_words,
    b.known_words::integer as known_words,
    b.learning_words::integer as learning_words,
    case when b.total_words = 0 then 0 else round((b.known_words::numeric * 100) / b.total_words, 2) end as known_rate
  from base b

  union all

  select
    o.level,
    o.seen_words::integer,
    o.known_words::integer,
    o.learning_words::integer,
    case when o.total_words = 0 then 0 else round((o.known_words::numeric * 100) / o.total_words, 2) end as known_rate
  from overall o
)
select *
from unioned
order by case level when 'N5' then 1 when 'N4' then 2 when 'N3' then 3 when 'N2' then 4 when 'N1' then 5 else 6 end;
$$;

grant execute on function public.get_progress_stats() to authenticated;
