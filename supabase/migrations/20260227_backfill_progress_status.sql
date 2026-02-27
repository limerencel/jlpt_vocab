update public.progress
set
  status = case when correct_count > wrong_count then 'known' else 'learning' end,
  updated_at = now()
where status is distinct from case when correct_count > wrong_count then 'known' else 'learning' end;
