-- ============================================================================
-- MIGRAÇÃO SUPABASE: SISTEMA SIMPLES → SISTEMA MULTI-HOSPITALAR
-- MedAgenda - Versão 2.0
-- ============================================================================

-- IMPORTANTE: Execute este script no Supabase para migrar para multi-hospitalar
-- Este script preserva todos os dados existentes

BEGIN;

-- ============================================================================
-- 1. CRIAR TABELAS HOSPITAIS E USUARIOS
-- ============================================================================

-- Criar tabela hospitais
CREATE TABLE IF NOT EXISTS public.hospitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hospital_id UUID NOT NULL REFERENCES public.hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INSERIR HOSPITAL PADRÃO PARA DADOS EXISTENTES
-- ============================================================================

-- Inserir hospital padrão para migrar dados existentes
INSERT INTO public.hospitais (id, nome, cidade, cnpj) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Hospital Principal', 
    'São Paulo', 
    '00.000.000/0001-00'
) ON CONFLICT (cnpj) DO NOTHING;

-- ============================================================================
-- 3. ADICIONAR CAMPOS HOSPITAL_ID NAS TABELAS EXISTENTES
-- ============================================================================

-- Adicionar hospital_id na tabela medicos
ALTER TABLE public.medicos 
ADD COLUMN IF NOT EXISTS hospital_id UUID 
REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Atualizar médicos existentes com hospital padrão
UPDATE public.medicos 
SET hospital_id = '00000000-0000-0000-0000-000000000001'
WHERE hospital_id IS NULL;

-- Tornar hospital_id obrigatório
ALTER TABLE public.medicos 
ALTER COLUMN hospital_id SET NOT NULL;

-- Adicionar hospital_id na tabela procedimentos
ALTER TABLE public.procedimentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID 
REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Atualizar procedimentos existentes com hospital padrão
UPDATE public.procedimentos 
SET hospital_id = '00000000-0000-0000-0000-000000000001'
WHERE hospital_id IS NULL;

-- Tornar hospital_id obrigatório
ALTER TABLE public.procedimentos 
ALTER COLUMN hospital_id SET NOT NULL;

-- Adicionar hospital_id na tabela agendamentos
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS hospital_id UUID 
REFERENCES public.hospitais(id) ON DELETE CASCADE;

-- Atualizar agendamentos existentes com hospital padrão
UPDATE public.agendamentos 
SET hospital_id = '00000000-0000-0000-0000-000000000001'
WHERE hospital_id IS NULL;

-- Tornar hospital_id obrigatório
ALTER TABLE public.agendamentos 
ALTER COLUMN hospital_id SET NOT NULL;

-- ============================================================================
-- 4. REMOVER CAMPO HORARIO (CONFORME SOLICITADO)
-- ============================================================================

-- Remover constraint unique que inclui horario
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_medico_id_data_agendamento_horario_key;

-- Remover coluna horario
ALTER TABLE public.agendamentos 
DROP COLUMN IF EXISTS horario;

-- Adicionar nova constraint unique sem horario
ALTER TABLE public.agendamentos 
ADD CONSTRAINT agendamentos_medico_id_data_agendamento_key 
UNIQUE(medico_id, data_agendamento);

-- ============================================================================
-- 5. ATUALIZAR CONSTRAINTS PARA MULTI-HOSPITALAR
-- ============================================================================

-- Remover constraints únicas globais
ALTER TABLE public.medicos DROP CONSTRAINT IF EXISTS medicos_crm_key;
ALTER TABLE public.medicos DROP CONSTRAINT IF EXISTS medicos_email_key;
ALTER TABLE public.procedimentos DROP CONSTRAINT IF EXISTS procedimentos_nome_key;

-- Adicionar constraints únicas por hospital
ALTER TABLE public.medicos 
ADD CONSTRAINT medicos_crm_hospital_key UNIQUE(crm, hospital_id);

ALTER TABLE public.medicos 
ADD CONSTRAINT medicos_email_hospital_key UNIQUE(email, hospital_id);

ALTER TABLE public.procedimentos 
ADD CONSTRAINT procedimentos_nome_hospital_key UNIQUE(nome, hospital_id);

-- ============================================================================
-- 6. CRIAR ÍNDICES PARA OTIMIZAÇÃO
-- ============================================================================

-- Índices para hospitais
CREATE INDEX IF NOT EXISTS idx_hospitais_cnpj ON public.hospitais(cnpj);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_hospital_id ON public.usuarios(hospital_id);

-- Índices para hospital_id nas tabelas existentes
CREATE INDEX IF NOT EXISTS idx_medicos_hospital_id ON public.medicos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_hospital_id ON public.procedimentos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_hospital_id ON public.agendamentos(hospital_id);

-- ============================================================================
-- 7. ATUALIZAR TRIGGERS PARA NOVAS TABELAS
-- ============================================================================

-- Triggers para hospitais
CREATE TRIGGER update_hospitais_updated_at 
    BEFORE UPDATE ON public.hospitais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para usuarios
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INSERIR DADOS DE EXEMPLO PARA MULTI-HOSPITALAR
-- ============================================================================

