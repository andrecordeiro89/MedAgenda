insert into public.usuarios (email, hospital_id)
values ('radiologia.foz@medagenda.com', 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f')
on conflict (email)
do update set hospital_id = excluded.hospital_id;

with u as (
  select id from public.usuarios where email = 'radiologia.foz@medagenda.com' limit 1
)
insert into public.usuario_hospitais (usuario_id, hospital_id, role)
select u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid, 'triagem'
from u
on conflict (usuario_id, hospital_id) do update set role = excluded.role;
