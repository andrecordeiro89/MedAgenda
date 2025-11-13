-- ============================================
-- ATUALIZAR ENUM status_liberacao_enum
-- Adicionar novos valores: 'anestesista', 'cardio', 'exames', 'liberado'
-- 
-- IMPORTANTE: No PostgreSQL, novos valores de enum precisam ser commitados
-- antes de serem usados. Execute este script completo de uma vez.
-- ============================================

-- ============================================
-- PASSO 1: Adicionar valor 'anestesista'
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
    value_exists boolean;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        -- Verificar se o valor já existe
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'anestesista' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
        ) INTO value_exists;
        
        IF NOT value_exists THEN
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'anestesista');
            RAISE NOTICE '✅ Valor "anestesista" adicionado ao tipo %', enum_type_name;
        ELSE
            RAISE NOTICE 'ℹ️ Valor "anestesista" já existe';
        END IF;
    END IF;
END $$;

-- ============================================
-- PASSO 2: Adicionar valor 'cardio'
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
    value_exists boolean;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'cardio' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
        ) INTO value_exists;
        
        IF NOT value_exists THEN
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'cardio');
            RAISE NOTICE '✅ Valor "cardio" adicionado ao tipo %', enum_type_name;
        ELSE
            RAISE NOTICE 'ℹ️ Valor "cardio" já existe';
        END IF;
    END IF;
END $$;

-- ============================================
-- PASSO 3: Adicionar valor 'exames'
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
    value_exists boolean;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'exames' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
        ) INTO value_exists;
        
        IF NOT value_exists THEN
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'exames');
            RAISE NOTICE '✅ Valor "exames" adicionado ao tipo %', enum_type_name;
        ELSE
            RAISE NOTICE 'ℹ️ Valor "exames" já existe';
        END IF;
    END IF;
END $$;

-- ============================================
-- PASSO 4: Adicionar valor 'liberado' (pode já existir)
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
    value_exists boolean;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'liberado' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
        ) INTO value_exists;
        
        IF NOT value_exists THEN
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'liberado');
            RAISE NOTICE '✅ Valor "liberado" adicionado ao tipo %', enum_type_name;
        ELSE
            RAISE NOTICE 'ℹ️ Valor "liberado" já existe';
        END IF;
    END IF;
END $$;

-- ============================================
-- PASSO 5: Atualizar valor padrão da coluna
-- (Execute após os valores serem adicionados)
-- ============================================
ALTER TABLE public.agendamentos 
ALTER COLUMN status_liberacao SET DEFAULT 'anestesista';

-- ============================================
-- PASSO 6: Atualizar registros existentes de 'pendente' para 'anestesista'
-- (Execute após os valores serem adicionados)
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        -- Verificar se 'pendente' existe no enum
        IF EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'pendente' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
        ) THEN
            -- Atualizar registros
            EXECUTE format('UPDATE public.agendamentos SET status_liberacao = %L::%I WHERE status_liberacao::text = %L', 
                          'anestesista', enum_type_name, 'pendente');
            
            RAISE NOTICE '✅ Registros com status "pendente" atualizados para "anestesista"';
        ELSE
            RAISE NOTICE 'ℹ️ Valor "pendente" não encontrado no enum, pulando migração';
        END IF;
    END IF;
END $$;

-- ============================================
-- PASSO 7: Verificar os valores do enum
-- ============================================
DO $$ 
DECLARE
    enum_type_name text;
    enum_value text;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL THEN
        RAISE NOTICE '📋 Valores do enum %:', enum_type_name;
        
        FOR enum_value IN
            SELECT enumlabel
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
            ORDER BY enumsortorder
        LOOP
            RAISE NOTICE '  - %', enum_value;
        END LOOP;
    END IF;
END $$;

-- ============================================
-- PASSO 8: Verificar quantos registros têm cada status
-- ============================================
SELECT status_liberacao, COUNT(*) as total
FROM public.agendamentos
GROUP BY status_liberacao
ORDER BY status_liberacao;
