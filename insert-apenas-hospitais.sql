-- ============================================================================
-- INSERÇÃO APENAS DOS HOSPITAIS - MEDAGENDA
-- ============================================================================

-- Inserir hospitais (id será gerado automaticamente)
INSERT INTO public.hospitais (nome, cidade, cnpj, created_at, updated_at) VALUES
('Hospital Municipal Santa Alice', 'Santa Mariana', '14.736.446/0001-93', NOW(), NOW()),
('Hospital Municipal Juarez Barreto de Macedo', 'Faxinal', '14.736.446/0006-06', NOW(), NOW()),
('Hospital Municipal São José', 'Carlópolis', '14.736.446/0007-89', NOW(), NOW()),
('Hospital Municipal 18 de Dezembro', 'Arapoti', '14.736.446/0008-60', NOW(), NOW()),
('Hospital Nossa Senhora Aparecida', 'Foz do Iguaçu', '14.736.446/0009-40', NOW(), NOW()),
('Hospital Maternidade Nossa Senhora Aparecida', 'Fazenda Rio Grande', '14.736.446/0010-84', NOW(), NOW()),
('Hospital Maternidade Rio Branco do Sul', 'Rio Branco do Sul', '14.736.446/0012-46', NOW(), NOW());

-- Verificar se os hospitais foram inseridos
SELECT 'HOSPITAIS INSERIDOS COM SUCESSO:' as status;
SELECT id, nome, cidade, cnpj FROM public.hospitais 
WHERE nome IN (
    'Hospital Municipal Santa Alice',
    'Hospital Municipal Juarez Barreto de Macedo', 
    'Hospital Municipal São José',
    'Hospital Municipal 18 de Dezembro',
    'Hospital Nossa Senhora Aparecida',
    'Hospital Maternidade Nossa Senhora Aparecida',
    'Hospital Maternidade Rio Branco do Sul'
)
ORDER BY nome;

-- Contar total de hospitais
SELECT COUNT(*) as total_hospitais FROM public.hospitais;
