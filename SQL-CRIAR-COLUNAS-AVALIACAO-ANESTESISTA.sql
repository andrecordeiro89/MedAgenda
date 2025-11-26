-- ============================================================================
-- CRIAR COLUNAS DE AVALIAÇÃO DO ANESTESISTA
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- 1️⃣ CRIAR AS 5 COLUNAS NOVAS
-- ============================================================================
ALTER TABLE agendamentos 
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista VARCHAR(50),
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_observacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_motivo_reprovacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_complementares TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_data TIMESTAMPTZ;

-- 2️⃣ ADICIONAR COMENTÁRIOS (Documentação)
-- ============================================================================
COMMENT ON COLUMN agendamentos.avaliacao_anestesista 
  IS 'Status da avaliação do anestesista: aprovado, reprovado, complementares, ou null';

COMMENT ON COLUMN agendamentos.avaliacao_anestesista_observacao 
  IS 'Observações sobre a aprovação do anestesista';

COMMENT ON COLUMN agendamentos.avaliacao_anestesista_motivo_reprovacao 
  IS 'Motivo da reprovação pelo anestesista';

COMMENT ON COLUMN agendamentos.avaliacao_anestesista_complementares 
  IS 'Observações complementares do anestesista';

COMMENT ON COLUMN agendamentos.avaliacao_anestesista_data 
  IS 'Data e hora em que a avaliação foi realizada';

-- 3️⃣ CRIAR ÍNDICE PARA MELHOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_avaliacao_anestesista 
  ON agendamentos(avaliacao_anestesista);

-- 4️⃣ VERIFICAR SE AS COLUNAS FORAM CRIADAS
-- ============================================================================
SELECT 
  column_name AS "Coluna", 
  data_type AS "Tipo", 
  is_nullable AS "Aceita NULL",
  column_default AS "Valor Padrão"
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Você deve ver 5 linhas:
-- 1. avaliacao_anestesista               | VARCHAR(50)  | YES | NULL
-- 2. avaliacao_anestesista_observacao    | TEXT         | YES | NULL
-- 3. avaliacao_anestesista_motivo_reprovacao | TEXT     | YES | NULL
-- 4. avaliacao_anestesista_complementares    | TEXT     | YES | NULL
-- 5. avaliacao_anestesista_data              | TIMESTAMPTZ | YES | NULL
-- ============================================================================

-- ✅ PRONTO! Agora você pode usar a funcionalidade de avaliação do anestesista!

