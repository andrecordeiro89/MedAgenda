-- ============================================================================
-- CORREÇÃO PARA EXCLUSÃO DE PROCEDIMENTOS
-- Resolver conflito de foreign key constraint
-- ============================================================================

-- 1. Verificar quais procedimentos estão sendo usados em agendamentos
SELECT 'Procedimentos em uso nos agendamentos:' as info;
SELECT 
    p.nome as procedimento,
    count(a.id) as quantidade_agendamentos
FROM procedimentos p
LEFT JOIN agendamentos a ON p.id = a.procedimento_id
GROUP BY p.id, p.nome
HAVING count(a.id) > 0
ORDER BY count(a.id) DESC;

-- 2. Verificar o procedimento específico que está sendo excluído
-- Substitua o ID pelo procedimento que você está tentando excluir
SELECT 'Agendamentos usando o procedimento específico:' as info;
SELECT 
    a.nome_paciente,
    a.data_agendamento,
    p.nome as procedimento,
    m.nome as medico
FROM agendamentos a
JOIN procedimentos p ON a.procedimento_id = p.id
LEFT JOIN medicos m ON a.medico_id = m.id
WHERE p.id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871'  -- Substitua pelo ID correto
ORDER BY a.data_agendamento DESC;

-- 3. OPÇÃO 1: Excluir agendamentos relacionados primeiro (CUIDADO!)
-- DESCOMENTE APENAS SE TIVER CERTEZA
-- DELETE FROM agendamentos WHERE procedimento_id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';

-- 4. OPÇÃO 2: Atualizar agendamentos para usar outro procedimento
-- Primeiro, vamos ver outros procedimentos disponíveis do mesmo tipo
SELECT 'Outros procedimentos disponíveis:' as info;
SELECT 
    id,
    nome,
    tipo,
    especialidade
FROM procedimentos 
WHERE id != 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871'  -- Excluir o que queremos deletar
ORDER BY nome;

-- 5. OPÇÃO 3: Marcar procedimento como inativo ao invés de excluir
-- Adicionar coluna ativo se não existir
ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Marcar como inativo ao invés de excluir
-- UPDATE procedimentos SET ativo = false WHERE id = 'a25f8b1f-36f8-4aee-8dcb-a15adeedd871';

-- 6. Verificar constraint atual
SELECT 'Constraints da tabela agendamentos:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'agendamentos'::regclass
AND contype = 'f';  -- foreign key constraints

SELECT 'Execute uma das opções acima para resolver o conflito!' as resultado;
