insert into public.usuarios (email, hospital_id)
values ('ccih.frg@medagenda.com', '933de4fb-ebfd-4838-bb43-153a7354d333')
on conflict (email)
do update set hospital_id = excluded.hospital_id;

with u as (
  select id from public.usuarios where email = 'ccih.frg@medagenda.com' limit 1
)
insert into public.usuario_hospitais (usuario_id, hospital_id, role)
select u.id, '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid, 'agendamento_local'
from u
on conflict (usuario_id, hospital_id) do update set role = excluded.role;
