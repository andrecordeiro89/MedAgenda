-- ============================================================================
-- VERIFICAR E CORRIGIR COLUNAS DE AVALIAÇÃO DO ANESTESISTA
-- ============================================================================
-- Execute este script no SQL Editor do Supabase para diagnosticar e corrigir
-- ============================================================================

-- 1️⃣ VERIFICAR SE AS COLUNAS EXISTEM
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;

-- Se não retornar nada, as colunas NÃO existem. Execute o bloco abaixo:

-- 2️⃣ CRIAR AS COLUNAS (se não existirem)
-- ============================================================================
ALTER TABLE agendamentos 
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista VARCHAR(50),
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_observacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_motivo_reprovacao TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_complementares TEXT,
  ADD COLUMN IF NOT EXISTS avaliacao_anestesista_data TIMESTAMPTZ;

-- Adicionar comentários para documentação
COMMENT ON COLUMN agendamentos.avaliacao_anestesista IS 'Status da avaliação: aprovado, reprovado, complementares, ou null';
COMMENT ON COLUMN agendamentos.avaliacao_anestesista_observacao IS 'Observações sobre a aprovação';
COMMENT ON COLUMN agendamentos.avaliacao_anestesista_motivo_reprovacao IS 'Motivo da reprovação';
COMMENT ON COLUMN agendamentos.avaliacao_anestesista_complementares IS 'Observações complementares';
COMMENT ON COLUMN agendamentos.avaliacao_anestesista_data IS 'Data/hora da avaliação do anestesista';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_avaliacao_anestesista 
  ON agendamentos(avaliacao_anestesista);

-- 3️⃣ VERIFICAR POLÍTICAS RLS (Row Level Security)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'agendamentos'
ORDER BY cmd, policyname;

-- 4️⃣ GARANTIR PERMISSÕES DE UPDATE
-- ============================================================================
-- Se você estiver usando RLS, certifique-se de que há uma política para UPDATE
-- Esta é uma política EXEMPLO - ajuste conforme suas necessidades de segurança:

-- DROP POLICY IF EXISTS "Allow all operations on agendamentos" ON agendamentos;

-- Política permissiva para desenvolvimento (AJUSTE PARA PRODUÇÃO!)
CREATE POLICY IF NOT EXISTS "Allow UPDATE on agendamentos" 
  ON agendamentos 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- OU se você já tem uma política específica, certifique-se que ela permite UPDATE
-- nas novas colunas

-- 5️⃣ TESTAR UPDATE MANUALMENTE
-- ============================================================================
-- Pegue um ID de agendamento existente:
SELECT id, nome_paciente, avaliacao_anestesista 
FROM agendamentos 
LIMIT 5;

-- Teste update em um registro (substitua 'SEU_ID_AQUI' por um ID real):
-- UPDATE agendamentos 
-- SET 
--   avaliacao_anestesista = 'aprovado',
--   avaliacao_anestesista_observacao = 'Teste de observação',
--   avaliacao_anestesista_data = NOW()
-- WHERE id = 'SEU_ID_AQUI';

-- Verificar se funcionou:
-- SELECT 
--   id, 
--   nome_paciente, 
--   avaliacao_anestesista, 
--   avaliacao_anestesista_observacao,
--   avaliacao_anestesista_data
-- FROM agendamentos 
-- WHERE id = 'SEU_ID_AQUI';

-- 6️⃣ VERIFICAR SE HÁ TRIGGERS QUE PODEM ESTAR CAUSANDO PROBLEMAS
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'agendamentos'
ORDER BY trigger_name;

-- 7️⃣ VERIFICAR PERMISSÕES DA TABELA
-- ============================================================================
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'agendamentos';

-- ============================================================================
-- DIAGNÓSTICO COMPLETO
-- ============================================================================
SELECT 
  'Tabela agendamentos existe?' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamentos') 
    THEN '✅ SIM' 
    ELSE '❌ NÃO' 
  END as resultado
UNION ALL
SELECT 
  'Colunas de avaliação existem?' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'agendamentos' 
        AND column_name = 'avaliacao_anestesista'
    ) 
    THEN '✅ SIM' 
    ELSE '❌ NÃO - Execute o passo 2️⃣' 
  END as resultado
UNION ALL
SELECT 
  'RLS está habilitado?' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'agendamentos' 
        AND rowsecurity = true
    ) 
    THEN '✅ SIM - Verifique políticas' 
    ELSE '⚪ NÃO' 
  END as resultado;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Após executar este script, você deve ver:
-- ✅ 5 colunas com nome começando com 'avaliacao_anestesista'
-- ✅ Políticas RLS que permitem UPDATE
-- ✅ Teste de UPDATE funcionando
-- ============================================================================

