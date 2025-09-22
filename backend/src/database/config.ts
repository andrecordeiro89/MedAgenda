import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medagenda',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // Tempo limite para estabelecer conexão
};

export const pool = new Pool(dbConfig);

// Função para testar a conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    return false;
  }
};

// Função para executar queries
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Função para fechar todas as conexões
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Pool de conexões fechado');
};
