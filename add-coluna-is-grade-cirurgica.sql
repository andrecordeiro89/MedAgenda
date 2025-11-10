-- ============================================================================
-- ADICIONAR COLUNA PARA IDENTIFICAR REGISTROS DE GRADE CIRÚRGICA
-- ============================================================================
-- Esta coluna identifica registros que são apenas estruturas de grade cirúrgica
-- (linhas de especialidade/médico) e não devem aparecer na tela de Documentação

-- Adicionar coluna is_grade_cirurgica na tabela agendamentos
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS is_grade_cirurgica BOOLEAN NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN agendamentos.is_grade_cirurgica IS 
'Indica se o registro é apenas uma estrutura de grade cirúrgica (linha de especialidade/médico). 
Registros com is_grade_cirurgica=true não devem aparecer na tela de Documentação.';

-- Criar índice para otimizar filtros
CREATE INDEX IF NOT EXISTS idx_agendamentos_is_grade_cirurgica 
ON agendamentos(is_grade_cirurgica) 
WHERE is_grade_cirurgica = true;

-- Atualizar registros existentes que são de grade cirúrgica
-- (identificados por: procedimentos IS NULL E nome_paciente = '')
UPDATE agendamentos 
SET is_grade_cirurgica = true 
WHERE (procedimentos IS NULL OR procedimentos = '') 
  AND (nome_paciente IS NULL OR nome_paciente = '');

-- Verificar quantos registros foram atualizados
SELECT 
  COUNT(*) as total_registros_grade_cirurgica,
  COUNT(*) FILTER (WHERE is_grade_cirurgica = true) as marcados_como_grade
FROM agendamentos;

