-- ============================================================================
-- ADICIONAR CAMPOS HOSPITAL_ID NAS TABELAS EXISTENTES
-- Execute DEPOIS de criar as tabelas hospitais e usuarios
-- ============================================================================

-- IMPORTANTE: Execute este script APENAS DEPOIS de executar create-hospitais-usuarios-only.sql

-- ============================================================================
-- 1. ADICIONAR HOSPITAL_ID NA TABELA MEDICOS
-- ============================================================================

-- Adicionar coluna hospital_id
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Se você quiser atribuir todos os médicos existentes ao primeiro hospital:
-- UPDATE public.medicos 
-- SET hospital_id = (SELECT id FROM public.hospitais LIMIT 1)
-- WHERE hospital_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_medicos_hospital_id ON public.medicos(hospital_id);

-- ============================================================================
-- 2. ADICIONAR HOSPITAL_ID NA TABELA PROCEDIMENTOS
-- ============================================================================

-- Adicionar coluna hospital_id
ALTER TABLE public.procedimentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Se você quiser atribuir todos os procedimentos existentes ao primeiro hospital:
-- UPDATE public.procedimentos 
-- SET hospital_id = (SELECT id FROM public.hospitais LIMIT 1)
-- WHERE hospital_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_procedimentos_hospital_id ON public.procedimentos(hospital_id);

-- ============================================================================
-- 3. ADICIONAR HOSPITAL_ID NA TABELA AGENDAMENTOS
-- ============================================================================

-- Adicionar coluna hospital_id
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Se você quiser atribuir todos os agendamentos existentes ao primeiro hospital:
-- UPDATE public.agendamentos 
-- SET hospital_id = (SELECT id FROM public.hospitais LIMIT 1)
-- WHERE hospital_id IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_agendamentos_hospital_id ON public.agendamentos(hospital_id);

-- ============================================================================
-- 4. VERIFICAÇÃO
-- ============================================================================
SELECT 
    'Campos hospital_id adicionados com sucesso!' as status,
    (SELECT COUNT(*) FROM public.medicos WHERE hospital_id IS NOT NULL) as medicos_com_hospital,
    (SELECT COUNT(*) FROM public.procedimentos WHERE hospital_id IS NOT NULL) as procedimentos_com_hospital,
    (SELECT COUNT(*) FROM public.agendamentos WHERE hospital_id IS NOT NULL) as agendamentos_com_hospital;

-- Verificar estrutura das colunas adicionadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('medicos', 'procedimentos', 'agendamentos')
AND column_name = 'hospital_id'
ORDER BY table_name;
