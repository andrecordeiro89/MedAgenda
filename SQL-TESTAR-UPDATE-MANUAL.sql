-- ============================================================================
-- TESTAR UPDATE MANUAL - DIAGNÓSTICO COMPLETO
-- ============================================================================
-- Execute este script linha por linha para diagnosticar o problema
-- ============================================================================

-- 1️⃣ VERIFICAR SE AS COLUNAS EXISTEM
-- ============================================================================
SELECT 
  column_name AS "✅ Coluna", 
  data_type AS "Tipo"
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;

-- Deve mostrar 5 colunas!
-- Se não mostrar, execute: SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql

-- ============================================================================

-- 2️⃣ VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo (true/false)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Se RLS Ativo = true, você precisa criar políticas OU desabilitar RLS
-- Se RLS Ativo = false, o UPDATE deveria funcionar

-- ============================================================================

-- 3️⃣ VER POLÍTICAS EXISTENTES (se RLS está ativo)
-- ============================================================================
SELECT 
  policyname AS "Nome da Política",
  cmd AS "Comando (SELECT/UPDATE/INSERT/DELETE)",
  permissive AS "Tipo",
  roles AS "Roles",
  qual AS "Condição USING",
  with_check AS "Condição WITH CHECK"
FROM pg_policies 
WHERE tablename = 'agendamentos'
ORDER BY cmd, policyname;

-- Se não houver política de UPDATE, você precisa criar!

-- ============================================================================

-- 4️⃣ LISTAR ALGUNS AGENDAMENTOS PARA PEGAR UM ID REAL
-- ============================================================================
SELECT 
  id,
  nome_paciente,
  hospital_id,
  avaliacao_anestesista
FROM agendamentos 
LIMIT 5;

-- COPIE um ID daqui para usar no teste abaixo

-- ============================================================================

-- 5️⃣ TESTAR UPDATE MANUAL (substitua 'COLE_UM_ID_AQUI' por um ID real)
-- ============================================================================
-- ⚠️ ATENÇÃO: Substitua 'COLE_UM_ID_AQUI' por um ID real da consulta acima!

UPDATE agendamentos 
SET 
  avaliacao_anestesista = 'aprovado',
  avaliacao_anestesista_observacao = 'Teste manual de UPDATE',
  avaliacao_anestesista_data = NOW()
WHERE id = 'COLE_UM_ID_AQUI'
RETURNING id, nome_paciente, avaliacao_anestesista, avaliacao_anestesista_observacao;

-- ============================================================================
-- RESULTADOS POSSÍVEIS:
-- ============================================================================
-- ✅ Se RETORNAR dados: UPDATE funcionou! Problema está no código da aplicação
-- ❌ Se NÃO RETORNAR nada: Problema de permissão RLS ou ID inválido
-- ❌ Se der ERRO: Leia a mensagem de erro

-- ============================================================================

-- 6️⃣ SE O UPDATE MANUAL NÃO FUNCIONAR, DESABILITE O RLS
-- ============================================================================
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- Agora tente o UPDATE novamente (passo 5)

-- ============================================================================

-- 7️⃣ VERIFICAR SE O RLS FOI DESABILITADO
-- ============================================================================
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo (deve ser FALSE agora)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- Se rowsecurity = false, o RLS está desabilitado ✅

-- ============================================================================

-- 8️⃣ TESTAR UPDATE NOVAMENTE COM RLS DESABILITADO
-- ============================================================================
-- ⚠️ Substitua 'COLE_UM_ID_AQUI' por um ID real!

UPDATE agendamentos 
SET 
  avaliacao_anestesista = 'complementares',
  avaliacao_anestesista_complementares = 'Teste após desabilitar RLS',
  avaliacao_anestesista_data = NOW()
WHERE id = 'COLE_UM_ID_AQUI'
RETURNING id, nome_paciente, avaliacao_anestesista, avaliacao_anestesista_complementares;

-- Se funcionar agora, o problema ERA o RLS!

-- ============================================================================

-- 9️⃣ VER TODOS OS AGENDAMENTOS COM AVALIAÇÃO
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

-- Deve mostrar os registros que você acabou de atualizar

-- ============================================================================
-- 🎯 DIAGNÓSTICO FINAL
-- ============================================================================
--
-- SE O UPDATE MANUAL FUNCIONOU COM RLS DESABILITADO:
-- ✅ Problema: RLS estava bloqueando
-- ✅ Solução: Mantenha RLS desabilitado OU crie políticas corretas
--
-- SE O UPDATE MANUAL NÃO FUNCIONOU MESMO COM RLS DESABILITADO:
-- ❌ Problema: Colunas não existem OU ID inválido
-- ❌ Solução: Execute SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql
--
-- ============================================================================

