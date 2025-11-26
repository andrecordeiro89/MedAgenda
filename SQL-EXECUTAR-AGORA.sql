-- ============================================================================
-- EXECUTE ESTE SQL PASSO A PASSO
-- ============================================================================
-- Cole APENAS o bloco que está sendo solicitado
-- ============================================================================

-- ============================================================================
-- PASSO 1: Ver se as colunas existem (COLE ISSO PRIMEIRO)
-- ============================================================================
SELECT 
  column_name AS "Coluna", 
  data_type AS "Tipo"
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;

-- Deve mostrar 5 colunas!
-- Se não mostrar, PARE e execute: SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql

-- ============================================================================
-- PASSO 2: Ver se RLS está ativo (COLE ISSO DEPOIS)
-- ============================================================================
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Resultado:
-- Se RLS Ativo = TRUE  → Vá para o PASSO 3
-- Se RLS Ativo = FALSE → Pule para o PASSO 4

-- ============================================================================
-- PASSO 3: DESABILITAR RLS (COLE ISSO SE RLS = TRUE)
-- ============================================================================
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 4: CONFIRMAR QUE RLS FOI DESABILITADO (COLE ISSO)
-- ============================================================================
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo (deve ser FALSE)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Deve mostrar FALSE agora! ✅

-- ============================================================================
-- ✅ PRONTO! AGORA TESTE NA APLICAÇÃO
-- ============================================================================
-- 1. Recarregue a aplicação (F5)
-- 2. Vá na tela Anestesista
-- 3. Tente salvar uma avaliação
-- 4. DEVE FUNCIONAR! 🎉

-- ============================================================================
-- 🔍 EXTRA: Ver agendamentos (OPCIONAL)
-- ============================================================================
SELECT 
  id,
  nome_paciente,
  avaliacao_anestesista
FROM agendamentos 
LIMIT 5;

