-- ============================================================================
-- CRIAÇÃO DA TABELA ESPECIALIDADES E MIGRAÇÃO DE DADOS
-- ============================================================================

-- 1. Criar tabela de especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserir especialidades comuns na área médica
INSERT INTO especialidades (nome, descricao) VALUES 
    ('Cardiologia', 'Especialidade médica que se ocupa do diagnóstico e tratamento das doenças que acometem o coração'),
    ('Dermatologia', 'Especialidade médica que se ocupa do diagnóstico e tratamento de doenças da pele'),
    ('Endocrinologia', 'Especialidade médica que estuda as ordens do sistema endócrino e suas secreções específicas'),
    ('Gastroenterologia', 'Especialidade médica que se ocupa do estudo, diagnóstico e tratamento clínico das doenças do aparelho digestivo'),
    ('Ginecologia', 'Especialidade da medicina que lida com a saúde do aparelho reprodutor feminino'),
    ('Neurologia', 'Especialidade médica que trata dos distúrbios estruturais do sistema nervoso'),
    ('Oftalmologia', 'Especialidade da medicina que estuda e trata as doenças relacionadas ao olho'),
    ('Ortopedia', 'Especialidade médica que cuida da saúde relacionada aos elementos do aparelho locomotor'),
    ('Otorrinolaringologia', 'Especialidade médica com características clínicas e cirúrgicas'),
    ('Pediatria', 'Especialidade médica dedicada à assistência à criança e ao adolescente'),
    ('Pneumologia', 'Especialidade médica que se ocupa do diagnóstico e tratamento das patologias das vias aéreas inferiores'),
    ('Psiquiatria', 'Especialidade da Medicina que lida com a prevenção, atendimento, diagnóstico, tratamento e reabilitação das diferentes formas de sofrimentos mentais'),
    ('Radiologia', 'Especialidade médica que utiliza as radiações para a realização de diagnósticos'),
    ('Urologia', 'Especialidade cirúrgica da medicina que trata do trato urinário de homens e mulheres'),
    ('Anestesiologia', 'Especialidade médica que envolve o cuidado médico antes, durante e após a cirurgia'),
    ('Cirurgia Geral', 'Especialidade médica cuja área de atuação compreende procedimentos cirúrgicos do aparelho digestivo'),
    ('Clínica Médica', 'Especialidade médica que trata de pacientes adultos, atuando principalmente em ambiente hospitalar'),
    ('Medicina do Trabalho', 'Especialidade médica que lida com as relações entre a saúde dos homens e mulheres trabalhadores'),
    ('Medicina de Família', 'Especialidade médica que fornece cuidados de saúde contínuos e abrangentes'),
    ('Patologia', 'Especialidade médica que estuda as causas, mecanismos e natureza das doenças')
ON CONFLICT (nome) DO NOTHING;

-- 3. Adicionar coluna especialidade_id na tabela medicos (referência para especialidades)
ALTER TABLE medicos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- 4. Adicionar coluna especialidade_id na tabela procedimentos (referência para especialidades)  
ALTER TABLE procedimentos 
ADD COLUMN IF NOT EXISTS especialidade_id UUID REFERENCES especialidades(id);

-- 5. Migrar dados existentes de especialidades dos médicos
-- Para cada especialidade única na tabela médicos, criar um registro na tabela especialidades e atualizar a referência
DO $$
DECLARE
    especialidade_record RECORD;
    especialidade_uuid UUID;
BEGIN
    -- Para cada especialidade única nos médicos
    FOR especialidade_record IN 
        SELECT DISTINCT especialidade FROM medicos WHERE especialidade IS NOT NULL AND especialidade != ''
    LOOP
        -- Inserir na tabela especialidades se não existir
        INSERT INTO especialidades (nome) 
        VALUES (especialidade_record.especialidade) 
        ON CONFLICT (nome) DO NOTHING;
        
        -- Buscar o ID da especialidade
        SELECT id INTO especialidade_uuid FROM especialidades WHERE nome = especialidade_record.especialidade;
        
        -- Atualizar médicos com a referência
        UPDATE medicos 
        SET especialidade_id = especialidade_uuid 
        WHERE especialidade = especialidade_record.especialidade;
    END LOOP;
END $$;

-- 6. Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade_id ON medicos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_especialidade_id ON procedimentos(especialidade_id);
CREATE INDEX IF NOT EXISTS idx_especialidades_nome ON especialidades(nome);

-- 7. Comentários nas tabelas
COMMENT ON TABLE especialidades IS 'Tabela centralizada de especialidades médicas para padronização no sistema multi-hospitalar';
COMMENT ON COLUMN especialidades.nome IS 'Nome da especialidade médica (único no sistema)';
COMMENT ON COLUMN especialidades.descricao IS 'Descrição detalhada da especialidade médica';

COMMENT ON COLUMN medicos.especialidade_id IS 'Referência para a tabela especialidades (nova abordagem padronizada)';
COMMENT ON COLUMN procedimentos.especialidade_id IS 'Especialidade médica relacionada ao procedimento';

-- Mensagem de sucesso
SELECT 'Tabela especialidades criada com sucesso! Dados migrados automaticamente.' as status;
