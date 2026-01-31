-- Inserir usuários multi-hospital ausentes em public.usuarios
-- e criar seus vínculos em public.usuario_hospitais

BEGIN;

-- Coordenacao (multi-hospital)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'coordenacao@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'coordenacao@medagenda.com');

-- Faturamento (multi-hospital)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'faturamento@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'faturamento@medagenda.com');

INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'faturamento01@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'faturamento01@medagenda.com');

-- Diretriz (multi-hospital)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'diretriz@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'diretriz@medagenda.com');

-- Diretoria (multi-hospital)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'diretoria@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'diretoria@medagenda.com');

-- Diretoria (Tiago)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'tiago@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'tiago@medagenda.com');

-- Diretoria (Helluany) FRG + FOZ
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'helluany@medagenda.com', '933de4fb-ebfd-4838-bb43-153a7354d333', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'helluany@medagenda.com');

-- Faturamento local (Sabrina) FRG + RBS
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'sabrina@medagenda.com', '933de4fb-ebfd-4838-bb43-153a7354d333', 'medagenda123'
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'sabrina@medagenda.com');

-- ==========================
-- Vinculações multi-hospital
-- ==========================

-- Coordenacao: todos os hospitais
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

-- Faturamento: todos os hospitais
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

-- Diretriz: todos os hospitais
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

-- Diretoria: todos os hospitais
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

-- Tiago: todos os hospitais
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

-- Helluany: FRG + FOZ
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, h.hospital_id, 'diretoria'
FROM public.usuarios u
JOIN (
  SELECT '933de4fb-ebfd-4838-bb43-153a7354d333'::uuid AS hospital_id UNION ALL
  SELECT 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f'::uuid
) h ON TRUE
WHERE u.email = 'helluany@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

-- Sabrina: FRG + RBS (faturamento_local)
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

