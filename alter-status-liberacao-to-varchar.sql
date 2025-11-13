-- ============================================
-- ALTERAR COLUNA status_liberacao DE ENUM PARA VARCHAR
-- Solução mais simples e flexível
-- ============================================

-- PASSO 1: Remover constraint CHECK se existir (para evitar conflitos)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status_liberacao' 
        AND table_name = 'agendamentos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agendamentos DROP CONSTRAINT check_status_liberacao;
        RAISE NOTICE '✅ Constraint check_status_liberacao removida';
    END IF;
END $$;

-- PASSO 2: Alterar o tipo da coluna de ENUM para VARCHAR
ALTER TABLE public.agendamentos 
ALTER COLUMN status_liberacao TYPE VARCHAR(50) 
USING status_liberacao::text;

-- PASSO 3: Definir valor padrão como 'anestesista'
ALTER TABLE public.agendamentos 
ALTER COLUMN status_liberacao SET DEFAULT 'anestesista';

-- PASSO 4: Atualizar registros existentes que têm 'pendente' para 'anestesista'
UPDATE public.agendamentos 
SET status_liberacao = 'anestesista' 
WHERE status_liberacao = 'pendente';

-- PASSO 5: (Opcional) Adicionar constraint CHECK para garantir apenas valores válidos
-- Isso garante que apenas os valores permitidos sejam inseridos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status_liberacao' 
        AND table_name = 'agendamentos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.agendamentos 
        ADD CONSTRAINT check_status_liberacao 
        CHECK (status_liberacao IN ('anestesista', 'cardio', 'exames', 'liberado'));
        RAISE NOTICE '✅ Constraint check_status_liberacao adicionada';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint check_status_liberacao já existe';
    END IF;
END $$;

-- PASSO 6: Verificar os valores únicos na coluna
SELECT DISTINCT status_liberacao, COUNT(*) as total
FROM public.agendamentos
GROUP BY status_liberacao
ORDER BY status_liberacao;

-- PASSO 7: Verificação final da estrutura da coluna
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'agendamentos' 
AND column_name = 'status_liberacao';
