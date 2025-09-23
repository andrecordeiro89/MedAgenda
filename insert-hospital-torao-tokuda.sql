-- ============================================================================
-- INSERÇÃO DO HOSPITAL TORAO TOKUDA - MEDAGENDA
-- ============================================================================

-- Inserir hospital Torao Tokuda
INSERT INTO public.hospitais (nome, cidade, cnpj, created_at, updated_at) VALUES
('Hospital Torao Tokuda', 'Apucarana', '08325231001400', NOW(), NOW());

-- Buscar o ID do hospital recém-criado
SELECT id, nome, cidade, cnpj FROM public.hospitais 
WHERE nome = 'Hospital Torao Tokuda';

-- Inserir usuário associado ao hospital (substituir HOSPITAL_ID_AQUI pelo ID retornado acima)
-- Copie o ID do hospital da consulta acima e substitua na linha abaixo
-- INSERT INTO public.usuarios (email, hospital_id, created_at, updated_at) VALUES
-- ('agendamento.apu@medagenda.com', 'HOSPITAL_ID_AQUI', NOW(), NOW());

-- Verificar se foi inserido corretamente
SELECT 'HOSPITAL TORAO TOKUDA INSERIDO:' as status;
SELECT h.id, h.nome, h.cidade, h.cnpj FROM public.hospitais h 
WHERE h.nome = 'Hospital Torao Tokuda';
