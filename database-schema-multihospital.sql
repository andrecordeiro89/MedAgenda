-- ============================================================================
-- MEDAGENDA - SISTEMA MULTI-HOSPITALAR
-- Schema completo do banco de dados PostgreSQL
-- Versão: 2.0 (Multi-hospitalar)
-- ============================================================================

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA HOSPITAIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hospitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. TABELA USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. TABELA MEDICOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    especialidade VARCHAR(255) NOT NULL,
    crm VARCHAR(50) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crm, hospital_id),
    UNIQUE(email, hospital_id)
);

-- ============================================================================
-- 4. TABELA PROCEDIMENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cirurgico', 'ambulatorial')),
    duracao_estimada_min INTEGER NOT NULL CHECK (duracao_estimada_min > 0),
    descricao TEXT,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nome, hospital_id)
);

-- ============================================================================
-- 5. TABELA AGENDAMENTOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_paciente VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    cidade_natal VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    data_agendamento DATE NOT NULL,
    status_liberacao VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status_liberacao IN ('pendente', 'liberado')),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    procedimento_id UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(medico_id, data_agendamento)
);

-- ============================================================================
-- 6. ÍNDICES PARA OTIMIZAÇÃO
-- ============================================================================

-- Índices para hospitais
CREATE INDEX IF NOT EXISTS idx_hospitais_cnpj ON hospitais(cnpj);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_hospital_id ON usuarios(hospital_id);

-- Índices para médicos
CREATE INDEX IF NOT EXISTS idx_medicos_hospital_id ON medicos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON medicos(crm);
CREATE INDEX IF NOT EXISTS idx_medicos_especialidade ON medicos(especialidade);

