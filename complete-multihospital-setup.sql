-- ============================================================================
-- SETUP COMPLETO MULTI-HOSPITALAR - CONECTAR DADOS EXISTENTES
-- Execute no Supabase após criar as tabelas hospitais e usuarios
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR CAMPOS HOSPITAL_ID NAS TABELAS EXISTENTES
-- ============================================================================

-- Adicionar hospital_id na tabela medicos
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Adicionar hospital_id na tabela procedimentos  
ALTER TABLE public.procedimentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Adicionar hospital_id na tabela agendamentos
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. ATRIBUIR HOSPITAL SÃO PAULO A TODOS OS DADOS EXISTENTES
-- ============================================================================

-- Atribuir todos os médicos existentes ao Hospital São Paulo
UPDATE public.medicos 
SET hospital_id = (SELECT id FROM public.hospitais WHERE nome = 'Hospital São Paulo')
WHERE hospital_id IS NULL;

-- Atribuir todos os procedimentos existentes ao Hospital São Paulo
UPDATE public.procedimentos 
SET hospital_id = (SELECT id FROM public.hospitais WHERE nome = 'Hospital São Paulo')
WHERE hospital_id IS NULL;

-- Atribuir todos os agendamentos existentes ao Hospital São Paulo
UPDATE public.agendamentos 
SET hospital_id = (SELECT id FROM public.hospitais WHERE nome = 'Hospital São Paulo')
WHERE hospital_id IS NULL;

-- ============================================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_medicos_hospital_id ON public.medicos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_hospital_id ON public.procedimentos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_hospital_id ON public.agendamentos(hospital_id);

-- ============================================================================
-- 4. REMOVER CAMPO HORARIO (CONFORME SOLICITADO ANTERIORMENTE)
-- ============================================================================

-- PRIMEIRO: Remover views que dependem da coluna horario
DROP VIEW IF EXISTS public.agendamentos_completos CASCADE;
DROP VIEW IF EXISTS public.estatisticas_dashboard CASCADE;

-- Remover constraint unique que pode incluir horario
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_medico_id_data_agendamento_horario_key;

-- Remover coluna horario
ALTER TABLE public.agendamentos 
DROP COLUMN IF EXISTS horario CASCADE;

-- Adicionar nova constraint unique sem horario (apenas médico + data)
ALTER TABLE public.agendamentos 
ADD CONSTRAINT agendamentos_medico_id_data_agendamento_key 
UNIQUE(medico_id, data_agendamento);

-- ============================================================================
-- 5. CRIAR VIEW PARA CONSULTAS COMPLETAS
-- ============================================================================
CREATE OR REPLACE VIEW public.agendamentos_completos AS
SELECT 
    a.id,
    a.nome_paciente,
    a.data_nascimento,
    EXTRACT(YEAR FROM AGE(a.data_nascimento)) AS idade,
    a.cidade_natal,
    a.telefone,
    a.whatsapp,
    a.data_agendamento,
    -- horario removido
    a.status_liberacao,
    a.medico_id,
    a.procedimento_id,
    a.hospital_id,
    m.nome AS medico_nome,
    m.especialidade AS medico_especialidade,
    p.nome AS procedimento_nome,
    p.tipo AS procedimento_tipo,
    p.duracao_estimada_min,
    h.nome AS hospital_nome,
    h.cidade AS hospital_cidade,
    h.cnpj AS hospital_cnpj,
    a.created_at
FROM public.agendamentos a
JOIN public.medicos m ON a.medico_id = m.id
JOIN public.procedimentos p ON a.procedimento_id = p.id
JOIN public.hospitais h ON a.hospital_id = h.id;

-- ============================================================================
-- 6. CRIAR VIEW DE ESTATÍSTICAS POR HOSPITAL
-- ============================================================================
CREATE OR REPLACE VIEW public.estatisticas_por_hospital AS
SELECT 
    h.id as hospital_id,
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj,
    COUNT(DISTINCT m.id) as total_medicos,
    COUNT(DISTINCT p.id) as total_procedimentos,
    COUNT(DISTINCT a.id) as total_agendamentos,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'liberado' THEN a.id END) as agendamentos_liberados,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'pendente' THEN a.id END) as agendamentos_pendentes,
    COUNT(DISTINCT u.id) as total_usuarios
