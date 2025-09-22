-- ============================================
-- CONFIGURAÇÃO SIMPLES - MEDAGENDA SUPABASE
-- ============================================

-- ============================================
-- DESABILITAR RLS E CONFIGURAR PERMISSÕES
-- ============================================
ALTER TABLE public.medicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;

-- Dar permissões completas
GRANT ALL ON public.medicos TO anon, authenticated;
GRANT ALL ON public.procedimentos TO anon, authenticated;
GRANT ALL ON public.agendamentos TO anon, authenticated;

-- Permissões para sequências
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- INSERIR DADOS DE EXEMPLO - MÉDICOS
-- ============================================
-- Verificar se já existem dados antes de inserir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.medicos WHERE crm = '12345-SP') THEN
        INSERT INTO public.medicos (nome, especialidade, crm, telefone, email) VALUES
        ('Dr. Carlos Andrade', 'Cardiologia', '12345-SP', '(11) 98765-4321', 'carlos.andrade@hospital.com'),
        ('Dra. Ana Beatriz', 'Ortopedia', '54321-RJ', '(21) 91234-5678', 'ana.beatriz@hospital.com'),
        ('Dr. João Paulo', 'Neurologia', '67890-MG', '(31) 95678-1234', 'joao.paulo@hospital.com'),
        ('Dra. Mariana Costa', 'Pediatria', '09876-BA', '(71) 98888-7777', 'mariana.costa@hospital.com'),
        ('Dr. Ricardo Gomes', 'Dermatologia', '11223-PR', '(41) 97777-8888', 'ricardo.gomes@hospital.com');
    END IF;
END $$;

-- ============================================
-- INSERIR DADOS DE EXEMPLO - PROCEDIMENTOS
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.procedimentos WHERE nome = 'Consulta de Rotina') THEN
        INSERT INTO public.procedimentos (nome, tipo, duracao_estimada_min, descricao) VALUES
        ('Consulta de Rotina', 'ambulatorial', 30, 'Check-up geral com o clínico.'),
        ('Eletrocardiograma', 'ambulatorial', 45, 'Exame para avaliar a atividade elétrica do coração.'),
        ('Cirurgia de Apendicite', 'cirurgico', 90, 'Remoção do apêndice inflamado.'),
        ('Fisioterapia Ortopédica', 'ambulatorial', 60, 'Sessão de reabilitação física.'),
        ('Endoscopia', 'cirurgico', 60, 'Exame para visualizar o sistema digestivo.'),
        ('Aplicação de Botox', 'ambulatorial', 30, 'Procedimento estético.');
    END IF;
END $$;

-- ============================================
-- INSERIR DADOS DE EXEMPLO - AGENDAMENTOS
-- ============================================
-- Vamos inserir alguns agendamentos manualmente para evitar problemas com random()
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
    'Ana Silva',
    '1985-03-15'::DATE,
    'São Paulo',
    '(11) 99999-1111',
    '(11) 99999-1111',
    CURRENT_DATE + INTERVAL '1 day',
    '08:00'::TIME,
    'pendente',
    m.id,
    p.id
FROM public.medicos m, public.procedimentos p
WHERE m.nome = 'Dr. Carlos Andrade' 
AND p.nome = 'Consulta de Rotina'
LIMIT 1
;

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
    'Bruno Souza',
    '1990-07-22'::DATE,
    'Rio de Janeiro',
    '(21) 88888-2222',
    '(21) 88888-2222',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00'::TIME,
    'liberado',
    m.id,
    p.id
FROM public.medicos m, public.procedimentos p
WHERE m.nome = 'Dra. Ana Beatriz' 
AND p.nome = 'Fisioterapia Ortopédica'
LIMIT 1
;

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
    'Carla Dias',
    '1988-11-08'::DATE,
    'Belo Horizonte',
    '(31) 77777-3333',
    '(31) 77777-3333',
    CURRENT_DATE + INTERVAL '3 days',
    '14:00'::TIME,
    'pendente',
    m.id,
    p.id
FROM public.medicos m, public.procedimentos p
WHERE m.nome = 'Dr. João Paulo' 
AND p.nome = 'Eletrocardiograma'
LIMIT 1
;

-- ============================================
-- CRIAR VIEWS ÚTEIS
-- ============================================
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

-- Dar permissões na view
GRANT SELECT ON public.agendamentos_completos TO anon, authenticated;

-- ============================================
-- TESTE FINAL
-- ============================================
SELECT 'Setup concluído!' as status,
       (SELECT COUNT(*) FROM public.medicos) as medicos,
       (SELECT COUNT(*) FROM public.procedimentos) as procedimentos,
       (SELECT COUNT(*) FROM public.agendamentos) as agendamentos;