-- Índices para procedimentos
CREATE INDEX IF NOT EXISTS idx_procedimentos_hospital_id ON procedimentos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_tipo ON procedimentos(tipo);

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_hospital_id ON agendamentos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_agendamento ON agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_id ON agendamentos(medico_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_procedimento_id ON agendamentos(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status_liberacao);

-- ============================================================================
-- 7. FUNÇÃO PARA ATUALIZAR UPDATED_AT AUTOMATICAMENTE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_hospitais_updated_at 
    BEFORE UPDATE ON hospitais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at 
    BEFORE UPDATE ON medicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedimentos_updated_at 
    BEFORE UPDATE ON procedimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. DADOS DE EXEMPLO (SEED)
-- ============================================================================

-- Inserir hospitais de exemplo
INSERT INTO hospitais (id, nome, cidade, cnpj) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Hospital São Paulo', 'São Paulo', '11.222.333/0001-44'),
    ('22222222-2222-2222-2222-222222222222', 'Hospital Rio de Janeiro', 'Rio de Janeiro', '22.333.444/0001-55'),
    ('33333333-3333-3333-3333-333333333333', 'Hospital Belo Horizonte', 'Belo Horizonte', '33.444.555/0001-66')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir usuários de exemplo
INSERT INTO usuarios (id, email, hospital_id) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@hospitalsaopaulo.com', '11111111-1111-1111-1111-111111111111'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'recepcionista@hospitalsaopaulo.com', '11111111-1111-1111-1111-111111111111'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@hospitalrio.com', '22222222-2222-2222-2222-222222222222'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'coordenador@hospitalbh.com', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (email) DO NOTHING;

-- Inserir médicos de exemplo
INSERT INTO medicos (id, nome, especialidade, crm, telefone, email, hospital_id) VALUES
    ('m1111111-1111-1111-1111-111111111111', 'Dr. Carlos Andrade', 'Cardiologia', '12345-SP', '(11) 98765-4321', 'carlos.andrade@hospital.com', '11111111-1111-1111-1111-111111111111'),
    ('m2222222-2222-2222-2222-222222222222', 'Dra. Ana Beatriz', 'Ortopedia', '54321-RJ', '(21) 91234-5678', 'ana.beatriz@hospital.com', '22222222-2222-2222-2222-222222222222'),
    ('m3333333-3333-3333-3333-333333333333', 'Dr. João Paulo', 'Neurologia', '67890-MG', '(31) 95678-1234', 'joao.paulo@hospital.com', '33333333-3333-3333-3333-333333333333'),
    ('m4444444-4444-4444-4444-444444444444', 'Dra. Mariana Costa', 'Pediatria', '09876-BA', '(71) 98888-7777', 'mariana.costa@hospital.com', '11111111-1111-1111-1111-111111111111'),
    ('m5555555-5555-5555-5555-555555555555', 'Dr. Ricardo Gomes', 'Dermatologia', '11223-PR', '(41) 97777-8888', 'ricardo.gomes@hospital.com', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (crm, hospital_id) DO NOTHING;

-- Inserir procedimentos de exemplo
INSERT INTO procedimentos (id, nome, tipo, duracao_estimada_min, descricao, hospital_id) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Consulta de Rotina', 'ambulatorial', 30, 'Check-up geral com o clínico.', '11111111-1111-1111-1111-111111111111'),
    ('p2222222-2222-2222-2222-222222222222', 'Eletrocardiograma', 'ambulatorial', 45, 'Exame para avaliar a atividade elétrica do coração.', '11111111-1111-1111-1111-111111111111'),
    ('p3333333-3333-3333-3333-333333333333', 'Cirurgia de Apendicite', 'cirurgico', 90, 'Remoção do apêndice inflamado.', '22222222-2222-2222-2222-222222222222'),
    ('p4444444-4444-4444-4444-444444444444', 'Fisioterapia Ortopédica', 'ambulatorial', 60, 'Sessão de reabilitação física.', '22222222-2222-2222-2222-222222222222'),
    ('p5555555-5555-5555-5555-555555555555', 'Endoscopia', 'cirurgico', 60, 'Exame para visualizar o sistema digestivo.', '33333333-3333-3333-3333-333333333333'),
    ('p6666666-6666-6666-6666-666666666666', 'Aplicação de Botox', 'ambulatorial', 30, 'Procedimento estético.', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (nome, hospital_id) DO NOTHING;

-- ============================================================================
-- 10. VIEWS ÚTEIS PARA CONSULTAS
-- ============================================================================

-- View para agendamentos com detalhes completos
CREATE OR REPLACE VIEW vw_agendamentos_completos AS
SELECT 
    a.id,
    a.nome_paciente,
    a.data_nascimento,
    a.cidade_natal,
    a.telefone,
    a.whatsapp,
    a.data_agendamento,
    a.status_liberacao,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade,
    
    -- Dados do médico
    m.id as medico_id,
    m.nome as medico_nome,
    m.especialidade as medico_especialidade,
    m.crm as medico_crm,
    
    -- Dados do procedimento
    p.id as procedimento_id,
    p.nome as procedimento_nome,
    p.tipo as procedimento_tipo,
    p.duracao_estimada_min,
    
    -- Dados do hospital
    h.id as hospital_id,
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj,
    
    a.created_at,
    a.updated_at
FROM agendamentos a
JOIN medicos m ON a.medico_id = m.id
JOIN procedimentos p ON a.procedimento_id = p.id
JOIN hospitais h ON a.hospital_id = h.id;

-- View para estatísticas por hospital
CREATE OR REPLACE VIEW vw_estatisticas_hospitais AS
SELECT 
    h.id,
    h.nome,
    h.cidade,
    h.cnpj,
    COUNT(DISTINCT m.id) as total_medicos,
    COUNT(DISTINCT p.id) as total_procedimentos,
    COUNT(DISTINCT a.id) as total_agendamentos,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'liberado' THEN a.id END) as agendamentos_liberados,
    COUNT(DISTINCT CASE WHEN a.status_liberacao = 'pendente' THEN a.id END) as agendamentos_pendentes,
    COUNT(DISTINCT u.id) as total_usuarios
FROM hospitais h
LEFT JOIN medicos m ON h.id = m.hospital_id
LEFT JOIN procedimentos p ON h.id = p.hospital_id
LEFT JOIN agendamentos a ON h.id = a.hospital_id
LEFT JOIN usuarios u ON h.id = u.hospital_id
GROUP BY h.id, h.nome, h.cidade, h.cnpj
ORDER BY h.nome;

-- ============================================================================
-- 11. COMENTÁRIOS DAS TABELAS
-- ============================================================================

COMMENT ON TABLE hospitais IS 'Cadastro de hospitais do sistema';
COMMENT ON COLUMN hospitais.cnpj IS 'CNPJ no formato XX.XXX.XXX/XXXX-XX';

COMMENT ON TABLE usuarios IS 'Usuários do sistema com acesso aos hospitais';
COMMENT ON COLUMN usuarios.email IS 'Email único para autenticação';

COMMENT ON TABLE medicos IS 'Médicos cadastrados por hospital';
COMMENT ON COLUMN medicos.crm IS 'CRM único por hospital (permite mesmo CRM em hospitais diferentes)';

COMMENT ON TABLE procedimentos IS 'Procedimentos disponíveis por hospital';
COMMENT ON COLUMN procedimentos.tipo IS 'Tipo: cirurgico ou ambulatorial';

COMMENT ON TABLE agendamentos IS 'Agendamentos de pacientes';
COMMENT ON COLUMN agendamentos.status_liberacao IS 'Status: pendente ou liberado';

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
