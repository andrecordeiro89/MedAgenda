-- ============================================================================
-- INSERÇÃO DE HOSPITAIS E USUÁRIOS REAIS - MEDAGENDA
-- ============================================================================

-- Inserir hospitais
INSERT INTO public.hospitais (id, nome, cidade, cnpj, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Hospital Municipal Santa Alice', 'Santa Mariana', '14.736.446/0001-93', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Hospital Municipal Juarez Barreto de Macedo', 'Faxinal', '14.736.446/0006-06', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'Hospital Municipal São José', 'Carlópolis', '14.736.446/0007-89', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'Hospital Municipal 18 de Dezembro', 'Arapoti', '14.736.446/0008-60', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'Hospital Nossa Senhora Aparecida', 'Foz do Iguaçu', '14.736.446/0009-40', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'Hospital Maternidade Nossa Senhora Aparecida', 'Fazenda Rio Grande', '14.736.446/0010-84', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440016', 'Hospital Maternidade Rio Branco do Sul', 'Rio Branco do Sul', '14.736.446/0012-46', NOW(), NOW());

-- Inserir usuários
INSERT INTO public.usuarios (id, email, hospital_id, created_at, updated_at) VALUES
('user-550e8400-e29b-41d4-a716-446655440010', 'agendamento.sm@medagenda.com', '550e8400-e29b-41d4-a716-446655440010', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440011', 'agendamento.fax@medagenda.com', '550e8400-e29b-41d4-a716-446655440011', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440012', 'agendamento.car@medagenda.com', '550e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440013', 'agendamento.ara@medagenda.com', '550e8400-e29b-41d4-a716-446655440013', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440014', 'agendamento.foz@medagenda.com', '550e8400-e29b-41d4-a716-446655440014', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440015', 'agendamento.frg@medagenda.com', '550e8400-e29b-41d4-a716-446655440015', NOW(), NOW()),
('user-550e8400-e29b-41d4-a716-446655440016', 'agendamento.rbs@medagenda.com', '550e8400-e29b-41d4-a716-446655440016', NOW(), NOW());

-- Verificar se os dados foram inseridos corretamente
SELECT 'HOSPITAIS INSERIDOS:' as status;
SELECT h.nome, h.cidade, h.cnpj FROM public.hospitais h WHERE h.nome LIKE 'Hospital Municipal%' OR h.nome LIKE 'Hospital Nossa%' OR h.nome LIKE 'Hospital Maternidade%';

SELECT 'USUÁRIOS INSERIDOS:' as status;
SELECT u.email, h.nome as hospital FROM public.usuarios u 
JOIN public.hospitais h ON u.hospital_id = h.id 
WHERE u.email LIKE '%@medagenda.com';

-- Contar total de registros
SELECT 'TOTAIS:' as status;
SELECT COUNT(*) as total_hospitais FROM public.hospitais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios;
