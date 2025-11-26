-- ============================================================================
-- SOLUÇÃO RÁPIDA: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================================================
-- ⚠️ USE APENAS EM DESENVOLVIMENTO! NÃO USE EM PRODUÇÃO!
-- ============================================================================
-- Esta é a solução mais RÁPIDA para testar se funciona
-- Desabilita a segurança RLS na tabela agendamentos
-- ============================================================================

-- DESABILITAR RLS (Row Level Security)
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- VERIFICAR SE FOI DESABILITADO
SELECT 
  tablename AS "Tabela",
  rowsecurity AS "RLS Ativo (deve ser FALSE agora)"
FROM pg_tables 
WHERE tablename = 'agendamentos';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Tabela      | RLS Ativo
-- agendamentos | false      ← Deve aparecer FALSE
-- ============================================================================

-- ✅ PRONTO! Agora teste na aplicação!

-- ============================================================================
-- 🔄 PARA REABILITAR RLS DEPOIS (QUANDO FOR PARA PRODUÇÃO):
-- ============================================================================
-- ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
-- 
-- E então execute o script: SQL-CORRIGIR-PERMISSOES-RLS.sql
-- para criar as políticas corretas
-- ============================================================================

