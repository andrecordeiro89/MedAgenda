-- ============================================================================
-- PERMITIR DUPLICAÇÃO DE PROCEDIMENTOS E PACIENTES ENTRE HOSPITAIS
-- Modelo simples e eficaz - mesma lógica dos médicos
-- ============================================================================

-- ============================================================================
-- 1. PROCEDIMENTOS - PERMITIR MESMO NOME EM HOSPITAIS DIFERENTES
-- ============================================================================

-- Remover constraint que impede procedimentos com mesmo nome
ALTER TABLE procedimentos DROP CONSTRAINT IF EXISTS procedimentos_nome_key;
ALTER TABLE procedimentos DROP CONSTRAINT IF EXISTS procedimentos_nome_hospital_key;

-- Verificar se funcionou
SELECT 
    COUNT(*) as total_procedimentos,
    COUNT(DISTINCT nome) as nomes_unicos,
    COUNT(*) - COUNT(DISTINCT nome) as duplicacoes_possiveis
FROM procedimentos;

-- ============================================================================
-- 2. AGENDAMENTOS/PACIENTES - PERMITIR MESMO PACIENTE EM HOSPITAIS DIFERENTES  
-- ============================================================================

-- Verificar se existem constraints que impedem pacientes duplicados
-- (Normalmente não há, mas vamos verificar)
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'agendamentos'::regclass
AND (conname LIKE '%nome%' OR conname LIKE '%paciente%');

-- Se houver alguma constraint de nome único, remover:
-- ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_nome_key;

-- ============================================================================
-- 3. VERIFICAR SITUAÇÃO ATUAL
-- ============================================================================

-- Ver procedimentos por hospital
SELECT 
    h.nome as hospital,
    COUNT(p.id) as total_procedimentos,
    COUNT(DISTINCT p.nome) as procedimentos_unicos
FROM hospitais h
LEFT JOIN procedimentos p ON h.id = p.hospital_id
GROUP BY h.id, h.nome
ORDER BY h.nome;

-- Ver pacientes por hospital (últimos 10 agendamentos)
SELECT 
    h.nome as hospital,
    a.nome_paciente as paciente,
    a.data_agendamento,
    p.nome as procedimento
FROM agendamentos a
JOIN hospitais h ON a.hospital_id = h.id  
JOIN procedimentos p ON a.procedimento_id = p.id
ORDER BY a.data_agendamento DESC
LIMIT 10;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Procedimentos: Mesmo nome pode existir em hospitais diferentes
--    Exemplo: "Cirurgia de Catarata" no Hospital A e Hospital B
--
-- ✅ Pacientes: Mesmo paciente pode ser atendido em hospitais diferentes  
--    Exemplo: "João Silva" pode ter agendamentos no Hospital A e Hospital B
--
-- ✅ Flexibilidade total: Hospitais da mesma região compartilham pacientes
-- ✅ Sem erros de duplicação
-- ✅ Modelo simples e eficaz

COMMIT;
