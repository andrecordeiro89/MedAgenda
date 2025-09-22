-- ============================================
-- CONFIGURAÇÕES DE PERMISSÕES E DADOS - MEDAGENDA
-- ============================================

-- ============================================
-- CRIAR TIPOS ENUM (se não existirem)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_liberacao') THEN
        CREATE TYPE status_liberacao AS ENUM ('pendente', 'liberado');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_procedimento') THEN
        CREATE TYPE tipo_procedimento AS ENUM ('cirurgico', 'ambulatorial');
    END IF;
END $$;

-- ============================================
-- CONFIGURAÇÕES DE SEGURANÇA (RLS DESABILITADO CONFORME SOLICITADO)
-- ============================================
-- Como você mencionou que é para uso interno, vamos desabilitar RLS
-- e dar permissões completas para usuários autenticados e anônimos

-- Desabilitar RLS em todas as tabelas
ALTER TABLE public.medicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas para anon e authenticated
GRANT ALL ON public.medicos TO anon, authenticated;
GRANT ALL ON public.procedimentos TO anon, authenticated;
GRANT ALL ON public.agendamentos TO anon, authenticated;

-- Permissões para sequências (se houver)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- DADOS INICIAIS - MÉDICOS
-- ============================================
INSERT INTO public.medicos (nome, especialidade, crm, telefone, email) VALUES
('Dr. Carlos Andrade', 'Cardiologia', '12345-SP', '(11) 98765-4321', 'carlos.andrade@hospital.com'),
('Dra. Ana Beatriz', 'Ortopedia', '54321-RJ', '(21) 91234-5678', 'ana.beatriz@hospital.com'),
('Dr. João Paulo', 'Neurologia', '67890-MG', '(31) 95678-1234', 'joao.paulo@hospital.com'),
('Dra. Mariana Costa', 'Pediatria', '09876-BA', '(71) 98888-7777', 'mariana.costa@hospital.com'),
('Dr. Ricardo Gomes', 'Dermatologia', '11223-PR', '(41) 97777-8888', 'ricardo.gomes@hospital.com')
ON CONFLICT (crm) DO NOTHING;

-- ============================================
-- DADOS INICIAIS - PROCEDIMENTOS
-- ============================================
INSERT INTO public.procedimentos (nome, tipo, duracao_estimada_min, descricao) VALUES
('Consulta de Rotina', 'ambulatorial', 30, 'Check-up geral com o clínico.'),
('Eletrocardiograma', 'ambulatorial', 45, 'Exame para avaliar a atividade elétrica do coração.'),
('Cirurgia de Apendicite', 'cirurgico', 90, 'Remoção do apêndice inflamado.'),
('Fisioterapia Ortopédica', 'ambulatorial', 60, 'Sessão de reabilitação física.'),
('Endoscopia', 'cirurgico', 60, 'Exame para visualizar o sistema digestivo.'),
('Aplicação de Botox', 'ambulatorial', 30, 'Procedimento estético.')
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- DADOS INICIAIS - AGENDAMENTOS DE EXEMPLO
-- ============================================
-- Vamos criar alguns agendamentos de exemplo
WITH medicos_sample AS (
    SELECT id, nome FROM public.medicos LIMIT 3
),
procedimentos_sample AS (
    SELECT id, nome FROM public.procedimentos LIMIT 3
)
INSERT INTO public.agendamentos (
    nome_paciente, 
    data_nascimento, 
    cidade_natal, 
    telefone, 
    whatsapp, 
    data_agendamento, 
    horario, 
    status_liberacao, 
    medico_id, 
    procedimento_id
)
SELECT 
    CASE 
        WHEN generate_series % 5 = 0 THEN 'Ana Silva'
        WHEN generate_series % 5 = 1 THEN 'Bruno Souza'
        WHEN generate_series % 5 = 2 THEN 'Carla Dias'
        WHEN generate_series % 5 = 3 THEN 'Diego Rocha'
        ELSE 'Elisa Ferreira'
    END as nome_paciente,
    (CURRENT_DATE - INTERVAL '25 years' + (random() * INTERVAL '20 years'))::DATE as data_nascimento,
    CASE 
        WHEN generate_series % 3 = 0 THEN 'São Paulo'
        WHEN generate_series % 3 = 1 THEN 'Rio de Janeiro'
        ELSE 'Belo Horizonte'
    END as cidade_natal,
    '(11) 9' || LPAD((1000 + random() * 8999)::INT::TEXT, 4, '0') || '-' || LPAD((1000 + random() * 8999)::INT::TEXT, 4, '0') as telefone,
    '(11) 9' || LPAD((1000 + random() * 8999)::INT::TEXT, 4, '0') || '-' || LPAD((1000 + random() * 8999)::INT::TEXT, 4, '0') as whatsapp,
    (CURRENT_DATE + (generate_series || ' days')::INTERVAL + (random() * INTERVAL '30 days'))::DATE as data_agendamento,
    CASE 
        WHEN generate_series % 8 = 0 THEN '08:00'
        WHEN generate_series % 8 = 1 THEN '09:00'
        WHEN generate_series % 8 = 2 THEN '10:00'
        WHEN generate_series % 8 = 3 THEN '11:00'
        WHEN generate_series % 8 = 4 THEN '14:00'
        WHEN generate_series % 8 = 5 THEN '15:00'
        WHEN generate_series % 8 = 6 THEN '16:00'
        ELSE '17:00'
    END::TIME as horario,
    CASE WHEN random() > 0.5 THEN 'liberado'::status_liberacao ELSE 'pendente'::status_liberacao END,
    (SELECT id FROM medicos_sample ORDER BY random() LIMIT 1),
    (SELECT id FROM procedimentos_sample ORDER BY random() LIMIT 1)
