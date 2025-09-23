-- ============================================================================
-- CRIAÇÃO DE NOVA TABELA ESPECIALIDADES - ESPECIALIDADES MÉDICAS DO BRASIL
-- Script completo para criar nova tabela com especialidades brasileiras
-- ============================================================================

-- 1. Dropar tabela existente se houver problemas de RLS
DROP TABLE IF EXISTS especialidades CASCADE;

-- 2. Criar nova tabela especialidades
CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inserir especialidades médicas mais comuns no Brasil
INSERT INTO especialidades (nome) VALUES 
    -- Clínicas Básicas
    ('Clínica Médica'),
    ('Pediatria'),
    ('Ginecologia e Obstetrícia'),
    ('Medicina de Família e Comunidade'),
    
    -- Cirúrgicas Principais
    ('Cirurgia Geral'),
    ('Cirurgia Cardiovascular'),
    ('Cirurgia Plástica'),
    ('Cirurgia Torácica'),
    ('Neurocirurgia'),
    ('Cirurgia Vascular'),
    
    -- Especialidades por Sistema
    ('Cardiologia'),
    ('Neurologia'),
    ('Ortopedia e Traumatologia'),
    ('Urologia'),
    ('Oftalmologia'),
    ('Otorrinolaringologia'),
    ('Dermatologia'),
    ('Gastroenterologia'),
    ('Pneumologia'),
    ('Nefrologia'),
    ('Endocrinologia e Metabologia'),
    ('Reumatologia'),
    ('Hematologia e Hemoterapia'),
    ('Oncologia Clínica'),
    
    -- Diagnósticas
    ('Radiologia e Diagnóstico por Imagem'),
    ('Patologia'),
    ('Medicina Nuclear'),
    ('Ultrassonografia'),
    
    -- Psiquiátricas e Mentais
    ('Psiquiatria'),
    ('Neuropsiquiatria'),
    
    -- Anestesia e Terapia Intensiva
    ('Anestesiologia'),
    ('Medicina Intensiva'),
    ('Medicina de Emergência'),
    
    -- Medicina Preventiva
    ('Medicina do Trabalho'),
    ('Medicina Preventiva e Social'),
    ('Medicina Legal e Perícia Médica'),
    
    -- Especialidades Específicas
    ('Infectologia'),
    ('Geriatria'),
    ('Medicina Física e Reabilitação'),
    ('Medicina do Esporte'),
    ('Medicina de Tráfego'),
    ('Homeopatia'),
    ('Acupuntura'),
    
    -- Áreas de Atuação Comuns
    ('Medicina Fetal'),
    ('Reprodução Humana'),
    ('Mastologia'),
    ('Coloproctologia'),
    ('Hepatologia'),
    ('Eletrofisiologia Clínica Invasiva'),
    ('Ecocardiografia'),
    ('Hemodinâmica e Cardiologia Intervencionista'),
    
    -- Outras Especialidades
    ('Genética Médica'),
    ('Imunologia'),
    ('Nutrologia'),
    ('Medicina Hiperbárica');

-- 4. Adicionar colunas nas tabelas relacionadas
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- 5. Migrar dados existentes dos médicos
DO $$
DECLARE
    especialidade_record RECORD;
    especialidade_uuid UUID;
    match_found BOOLEAN;
BEGIN
    -- Para cada especialidade única nos médicos
    FOR especialidade_record IN 
        SELECT DISTINCT TRIM(especialidade) as especialidade_limpa
        FROM medicos 
        WHERE especialidade IS NOT NULL 
        AND TRIM(especialidade) != ''
    LOOP
        match_found := FALSE;
        
        -- Tentar encontrar correspondência exata (case insensitive)
        SELECT id INTO especialidade_uuid 
        FROM especialidades 
        WHERE LOWER(TRIM(nome)) = LOWER(especialidade_record.especialidade_limpa);
        
        IF especialidade_uuid IS NOT NULL THEN
            match_found := TRUE;
        ELSE
            -- Tentar correspondências parciais comuns
            CASE 
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%cardio%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Cardiologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%ortop%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Ortopedia e Traumatologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%oftalm%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Oftalmologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%otorrin%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Otorrinolaringologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%ginec%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Ginecologia e Obstetrícia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%pediatr%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Pediatria';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%dermat%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Dermatologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%urol%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Urologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%neuro%' AND NOT LOWER(especialidade_record.especialidade_limpa) LIKE '%cirurg%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Neurologia';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%cirurg%' AND LOWER(especialidade_record.especialidade_limpa) LIKE '%geral%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Cirurgia Geral';
                    match_found := TRUE;
                WHEN LOWER(especialidade_record.especialidade_limpa) LIKE '%clinic%' THEN
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = 'Clínica Médica';
                    match_found := TRUE;
                ELSE
                    -- Se não encontrou correspondência, inserir como nova especialidade
                    INSERT INTO especialidades (nome) VALUES (especialidade_record.especialidade_limpa);
                    SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = especialidade_record.especialidade_limpa;
                    match_found := TRUE;
                    RAISE NOTICE 'Nova especialidade criada: %', especialidade_record.especialidade_limpa;
            END CASE;
        END IF;
        
        -- Atualizar médicos com a especialidade_id encontrada/criada
        IF match_found AND especialidade_uuid IS NOT NULL THEN
            UPDATE medicos 
            SET especialidade_id = especialidade_uuid 
            WHERE TRIM(especialidade) = especialidade_record.especialidade_limpa
            AND especialidade_id IS NULL;
            
            RAISE NOTICE 'Migrados médicos com especialidade: % -> %', 
                especialidade_record.especialidade_limpa,
                (SELECT nome FROM especialidades WHERE id = especialidade_uuid);
        END IF;
    END LOOP;
END $$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade_id ON medicos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_especialidade_id ON procedimentos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_especialidades_nome ON especialidades(nome);

-- 7. Configurar RLS (Row Level Security) se necessário
-- Desabilitar RLS para esta tabela pois especialidades são globais
ALTER TABLE especialidades DISABLE ROW LEVEL SECURITY;

-- 8. Verificar resultado
SELECT 
    'MIGRAÇÃO CONCLUÍDA!' as status,
    (SELECT count(*) FROM especialidades) as total_especialidades,
    (SELECT count(*) FROM medicos WHERE especialidade_id IS NOT NULL) as medicos_migrados,
    (SELECT count(*) FROM medicos WHERE especialidade IS NOT NULL) as total_medicos_com_especialidade;

-- 9. Listar especialidades criadas
SELECT 'ESPECIALIDADES DISPONÍVEIS:' as info;
SELECT 
    ROW_NUMBER() OVER (ORDER BY nome) as num,
    nome 
FROM especialidades 
ORDER BY nome;
