-- ============================================================================
-- MIGRAÇÃO: MÉDICOS MULTI-HOSPITALARES
-- Solução definitiva para médicos que atendem em múltiplos hospitais
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. BACKUP DOS DADOS ATUAIS (para segurança)
-- ============================================================================

-- Criar tabela de backup dos médicos
CREATE TABLE IF NOT EXISTS medicos_backup AS 
SELECT * FROM medicos;

SELECT 'Backup criado com ' || count(*) || ' médicos' as info FROM medicos_backup;

-- ============================================================================
-- 2. CRIAR NOVA TABELA DE RELACIONAMENTO MÉDICO-HOSPITAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS medico_hospital (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    ativo BOOLEAN DEFAULT true,
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitais(id) ON DELETE CASCADE,
    UNIQUE(medico_id, hospital_id)
);

-- ============================================================================
-- 3. MIGRAR DADOS EXISTENTES PARA A NOVA ESTRUTURA
-- ============================================================================

-- Inserir relacionamentos existentes na nova tabela
INSERT INTO medico_hospital (medico_id, hospital_id, ativo, data_inicio)
SELECT 
    id as medico_id,
    hospital_id,
    true as ativo,
    COALESCE(created_at::date, CURRENT_DATE) as data_inicio
FROM medicos 
WHERE hospital_id IS NOT NULL;

SELECT 'Migrados ' || count(*) || ' relacionamentos médico-hospital' as info 
FROM medico_hospital;

-- ============================================================================
-- 4. ATUALIZAR ESTRUTURA DA TABELA MÉDICOS
-- ============================================================================

-- Remover constraints antigas que impedem multi-hospital
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_crm_hospital_key;
ALTER TABLE medicos DROP CONSTRAINT IF EXISTS medicos_email_hospital_key;

-- Remover views que dependem da coluna hospital_id
DROP VIEW IF EXISTS estatisticas_por_hospital CASCADE;

-- Remover coluna hospital_id (agora será via relacionamento)
ALTER TABLE medicos DROP COLUMN IF EXISTS hospital_id;

-- Adicionar constraints globais (CRM e email únicos no sistema todo)
DO $$ 
BEGIN
    -- Adicionar constraint CRM único se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'medicos_crm_key' 
        AND conrelid = 'medicos'::regclass
    ) THEN
        ALTER TABLE medicos ADD CONSTRAINT medicos_crm_key UNIQUE(crm);
    END IF;
    
    -- Adicionar constraint EMAIL único se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'medicos_email_key' 
        AND conrelid = 'medicos'::regclass
    ) THEN
        ALTER TABLE medicos ADD CONSTRAINT medicos_email_key UNIQUE(email);
    END IF;
END $$;

