-- ============================================================================
-- RESTAURAR MODELO SIMPLES - VOLTAR AO QUE FUNCIONAVA
-- ============================================================================

-- 1. ADICIONAR COLUNA hospital_id DE VOLTA NA TABELA MEDICOS
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitais(id);

-- 2. MIGRAR DADOS DA TABELA medico_hospital DE VOLTA PARA medicos.hospital_id
UPDATE medicos 
SET hospital_id = mh.hospital_id
FROM medico_hospital mh 
WHERE medicos.id = mh.medico_id 
AND mh.ativo = true
AND medicos.hospital_id IS NULL;

-- 3. REMOVER CONSTRAINT DE CRM ÚNICO (PRINCIPAL OBJETIVO)
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_crm_key;
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_email_key;

-- 4. VERIFICAR RESULTADO
SELECT 
    COUNT(*) as total_medicos,
    COUNT(hospital_id) as medicos_com_hospital,
    COUNT(*) - COUNT(hospital_id) as medicos_sem_hospital
FROM medicos;

-- 5. VER ALGUNS EXEMPLOS
SELECT id, nome, crm, hospital_id FROM medicos LIMIT 5;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Coluna hospital_id restaurada na tabela medicos
-- ✅ Dados migrados de volta da tabela medico_hospital  
-- ✅ Constraint de CRM único removida
-- ✅ Sistema funciona como antes, mas permite CRM duplicado entre hospitais
-- ✅ Operadores podem cadastrar mesmo médico em hospitais diferentes

COMMIT;
