-- ============================================================================
-- CORRIGIR PERMISSÕES RLS (Row Level Security) - TABELA AGENDAMENTOS
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- 1️⃣ VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Habilitado"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- 2️⃣ VERIFICAR POLÍTICAS EXISTENTES
-- ============================================================================
SELECT 
  policyname AS "Nome da Política",
  cmd AS "Comando",
  permissive AS "Tipo",
  roles AS "Roles"
FROM pg_policies 
WHERE tablename = 'agendamentos'
ORDER BY cmd, policyname;

-- 3️⃣ CRIAR/ATUALIZAR POLÍTICA DE UPDATE
-- ============================================================================
-- OPÇÃO A: Permitir UPDATE para usuários autenticados (RECOMENDADO para desenvolvimento)
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Permitir UPDATE em agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Allow UPDATE on agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON agendamentos;

-- Criar nova política permissiva
CREATE POLICY "Permitir UPDATE em agendamentos para usuários autenticados"
  ON agendamentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4️⃣ GARANTIR POLÍTICA DE SELECT (para ler os dados atualizados)
-- ============================================================================
DROP POLICY IF EXISTS "Permitir SELECT em agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Allow SELECT on agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Enable read access for all users" ON agendamentos;

CREATE POLICY "Permitir SELECT em agendamentos para usuários autenticados"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (true);

-- 5️⃣ VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================================================
SELECT 
  policyname AS "✅ Política Criada",
  cmd AS "Comando",
  permissive AS "Tipo"
FROM pg_policies 
WHERE tablename = 'agendamentos'
  AND cmd IN ('UPDATE', 'SELECT')
ORDER BY cmd, policyname;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Você deve ver pelo menos 2 políticas:
-- 1. Permitir SELECT em agendamentos... | SELECT | PERMISSIVE
-- 2. Permitir UPDATE em agendamentos... | UPDATE | PERMISSIVE
-- ============================================================================

-- 6️⃣ TESTAR UPDATE (OPCIONAL - PARA VALIDAR)
-- ============================================================================
-- Primeiro, pegue um ID real de agendamento:
-- SELECT id, nome_paciente FROM agendamentos LIMIT 1;

-- Depois teste o UPDATE (substitua 'SEU_ID_AQUI' por um ID real):
-- UPDATE agendamentos 
-- SET avaliacao_anestesista = 'aprovado',
--     avaliacao_anestesista_observacao = 'Teste de permissão',
--     avaliacao_anestesista_data = NOW()
-- WHERE id = 'SEU_ID_AQUI'
-- RETURNING id, nome_paciente, avaliacao_anestesista;

-- Se retornar os dados, funcionou! ✅

-- ============================================================================
-- 🔒 PARA PRODUÇÃO: POLÍTICA MAIS RESTRITIVA (OPCIONAL)
-- ============================================================================
-- Se você quiser restringir por hospital_id ou outra condição, use algo assim:
-- 
-- DROP POLICY IF EXISTS "Permitir UPDATE em agendamentos para usuários autenticados" ON agendamentos;
-- 
-- CREATE POLICY "Permitir UPDATE apenas no hospital do usuário"
--   ON agendamentos
--   FOR UPDATE
--   TO authenticated
--   USING (
--     hospital_id IN (
--       SELECT hospital_id FROM usuarios WHERE auth_id = auth.uid()
--     )
--   )
--   WITH CHECK (
--     hospital_id IN (
--       SELECT hospital_id FROM usuarios WHERE auth_id = auth.uid()
--     )
--   );
--
-- ⚠️ ATENÇÃO: Ajuste conforme sua estrutura de permissões!
-- ============================================================================

-- ✅ PRONTO! Agora você pode atualizar os agendamentos sem erros de permissão!

