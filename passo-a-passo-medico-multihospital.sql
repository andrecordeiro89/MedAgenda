-- ============================================================================
-- PASSO A PASSO: ADICIONAR MÉDICO EXISTENTE A OUTRO HOSPITAL
-- Execute uma consulta por vez, copiando os resultados para a próxima
-- ============================================================================

-- PASSO 1: VER TODOS OS MÉDICOS EXISTENTES NO SISTEMA
-- Execute esta consulta primeiro e anote o ID do médico que você quer
SELECT 
    id, 
    nome, 
    crm, 
    especialidade,
    email
FROM medicos 
ORDER BY nome;

-- Resultado esperado:
-- id                                   | nome        | crm    | especialidade | email
-- 12345678-1234-1234-1234-123456789012 | Dr. João    | 12345  | Cardiologia   | joao@email.com
-- 87654321-4321-4321-4321-210987654321 | Dra. Maria  | 67890  | Pediatria     | maria@email.com

-- ============================================================================

-- PASSO 2: VER TODOS OS HOSPITAIS DISPONÍVEIS
-- Execute esta consulta e anote o ID do hospital onde quer adicionar o médico
SELECT 
    id, 
    nome, 
    cidade,
    cnpj
FROM hospitais 
ORDER BY nome;

-- Resultado esperado:
-- id                                   | nome                    | cidade        | cnpj
-- 550e8400-e29b-41d4-a716-446655440001 | Hospital São Paulo      | São Paulo     | 11111111000111
-- 550e8400-e29b-41d4-a716-446655440002 | Hospital Rio de Janeiro | Rio de Janeiro| 22222222000222

-- ============================================================================

-- PASSO 3: VER ONDE CADA MÉDICO JÁ ATENDE ATUALMENTE
-- Execute esta consulta para ver a situação atual
SELECT 
    m.nome as medico,
    m.crm,
    h.nome as hospital_atual,
    mh.ativo,
    mh.data_inicio
FROM medicos m
LEFT JOIN medico_hospital mh ON m.id = mh.medico_id AND mh.ativo = true
LEFT JOIN hospitais h ON mh.hospital_id = h.id
ORDER BY m.nome, h.nome;

-- ============================================================================

-- PASSO 4: ADICIONAR MÉDICO AO SEGUNDO HOSPITAL
-- SUBSTITUA os valores abaixo pelos IDs reais dos passos anteriores:

-- EXEMPLO (SUBSTITUA PELOS SEUS VALORES):
/*
SELECT adicionar_medico_hospital(
    '12345678-1234-1234-1234-123456789012',    -- ID do médico (do PASSO 1)
    '550e8400-e29b-41d4-a716-446655440002',    -- ID do hospital (do PASSO 2)  
    'Médico passou a atender também neste hospital'  -- Observação
);
*/

-- COLE AQUI SUA CONSULTA COM OS IDs REAIS:
-- SELECT adicionar_medico_hospital('SEU-ID-MEDICO-AQUI', 'SEU-ID-HOSPITAL-AQUI', 'Observação');

-- ============================================================================

-- PASSO 5: VERIFICAR SE FUNCIONOU
-- Execute esta consulta após o PASSO 4 para confirmar
SELECT 
    m.nome as medico,
    m.crm,
    h.nome as hospital,
    mh.ativo,
    mh.data_inicio,
    mh.observacoes
FROM medicos m
JOIN medico_hospital mh ON m.id = mh.medico_id
JOIN hospitais h ON mh.hospital_id = h.id
WHERE mh.ativo = true
ORDER BY m.nome, h.nome;

-- ============================================================================
-- INSTRUÇÕES:
-- 1. Execute PASSO 1 e copie o ID do médico desejado
-- 2. Execute PASSO 2 e copie o ID do hospital desejado  
-- 3. Execute PASSO 3 para ver situação atual
-- 4. Modifique e execute PASSO 4 com os IDs reais
-- 5. Execute PASSO 5 para confirmar o resultado
-- ============================================================================
