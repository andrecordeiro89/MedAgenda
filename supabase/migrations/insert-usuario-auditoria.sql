BEGIN;

-- Inserir usuário auditoria para Hospital Regional Centro Oeste (Guarapuava)
INSERT INTO public.usuarios (email, hospital_id, senha)
SELECT 'auditoria.gua@medagenda.com', '09ab26a8-8c2c-4a67-94f7-d450a1be328e', 'medagenda123'
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios WHERE email = 'auditoria.gua@medagenda.com'
);

-- Vincular usuário ao hospital com acesso completo (admin)
INSERT INTO public.usuario_hospitais (usuario_id, hospital_id, role)
SELECT u.id, '09ab26a8-8c2c-4a67-94f7-d450a1be328e'::uuid, 'admin'
FROM public.usuarios u
WHERE u.email = 'auditoria.gua@medagenda.com'
ON CONFLICT (usuario_id, hospital_id) DO NOTHING;

COMMIT;
