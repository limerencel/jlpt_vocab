create or replace function public.record_answer(p_word_id integer, p_is_correct boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.progress (
    user_id,
    word_id,
    status,
    correct_count,
    wrong_count,
    next_review_at,
    updated_at
  )
  values (
    v_user_id,
    p_word_id,
    case when p_is_correct then 'known' else 'learning' end,
    case when p_is_correct then 1 else 0 end,
    case when p_is_correct then 0 else 1 end,
    now(),
    now()
  )
  on conflict (user_id, word_id)
  do update
    set
      correct_count = public.progress.correct_count + case when p_is_correct then 1 else 0 end,
      wrong_count = public.progress.wrong_count + case when p_is_correct then 0 else 1 end,
      status = case when p_is_correct then 'known' else 'learning' end,
      next_review_at = now(),
      updated_at = now();
end;
$$;

grant execute on function public.record_answer(integer, boolean) to authenticated;

create or replace function public.reset_progress_by_level(p_level text)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_level not in ('N1','N2','N3','N4','N5') then
    raise exception 'Invalid level: %', p_level;
  end if;

  with deleted as (
    delete from public.progress p
    using public.words w
    where p.word_id = w.id
      and p.user_id = v_user_id
      and w.level = p_level
    returning p.id
  )
  select count(*) into v_deleted from deleted;

  return v_deleted;
end;
$$;

grant execute on function public.reset_progress_by_level(text) to authenticated;
