insert into public.usuarios (email, hospital_id)
values ('juliane@medagenda.com', 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f')
on conflict (email)
do update set hospital_id = excluded.hospital_id;

with u as (
  select id from public.usuarios where email = 'juliane@medagenda.com' limit 1
)
insert into public.usuario_hospitais (usuario_id, hospital_id, role)
select
  u.id,
  h_id,
  'diretoria'
from u
cross join unnest(array[
  '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid,
  '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid,
  '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid,
  '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid,
  '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid,
  '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid,
  'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid,
  'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid,
  '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
]) as h_id
on conflict (usuario_id, hospital_id) do update set role = excluded.role;
