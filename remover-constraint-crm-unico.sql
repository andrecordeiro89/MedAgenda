-- ============================================================================
-- REMOVER CONSTRAINT DE CRM ÚNICO GLOBAL
-- Permite que o mesmo CRM seja cadastrado em hospitais diferentes
-- ============================================================================

-- IMPORTANTE: Execute este script no Supabase para permitir CRMs duplicados

-- 1. Remover constraint de CRM único global
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_crm_key;

-- 2. Remover constraint de EMAIL único global (opcional)
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_email_key;

-- 3. Verificar se as constraints foram removidas
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'medicos'::regclass
AND conname LIKE '%crm%' OR conname LIKE '%email%';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Após executar este script:
-- ✅ Diferentes operadores podem cadastrar o mesmo médico (mesmo CRM)
-- ✅ Dr. André pode ser cadastrado em Apucarana E Santa Mariana
-- ✅ Sistema funciona normalmente, apenas sem validação de CRM único
-- ✅ Cada hospital vê apenas seus próprios médicos

-- ============================================================================
-- OBSERVAÇÕES:
-- ============================================================================
-- - O sistema continuará funcionando normalmente
-- - Cada hospital verá apenas os médicos cadastrados por seus operadores  
-- - O mesmo médico aparecerá como registros separados em hospitais diferentes
-- - Não haverá mais erro de "duplicate key value violates unique constraint"

COMMIT;
