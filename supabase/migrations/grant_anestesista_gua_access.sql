-- Concede acesso do usuário anestesista.gua@medagenda.com ao hospital informado
-- Cria/atualiza vínculo em usuario_hospitais com role anestesista

insert into public.usuario_hospitais (usuario_id, hospital_id, role)
select
  u.id as usuario_id,
  '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid as hospital_id,
  'anestesista'::text as role
from public.usuarios u
where lower(u.email) = lower('anestesista.gua@medagenda.com')
on conflict (usuario_id, hospital_id)
do update set role = excluded.role;