-- Inserir hospitais adicionais
INSERT INTO public.hospitais (nome, cidade, cnpj) VALUES
    ('Hospital São Paulo', 'São Paulo', '11.222.333/0001-44'),
    ('Hospital Rio de Janeiro', 'Rio de Janeiro', '22.333.444/0001-55'),
    ('Hospital Belo Horizonte', 'Belo Horizonte', '33.444.555/0001-66')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir usuários de exemplo
INSERT INTO public.usuarios (email, hospital_id) VALUES
    ('admin@hospitalprincipal.com', '00000000-0000-0000-0000-000000000001'),
    ('admin@hospitalsaopaulo.com', (SELECT id FROM public.hospitais WHERE cnpj = '11.222.333/0001-44')),
    ('recepcionista@hospitalsaopaulo.com', (SELECT id FROM public.hospitais WHERE cnpj = '11.222.333/0001-44')),
    ('admin@hospitalrio.com', (SELECT id FROM public.hospitais WHERE cnpj = '22.333.444/0001-55')),
    ('coordenador@hospitalbh.com', (SELECT id FROM public.hospitais WHERE cnpj = '33.444.555/0001-66'))
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 9. ATUALIZAR VIEWS EXISTENTES
-- ============================================================================

-- Atualizar view agendamentos_completos (remover horario, adicionar hospital)
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
    a.created_at,
    a.updated_at
FROM public.agendamentos a
JOIN public.medicos m ON a.medico_id = m.id
JOIN public.procedimentos p ON a.procedimento_id = p.id
JOIN public.hospitais h ON a.hospital_id = h.id;

-- Atualizar view de estatísticas
CREATE OR REPLACE VIEW public.estatisticas_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM public.agendamentos) AS total_agendamentos,
    (SELECT COUNT(*) FROM public.agendamentos WHERE status_liberacao = 'pendente') AS pendentes,
    (SELECT COUNT(*) FROM public.agendamentos WHERE status_liberacao = 'liberado') AS liberados,
    (SELECT COUNT(*) FROM public.agendamentos a JOIN public.procedimentos p ON a.procedimento_id = p.id WHERE p.tipo = 'cirurgico') AS cirurgicos,
    (SELECT COUNT(*) FROM public.agendamentos a JOIN public.procedimentos p ON a.procedimento_id = p.id WHERE p.tipo = 'ambulatorial') AS ambulatoriais,
    (SELECT COUNT(*) FROM public.medicos) AS total_medicos,
    (SELECT COUNT(*) FROM public.procedimentos) AS total_procedimentos,
    (SELECT COUNT(*) FROM public.hospitais) AS total_hospitais,
    (SELECT COUNT(*) FROM public.usuarios) AS total_usuarios;

-- Criar view de estatísticas por hospital
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
-- 10. CONFIGURAR PERMISSÕES PARA NOVAS TABELAS
-- ============================================================================

-- Desabilitar RLS para novas tabelas
ALTER TABLE public.hospitais DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas
GRANT ALL ON public.hospitais TO anon, authenticated;
GRANT ALL ON public.usuarios TO anon, authenticated;

-- Permissões para views
GRANT SELECT ON public.agendamentos_completos TO anon, authenticated;
GRANT SELECT ON public.estatisticas_dashboard TO anon, authenticated;
GRANT SELECT ON public.estatisticas_por_hospital TO anon, authenticated;

-- ============================================================================
-- 11. VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se migração foi bem sucedida
SELECT 
    'Migração Multi-Hospitalar Concluída!' as status,
    (SELECT COUNT(*) FROM public.hospitais) as hospitais,
    (SELECT COUNT(*) FROM public.usuarios) as usuarios,
    (SELECT COUNT(*) FROM public.medicos) as medicos,
    (SELECT COUNT(*) FROM public.procedimentos) as procedimentos,
    (SELECT COUNT(*) FROM public.agendamentos) as agendamentos,
    (SELECT COUNT(*) FROM public.agendamentos WHERE horario IS NOT NULL) as agendamentos_com_horario_ainda;

-- Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('hospitais', 'usuarios', 'medicos', 'procedimentos', 'agendamentos')
AND column_name IN ('hospital_id', 'horario')
ORDER BY table_name, column_name;

COMMIT;

-- ============================================================================
-- INSTRUÇÕES PÓS-MIGRAÇÃO
-- ============================================================================

-- 1. Verifique se todos os dados foram preservados
-- 2. Teste as APIs do frontend
-- 3. Atualize o frontend para usar o sistema multi-hospitalar
-- 4. Configure usuários para cada hospital conforme necessário

-- ENDPOINTS DE TESTE:
-- POST /api/usuarios/auth { "email": "admin@hospitalprincipal.com" }
-- GET /api/hospitais
-- GET /api/medicos?hospitalId=<hospital_id>
-- GET /api/procedimentos?hospitalId=<hospital_id>
-- GET /api/agendamentos?hospitalId=<hospital_id>
