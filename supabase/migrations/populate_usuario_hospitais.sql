-- Popular tabela de vínculo usuario_hospitais com usuários existentes
-- Usa emails cadastrados em public.usuarios para inserir vínculos por hospital

BEGIN;

-- Helper: ON CONFLICT ignora duplicados

-- ==========================
-- Hospitais (IDs conhecidos)
-- ==========================
-- Santa Alice (SM)
-- 3ea8c82a-02dd-41c3-9247-1ae07a1ecaba
-- Faxinal (FAX)
-- 4111b99d-8b4a-4b51-9561-a2fbd14e776e
-- Rio Branco do Sul (RBS)
-- 4a2527c1-df09-4a36-a08f-adc63f555123
-- Torao Tokuda (APU)
-- 54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7
-- Arapoti (ARA)
-- 8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a
-- Fazenda Rio Grande (FRG)
-- 933de4fb-ebfd-4838-bb43-153a7354d333
-- Carlópolis (CAR)
-- bbe11a40-2689-48af-9aa8-5c6e7f2e48da
-- Foz do Iguaçu (FOZ)
-- ece028c8-3c6d-4d0a-98aa-efaa3565b55f
-- Guarapuava (GUA)
-- 09ab26a8-8c2c-4a67-94f7-d450a1be328e

-- ==========================
-- Usuários de hospital único
-- ==========================
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'admin'
FROM public.usuarios u WHERE u.email = 'adm.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.apu@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.ara@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.car@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '4111b99d-8b4a-4b51-9561-a2fbd14e776e', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.fax@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'agendamento_local'
FROM public.usuarios u WHERE u.email = 'agendamento.foz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'agendamento_local'
FROM public.usuarios u WHERE u.email = 'agendamento.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '09ab26a8-8c2c-4a67-94f7-d450a1be328e', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.gua@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '4a2527c1-df09-4a36-a08f-adc63f555123', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.rbs@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'admin'
FROM public.usuarios u WHERE u.email = 'agendamento.sm@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'agendamento_local'
FROM public.usuarios u WHERE u.email = 'cc.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'agendamento_local'
FROM public.usuarios u WHERE u.email = 'cf.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.apu@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.ara@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.car@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '4111b99d-8b4a-4b51-9561-a2fbd14e776e', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.fax@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.foz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '09ab26a8-8c2c-4a67-94f7-d450a1be328e', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.gua@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '4a2527c1-df09-4a36-a08f-adc63f555123', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.rbs@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'admin'
FROM public.usuarios u WHERE u.email = 'coordenacao.sm@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Foz (especialidades)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'anestesista'
FROM public.usuarios u WHERE u.email = 'douglas.foz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'faturamento_local'
FROM public.usuarios u WHERE u.email = 'faturamento.foz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '933de4fb-ebfd-4838-bb43-153a7354d333', 'faturamento_local'
FROM public.usuarios u WHERE u.email = 'faturamento.frg@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '4a2527c1-df09-4a36-a08f-adc63f555123', 'faturamento_local'
FROM public.usuarios u WHERE u.email = 'faturamento.rbs@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Foz triagem/recepção
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'triagem'
FROM public.usuarios u WHERE u.email IN (
  'foz.ana.carolina@medagenda.com',
  'foz.carla@medagenda.com',
  'foz.marcia@medagenda.com',
  'foz.mateus@medagenda.com',
  'foz.roger@medagenda.com',
  'foz.tamiris@medagenda.com',
  'triagem.foz@medagenda.com'
)
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'recepcao'
FROM public.usuarios u WHERE u.email = 'recepcao.foz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Foz anestesista
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'anestesista'
FROM public.usuarios u WHERE u.email IN (
  'willer.foz@medagenda.com',
  'lianara.foz@medagenda.com'
)
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- TI Foz (admin)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f', 'admin'
FROM public.usuarios u WHERE u.email = 'tifoz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- ==========================
-- Usuários multi-hospital
-- ==========================
-- Coordenacao multi-hospital
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'coordenacao'
FROM public.usuarios u
JOIN (
  SELECT '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid AS hospital_id UNION ALL
  SELECT '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid UNION ALL
  SELECT '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid UNION ALL
  SELECT '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid UNION ALL
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid UNION ALL
  SELECT 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid UNION ALL
  SELECT '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
) h ON TRUE
WHERE u.email = 'coordenacao@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Faturamento multi-hospital
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'faturamento'
FROM public.usuarios u
JOIN (
  SELECT '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid AS hospital_id UNION ALL
  SELECT '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid UNION ALL
  SELECT '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid UNION ALL
  SELECT '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid UNION ALL
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid UNION ALL
  SELECT 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid UNION ALL
  SELECT '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
) h ON TRUE
WHERE u.email IN ('faturamento@medagenda.com','faturamento01@medagenda.com')
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Diretriz multi-hospital
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'diretriz'
FROM public.usuarios u
JOIN (
  SELECT '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid AS hospital_id UNION ALL
  SELECT '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid UNION ALL
  SELECT '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid UNION ALL
  SELECT '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid UNION ALL
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid UNION ALL
  SELECT 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid UNION ALL
  SELECT '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
) h ON TRUE
WHERE u.email = 'diretriz@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Diretoria multi-hospital
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'diretoria'
FROM public.usuarios u
JOIN (
  SELECT '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid AS hospital_id UNION ALL
  SELECT '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid UNION ALL
  SELECT '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid UNION ALL
  SELECT '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid UNION ALL
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid UNION ALL
  SELECT 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid UNION ALL
  SELECT '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
) h ON TRUE
WHERE u.email = 'diretoria@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Tiago (diretoria multi-hospital)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'diretoria'
FROM public.usuarios u
JOIN (
  SELECT '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'::uuid AS hospital_id UNION ALL
  SELECT '4111b99d-8b4a-4b51-9561-a2fbd14e776e'::uuid UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid UNION ALL
  SELECT '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7'::uuid UNION ALL
  SELECT '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a'::uuid UNION ALL
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid UNION ALL
  SELECT 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'::uuid UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid UNION ALL
  SELECT '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid
) h ON TRUE
WHERE u.email = 'tiago@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Helluany (diretoria FRG + FOZ)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'diretoria'
FROM public.usuarios u
JOIN (
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid AS hospital_id UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid
) h ON TRUE
WHERE u.email = 'helluany@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Sabrina (faturamento_local FRG + RBS)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'faturamento_local'
FROM public.usuarios u
JOIN (
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid AS hospital_id UNION ALL
  SELECT '4a2527c1-df09-4a36-a08f-adc63f555123'::uuid
) h ON TRUE
WHERE u.email = 'sabrina@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

COMMIT;
