-- ============================================================================
-- CRIAR TABELAS HOSPITAIS E USUARIOS - SISTEMA MULTI-HOSPITALAR
-- MedAgenda - Compatível com estrutura existente
-- ============================================================================

-- SEM RLS, SEM POLÍTICAS, APENAS AS NOVAS TABELAS

-- ============================================================================
-- 1. CRIAR TABELA HOSPITAIS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hospitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CRIAR TABELA USUARIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hospital_id UUID NOT NULL REFERENCES public.hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_hospitais_cnpj ON public.hospitais(cnpj);
CREATE INDEX IF NOT EXISTS idx_hospitais_nome ON public.hospitais(nome);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_hospital_id ON public.usuarios(hospital_id);

-- ============================================================================
-- 4. FUNÇÃO PARA ATUALIZAR UPDATED_AT (se não existir)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================================
-- 5. TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_hospitais_updated_at 
    BEFORE UPDATE ON public.hospitais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. INSERIR DADOS DE EXEMPLO
-- ============================================================================

-- Inserir hospitais de exemplo
INSERT INTO public.hospitais (nome, cidade, cnpj) VALUES
    ('Hospital São Paulo', 'São Paulo', '11.222.333/0001-44'),
    ('Hospital Rio de Janeiro', 'Rio de Janeiro', '22.333.444/0001-55'),
    ('Hospital Belo Horizonte', 'Belo Horizonte', '33.444.555/0001-66')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir usuários de exemplo
INSERT INTO public.usuarios (email, hospital_id) VALUES
    ('admin@hospitalsaopaulo.com', (SELECT id FROM public.hospitais WHERE cnpj = '11.222.333/0001-44')),
    ('recepcionista@hospitalsaopaulo.com', (SELECT id FROM public.hospitais WHERE cnpj = '11.222.333/0001-44')),
    ('admin@hospitalrio.com', (SELECT id FROM public.hospitais WHERE cnpj = '22.333.444/0001-55')),
    ('coordenador@hospitalbh.com', (SELECT id FROM public.hospitais WHERE cnpj = '33.444.555/0001-66'))
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 7. VERIFICAÇÃO FINAL
-- ============================================================================
SELECT 
    'Tabelas hospitais e usuarios criadas com sucesso!' as status,
    (SELECT COUNT(*) FROM public.hospitais) as hospitais_criados,
    (SELECT COUNT(*) FROM public.usuarios) as usuarios_criados;

-- Verificar estrutura criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('hospitais', 'usuarios')
ORDER BY table_name, ordinal_position;
