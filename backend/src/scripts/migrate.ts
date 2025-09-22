#!/usr/bin/env node

import dotenv from 'dotenv';
import { testConnection, closePool } from '../database/config';
import { createTables, dropTables } from '../database/migrations';

// Configurar variáveis de ambiente
dotenv.config();

const command = process.argv[2];

const showUsage = () => {
  console.log(`
📋 MedAgenda Database Migration Tool

Uso: npm run migrate [comando]

Comandos disponíveis:
  up      - Criar todas as tabelas e estruturas
  down    - Remover todas as tabelas (CUIDADO!)
  reset   - Remover e recriar todas as tabelas
  status  - Verificar status da conexão

Exemplos:
  npm run migrate up
  npm run migrate down
  npm run migrate reset
  npm run migrate status
  `);
};

const migrate = async () => {
  try {
    console.log('🔄 Iniciando migration...\n');

    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    switch (command) {
      case 'up':
        console.log('📈 Executando migration UP...');
        await createTables();
        console.log('✅ Migration UP concluída com sucesso!');
        break;

      case 'down':
        console.log('📉 Executando migration DOWN...');
        console.log('⚠️  ATENÇÃO: Esta operação removerá TODAS as tabelas e dados!');
        
        // Confirmar em produção
        if (process.env.NODE_ENV === 'production') {
          console.log('❌ Migration DOWN não permitida em produção');
          process.exit(1);
        }
        
        await dropTables();
        console.log('✅ Migration DOWN concluída com sucesso!');
        break;

      case 'reset':
        console.log('🔄 Executando migration RESET...');
        console.log('⚠️  ATENÇÃO: Esta operação removerá e recriará TODAS as tabelas!');
        
        // Confirmar em produção
        if (process.env.NODE_ENV === 'production') {
          console.log('❌ Migration RESET não permitida em produção');
          process.exit(1);
        }
        
        await dropTables();
        await createTables();
        console.log('✅ Migration RESET concluída com sucesso!');
        break;

      case 'status':
        console.log('📊 Status da conexão:');
        console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
        console.log(`   Database: ${process.env.DB_NAME || 'medagenda'}`);
        console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
        console.log('✅ Conexão ativa');
        break;

      default:
        console.log('❌ Comando inválido\n');
        showUsage();
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erro durante migration:', error);
    process.exit(1);
  } finally {
    await closePool();
    console.log('\n🔌 Conexões fechadas');
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  if (!command) {
    showUsage();
    process.exit(1);
  }
  
  migrate();
}

export { migrate };
