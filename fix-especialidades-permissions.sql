-- ============================================================================
-- CORREÇÃO DE PERMISSÕES DA TABELA ESPECIALIDADES
-- Resolve o erro 401 Unauthorized ao buscar especialidades
-- ============================================================================

-- 1. Verificar se a tabela existe
SELECT 'Verificando tabela especialidades...' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'especialidades';

-- 2. Verificar configuração atual de RLS
SELECT 
    'Configuração RLS atual:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'especialidades';

-- 3. Desabilitar RLS para a tabela especialidades (especialidades são globais)
ALTER TABLE especialidades DISABLE ROW LEVEL SECURITY;

-- 4. Garantir que a tabela seja acessível para usuários autenticados
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Especialidades são visíveis para todos" ON especialidades;
DROP POLICY IF EXISTS "Permitir leitura de especialidades" ON especialidades;
DROP POLICY IF EXISTS "Enable read access for all users" ON especialidades;

-- 5. Criar política simples para leitura (caso RLS seja reabilitado no futuro)
CREATE POLICY "Permitir leitura de especialidades para todos"
ON especialidades FOR SELECT
USING (true);

-- 6. Garantir permissões para usuários autenticados
GRANT SELECT ON especialidades TO authenticated;
GRANT SELECT ON especialidades TO anon;

-- 7. Verificar se há dados na tabela
SELECT 
    'Dados na tabela:' as info,
    count(*) as total_especialidades
FROM especialidades;

-- 8. Listar algumas especialidades para confirmar
SELECT 'Especialidades disponíveis (primeiras 10):' as info;
SELECT nome FROM especialidades ORDER BY nome LIMIT 10;

-- 9. Testar acesso direto
SELECT 'Teste de acesso direto:' as info;
SELECT 
    id,
    nome,
    created_at
FROM especialidades 
ORDER BY nome 
LIMIT 5;

-- 10. Verificar configuração final
SELECT 
    'Configuração final:' as status,
    (SELECT count(*) FROM especialidades) as total_especialidades,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'especialidades') as rls_habilitado;

SELECT 'CORREÇÃO DE PERMISSÕES CONCLUÍDA!' as resultado;
