-- ============================================
-- VERIFICAR ESQUEMA ATUAL DO BANCO
-- ============================================

-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('medicos', 'procedimentos', 'agendamentos');

-- Verificar estrutura da tabela medicos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'medicos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela procedimentos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'procedimentos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela agendamentos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'agendamentos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar tipos ENUM existentes
SELECT typname, enumlabel
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE typname IN ('status_liberacao', 'tipo_procedimento')
ORDER BY typname, enumsortorder;
