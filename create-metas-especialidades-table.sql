-- ============================================================================
-- MEDAGENDA - TABELA DE METAS DE AGENDAMENTOS POR ESPECIALIDADE
-- Script para criar a tabela que armazena metas de agendamento por especialidade e dia da semana
-- ============================================================================

-- Criar tipo ENUM para dias da semana se não existir
DO $$ BEGIN
    CREATE TYPE dia_semana AS ENUM ('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABELA: metas_especialidades
-- Armazena as metas de agendamentos por especialidade, dia da semana e hospital
-- ============================================================================
CREATE TABLE IF NOT EXISTS metas_especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialidade_id UUID NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    dia_semana dia_semana NOT NULL,
    quantidade_agendamentos INTEGER NOT NULL CHECK (quantidade_agendamentos > 0),
    ativo BOOLEAN NOT NULL DEFAULT true,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar duplicação: mesma especialidade + mesmo dia + mesmo hospital
    UNIQUE(especialidade_id, dia_semana, hospital_id)
);

-- ============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_metas_especialidades_especialidade_id ON metas_especialidades(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_metas_especialidades_hospital_id ON metas_especialidades(hospital_id);
CREATE INDEX IF NOT EXISTS idx_metas_especialidades_dia_semana ON metas_especialidades(dia_semana);
CREATE INDEX IF NOT EXISTS idx_metas_especialidades_ativo ON metas_especialidades(ativo);

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_metas_especialidades_hospital_especialidade 
ON metas_especialidades(hospital_id, especialidade_id) WHERE ativo = true;

-- ============================================================================
-- TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================
DROP TRIGGER IF EXISTS update_metas_especialidades_updated_at ON metas_especialidades;

CREATE TRIGGER update_metas_especialidades_updated_at 
    BEFORE UPDATE ON metas_especialidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS NA TABELA E COLUNAS (DOCUMENTAÇÃO)
-- ============================================================================
COMMENT ON TABLE metas_especialidades IS 'Armazena metas de quantidade de agendamentos por especialidade, dia da semana e hospital';
COMMENT ON COLUMN metas_especialidades.id IS 'Identificador único da meta';
COMMENT ON COLUMN metas_especialidades.especialidade_id IS 'Referência para a especialidade (FK)';
COMMENT ON COLUMN metas_especialidades.dia_semana IS 'Dia da semana para a meta (domingo a sabado)';
COMMENT ON COLUMN metas_especialidades.quantidade_agendamentos IS 'Quantidade meta de agendamentos para este dia';
COMMENT ON COLUMN metas_especialidades.ativo IS 'Indica se a meta está ativa (apenas metas ativas são contabilizadas)';
COMMENT ON COLUMN metas_especialidades.hospital_id IS 'Hospital ao qual esta meta pertence';
COMMENT ON COLUMN metas_especialidades.observacoes IS 'Observações ou justificativas para a meta';

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)
-- ============================================================================
-- Exemplos de metas para hospitais e especialidades de exemplo
-- Descomente as linhas abaixo se quiser inserir dados de teste

/*
-- Metas para Hospital São Paulo (ID de exemplo)
INSERT INTO metas_especialidades (especialidade_id, dia_semana, quantidade_agendamentos, ativo, hospital_id, observacoes) VALUES
(
    (SELECT id FROM especialidades WHERE nome = 'Cardiologia' LIMIT 1),
    'segunda',
    15,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'Meta para consultas de rotina em cardiologia'
),
(
    (SELECT id FROM especialidades WHERE nome = 'Ortopedia' LIMIT 1),
    'terca',
    12,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'Meta para consultas ortopédicas'
),
(
    (SELECT id FROM especialidades WHERE nome = 'Pediatria' LIMIT 1),
    'quarta',
    20,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'Alta demanda de pediatria às quartas-feiras'
),
(
    (SELECT id FROM especialidades WHERE nome = 'Dermatologia' LIMIT 1),
    'quinta',
    10,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'Meta padrão para dermatologia'
),
(
    (SELECT id FROM especialidades WHERE nome = 'Neurologia' LIMIT 1),
    'sexta',
    8,
    true,
    '550e8400-e29b-41d4-a716-446655440001',
    'Meta para consultas neurológicas especializadas'
)
ON CONFLICT (especialidade_id, dia_semana, hospital_id) DO NOTHING;
*/

