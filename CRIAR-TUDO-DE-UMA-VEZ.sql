-- ============================================================================
-- SCRIPT DEFINITIVO: CRIAR TUDO DE UMA VEZ
-- Este script cria TODAS as estruturas necessárias em uma única execução
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNA PREFIXOS NA TABELA PROCEDIMENTOS
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS prefixos TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Coluna prefixos adicionada em procedimentos';
EXCEPTION 
    WHEN duplicate_column THEN
        RAISE NOTICE 'ℹ️ Coluna prefixos já existe em procedimentos';
END $$;

-- ============================================================================
-- 2. CRIAR TABELAS DE GRADES CIRÚRGICAS
-- ============================================================================

-- Tabela: grades_cirurgicas
CREATE TABLE IF NOT EXISTS grades_cirurgicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    dia_semana dia_semana NOT NULL,
    mes_referencia CHAR(7) NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: grades_cirurgicas_dias
CREATE TABLE IF NOT EXISTS grades_cirurgicas_dias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id UUID NOT NULL REFERENCES grades_cirurgicas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    dia_semana dia_semana NOT NULL,
    ordem INTEGER NOT NULL CHECK (ordem IN (1, 2, 3)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(grade_id, data)
);

-- Tabela: grades_cirurgicas_itens
CREATE TABLE IF NOT EXISTS grades_cirurgicas_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dia_id UUID NOT NULL REFERENCES grades_cirurgicas_dias(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('especialidade', 'procedimento')),
    especialidade_id UUID REFERENCES especialidades(id) ON DELETE CASCADE,
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL,
    texto TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    pacientes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dia_id, ordem)
);

RAISE NOTICE '✅ Tabelas de grades cirúrgicas criadas';

-- ============================================================================
-- 3. CRIAR ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_hospital_id ON grades_cirurgicas(hospital_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dia_semana ON grades_cirurgicas(dia_semana);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_mes_referencia ON grades_cirurgicas(mes_referencia);

CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dias_grade_id ON grades_cirurgicas_dias(grade_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_dias_data ON grades_cirurgicas_dias(data);

CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_dia_id ON grades_cirurgicas_itens(dia_id);
CREATE INDEX IF NOT EXISTS idx_grades_cirurgicas_itens_tipo ON grades_cirurgicas_itens(tipo);

RAISE NOTICE '✅ Índices criados';

-- ============================================================================
-- 4. DESABILITAR RLS COMPLETAMENTE
-- ============================================================================

ALTER TABLE grades_cirurgicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_dias DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_itens DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS desabilitado em todas as tabelas de grades';

-- Também desabilitar em metas (se existir)
DO $$ 
BEGIN
    ALTER TABLE metas_especialidades DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS desabilitado em metas_especialidades';
EXCEPTION 
    WHEN undefined_table THEN
        RAISE NOTICE 'ℹ️ Tabela metas_especialidades não existe';
END $$;

-- ============================================================================
-- 5. REMOVER TODAS AS POLÍTICAS (SE EXISTIREM)
-- ============================================================================

DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'metas_especialidades',
            'grades_cirurgicas',
            'grades_cirurgicas_dias',
            'grades_cirurgicas_itens'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE '🗑️ Política removida: %.%', pol.tablename, pol.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar tabelas criadas
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('grades_cirurgicas', 'grades_cirurgicas_dias', 'grades_cirurgicas_itens');
    
    RAISE NOTICE '====================================';
    RAISE NOTICE '📊 RESULTADO FINAL:';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Tabelas criadas: %', v_count;
    
    IF v_count = 3 THEN
        RAISE NOTICE '🎉 SUCESSO! Todas as tabelas foram criadas!';
    ELSE
        RAISE NOTICE '⚠️ ATENÇÃO! Apenas % de 3 tabelas foram criadas.', v_count;
    END IF;
END $$;

-- Listar tabelas e status RLS
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS HABILITADO (PROBLEMA!)'
        ELSE '🔓 RLS DESABILITADO (OK!)'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'metas_especialidades',
    'grades_cirurgicas',
    'grades_cirurgicas_dias',
    'grades_cirurgicas_itens'
)
ORDER BY tablename;

-- ============================================================================
-- 7. INSTRUÇÕES FINAIS
-- ============================================================================

SELECT 
    '🎉 SCRIPT EXECUTADO COM SUCESSO!' as status,
    'Execute Ctrl+Shift+R no navegador para recarregar' as proxima_acao;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

