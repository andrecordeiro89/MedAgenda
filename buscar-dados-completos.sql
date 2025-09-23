-- ============================================================================
-- BUSCAR DADOS COMPLETOS DOS HOSPITAIS E USUÁRIOS - MEDAGENDA
-- ============================================================================

-- Buscar todos os dados dos hospitais e usuários
SELECT 
    h.id as hospital_id,
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj,
    u.email as usuario_email
FROM public.hospitais h
LEFT JOIN public.usuarios u ON h.id = u.hospital_id
WHERE u.email LIKE '%@medagenda.com'
ORDER BY u.email;
