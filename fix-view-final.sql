-- ============================================================================
-- CORREÇÃO FINAL: RECRIAR VIEW SEM CAMPO HORARIO
-- Execute este script para garantir que a view está correta
-- ============================================================================

-- 1. REMOVER VIEW EXISTENTE
DROP VIEW IF EXISTS public.agendamentos_completos CASCADE;

-- 2. RECRIAR VIEW SEM CAMPO HORARIO
CREATE VIEW public.agendamentos_completos AS
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

-- 3. DAR PERMISSÕES
GRANT SELECT ON public.agendamentos_completos TO anon, authenticated;

-- 4. VERIFICAR SE A VIEW FOI CRIADA CORRETAMENTE
SELECT 
    'View agendamentos_completos recriada com sucesso!' as status,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'agendamentos_completos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
