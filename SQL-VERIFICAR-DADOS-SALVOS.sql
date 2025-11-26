-- ============================================================================
-- VERIFICAR SE OS DADOS ESTÃO SENDO SALVOS
-- ============================================================================

-- 1️⃣ Ver agendamentos COM avaliação do anestesista
-- ============================================================================
SELECT 
  id,
  nome_paciente,
  avaliacao_anestesista,
  avaliacao_anestesista_observacao,
  avaliacao_anestesista_motivo_reprovacao,
  avaliacao_anestesista_complementares,
  avaliacao_anestesista_data
FROM agendamentos
WHERE avaliacao_anestesista IS NOT NULL
ORDER BY avaliacao_anestesista_data DESC
LIMIT 10;

-- Se retornar dados: UPDATE está funcionando! ✅
-- Se NÃO retornar: UPDATE não está salvando ❌

-- ============================================================================
-- 2️⃣ Verificar RLS novamente
-- ============================================================================
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Se RLS Ativo = TRUE: DESABILITE!
-- Se RLS Ativo = FALSE: O problema é outro

-- ============================================================================
-- 3️⃣ DESABILITAR RLS (SE NECESSÁRIO)
-- ============================================================================
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4️⃣ TESTAR SELECT NOVAMENTE
-- ============================================================================
SELECT 
  id,
  nome_paciente,
  avaliacao_anestesista,
  avaliacao_anestesista_observacao
FROM agendamentos
WHERE avaliacao_anestesista IS NOT NULL
LIMIT 5;

-- Agora deve retornar os dados! ✅

-- ============================================================================
-- 5️⃣ Ver TODOS os campos de avaliação (debug completo)
-- ============================================================================
SELECT 
  id,
  nome_paciente,
  hospital_id,
  avaliacao_anestesista,
  avaliacao_anestesista_observacao,
  avaliacao_anestesista_motivo_reprovacao,
  avaliacao_anestesista_complementares,
  avaliacao_anestesista_data,
  created_at,
  updated_at
FROM agendamentos
WHERE nome_paciente IS NOT NULL
ORDER BY updated_at DESC NULLS LAST
LIMIT 20;

-- Isso mostra os registros mais recentemente atualizados
-- Se você acabou de salvar uma avaliação, deve aparecer no topo!

-- ============================================================================
-- ✅ SOLUÇÃO COMPLETA
-- ============================================================================
-- Execute este bloco completo:

-- Desabilitar RLS
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- Confirmar
SELECT 
  tablename, 
  rowsecurity AS "RLS Desabilitado (deve ser FALSE)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Ver dados salvos
SELECT 
  COUNT(*) AS "Total com avaliação"
FROM agendamentos
WHERE avaliacao_anestesista IS NOT NULL;

-- ============================================================================

