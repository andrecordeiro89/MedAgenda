-- ============================================================================
-- INSERÇÃO DO USUÁRIO PARA HOSPITAL TORAO TOKUDA - MEDAGENDA
-- ============================================================================

-- Inserir usuário para o Hospital Torao Tokuda
INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) VALUES
('agendamento.apu@medagenda.com', '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7', NOW(), NOW());

-- Verificar se foi inserido corretamente
SELECT 'USUÁRIO TORAO TOKUDA INSERIDO:' as status;
SELECT 
    u.id as usuario_id,
    u.email, 
    h.nome as hospital_nome,
    h.cidade as hospital_cidade,
    h.cnpj as hospital_cnpj
FROM public.usuarios u 
JOIN public.hospitais h ON u.hospital_id = h.id 
WHERE u.email = 'agendamento.apu@medagenda.com';
