-- ============================================================================
-- SCRIPT DE CORREÇÃO: Políticas RLS para Metas e Grades Cirúrgicas
-- Execute este script para corrigir os erros 401 de permissão
-- ============================================================================

-- ============================================================================
-- CORRIGIR POLÍTICAS DE metas_especialidades
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir inserção de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir atualização de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir exclusão de metas" ON metas_especialidades;

-- Criar políticas mais permissivas (especificando roles explicitamente)
CREATE POLICY "Permitir leitura de metas" ON metas_especialidades
FOR SELECT 
TO public
USING (true);

CREATE POLICY "Permitir inserção de metas" ON metas_especialidades
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização de metas" ON metas_especialidades
FOR UPDATE 
TO public
USING (true);

CREATE POLICY "Permitir exclusão de metas" ON metas_especialidades
FOR DELETE 
TO public
USING (true);

-- ============================================================================
-- CORRIGIR POLÍTICAS DE grades_cirurgicas
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir inserção de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir atualização de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir exclusão de grades" ON grades_cirurgicas;

-- Criar políticas mais permissivas (especificando roles explicitamente)
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

-- ============================================================================
-- CORRIGIR POLÍTICAS DE grades_cirurgicas_dias
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir inserção de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir atualização de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir exclusão de dias" ON grades_cirurgicas_dias;

-- Criar políticas mais permissivas (especificando roles explicitamente)
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

-- ============================================================================
-- CORRIGIR POLÍTICAS DE grades_cirurgicas_itens
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir inserção de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir exclusão de itens" ON grades_cirurgicas_itens;

-- Criar políticas mais permissivas (especificando roles explicitamente)
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
-- VERIFICAR CONFIGURAÇÕES RLS
-- ============================================================================

-- Listar todas as políticas criadas (para verificação)
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
WHERE tablename IN ('metas_especialidades', 'grades_cirurgicas', 'grades_cirurgicas_dias', 'grades_cirurgicas_itens')
ORDER BY tablename, policyname;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

