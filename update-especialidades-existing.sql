-- ============================================================================
-- ATUALIZAÇÃO PARA TABELA ESPECIALIDADES EXISTENTE
-- Script adaptado para trabalhar com tabela especialidades já criada
-- ============================================================================

-- 1. Inserir especialidades se não existirem (usando ON CONFLICT para evitar duplicatas)
INSERT INTO especialidades (nome) VALUES 
    ('Cardiologia'),
    ('Dermatologia'),
    ('Endocrinologia'),
    ('Gastroenterologia'),
    ('Ginecologia'),
    ('Neurologia'),
    ('Oftalmologia'),
    ('Ortopedia'),
    ('Otorrinolaringologia'),
    ('Pediatria'),
    ('Pneumologia'),
    ('Psiquiatria'),
    ('Radiologia'),
    ('Urologia'),
    ('Anestesiologia'),
    ('Cirurgia Geral'),
    ('Clínica Médica'),
    ('Medicina do Trabalho'),
    ('Medicina de Família'),
    ('Patologia')
ON CONFLICT (nome) DO NOTHING;

-- 2. Adicionar coluna especialidade_id na tabela medicos (se não existir)
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- 3. Adicionar coluna especialidade_id na tabela procedimentos (se não existir)
ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- 4. Migrar dados existentes de especialidades dos médicos
-- Para cada especialidade única na tabela médicos, buscar na tabela especialidades e atualizar a referência
DO $$
DECLARE
    especialidade_record RECORD;
    especialidade_uuid UUID;
BEGIN
    -- Para cada especialidade única nos médicos
    FOR especialidade_record IN 
        SELECT DISTINCT especialidade FROM medicos 
        WHERE especialidade IS NOT NULL 
        AND especialidade != '' 
        AND especialidade_id IS NULL  -- Só migrar se ainda não foi migrado
    LOOP
        -- Buscar o ID da especialidade na tabela existente
        SELECT id INTO especialidade_uuid 
        FROM especialidades 
        WHERE LOWER(nome) = LOWER(especialidade_record.especialidade);
        
        -- Se encontrou a especialidade, atualizar médicos
        IF especialidade_uuid IS NOT NULL THEN
            UPDATE medicos 
            SET especialidade_id = especialidade_uuid 
            WHERE especialidade = especialidade_record.especialidade
            AND especialidade_id IS NULL;
            
            RAISE NOTICE 'Migrado % médicos com especialidade: %', 
                (SELECT count(*) FROM medicos WHERE especialidade_id = especialidade_uuid), 
                especialidade_record.especialidade;
        ELSE
            -- Se não encontrou, inserir nova especialidade e depois atualizar
            INSERT INTO especialidades (nome) VALUES (especialidade_record.especialidade) 
            ON CONFLICT (nome) DO NOTHING;
            
            SELECT id INTO especialidade_uuid 
            FROM especialidades 
            WHERE LOWER(nome) = LOWER(especialidade_record.especialidade);
            
            UPDATE medicos 
            SET especialidade_id = especialidade_uuid 
            WHERE especialidade = especialidade_record.especialidade
            AND especialidade_id IS NULL;
            
            RAISE NOTICE 'Criada nova especialidade e migrado médicos: %', especialidade_record.especialidade;
        END IF;
    END LOOP;
END $$;

-- 5. Criar índices para otimizar consultas (se não existirem)
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade_id ON medicos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_especialidade_id ON procedimentos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_especialidades_nome ON especialidades(nome);

-- 6. Verificar resultado da migração
SELECT 
    'Migração concluída!' as status,
    (SELECT count(*) FROM especialidades) as total_especialidades,
    (SELECT count(*) FROM medicos WHERE especialidade_id IS NOT NULL) as medicos_com_especialidade_id,
    (SELECT count(*) FROM medicos WHERE especialidade IS NOT NULL) as medicos_com_especialidade_texto;

-- 7. Mostrar especialidades disponíveis
SELECT 'Especialidades disponíveis:' as info;
SELECT nome FROM especialidades ORDER BY nome;
