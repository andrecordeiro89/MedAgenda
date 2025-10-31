-- ============================================================================
-- EXEMPLO DE IMPORTAÇÃO DE MÉDICOS
-- ============================================================================
-- Este arquivo mostra como os dados ficam na tabela 'medicos' após a importação
-- via Excel. Use como referência para entender a estrutura.
-- ============================================================================

-- 1. Primeiro, veja os IDs dos hospitais disponíveis
-- Execute esta query para obter os IDs que você vai usar no Excel:
SELECT id, nome FROM hospitais ORDER BY nome;

-- Exemplo de resultado:
-- id                                   | nome
-- -------------------------------------|-------------------------
-- 550e8400-e29b-41d4-a716-446655440001 | Hospital São Paulo
-- 550e8400-e29b-41d4-a716-446655440002 | Hospital Rio de Janeiro
-- 550e8400-e29b-41d4-a716-446655440003 | Hospital Brasília

-- ============================================================================
-- 2. EXEMPLO: Como os dados ficam após importação
-- ============================================================================

-- Exemplo 1: Dr. João Silva trabalha em 2 hospitais
-- No Excel você teria 2 linhas:
/*
nome         | cns             | especialidade | id (hospital_id)
-------------|-----------------|---------------|--------------------------------------
João Silva   | 123456789012345 | Cardiologia   | 550e8400-e29b-41d4-a716-446655440001
João Silva   | 123456789012345 | Cardiologia   | 550e8400-e29b-41d4-a716-446655440002
*/

-- Após importação, você terá 2 registros na tabela medicos:
-- SELECT * FROM medicos WHERE nome = 'João Silva';
/*
id (gerado)  | nome       | crm (cns)       | especialidade | hospital_id
-------------|------------|-----------------|---------------|--------------------------------------
<uuid1>      | João Silva | 123456789012345 | Cardiologia   | 550e8400-e29b-41d4-a716-446655440001
<uuid2>      | João Silva | 123456789012345 | Cardiologia   | 550e8400-e29b-41d4-a716-446655440002
*/

-- Exemplo 2: Dra. Maria Santos trabalha em apenas 1 hospital
-- No Excel você teria 1 linha:
/*
nome          | cns             | especialidade | id (hospital_id)
--------------|-----------------|---------------|--------------------------------------
Maria Santos  | 234567890123456 | Pediatria     | 550e8400-e29b-41d4-a716-446655440001
*/

-- Após importação:
-- SELECT * FROM medicos WHERE nome = 'Maria Santos';
/*
id (gerado)  | nome         | crm (cns)       | especialidade | hospital_id
-------------|--------------|-----------------|---------------|--------------------------------------
<uuid3>      | Maria Santos | 234567890123456 | Pediatria     | 550e8400-e29b-41d4-a716-446655440001
*/

-- ============================================================================
-- 3. CONSULTAS ÚTEIS APÓS A IMPORTAÇÃO
-- ============================================================================

-- Ver todos os médicos de um hospital específico:
SELECT 
    m.nome,
    m.crm,
    m.especialidade,
    h.nome as hospital
FROM medicos m
JOIN hospitais h ON m.hospital_id = h.id
WHERE m.hospital_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY m.nome;

-- Ver médicos que trabalham em múltiplos hospitais:
SELECT 
    m.crm,
    m.nome,
    m.especialidade,
    COUNT(DISTINCT m.hospital_id) as qtd_hospitais,
    STRING_AGG(h.nome, ', ') as hospitais
FROM medicos m
JOIN hospitais h ON m.hospital_id = h.id
GROUP BY m.crm, m.nome, m.especialidade
HAVING COUNT(DISTINCT m.hospital_id) > 1
ORDER BY m.nome;

-- Contar médicos por hospital:
SELECT 
    h.nome as hospital,
    COUNT(m.id) as total_medicos
FROM hospitais h
LEFT JOIN medicos m ON h.id = m.hospital_id
GROUP BY h.id, h.nome
ORDER BY h.nome;

-- Ver todos os médicos com seus hospitais:
SELECT 
    m.nome,
    m.crm,
    m.especialidade,
    h.nome as hospital,
    m.telefone,
    m.email
FROM medicos m
JOIN hospitais h ON m.hospital_id = h.id
ORDER BY m.nome, h.nome;

-- ============================================================================
-- 4. LIMPEZA (USE COM CUIDADO!)
-- ============================================================================

-- Se precisar limpar todos os médicos para recomeçar:
-- ⚠️ ATENÇÃO: Isso irá deletar TODOS os médicos!
-- DELETE FROM medicos;

-- Se precisar limpar médicos de um hospital específico:
-- DELETE FROM medicos WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440001';

-- Se precisar limpar um médico específico (por ID):
-- DELETE FROM medicos WHERE id = '<uuid-do-medico>';

-- ============================================================================
-- 5. VERIFICAÇÕES DE INTEGRIDADE
-- ============================================================================

-- Verificar se há médicos sem hospital:
SELECT * FROM medicos WHERE hospital_id IS NULL;

-- Verificar se há médicos com hospital_id inválido:
SELECT m.* 
FROM medicos m
LEFT JOIN hospitais h ON m.hospital_id = h.id
WHERE h.id IS NULL;

-- Verificar médicos com dados incompletos:
SELECT * FROM medicos 
WHERE nome IS NULL 
   OR nome = '' 
   OR crm IS NULL 
   OR crm = ''
   OR especialidade IS NULL 
   OR especialidade = '';

-- ============================================================================
-- FIM DO EXEMPLO
-- ============================================================================

