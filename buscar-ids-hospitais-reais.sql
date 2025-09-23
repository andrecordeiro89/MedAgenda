-- ============================================================================
-- BUSCAR IDs REAIS DOS HOSPITAIS PARA ATUALIZAR O SISTEMA - MEDAGENDA
-- ============================================================================

-- Buscar todos os hospitais com seus IDs reais para atualizar o mapeamento no frontend
SELECT 
    h.id,
    h.nome,
    h.cidade,
    h.cnpj,
    u.email as usuario_email
FROM public.hospitais h
LEFT JOIN public.usuarios u ON h.id = u.hospital_id
WHERE h.nome IN (
    'Hospital Municipal Santa Alice',
    'Hospital Municipal Juarez Barreto de Macedo', 
    'Hospital Municipal São José',
    'Hospital Municipal 18 de Dezembro',
    'Hospital Nossa Senhora Aparecida',
    'Hospital Maternidade Nossa Senhora Aparecida',
    'Hospital Maternidade Rio Branco do Sul'
)
ORDER BY h.nome;

-- Formato para copiar e colar no código (PremiumLogin.tsx)
SELECT 
    CONCAT(
        '''', u.email, ''': {', E'\n',
        '  id: ''', h.id, ''',', E'\n',
        '  nome: ''', h.nome, ''',', E'\n',
        '  cidade: ''', h.cidade, ''',', E'\n',
        '  cnpj: ''', h.cnpj, '''', E'\n',
        '},'
    ) as mapeamento_codigo
FROM public.hospitais h
JOIN public.usuarios u ON h.id = u.hospital_id
WHERE u.email LIKE '%@medagenda.com'
ORDER BY u.email;
