alter table if exists public.agendamentos
  add column if not exists triagem_pre_anestesica_ok boolean default false;

alter table if exists public.agendamentos
  add column if not exists triagem_pre_anestesica_url text;

alter table if exists public.agendamentos
  add column if not exists triagem_pre_anestesica_data timestamp with time zone;