-- ============================================================================
-- VIEW PARA RELATÓRIOS DE METAS
-- ============================================================================
CREATE OR REPLACE VIEW vw_metas_especialidades_completas AS
SELECT 
    m.id,
    m.especialidade_id,
    e.nome as especialidade_nome,
    m.dia_semana,
    m.quantidade_agendamentos,
    m.ativo,
    m.hospital_id,
    h.nome as hospital_nome,
    m.observacoes,
    m.created_at,
    m.updated_at
FROM metas_especialidades m
INNER JOIN especialidades e ON m.especialidade_id = e.id
INNER JOIN hospitais h ON m.hospital_id = h.id
ORDER BY h.nome, e.nome, m.dia_semana;

COMMENT ON VIEW vw_metas_especialidades_completas IS 'View completa de metas com nomes de especialidades e hospitais';

-- ============================================================================
-- FUNCTION PARA CALCULAR TOTAL DE METAS DA SEMANA POR ESPECIALIDADE
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_meta_semanal_especialidade(
    p_especialidade_id UUID,
    p_hospital_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantidade_agendamentos), 0)
    INTO v_total
    FROM metas_especialidades
    WHERE especialidade_id = p_especialidade_id
      AND hospital_id = p_hospital_id
      AND ativo = true;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_meta_semanal_especialidade IS 'Calcula o total de agendamentos meta para uma especialidade durante a semana';

-- ============================================================================
-- FUNCTION PARA OBTER META DE UM DIA ESPECÍFICO
-- ============================================================================
CREATE OR REPLACE FUNCTION obter_meta_dia(
    p_especialidade_id UUID,
    p_dia_semana dia_semana,
    p_hospital_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_meta INTEGER;
BEGIN
    SELECT quantidade_agendamentos
    INTO v_meta
    FROM metas_especialidades
    WHERE especialidade_id = p_especialidade_id
      AND dia_semana = p_dia_semana
      AND hospital_id = p_hospital_id
      AND ativo = true;
    
    RETURN COALESCE(v_meta, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_meta_dia IS 'Retorna a meta de agendamentos para um dia específico da semana';

-- ============================================================================
-- VIEW PARA RESUMO DE METAS POR HOSPITAL
-- ============================================================================
CREATE OR REPLACE VIEW vw_resumo_metas_por_hospital AS
SELECT 
    h.id as hospital_id,
    h.nome as hospital_nome,
    COUNT(DISTINCT m.especialidade_id) as total_especialidades_com_metas,
    COUNT(m.id) as total_metas_cadastradas,
    COUNT(CASE WHEN m.ativo = true THEN 1 END) as total_metas_ativas,
    SUM(CASE WHEN m.ativo = true THEN m.quantidade_agendamentos ELSE 0 END) as total_agendamentos_meta_semana
FROM hospitais h
LEFT JOIN metas_especialidades m ON h.id = m.hospital_id
GROUP BY h.id, h.nome
ORDER BY h.nome;

COMMENT ON VIEW vw_resumo_metas_por_hospital IS 'Resumo agregado de metas por hospital';

-- ============================================================================
-- PERMISSÕES (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS na tabela
ALTER TABLE metas_especialidades ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir inserção de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir atualização de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir exclusão de metas" ON metas_especialidades;

-- Política de SELECT (todos podem ler)
CREATE POLICY "Permitir leitura de metas" ON metas_especialidades
FOR SELECT 
TO public
USING (true);

-- Política de INSERT (todos podem inserir)
CREATE POLICY "Permitir inserção de metas" ON metas_especialidades
FOR INSERT 
TO public
WITH CHECK (true);

-- Política de UPDATE (todos podem atualizar)
CREATE POLICY "Permitir atualização de metas" ON metas_especialidades
FOR UPDATE 
TO public
USING (true);

-- Política de DELETE (todos podem excluir)
CREATE POLICY "Permitir exclusão de metas" ON metas_especialidades
FOR DELETE 
TO public
USING (true);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela metas_especialidades criada com sucesso!' as status;

-- Mostrar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'metas_especialidades'
ORDER BY ordinal_position;

