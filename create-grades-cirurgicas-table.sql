-- ============================================================================
-- MEDAGENDA - TABELA DE GRADES CIRÚRGICAS
-- Script para criar estrutura de persistência das grades cirúrgicas
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNA PREFIXOS NA TABELA PROCEDIMENTOS
-- ============================================================================
-- Adicionar coluna para armazenar prefixos de procedimentos cirúrgicos
ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS prefixos TEXT[] DEFAULT '{}';

COMMENT ON COLUMN procedimentos.prefixos IS 'Array de prefixos usados nas grades cirúrgicas (ex: LCA, MENISCO, PTJ)';

-- ============================================================================
-- 2. TABELA: grades_cirurgicas
-- Armazena as grades cirúrgicas configuradas por hospital e dia da semana
-- ============================================================================
CREATE TABLE IF NOT EXISTS grades_cirurgicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    dia_semana dia_semana NOT NULL,
    mes_referencia CHAR(7) NOT NULL, -- Formato: YYYY-MM (ex: 2025-12)
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: uma grade ativa por dia da semana, mês e hospital
    UNIQUE(hospital_id, dia_semana, mes_referencia, ativa)
);

COMMENT ON TABLE grades_cirurgicas IS 'Grades cirúrgicas configuradas por hospital, dia da semana e mês';
COMMENT ON COLUMN grades_cirurgicas.dia_semana IS 'Dia da semana para o qual a grade se aplica';
COMMENT ON COLUMN grades_cirurgicas.mes_referencia IS 'Mês de referência no formato YYYY-MM';

-- ============================================================================
-- 3. TABELA: grades_cirurgicas_dias
-- Armazena cada dia específico da grade (as 3 ocorrências do dia da semana)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grades_cirurgicas_dias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id UUID NOT NULL REFERENCES grades_cirurgicas(id) ON DELETE CASCADE,
    data DATE NOT NULL, -- Data específica (ex: 2025-12-01)
    dia_semana dia_semana NOT NULL,
    ordem INTEGER NOT NULL CHECK (ordem IN (1, 2, 3)), -- 1ª, 2ª ou 3ª ocorrência
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: cada data só pode ter uma configuração por grade
    UNIQUE(grade_id, data)
);

COMMENT ON TABLE grades_cirurgicas_dias IS 'Dias específicos de cada grade cirúrgica';
COMMENT ON COLUMN grades_cirurgicas_dias.ordem IS 'Ordem da ocorrência (1=primeira, 2=segunda, 3=terceira)';

-- ============================================================================
-- 4. TABELA: grades_cirurgicas_itens
-- Armazena os itens da grade (especialidades e procedimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS grades_cirurgicas_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dia_id UUID NOT NULL REFERENCES grades_cirurgicas_dias(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('especialidade', 'procedimento')),
    especialidade_id UUID REFERENCES especialidades(id) ON DELETE CASCADE, -- Preenchido se tipo='especialidade'
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL, -- Preenchido se tipo='procedimento'
    texto TEXT NOT NULL, -- Texto livre (nome da especialidade ou prefixo do procedimento)
    ordem INTEGER NOT NULL, -- Ordem de exibição na grade
    pacientes TEXT[] DEFAULT '{}', -- Array de nomes de pacientes vinculados ao procedimento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: cada item tem uma ordem única dentro do seu dia
    UNIQUE(dia_id, ordem)
);

COMMENT ON TABLE grades_cirurgicas_itens IS 'Itens (especialidades e procedimentos) das grades cirúrgicas';
COMMENT ON COLUMN grades_cirurgicas_itens.tipo IS 'Tipo do item: especialidade (cabeçalho) ou procedimento';
COMMENT ON COLUMN grades_cirurgicas_itens.texto IS 'Texto livre do item (ex: Ortopedia - Joelho, LCA, MENISCO)';
COMMENT ON COLUMN grades_cirurgicas_itens.pacientes IS 'Array de nomes dos pacientes vinculados ao procedimento';

