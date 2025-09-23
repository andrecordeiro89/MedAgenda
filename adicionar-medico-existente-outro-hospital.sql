-- ============================================================================
-- ADICIONAR MÉDICO EXISTENTE A OUTRO HOSPITAL
-- Use este script quando quiser que um médico atenda em múltiplos hospitais
-- ============================================================================

-- PASSO 1: Encontrar o médico pelo CRM
-- Substitua 'SEU-CRM-AQUI' pelo CRM do médico
SELECT id, nome, crm FROM medicos WHERE crm = 'SEU-CRM-AQUI';

-- PASSO 2: Encontrar o ID do hospital
-- Substitua 'NOME-DO-HOSPITAL' pelo nome do hospital
SELECT id, nome FROM hospitais WHERE nome ILIKE '%NOME-DO-HOSPITAL%';

-- PASSO 3: Adicionar médico ao hospital (usando a função criada na migração)
-- Substitua os IDs pelos valores encontrados acima
SELECT adicionar_medico_hospital(
    'ID-DO-MEDICO',           -- ID do médico (do PASSO 1)
    'ID-DO-HOSPITAL',         -- ID do hospital (do PASSO 2)
    'Médico passou a atender neste hospital também'  -- Observação
);

-- PASSO 4: Verificar se funcionou
-- Substitua 'ID-DO-MEDICO' pelo ID do médico
SELECT 
    m.nome as medico_nome,
    m.crm,
    h.nome as hospital_nome,
    mh.ativo,
    mh.data_inicio
FROM medicos m
JOIN medico_hospital mh ON m.id = mh.medico_id
JOIN hospitais h ON mh.hospital_id = h.id
WHERE m.id = 'ID-DO-MEDICO'
AND mh.ativo = true;

-- ============================================================================
-- EXEMPLO PRÁTICO:
-- ============================================================================

-- 1. Buscar médico Dr. João
-- SELECT id, nome, crm FROM medicos WHERE nome ILIKE '%joão%';

-- 2. Buscar Hospital Rio de Janeiro  
-- SELECT id, nome FROM hospitais WHERE nome ILIKE '%rio%';

-- 3. Adicionar Dr. João ao Hospital Rio de Janeiro
-- SELECT adicionar_medico_hospital(
--     '12345678-1234-1234-1234-123456789012',  -- ID do Dr. João
--     '550e8400-e29b-41d4-a716-446655440002',  -- ID Hospital Rio
--     'Dr. João agora atende também no Rio de Janeiro'
-- );
