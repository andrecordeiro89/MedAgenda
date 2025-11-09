-- ========================================
-- CONFIGURAR POLÍTICAS DO BUCKET
-- ========================================
-- Execute este script APÓS criar o bucket
-- no Supabase Dashboard → SQL Editor
-- ========================================

-- IMPORTANTE: Substitua 'documentos-medicos' pelo nome exato do seu bucket
-- se for diferente

-- ========================================
-- 1. POLÍTICA PARA UPLOAD (INSERT)
-- ========================================
-- Permite que qualquer pessoa autenticada faça upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-medicos'
);

-- OU para permitir uploads públicos (menos seguro):
-- CREATE POLICY "Allow public uploads"
-- ON storage.objects
-- FOR INSERT
-- TO public
-- WITH CHECK (
--   bucket_id = 'documentos-medicos'
-- );

-- ========================================
-- 2. POLÍTICA PARA LEITURA (SELECT)
-- ========================================
-- Permite que qualquer pessoa leia os arquivos (público)
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documentos-medicos'
);

-- ========================================
-- 3. POLÍTICA PARA ATUALIZAÇÃO (UPDATE)
-- ========================================
-- Permite que pessoas autenticadas atualizem arquivos
CREATE POLICY "Allow authenticated update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos-medicos'
)
WITH CHECK (
  bucket_id = 'documentos-medicos'
);

-- ========================================
-- 4. POLÍTICA PARA EXCLUSÃO (DELETE)
-- ========================================
-- Permite que pessoas autenticadas deletem arquivos
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-medicos'
);

-- ========================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ========================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%documentos-medicos%'
  OR policyname LIKE '%Allow%';

-- ========================================
-- REMOVER POLÍTICAS (se necessário)
-- ========================================
-- Descomente as linhas abaixo se precisar remover as políticas:

-- DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. Se o bucket estiver marcado como "Public" no Dashboard,
--    as políticas acima podem não ser necessárias
--
-- 2. Para maior segurança, use apenas políticas para "authenticated"
--    e implemente autenticação na aplicação
--
-- 3. As políticas acima permitem acesso público à leitura,
--    o que é adequado para documentos médicos com controle
--    de acesso na aplicação

