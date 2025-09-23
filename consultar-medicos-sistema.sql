-- ============================================================================
-- CONSULTAR MÉDICOS NO SISTEMA MULTI-HOSPITALAR
-- ============================================================================

-- 1. VER TODOS OS MÉDICOS E SEUS HOSPITAIS
SELECT 
    m.nome as medico_nome,
    m.crm,
    m.especialidade,
    h.nome as hospital_nome,
    mh.ativo,
    mh.data_inicio,
    mh.observacoes
FROM medicos m
LEFT JOIN medico_hospital mh ON m.id = mh.medico_id
LEFT JOIN hospitais h ON mh.hospital_id = h.id
ORDER BY m.nome, h.nome;

-- 2. VER APENAS MÉDICOS ATIVOS POR HOSPITAL
SELECT 
    h.nome as hospital,
    COUNT(DISTINCT mh.medico_id) as total_medicos_ativos,
    STRING_AGG(m.nome, ', ' ORDER BY m.nome) as medicos
FROM hospitais h
LEFT JOIN medico_hospital mh ON h.id = mh.hospital_id AND mh.ativo = true
LEFT JOIN medicos m ON mh.medico_id = m.id
GROUP BY h.id, h.nome
ORDER BY h.nome;

-- 3. VERIFICAR SE CRM JÁ EXISTE NO SISTEMA
-- Substitua 'CRM-PARA-VERIFICAR' pelo CRM que quer testar
SELECT 
    m.nome,
    m.crm,
    m.email,
    COUNT(mh.hospital_id) as total_hospitais,
    STRING_AGG(h.nome, ', ') as hospitais_onde_atende
FROM medicos m
LEFT JOIN medico_hospital mh ON m.id = mh.medico_id AND mh.ativo = true
LEFT JOIN hospitais h ON mh.hospital_id = h.id
WHERE m.crm = 'CRM-PARA-VERIFICAR'
GROUP BY m.id, m.nome, m.crm, m.email;

-- 4. VER MÉDICOS QUE ATENDEM EM MÚLTIPLOS HOSPITAIS
SELECT 
    m.nome,
    m.crm,
    COUNT(mh.hospital_id) as total_hospitais,
    STRING_AGG(h.nome, ', ' ORDER BY h.nome) as hospitais
FROM medicos m
JOIN medico_hospital mh ON m.id = mh.medico_id AND mh.ativo = true
JOIN hospitais h ON mh.hospital_id = h.id
GROUP BY m.id, m.nome, m.crm
HAVING COUNT(mh.hospital_id) > 1
ORDER BY m.nome;

-- 5. ESTATÍSTICAS GERAIS
SELECT 
    'Total de médicos únicos' as metrica,
    COUNT(*) as valor
FROM medicos
UNION ALL
SELECT 
    'Total de relacionamentos ativos' as metrica,
    COUNT(*) as valor
FROM medico_hospital WHERE ativo = true
UNION ALL
SELECT 
    'Médicos multi-hospitalares' as metrica,
    COUNT(*) as valor
FROM (
    SELECT medico_id
    FROM medico_hospital 
    WHERE ativo = true
    GROUP BY medico_id
    HAVING COUNT(hospital_id) > 1
) sub;
