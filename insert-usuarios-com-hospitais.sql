-- ============================================================================
-- INSERÇÃO DOS USUÁRIOS ASSOCIADOS AOS HOSPITAIS - MEDAGENDA
-- ============================================================================

-- Inserir usuários (id será gerado automaticamente, hospital_id será buscado pelo nome do hospital)
INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.sm@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Municipal Santa Alice';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.fax@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Municipal Juarez Barreto de Macedo';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.car@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Municipal São José';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.ara@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Municipal 18 de Dezembro';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.foz@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Nossa Senhora Aparecida';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.frg@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Maternidade Nossa Senhora Aparecida';

INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) 
SELECT 
    'agendamento.rbs@medagenda.com',
    h.id,
    NOW(),
    NOW()
FROM public.hospitais h 
WHERE h.nome = 'Hospital Maternidade Rio Branco do Sul';

-- Verificar se os usuários foram inseridos corretamente
SELECT 'USUÁRIOS INSERIDOS COM SUCESSO:' as status;
SELECT 
    u.id,
    u.email, 
    h.nome as hospital_nome,
    h.cidade as hospital_cidade
FROM public.usuarios u 
JOIN public.hospitais h ON u.hospital_id = h.id 
WHERE u.email LIKE '%@medagenda.com'
ORDER BY u.email;

-- Contar total de usuários
SELECT COUNT(*) as total_usuarios FROM public.usuarios WHERE email LIKE '%@medagenda.com';