FROM generate_series(1, 15)
ON CONFLICT (medico_id, data_agendamento, horario) DO NOTHING;

-- ============================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ============================================

-- View com agendamentos completos (com nomes de médicos e procedimentos)
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
    a.horario,
    a.status_liberacao,
    a.medico_id,
    a.procedimento_id,
    m.nome AS medico_nome,
    m.especialidade AS medico_especialidade,
    p.nome AS procedimento_nome,
    p.tipo AS procedimento_tipo,
    p.duracao_estimada_min,
    a.created_at,
    a.updated_at
FROM public.agendamentos a
JOIN public.medicos m ON a.medico_id = m.id
JOIN public.procedimentos p ON a.procedimento_id = p.id;

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW public.estatisticas_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM public.agendamentos) AS total_agendamentos,
    (SELECT COUNT(*) FROM public.agendamentos WHERE status_liberacao = 'pendente') AS pendentes,
    (SELECT COUNT(*) FROM public.agendamentos WHERE status_liberacao = 'liberado') AS liberados,
    (SELECT COUNT(*) FROM public.agendamentos a JOIN public.procedimentos p ON a.procedimento_id = p.id WHERE p.tipo = 'cirurgico') AS cirurgicos,
    (SELECT COUNT(*) FROM public.agendamentos a JOIN public.procedimentos p ON a.procedimento_id = p.id WHERE p.tipo = 'ambulatorial') AS ambulatoriais,
    (SELECT COUNT(*) FROM public.medicos) AS total_medicos,
    (SELECT COUNT(*) FROM public.procedimentos) AS total_procedimentos;

-- Dar permissões nas views
GRANT SELECT ON public.agendamentos_completos TO anon, authenticated;
GRANT SELECT ON public.estatisticas_dashboard TO anon, authenticated;

-- ============================================
-- ÍNDICES PARA PERFORMANCE (se não existirem)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_agendamento ON public.agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_id ON public.agendamentos(medico_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_procedimento_id ON public.agendamentos(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status_liberacao);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON public.medicos(crm);
CREATE INDEX IF NOT EXISTS idx_medicos_email ON public.medicos(email);
CREATE INDEX IF NOT EXISTS idx_procedimentos_tipo ON public.procedimentos(tipo);

-- ============================================
-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS PARA updated_at (se não existirem)
-- ============================================
DROP TRIGGER IF EXISTS update_medicos_updated_at ON public.medicos;
CREATE TRIGGER update_medicos_updated_at 
    BEFORE UPDATE ON public.medicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_procedimentos_updated_at ON public.procedimentos;
CREATE TRIGGER update_procedimentos_updated_at 
    BEFORE UPDATE ON public.procedimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TESTE FINAL
-- ============================================
SELECT 'MedAgenda configurado com sucesso no Supabase!' as status,
       (SELECT COUNT(*) FROM public.medicos) as medicos_inseridos,
       (SELECT COUNT(*) FROM public.procedimentos) as procedimentos_inseridos,
       (SELECT COUNT(*) FROM public.agendamentos) as agendamentos_inseridos;
