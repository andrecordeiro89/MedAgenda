-- ============================================
-- FUNÇÃO RPC OTIMIZADA PARA SIGTAP ÚNICOS
-- ============================================
-- Esta função deve ser criada no Supabase para máxima performance
-- com tabelas de +100k registros

-- Criar função para buscar procedimentos únicos com paginação
CREATE OR REPLACE FUNCTION get_unique_sigtap_procedures(
    page_num INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 100,
    search_term TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    total_count INTEGER;
    offset_val INTEGER;
BEGIN
    -- Calcular offset
    offset_val := (page_num - 1) * page_size;
    
    -- Contar total de registros únicos
    IF search_term IS NOT NULL AND search_term != '' THEN
        SELECT COUNT(DISTINCT code) INTO total_count
        FROM sigtap_procedures
        WHERE code ILIKE '%' || search_term || '%'
           OR name ILIKE '%' || search_term || '%'
           OR description ILIKE '%' || search_term || '%';
    ELSE
        SELECT COUNT(DISTINCT code) INTO total_count
        FROM sigtap_procedures;
    END IF;
    
    -- Buscar dados únicos com paginação
    WITH unique_procedures AS (
        SELECT DISTINCT ON (code) *
        FROM sigtap_procedures
        WHERE 
            CASE 
                WHEN search_term IS NOT NULL AND search_term != '' THEN
                    (code ILIKE '%' || search_term || '%'
                     OR name ILIKE '%' || search_term || '%'
                     OR description ILIKE '%' || search_term || '%')
                ELSE TRUE
            END
        ORDER BY code, created_at DESC
    )
    SELECT json_build_object(
        'data', COALESCE(json_agg(up.*), '[]'::json),
        'total_count', total_count,
        'page', page_num,
        'page_size', page_size,
        'total_pages', CEIL(total_count::FLOAT / page_size)
    ) INTO result
    FROM (
        SELECT * FROM unique_procedures
        ORDER BY code
        LIMIT page_size OFFSET offset_val
    ) up;
    
    RETURN result;
END;
$$;

-- Dar permissões para usuários anônimos (ajustar conforme sua política de segurança)
GRANT EXECUTE ON FUNCTION get_unique_sigtap_procedures TO anon;
GRANT EXECUTE ON FUNCTION get_unique_sigtap_procedures TO authenticated;

-- ============================================
-- FUNÇÃO AUXILIAR PARA CONTAR ÚNICOS
-- ============================================
CREATE OR REPLACE FUNCTION count_unique_sigtap_codes()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    unique_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT code) INTO unique_count
    FROM sigtap_procedures
    WHERE code IS NOT NULL AND code != '';
    
    RETURN unique_count;
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION count_unique_sigtap_codes TO anon;
GRANT EXECUTE ON FUNCTION count_unique_sigtap_codes TO authenticated;

-- ============================================
-- EXEMPLO DE USO
-- ============================================
-- Buscar primeira página (100 registros)
-- SELECT get_unique_sigtap_procedures(1, 100, NULL);

-- Buscar segunda página com filtro
-- SELECT get_unique_sigtap_procedures(2, 100, 'cirurgia');

-- Contar total de códigos únicos
-- SELECT count_unique_sigtap_codes();

-- ============================================
-- INSTRUÇÕES PARA IMPLEMENTAR
-- ============================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole este código SQL
-- 4. Execute o script
-- 5. A função estará disponível via .rpc() no JavaScript

-- ============================================
-- VERIFICAR SE FUNÇÃO EXISTE
-- ============================================
-- SELECT EXISTS (
--     SELECT 1 
--     FROM pg_proc 
--     WHERE proname = 'get_unique_sigtap_procedures'
-- );
