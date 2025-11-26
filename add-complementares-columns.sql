-- ============================================================================
-- ADICIONAR COLUNAS DE DOCUMENTOS COMPLEMENTARES
-- ============================================================================
-- Este script adiciona as novas colunas para o sistema de documentação complementar
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna complementares_ok (indica se há complementares anexados)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS complementares_ok BOOLEAN DEFAULT false;

-- Adicionar coluna complementares_urls (JSON com URLs dos arquivos)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS complementares_urls TEXT;

-- Adicionar coluna complementares_data (timestamp do upload)
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS complementares_data TIMESTAMPTZ;

-- Comentários das colunas
COMMENT ON COLUMN agendamentos.complementares_ok IS 'Indica se documentos complementares foram anexados';
COMMENT ON COLUMN agendamentos.complementares_urls IS 'JSON array com URLs dos documentos complementares';
COMMENT ON COLUMN agendamentos.complementares_data IS 'Data/hora do upload dos documentos complementares';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
    AND column_name IN ('complementares_ok', 'complementares_urls', 'complementares_data')
ORDER BY column_name;

-- ============================================================================
-- ATUALIZAR POLÍTICAS RLS (se necessário)
-- ============================================================================
-- Se você tiver Row Level Security habilitado, as novas colunas já estarão
-- cobertas pelas políticas existentes. Não é necessário criar políticas novas.

-- ============================================================================
-- EXEMPLO DE ATUALIZAÇÃO
-- ============================================================================
-- UPDATE agendamentos
-- SET 
--     complementares_ok = true,
--     complementares_urls = '["url1", "url2"]',
--     complementares_data = NOW()
-- WHERE id = 'seu-id-aqui';

-- ============================================================================
-- FINALIZADO
-- ============================================================================
SELECT '✅ Colunas de complementares adicionadas com sucesso!' AS resultado;

