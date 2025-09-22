#!/usr/bin/env node

import dotenv from 'dotenv';
import { testConnection, closePool } from '../database/config';
import { seedDatabase } from '../database/seed';

// Configurar variáveis de ambiente
dotenv.config();

const showUsage = () => {
  console.log(`
🌱 MedAgenda Database Seed Tool

Uso: npm run seed

Este script irá:
- Limpar dados existentes
- Inserir dados de exemplo (médicos, procedimentos, agendamentos)
- Popular o banco com dados para desenvolvimento/teste

⚠️  ATENÇÃO: Esta operação substituirá todos os dados existentes!
  `);
};

const seed = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }

    // Confirmar em produção
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Seed não permitido em ambiente de produção');
      process.exit(1);
    }

    console.log('⚠️  Esta operação irá substituir todos os dados existentes!');
    console.log('🔄 Executando seed...\n');

    await seedDatabase();

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📊 Dados inseridos:');
    console.log('   • 5 médicos com diferentes especialidades');
    console.log('   • 6 procedimentos (ambulatoriais e cirúrgicos)');
    console.log('   • ~25 agendamentos de exemplo');
    console.log('\n🎯 Banco de dados pronto para desenvolvimento!');

  } catch (error) {
    console.error('\n❌ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await closePool();
    console.log('\n🔌 Conexões fechadas');
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  const shouldSeed = process.argv[2];
  
  if (shouldSeed === '--help' || shouldSeed === '-h') {
    showUsage();
    process.exit(0);
  }

  seed();
}

export { seed };
