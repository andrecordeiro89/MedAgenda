import { query } from './config';

export const createTables = async (): Promise<void> => {
  try {
    console.log('🚀 Iniciando criação das tabelas...');

    // Criar extensão UUID se não existir
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 1. Criar tabela hospitais
    await query(`
      CREATE TABLE IF NOT EXISTS hospitais (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        cidade VARCHAR(255) NOT NULL,
        cnpj VARCHAR(18) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Criar tabela usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL UNIQUE,
        hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Criar tabela medicos
    await query(`
      CREATE TABLE IF NOT EXISTS medicos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        especialidade VARCHAR(255) NOT NULL,
        crm VARCHAR(50) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(crm, hospital_id),
        UNIQUE(email, hospital_id)
      );
    `);

    // 4. Criar tabela procedimentos
    await query(`
      CREATE TABLE IF NOT EXISTS procedimentos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cirurgico', 'ambulatorial')),
        duracao_estimada_min INTEGER NOT NULL CHECK (duracao_estimada_min > 0),
        descricao TEXT,
        hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nome, hospital_id)
      );
    `);

    // 5. Criar tabela agendamentos
    await query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome_paciente VARCHAR(255) NOT NULL,
        data_nascimento DATE NOT NULL,
        cidade_natal VARCHAR(255),
        telefone VARCHAR(20),
        whatsapp VARCHAR(20),
        data_agendamento DATE NOT NULL,
        status_liberacao VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status_liberacao IN ('pendente', 'liberado')),
        medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
        procedimento_id UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
        hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(medico_id, data_agendamento)
      );
    `);

    // Criar índices para otimização
    await query(`
      CREATE INDEX IF NOT EXISTS idx_hospitais_cnpj ON hospitais(cnpj);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_hospital_id ON usuarios(hospital_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_medicos_hospital_id ON medicos(hospital_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_procedimentos_hospital_id ON procedimentos(hospital_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_hospital_id ON agendamentos(hospital_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_data_agendamento ON agendamentos(data_agendamento);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_medico_id ON agendamentos(medico_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_procedimento_id ON agendamentos(procedimento_id);
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status_liberacao);
    `);

    // Criar função para atualizar updated_at automaticamente
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Criar triggers para updated_at
    await query(`
      CREATE TRIGGER update_hospitais_updated_at BEFORE UPDATE ON hospitais
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON medicos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      CREATE TRIGGER update_procedimentos_updated_at BEFORE UPDATE ON procedimentos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await query(`
      CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
};

export const dropTables = async (): Promise<void> => {
  try {
    console.log('🗑️  Removendo tabelas...');
    
    await query('DROP TABLE IF EXISTS agendamentos CASCADE;');
    await query('DROP TABLE IF EXISTS procedimentos CASCADE;');
    await query('DROP TABLE IF EXISTS medicos CASCADE;');
    await query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
    
    console.log('✅ Tabelas removidas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao remover tabelas:', error);
    throw error;
  }
};