-- ============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ============================================================================

-- grades_cirurgicas
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_hospital_id ON grades_cirurgicas(hospital_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dia_semana ON grades_cirurgicas(dia_semana);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_mes_referencia ON grades_cirurgicas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_ativa ON grades_cirurgicas(ativa) WHERE ativa = true;

-- grades_cirurgicas_dias
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dias_grade_id ON grades_cirurgicas_dias(grade_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dias_data ON grades_cirurgicas_dias(data);

-- grades_cirurgicas_itens
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_dia_id ON grades_cirurgicas_itens(dia_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_tipo ON grades_cirurgicas_itens(tipo);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_especialidade_id ON grades_cirurgicas_itens(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_procedimento_id ON grades_cirurgicas_itens(procedimento_id);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================
DROP TRIGGER IF EXISTS update_grades_cirurgicas_updated_at ON grades_cirurgicas;
DROP TRIGGER IF EXISTS update_grades_cirurgicas_dias_updated_at ON grades_cirurgicas_dias;
DROP TRIGGER IF EXISTS update_grades_cirurgicas_itens_updated_at ON grades_cirurgicas_itens;

CREATE TRIGGER update_grades_cirurgicas_updated_at 
    BEFORE UPDATE ON grades_cirurgicas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_cirurgicas_dias_updated_at 
    BEFORE UPDATE ON grades_cirurgicas_dias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_cirurgicas_itens_updated_at 
    BEFORE UPDATE ON grades_cirurgicas_itens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS PARA CONSULTAS OTIMIZADAS
-- ============================================================================

-- View completa com todos os dados da grade
CREATE OR REPLACE VIEW vw_grades_cirurgicas_completas AS
SELECT 
    g.id as grade_id,
    g.hospital_id,
    h.nome as hospital_nome,
    g.dia_semana,
    g.mes_referencia,
    g.ativa,
    d.id as dia_id,
    d.data,
    d.ordem as dia_ordem,
    i.id as item_id,
    i.tipo as item_tipo,
    i.especialidade_id,
    e.nome as especialidade_nome,
    i.procedimento_id,
    p.nome as procedimento_nome,
    i.texto as item_texto,
    i.ordem as item_ordem,
    i.pacientes,
    array_length(i.pacientes, 1) as total_pacientes,
    g.created_at,
    g.updated_at
FROM grades_cirurgicas g
INNER JOIN hospitais h ON g.hospital_id = h.id
LEFT JOIN grades_cirurgicas_dias d ON g.id = d.grade_id
LEFT JOIN grades_cirurgicas_itens i ON d.id = i.dia_id
LEFT JOIN especialidades e ON i.especialidade_id = e.id
LEFT JOIN procedimentos p ON i.procedimento_id = p.id
WHERE g.ativa = true
ORDER BY g.dia_semana, d.data, i.ordem;

COMMENT ON VIEW vw_grades_cirurgicas_completas IS 'View completa de todas as grades cirúrgicas com seus itens';

-- View resumo de pacientes por dia
CREATE OR REPLACE VIEW vw_grades_pacientes_por_dia AS
SELECT 
    g.id as grade_id,
    g.hospital_id,
    h.nome as hospital_nome,
    d.data,
    d.dia_semana,
    COUNT(DISTINCT i.id) FILTER (WHERE i.tipo = 'especialidade') as total_especialidades,
    COUNT(DISTINCT i.id) FILTER (WHERE i.tipo = 'procedimento') as total_procedimentos,
    SUM(array_length(i.pacientes, 1)) as total_pacientes
FROM grades_cirurgicas g
INNER JOIN hospitais h ON g.hospital_id = h.id
INNER JOIN grades_cirurgicas_dias d ON g.id = d.grade_id
LEFT JOIN grades_cirurgicas_itens i ON d.id = i.dia_id
WHERE g.ativa = true
GROUP BY g.id, g.hospital_id, h.nome, d.data, d.dia_semana
ORDER BY d.data;

COMMENT ON VIEW vw_grades_pacientes_por_dia IS 'Resumo de especialidades, procedimentos e pacientes por dia';

-- View de prefixos mais usados
CREATE OR REPLACE VIEW vw_prefixos_mais_usados AS
SELECT 
    i.texto as prefixo,
    COUNT(*) as quantidade_usos,
    array_agg(DISTINCT e.nome) FILTER (WHERE e.nome IS NOT NULL) as especialidades,
    SUM(array_length(i.pacientes, 1)) as total_pacientes
FROM grades_cirurgicas_itens i
LEFT JOIN grades_cirurgicas_itens esp ON esp.dia_id = i.dia_id AND esp.tipo = 'especialidade' AND esp.ordem < i.ordem
LEFT JOIN especialidades e ON esp.especialidade_id = e.id
WHERE i.tipo = 'procedimento'
GROUP BY i.texto
ORDER BY quantidade_usos DESC, total_pacientes DESC
LIMIT 50;

COMMENT ON VIEW vw_prefixos_mais_usados IS 'Prefixos de procedimentos mais utilizados nas grades';

-- ============================================================================
-- FUNÇÕES ÚTEIS
-- ============================================================================

-- Função para obter grade completa de um dia da semana
CREATE OR REPLACE FUNCTION fn_obter_grade_cirurgica(
    p_hospital_id UUID,
    p_dia_semana dia_semana,
    p_mes_referencia CHAR(7)
)
RETURNS TABLE (
    grade_id UUID,
    dia_id UUID,
    data DATE,
    dia_ordem INTEGER,
    item_id UUID,
    item_tipo VARCHAR,
    item_texto TEXT,
    item_ordem INTEGER,
    pacientes TEXT[],
    total_pacientes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        d.id,
        d.data,
        d.ordem,
        i.id,
        i.tipo,
        i.texto,
        i.ordem,
        i.pacientes,
        array_length(i.pacientes, 1)
    FROM grades_cirurgicas g
    LEFT JOIN grades_cirurgicas_dias d ON g.id = d.grade_id
    LEFT JOIN grades_cirurgicas_itens i ON d.id = i.dia_id
    WHERE g.hospital_id = p_hospital_id
      AND g.dia_semana = p_dia_semana
      AND g.mes_referencia = p_mes_referencia
      AND g.ativa = true
    ORDER BY d.data, i.ordem;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_obter_grade_cirurgica IS 'Retorna grade cirúrgica completa para um hospital, dia da semana e mês';

-- Função para duplicar grade para outro mês
CREATE OR REPLACE FUNCTION fn_duplicar_grade_cirurgica(
    p_grade_id UUID,
    p_novo_mes_referencia CHAR(7)
)
RETURNS UUID AS $$
DECLARE
    v_nova_grade_id UUID;
    v_dia_atual RECORD;
    v_novo_dia_id UUID;
    v_item_atual RECORD;
BEGIN
    -- Criar nova grade
    INSERT INTO grades_cirurgicas (hospital_id, dia_semana, mes_referencia, ativa)
    SELECT hospital_id, dia_semana, p_novo_mes_referencia, true
    FROM grades_cirurgicas
    WHERE id = p_grade_id
    RETURNING id INTO v_nova_grade_id;
    
    -- Duplicar dias
    FOR v_dia_atual IN 
        SELECT * FROM grades_cirurgicas_dias WHERE grade_id = p_grade_id
    LOOP
        INSERT INTO grades_cirurgicas_dias (grade_id, data, dia_semana, ordem)
        VALUES (v_nova_grade_id, v_dia_atual.data, v_dia_atual.dia_semana, v_dia_atual.ordem)
        RETURNING id INTO v_novo_dia_id;
        
        -- Duplicar itens do dia
        FOR v_item_atual IN
            SELECT * FROM grades_cirurgicas_itens WHERE dia_id = v_dia_atual.id
        LOOP
            INSERT INTO grades_cirurgicas_itens (
                dia_id, tipo, especialidade_id, procedimento_id, texto, ordem, pacientes
            )
            VALUES (
                v_novo_dia_id, v_item_atual.tipo, v_item_atual.especialidade_id,
                v_item_atual.procedimento_id, v_item_atual.texto, v_item_atual.ordem,
                v_item_atual.pacientes
            );
        END LOOP;
    END LOOP;
    
    RETURN v_nova_grade_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_duplicar_grade_cirurgica IS 'Duplica uma grade cirúrgica completa para outro mês';

-- ============================================================================
-- PERMISSÕES (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE grades_cirurgicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_itens ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir inserção de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir atualização de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir exclusão de grades" ON grades_cirurgicas;

DROP POLICY IF EXISTS "Permitir leitura de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir inserção de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir atualização de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir exclusão de dias" ON grades_cirurgicas_dias;

DROP POLICY IF EXISTS "Permitir leitura de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir inserção de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir exclusão de itens" ON grades_cirurgicas_itens;

-- Políticas para grades_cirurgicas
CREATE POLICY "Permitir leitura de grades" ON grades_cirurgicas
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Permitir inserção de grades" ON grades_cirurgicas
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização de grades" ON grades_cirurgicas
FOR UPDATE 
TO public
USING (true);

CREATE POLICY "Permitir exclusão de grades" ON grades_cirurgicas
FOR DELETE 
TO public
USING (true);

-- Políticas para grades_cirurgicas_dias
CREATE POLICY "Permitir leitura de dias" ON grades_cirurgicas_dias
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Permitir inserção de dias" ON grades_cirurgicas_dias
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização de dias" ON grades_cirurgicas_dias
FOR UPDATE 
TO public
USING (true);

CREATE POLICY "Permitir exclusão de dias" ON grades_cirurgicas_dias
FOR DELETE 
TO public
USING (true);

-- Políticas para grades_cirurgicas_itens
CREATE POLICY "Permitir leitura de itens" ON grades_cirurgicas_itens
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Permitir inserção de itens" ON grades_cirurgicas_itens
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização de itens" ON grades_cirurgicas_itens
FOR UPDATE 
TO public
USING (true);

CREATE POLICY "Permitir exclusão de itens" ON grades_cirurgicas_itens
FOR DELETE 
TO public
USING (true);

-- ============================================================================
-- DADOS DE EXEMPLO (Opcional - comentado por padrão)
-- ============================================================================
/*
-- Exemplo: Inserir grade cirúrgica para segunda-feira
INSERT INTO grades_cirurgicas (hospital_id, dia_semana, mes_referencia, ativa)
VALUES ('seu-hospital-id-aqui', 'segunda', '2025-12', true);

-- Exemplo: Inserir dias da grade
INSERT INTO grades_cirurgicas_dias (grade_id, data, dia_semana, ordem)
VALUES 
    ('grade-id-aqui', '2025-12-01', 'segunda', 1),
    ('grade-id-aqui', '2025-12-08', 'segunda', 2),
    ('grade-id-aqui', '2025-12-15', 'segunda', 3);

-- Exemplo: Inserir itens (especialidade + procedimentos)
INSERT INTO grades_cirurgicas_itens (dia_id, tipo, especialidade_id, texto, ordem)
VALUES ('dia-id-aqui', 'especialidade', 'especialidade-id-aqui', 'Ortopedia - Joelho', 1);

INSERT INTO grades_cirurgicas_itens (dia_id, tipo, procedimento_id, texto, ordem, pacientes)
VALUES 
    ('dia-id-aqui', 'procedimento', 'procedimento-id-aqui', 'LCA', 2, ARRAY['João Silva', 'Maria Santos']),
    ('dia-id-aqui', 'procedimento', 'procedimento-id-aqui', 'MENISCO', 3, ARRAY['Pedro Costa']);
*/

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

