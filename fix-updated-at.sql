-- ============================================
-- FIX: Adicionar created_at e updated_at + triggers
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna created_at se não existir
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Adicionar coluna updated_at se não existir
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Atualizar registros existentes que não têm created_at
UPDATE agendamentos 
SET created_at = NOW()
WHERE created_at IS NULL;

-- 4. Atualizar registros existentes que não têm updated_at
UPDATE agendamentos 
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON agendamentos;

-- 7. Criar trigger para atualizar updated_at em todo UPDATE
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Criar função para definir created_at automaticamente em novos registros
CREATE OR REPLACE FUNCTION set_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS set_agendamentos_created_at ON agendamentos;

-- 10. Criar trigger para definir created_at em todo INSERT
CREATE TRIGGER set_agendamentos_created_at
    BEFORE INSERT ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION set_created_at_column();

-- ============================================
-- Verificar se funcionou
-- ============================================
-- Execute esta query para testar:
-- SELECT id, nome_paciente, created_at, updated_at 
-- FROM agendamentos 
-- ORDER BY created_at DESC
-- LIMIT 10;

