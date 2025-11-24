-- ============================================
-- CRIAR TABELA DE CIDADES
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS cidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL DEFAULT 'PR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_cidades_nome ON cidades(nome);
CREATE INDEX IF NOT EXISTS idx_cidades_estado ON cidades(estado);

-- Constraint para evitar duplicatas
ALTER TABLE cidades ADD CONSTRAINT IF NOT EXISTS unique_cidade_estado UNIQUE (nome, estado);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_cidades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cidades_updated_at
BEFORE UPDATE ON cidades
FOR EACH ROW
EXECUTE FUNCTION update_cidades_updated_at();

-- ============================================
-- POPULAR COM CIDADES DO PARANÁ
-- ============================================

INSERT INTO cidades (nome, estado) VALUES
-- Cidades dos hospitais cadastrados
('Foz do Iguaçu', 'PR'),
('Santa Mariana', 'PR'),
('Faxinal', 'PR'),
('Carlópolis', 'PR'),
('Arapoti', 'PR'),
('Fazenda Rio Grande', 'PR'),
('Rio Branco do Sul', 'PR'),
('Apucarana', 'PR'),

-- Principais cidades do Paraná
('Curitiba', 'PR'),
('Londrina', 'PR'),
('Maringá', 'PR'),
('Ponta Grossa', 'PR'),
('Cascavel', 'PR'),
('São José dos Pinhais', 'PR'),
('Colombo', 'PR'),
('Guarapuava', 'PR'),
('Paranaguá', 'PR'),
('Araucária', 'PR'),
('Toledo', 'PR'),
('Pinhais', 'PR'),
('Campo Largo', 'PR'),
('Almirante Tamandaré', 'PR'),
('Umuarama', 'PR'),
('Paranavaí', 'PR'),
('Cambé', 'PR'),
('Piraquara', 'PR'),
('Arapongas', 'PR'),
('Sarandi', 'PR'),
('Telêmaco Borba', 'PR'),
('Castro', 'PR'),
('Irati', 'PR'),
('Rolândia', 'PR'),
('Pato Branco', 'PR'),
('Campo Mourão', 'PR'),
('Cianorte', 'PR'),
('Francisco Beltrão', 'PR'),
('União da Vitória', 'PR'),
('Apucarana', 'PR'),
('Dois Vizinhos', 'PR'),
('Cornélio Procópio', 'PR'),
('São Mateus do Sul', 'PR'),
('Paranacity', 'PR'),
('Ibiporã', 'PR'),
('Fazenda Rio Grande', 'PR'),
('Lapa', 'PR'),
('Loanda', 'PR'),
('Prudentópolis', 'PR'),
('Mandaguari', 'PR'),
('Palmas', 'PR'),
('Goioerê', 'PR'),
('Marechal Cândido Rondon', 'PR'),
('Medianeira', 'PR'),
('Ivaiporã', 'PR'),
('Jandaia do Sul', 'PR'),
('Santo Antônio da Platina', 'PR'),
('Quedas do Iguaçu', 'PR'),
('Ortigueira', 'PR'),
('Matinhos', 'PR'),
('Rio Negro', 'PR'),
('Bandeirantes', 'PR'),
('Matelândia', 'PR'),
('Pitanga', 'PR'),
('Jacarezinho', 'PR'),
('Assis Chateaubriand', 'PR'),
('Terra Roxa', 'PR'),
('Wenceslau Braz', 'PR'),
('Reserva', 'PR'),
('Laranjeiras do Sul', 'PR'),
('Palmeira', 'PR'),
('Andirá', 'PR'),
('Guaíra', 'PR'),
('Pérola', 'PR'),
('Santa Helena', 'PR'),
('Pontal do Paraná', 'PR'),
('Joaquim Távora', 'PR'),
('Antonina', 'PR'),
('Marialva', 'PR'),
('Realeza', 'PR'),
('Chopinzinho', 'PR'),
('Colorado', 'PR'),
('Nova Esperança', 'PR'),
('Guaratuba', 'PR'),
('Tibagi', 'PR'),
('Sengés', 'PR'),
('Antonina', 'PR'),
('Assaí', 'PR'),
('Morretes', 'PR'),
('Quedas do Iguaçu', 'PR'),
('Carambeí', 'PR'),
('Siqueira Campos', 'PR'),
('Ampére', 'PR'),
('Ipiranga', 'PR'),
('Foz do Jordão', 'PR'),
('Rio Branco do Ivaí', 'PR'),
('São Miguel do Iguaçu', 'PR'),
('Vera Cruz do Oeste', 'PR'),
('Ibaiti', 'PR'),
('Rebouças', 'PR'),
('Boa Esperança do Iguaçu', 'PR'),
('Formosa do Oeste', 'PR'),
('Altônia', 'PR'),
('Quatro Barras', 'PR'),
('Cambará', 'PR'),
('Capitão Leônidas Marques', 'PR'),
('Imbituva', 'PR'),
('Jaguariaíva', 'PR'),
('Nova Aurora', 'PR'),
('Cruzeiro do Oeste', 'PR'),
('São João do Ivaí', 'PR'),
('Centenário do Sul', 'PR'),
('Porto Amazonas', 'PR'),
('Diamante do Norte', 'PR'),
('Porecatu', 'PR'),
('Salto do Lontra', 'PR'),
('Guaraniaçu', 'PR')
ON CONFLICT (nome, estado) DO NOTHING;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT COUNT(*) as total_cidades FROM cidades;
SELECT * FROM cidades ORDER BY nome LIMIT 10;

