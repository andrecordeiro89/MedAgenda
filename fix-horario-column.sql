-- ============================================================================
-- CORREÇÃO: REMOVER COLUNA HORARIO COM DEPENDÊNCIAS
-- Execute este script para corrigir o erro de dependências
-- ============================================================================

-- 1. REMOVER VIEWS QUE DEPENDEM DA COLUNA HORARIO
DROP VIEW IF EXISTS public.agendamentos_completos CASCADE;
DROP VIEW IF EXISTS public.estatisticas_dashboard CASCADE;

-- 2. REMOVER CONSTRAINTS QUE INCLUEM HORARIO
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_medico_id_data_agendamento_horario_key;

-- 3. REMOVER COLUNA HORARIO (AGORA SEM DEPENDÊNCIAS)
ALTER TABLE public.agendamentos 
DROP COLUMN IF EXISTS horario CASCADE;

-- 4. ADICIONAR NOVA CONSTRAINT SEM HORARIO
ALTER TABLE public.agendamentos 
ADD CONSTRAINT agendamentos_medico_id_data_agendamento_key 
UNIQUE(medico_id, data_agendamento);

-- 5. RECRIAR VIEW AGENDAMENTOS_COMPLETOS SEM HORARIO
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

-- 6. RECRIAR VIEW DE ESTATÍSTICAS
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

-- 7. DAR PERMISSÕES NAS VIEWS
GRANT SELECT ON public.agendamentos_completos TO anon, authenticated;
GRANT SELECT ON public.estatisticas_dashboard TO anon, authenticated;

-- 8. VERIFICAÇÃO
SELECT 
    'Coluna horario removida com sucesso!' as status,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'agendamentos' 
     AND column_name = 'horario' 
     AND table_schema = 'public') as horario_ainda_existe;

-- Se horario_ainda_existe = 0, a correção foi bem-sucedida!
