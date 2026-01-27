-- ============================================
-- FIX: Permissões RLS para tabela agendamentos
-- Projeto: teidsiqsligaksuwmczt
-- ============================================

-- 1. Verificar se RLS está habilitado
-- Se retornar TRUE, o RLS está ativo
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'agendamentos';

-- 2. OPÇÃO A: Desabilitar RLS completamente (mais simples para dev)
-- Use esta opção se o sistema não precisa de controle de acesso por linha
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;

-- 3. OPÇÃO B: Manter RLS e criar políticas permissivas
-- Use esta opção se quiser manter segurança mas permitir acesso
-- (Descomente as linhas abaixo se preferir esta opção)

/*
-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Criar política para SELECT (leitura) - permite anon e authenticated
CREATE POLICY "Permitir leitura de agendamentos" 
ON public.agendamentos 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Criar política para INSERT (criação)
CREATE POLICY "Permitir inserção de agendamentos" 
ON public.agendamentos 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Criar política para UPDATE (atualização)
CREATE POLICY "Permitir atualização de agendamentos" 
ON public.agendamentos 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Criar política para DELETE (exclusão)
CREATE POLICY "Permitir exclusão de agendamentos" 
ON public.agendamentos 
FOR DELETE 
TO anon, authenticated
USING (true);
*/

-- 4. Garantir que o role anon tem permissões na tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;

-- 5. Verificar resultado
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'agendamentos';

