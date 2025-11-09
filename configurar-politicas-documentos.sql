-- ========================================
-- CONFIGURAR POLÍTICAS DO BUCKET "Documentos"
-- ========================================
-- Execute este script no Supabase Dashboard → SQL Editor
-- ========================================

-- IMPORTANTE: Este script configura políticas para permitir
-- upload, leitura e exclusão de arquivos no bucket "Documentos"

-- ========================================
-- 1. VERIFICAR SE O BUCKET EXISTE
-- ========================================
-- Execute primeiro para verificar se o bucket está criado:
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'Documentos';

-- Se não retornar nenhuma linha, o bucket não existe ou tem nome diferente

-- ========================================
-- 2. POLÍTICA PARA UPLOAD (INSERT)
-- ========================================
-- Permite que qualquer pessoa faça upload (público)
-- Se quiser apenas autenticados, troque 'public' por 'authenticated'
CREATE POLICY "Allow public uploads to Documentos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'Documentos'
);

-- ========================================
-- 3. POLÍTICA PARA LEITURA (SELECT)
-- ========================================
-- Permite que qualquer pessoa leia os arquivos (público)
CREATE POLICY "Allow public read from Documentos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Documentos'
);

-- ========================================
-- 4. POLÍTICA PARA ATUALIZAÇÃO (UPDATE)
-- ========================================
-- Permite que qualquer pessoa atualize arquivos (público)
CREATE POLICY "Allow public update in Documentos"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'Documentos'
)
WITH CHECK (
  bucket_id = 'Documentos'
);

-- ========================================
-- 5. POLÍTICA PARA EXCLUSÃO (DELETE)
-- ========================================
-- Permite que qualquer pessoa delete arquivos (público)
CREATE POLICY "Allow public delete from Documentos"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'Documentos'
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
  AND policyname LIKE '%Documentos%';

-- ========================================
-- REMOVER POLÍTICAS ANTIGAS (se necessário)
-- ========================================
-- Se precisar remover políticas existentes, descomente:

-- DROP POLICY IF EXISTS "Allow public uploads to Documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public read from Documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public update in Documentos" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public delete from Documentos" ON storage.objects;

-- ========================================
-- ALTERNATIVA: DESABILITAR RLS (NÃO RECOMENDADO)
-- ========================================
-- Se as políticas acima não funcionarem, você pode desabilitar RLS
-- (NÃO RECOMENDADO para produção):
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. As políticas acima permitem acesso PÚBLICO ao bucket
--    Isso significa que qualquer pessoa pode fazer upload/leitura
--    Se precisar de mais segurança, use 'authenticated' ao invés de 'public'
--
-- 2. Para maior segurança, você pode criar políticas mais restritas:
--    - Apenas usuários autenticados podem fazer upload
--    - Apenas usuários autenticados podem deletar
--    - Qualquer pessoa pode ler (para visualizar documentos)
--
-- 3. Se o bucket estiver marcado como "Public" no Dashboard,
--    essas políticas ainda são necessárias para permitir uploads

