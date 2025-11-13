-- ============================================
-- ATUALIZAR ENUM status_liberacao_enum - VERSÃO PASSO A PASSO
-- 
-- Se o script completo não funcionar, execute cada bloco separadamente
-- ============================================

-- ============================================
-- BLOCO 1: Adicionar 'anestesista'
-- Execute este bloco primeiro
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
    
    IF enum_type_name IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'anestesista' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'anestesista');
        RAISE NOTICE '✅ Valor "anestesista" adicionado';
    END IF;
END $$;

-- ============================================
-- BLOCO 2: Adicionar 'cardio'
-- Execute este bloco após o BLOCO 1
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
    
    IF enum_type_name IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cardio' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'cardio');
        RAISE NOTICE '✅ Valor "cardio" adicionado';
    END IF;
END $$;

-- ============================================
-- BLOCO 3: Adicionar 'exames'
-- Execute este bloco após o BLOCO 2
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
    
    IF enum_type_name IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'exames' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'exames');
        RAISE NOTICE '✅ Valor "exames" adicionado';
    END IF;
END $$;

-- ============================================
-- BLOCO 4: Adicionar 'liberado' (pode já existir)
-- Execute este bloco após o BLOCO 3
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
    
    IF enum_type_name IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'liberado' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'liberado');
        RAISE NOTICE '✅ Valor "liberado" adicionado';
    END IF;
END $$;

-- ============================================
-- BLOCO 5: Atualizar valor padrão e migrar dados
-- Execute este bloco APÓS todos os valores serem adicionados
-- ============================================
ALTER TABLE public.agendamentos 
ALTER COLUMN status_liberacao SET DEFAULT 'anestesista';

DO $$ 
DECLARE
    enum_type_name text;
BEGIN
    SELECT udt_name INTO enum_type_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'agendamentos' 
    AND column_name = 'status_liberacao';
    
    IF enum_type_name IS NOT NULL AND EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pendente' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        EXECUTE format('UPDATE public.agendamentos SET status_liberacao = %L::%I WHERE status_liberacao::text = %L', 
                      'anestesista', enum_type_name, 'pendente');
        RAISE NOTICE '✅ Registros migrados de "pendente" para "anestesista"';
    END IF;
END $$;