FROM public.hospitais h
LEFT JOIN public.medicos m ON h.id = m.hospital_id
LEFT JOIN public.procedimentos p ON h.id = p.hospital_id
LEFT JOIN public.agendamentos a ON h.id = a.hospital_id
LEFT JOIN public.usuarios u ON h.id = u.hospital_id
GROUP BY h.id, h.nome, h.cidade, h.cnpj
ORDER BY h.nome;

-- ============================================================================
-- 7. INSERIR DADOS ADICIONAIS PARA OUTROS HOSPITAIS (EXEMPLO)
-- ============================================================================

-- Inserir um médico no Hospital Rio de Janeiro
INSERT INTO public.medicos (nome, especialidade, crm, telefone, email, hospital_id)
SELECT 
    'Dr. Roberto Silva',
    'Cardiologia',
    '54321-RJ',
    '(21) 98765-4321',
    'roberto.silva@hospitalrio.com',
    h.id
FROM public.hospitais h 
WHERE h.nome = 'Hospital Rio de Janeiro'
ON CONFLICT DO NOTHING;

-- Inserir um procedimento no Hospital Rio de Janeiro
INSERT INTO public.procedimentos (nome, tipo, duracao_estimada_min, descricao, hospital_id)
SELECT 
    'Consulta Cardiológica',
    'ambulatorial',
    45,
    'Consulta especializada em cardiologia',
    h.id
FROM public.hospitais h 
WHERE h.nome = 'Hospital Rio de Janeiro'
ON CONFLICT DO NOTHING;

-- Inserir um médico no Hospital Belo Horizonte
INSERT INTO public.medicos (nome, especialidade, crm, telefone, email, hospital_id)
SELECT 
    'Dra. Fernanda Costa',
    'Neurologia',
    '67890-MG',
    '(31) 95678-1234',
    'fernanda.costa@hospitalbh.com',
    h.id
FROM public.hospitais h 
WHERE h.nome = 'Hospital Belo Horizonte'
ON CONFLICT DO NOTHING;

-- Inserir um procedimento no Hospital Belo Horizonte
INSERT INTO public.procedimentos (nome, tipo, duracao_estimada_min, descricao, hospital_id)
SELECT 
    'Exame Neurológico',
    'ambulatorial',
    60,
    'Avaliação neurológica completa',
    h.id
FROM public.hospitais h 
WHERE h.nome = 'Hospital Belo Horizonte'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. VERIFICAÇÃO FINAL COMPLETA
-- ============================================================================
SELECT 
    '🎉 SISTEMA MULTI-HOSPITALAR CONFIGURADO COM SUCESSO! 🎉' as status;

-- Estatísticas por hospital
SELECT 
    '📊 ESTATÍSTICAS POR HOSPITAL:' as info,
    hospital_nome,
    total_medicos,
    total_procedimentos,
    total_agendamentos,
    total_usuarios
FROM public.estatisticas_por_hospital;

-- Verificar estrutura das tabelas
SELECT 
    '🏗️ ESTRUTURA DAS TABELAS:' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('hospitais', 'usuarios', 'medicos', 'procedimentos', 'agendamentos')
AND column_name IN ('hospital_id', 'horario')
ORDER BY table_name, column_name;

-- Testar consulta completa
SELECT 
    '🔍 TESTE DE CONSULTA COMPLETA:' as info,
    COUNT(*) as total_agendamentos_com_detalhes
FROM public.agendamentos_completos;

-- ============================================================================
-- 9. PRÓXIMOS PASSOS
-- ============================================================================
SELECT 
    '📋 PRÓXIMOS PASSOS:' as info,
    '1. Testar APIs do backend' as passo_1,
    '2. Implementar login no frontend' as passo_2,
    '3. Adicionar filtros por hospital' as passo_3,
    'Sistema pronto para uso! 🚀' as status_final;