-- ============================================================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_medico_hospital_medico_id ON medico_hospital(medico_id);
CREATE INDEX IF NOT EXISTS idx_medico_hospital_hospital_id ON medico_hospital(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medico_hospital_ativo ON medico_hospital(ativo);
CREATE INDEX IF NOT EXISTS idx_medico_hospital_composto ON medico_hospital(hospital_id, ativo);

-- ============================================================================
-- 6. CRIAR VIEWS PARA FACILITAR CONSULTAS
-- ============================================================================

-- View para médicos com seus hospitais
CREATE OR REPLACE VIEW v_medicos_hospitais AS
SELECT 
    m.id as medico_id,
    m.nome as medico_nome,
    m.crm,
    m.email,
    m.telefone,
    m.especialidade,
    m.created_at as medico_created_at,
    
    h.id as hospital_id,
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj,
    
    mh.ativo,
    mh.data_inicio,
    mh.data_fim,
    mh.observacoes
FROM medicos m
JOIN medico_hospital mh ON m.id = mh.medico_id
JOIN hospitais h ON mh.hospital_id = h.id
ORDER BY m.nome, h.nome;

-- View para médicos ativos por hospital
CREATE OR REPLACE VIEW v_medicos_ativos_por_hospital AS
SELECT 
    h.id as hospital_id,
    h.nome as hospital_nome,
    m.id as medico_id,
    m.nome as medico_nome,
    m.crm,
    m.especialidade,
    mh.data_inicio
FROM hospitais h
JOIN medico_hospital mh ON h.id = mh.hospital_id
JOIN medicos m ON mh.medico_id = m.id
WHERE mh.ativo = true
AND (mh.data_fim IS NULL OR mh.data_fim > CURRENT_DATE)
ORDER BY h.nome, m.nome;

-- ============================================================================
-- 7. CRIAR FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para adicionar médico a um hospital
CREATE OR REPLACE FUNCTION adicionar_medico_hospital(
    p_medico_id UUID,
    p_hospital_id UUID,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_relacao_id UUID;
BEGIN
    INSERT INTO medico_hospital (medico_id, hospital_id, ativo, observacoes)
    VALUES (p_medico_id, p_hospital_id, true, p_observacoes)
    ON CONFLICT (medico_id, hospital_id) 
    DO UPDATE SET 
        ativo = true,
        data_fim = NULL,
        observacoes = COALESCE(EXCLUDED.observacoes, medico_hospital.observacoes),
        updated_at = NOW()
    RETURNING id INTO v_relacao_id;
    
    RETURN v_relacao_id;
END;
$$ LANGUAGE plpgsql;

-- Função para remover médico de um hospital
CREATE OR REPLACE FUNCTION remover_medico_hospital(
    p_medico_id UUID,
    p_hospital_id UUID,
    p_observacoes TEXT DEFAULT 'Removido via sistema'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE medico_hospital 
    SET 
        ativo = false,
        data_fim = CURRENT_DATE,
        observacoes = p_observacoes,
        updated_at = NOW()
    WHERE medico_id = p_medico_id 
    AND hospital_id = p_hospital_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ATUALIZAR TABELA AGENDAMENTOS PARA SUPORTAR MULTI-HOSPITAL
-- ============================================================================

-- Adicionar coluna para identificar em qual hospital o atendimento acontece
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS hospital_atendimento_id UUID REFERENCES hospitais(id);

-- Preencher com o hospital do agendamento atual
UPDATE agendamentos 
SET hospital_atendimento_id = hospital_id 
WHERE hospital_atendimento_id IS NULL;

-- ============================================================================
-- 9. VERIFICAÇÕES E RELATÓRIOS
-- ============================================================================

-- Verificar integridade da migração
SELECT 'VERIFICAÇÕES DA MIGRAÇÃO:' as titulo;

-- Contar médicos antes e depois
SELECT 
    'Médicos na tabela original: ' || (SELECT count(*) FROM medicos_backup) ||
    ', Médicos após migração: ' || (SELECT count(*) FROM medicos) ||
    ', Relacionamentos criados: ' || (SELECT count(*) FROM medico_hospital) as resumo;

-- Mostrar médicos com múltiplos hospitais (se houver)
SELECT 'Médicos que atendem em múltiplos hospitais:' as info;
SELECT 
    m.nome as medico,
    m.crm,
    count(mh.hospital_id) as quantidade_hospitais,
    string_agg(h.nome, ', ') as hospitais
FROM medicos m
JOIN medico_hospital mh ON m.id = mh.medico_id
JOIN hospitais h ON mh.hospital_id = h.id
WHERE mh.ativo = true
GROUP BY m.id, m.nome, m.crm
HAVING count(mh.hospital_id) > 1
ORDER BY quantidade_hospitais DESC, m.nome;

-- Verificar se há problemas
SELECT 'Verificação de problemas:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM medicos WHERE crm IN (
            SELECT crm FROM medicos GROUP BY crm HAVING count(*) > 1
        )) THEN '⚠️ ATENÇÃO: CRMs duplicados encontrados!'
        ELSE '✅ Nenhum CRM duplicado'
    END as status_crm,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM medicos WHERE email IN (
            SELECT email FROM medicos GROUP BY email HAVING count(*) > 1
        )) THEN '⚠️ ATENÇÃO: Emails duplicados encontrados!'
        ELSE '✅ Nenhum email duplicado'
    END as status_email;

-- ============================================================================
-- 10. INSTRUÇÕES PARA O DESENVOLVEDOR
-- ============================================================================

SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status;
SELECT 'Próximos passos:' as titulo;
SELECT '1. Atualizar APIs para usar a nova estrutura' as passo_1;
SELECT '2. Atualizar frontend para permitir múltiplos hospitais' as passo_2;
SELECT '3. Testar funcionalidades de CRUD' as passo_3;
SELECT '4. Remover tabela medicos_backup após validação' as passo_4;

COMMIT;

-- ============================================================================
-- EXEMPLO DE USO DAS NOVAS FUNÇÕES
-- ============================================================================

-- Para adicionar um médico existente a outro hospital:
-- SELECT adicionar_medico_hospital('id-do-medico', 'id-do-hospital', 'Médico passou a atender aqui também');

-- Para remover um médico de um hospital:
-- SELECT remover_medico_hospital('id-do-medico', 'id-do-hospital', 'Médico não atende mais aqui');

-- Para consultar médicos de um hospital específico:
-- SELECT * FROM v_medicos_ativos_por_hospital WHERE hospital_id = 'id-do-hospital';

-- ============================================================================
-- 8. RECRIAR VIEW ESTATISTICAS_POR_HOSPITAL COM NOVA ESTRUTURA
-- ============================================================================

-- Recriar view de estatísticas usando a nova estrutura N:N
CREATE OR REPLACE VIEW public.estatisticas_por_hospital AS
SELECT 
    h.id as hospital_id,
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj,
    COUNT(DISTINCT mh.medico_id) as total_medicos,
    COUNT(DISTINCT p.id) as total_procedimentos,
    COUNT(DISTINCT a.id) as total_agendamentos,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'liberado' THEN a.id END) as agendamentos_liberados,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'pendente' THEN a.id END) as agendamentos_pendentes,
    COUNT(DISTINCT u.id) as total_usuarios
FROM public.hospitais h
LEFT JOIN public.medico_hospital mh ON h.id = mh.hospital_id AND mh.ativo = true
LEFT JOIN public.procedimentos p ON h.id = p.hospital_id
LEFT JOIN public.agendamentos a ON h.id = a.hospital_id
LEFT JOIN public.usuarios u ON h.id = u.hospital_id
GROUP BY h.id, h.nome, h.cidade, h.cnpj
ORDER BY h.nome;

-- Dar permissões para a view
GRANT SELECT ON public.estatisticas_por_hospital TO anon, authenticated;
