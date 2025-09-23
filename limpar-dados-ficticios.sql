-- ============================================================================
-- LIMPEZA DOS DADOS FICTÍCIOS - MEDAGENDA
-- Manter apenas os hospitais reais para teste
-- ============================================================================

-- ATENÇÃO: Este script vai apagar TODOS os dados das tabelas!
-- Execute apenas se quiser começar do zero com dados limpos.

-- 1. Limpar agendamentos (todos)
DELETE FROM public.agendamentos;

-- 2. Limpar médicos (todos)
DELETE FROM public.medicos;

-- 3. Limpar procedimentos (todos)
DELETE FROM public.procedimentos;

-- 4. Limpar usuários fictícios (manter apenas os reais @medagenda.com)
DELETE FROM public.usuarios 
WHERE email NOT LIKE '%@medagenda.com';

-- 5. Limpar hospitais fictícios (manter apenas os reais)
DELETE FROM public.hospitais 
WHERE nome NOT IN (
    'Hospital Municipal Santa Alice',
    'Hospital Municipal Juarez Barreto de Macedo', 
    'Hospital Municipal São José',
    'Hospital Municipal 18 de Dezembro',
    'Hospital Nossa Senhora Aparecida',
    'Hospital Maternidade Nossa Senhora Aparecida',
    'Hospital Maternidade Rio Branco do Sul',
    'Hospital Torao Tokuda'
);

-- Verificar o que restou no banco
SELECT 'HOSPITAIS REAIS RESTANTES:' as status;
SELECT id, nome, cidade FROM public.hospitais ORDER BY nome;

SELECT 'USUÁRIOS REAIS RESTANTES:' as status;
SELECT u.email, h.nome as hospital FROM public.usuarios u 
JOIN public.hospitais h ON u.hospital_id = h.id 
ORDER BY u.email;

SELECT 'CONTADORES FINAIS:' as status;
SELECT COUNT(*) as total_hospitais FROM public.hospitais;
SELECT COUNT(*) as total_usuarios FROM public.usuarios;
SELECT COUNT(*) as total_medicos FROM public.medicos;
SELECT COUNT(*) as total_procedimentos FROM public.procedimentos;
SELECT COUNT(*) as total_agendamentos FROM public.agendamentos;
