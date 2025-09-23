-- ============================================================================
-- RESOLVER EXCLUSÃO DO PROCEDIMENTO ESPECÍFICO
-- ID: a25f8b1f-36f8-4aee-8dcb-a15adeedd871
-- ============================================================================

-- 1. Verificar o procedimento que está tentando excluir
SELECT 'Procedimento a ser excluído:' as info;
SELECT 
    id,
    nome,
    tipo,
    especialidade,
    hospital_id
FROM procedimentos 
WHERE id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';

-- 2. Verificar quantos agendamentos usam este procedimento
SELECT 'Agendamentos que usam este procedimento:' as info;
SELECT 
    a.id,
    a.nome_paciente as paciente,
    a.data_agendamento,
    m.nome as medico,
    a.status_liberacao
FROM agendamentos a
LEFT JOIN medicos m ON a.medico_id = m.id
WHERE a.procedimento_id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871'
ORDER BY a.data_agendamento DESC;

-- 3. SOLUÇÃO RECOMENDADA: Substituir por outro procedimento similar
-- Encontrar procedimentos similares (mesmo tipo e especialidade)
SELECT 'Procedimentos similares para substituição:' as info;
SELECT 
    p2.id,
    p2.nome,
    p2.tipo,
    p2.especialidade
FROM procedimentos p1
JOIN procedimentos p2 ON (
    p1.tipo = p2.tipo 
    AND (p1.especialidade = p2.especialidade OR (p1.especialidade IS NULL AND p2.especialidade IS NULL))
    AND p1.hospital_id = p2.hospital_id
)
WHERE p1.id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871'
AND p2.id != 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871'
ORDER BY p2.nome;

-- 4. EXECUTAR SUBSTITUIÇÃO (descomente e substitua o ID do procedimento substituto)
-- Substitua 'ID_DO_PROCEDIMENTO_SUBSTITUTO' pelo ID de um procedimento similar
/*
UPDATE agendamentos 
SET procedimento_id = 'ID_DO_PROCEDIMENTO_SUBSTITUTO'
WHERE procedimento_id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';
*/

-- 5. APÓS A SUBSTITUIÇÃO, o procedimento pode ser excluído normalmente
/*
DELETE FROM procedimentos 
WHERE id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';
*/

-- 6. ALTERNATIVA: Marcar como inativo ao invés de excluir
-- Adicionar coluna ativo se não existir
ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Marcar como inativo (descomente para executar)
/*
UPDATE procedimentos 
SET ativo = false 
WHERE id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';
*/

-- 7. Se escolher a opção de marcar como inativo, atualizar as consultas
-- Para filtrar apenas procedimentos ativos nas consultas futuras
SELECT 'Para usar procedimentos ativos apenas, use esta consulta:' as dica;
SELECT 'SELECT * FROM procedimentos WHERE ativo = true OR ativo IS NULL;' as exemplo;

SELECT 'Escolha uma das opções acima para resolver o conflito!' as resultado;
