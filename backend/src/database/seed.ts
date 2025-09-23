import { query } from './config';
import { v4 as uuidv4 } from 'uuid';

// Dados dos hospitais
const hospitais = [
  {
    id: uuidv4(),
    nome: 'Hospital São Paulo',
    cidade: 'São Paulo',
    cnpj: '11.222.333/0001-44'
  },
  {
    id: uuidv4(),
    nome: 'Hospital Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    cnpj: '22.333.444/0001-55'
  },
  {
    id: uuidv4(),
    nome: 'Hospital Belo Horizonte',
    cidade: 'Belo Horizonte',
    cnpj: '33.444.555/0001-66'
  }
];

// Dados dos usuários
const usuarios = [
  {
    id: uuidv4(),
    email: 'admin@hospitalsaopaulo.com',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    email: 'recepcionista@hospitalsaopaulo.com',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    email: 'admin@hospitalrio.com',
    hospital_id: hospitais[1].id
  },
  {
    id: uuidv4(),
    email: 'coordenador@hospitalbh.com',
    hospital_id: hospitais[2].id
  }
];

const medicos = [
  {
    id: uuidv4(),
    nome: 'Dr. Carlos Andrade',
    especialidade: 'Cardiologia',
    crm: '12345-SP',
    telefone: '(11) 98765-4321',
    email: 'carlos.andrade@hospital.com',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    nome: 'Dra. Ana Beatriz',
    especialidade: 'Ortopedia',
    crm: '54321-RJ',
    telefone: '(21) 91234-5678',
    email: 'ana.beatriz@hospital.com',
    hospital_id: hospitais[1].id
  },
  {
    id: uuidv4(),
    nome: 'Dr. João Paulo',
    especialidade: 'Neurologia',
    crm: '67890-MG',
    telefone: '(31) 95678-1234',
    email: 'joao.paulo@hospital.com',
    hospital_id: hospitais[2].id
  },
  {
    id: uuidv4(),
    nome: 'Dra. Mariana Costa',
    especialidade: 'Pediatria',
    crm: '09876-BA',
    telefone: '(71) 98888-7777',
    email: 'mariana.costa@hospital.com',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    nome: 'Dr. Ricardo Gomes',
    especialidade: 'Dermatologia',
    crm: '11223-PR',
    telefone: '(41) 97777-8888',
    email: 'ricardo.gomes@hospital.com',
    hospital_id: hospitais[1].id
  }
];

const procedimentos = [
  {
    id: uuidv4(),
    nome: 'Consulta de Rotina',
    tipo: 'ambulatorial',
    duracao_estimada_min: 30,
    descricao: 'Check-up geral com o clínico.',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    nome: 'Eletrocardiograma',
    tipo: 'ambulatorial',
    duracao_estimada_min: 45,
    descricao: 'Exame para avaliar a atividade elétrica do coração.',
    hospital_id: hospitais[0].id
  },
  {
    id: uuidv4(),
    nome: 'Cirurgia de Apendicite',
    tipo: 'cirurgico',
    duracao_estimada_min: 90,
    descricao: 'Remoção do apêndice inflamado.',
    hospital_id: hospitais[1].id
  },
  {
    id: uuidv4(),
    nome: 'Fisioterapia Ortopédica',
    tipo: 'ambulatorial',
    duracao_estimada_min: 60,
    descricao: 'Sessão de reabilitação física.',
    hospital_id: hospitais[1].id
  },
  {
    id: uuidv4(),
    nome: 'Endoscopia',
    tipo: 'cirurgico',
    duracao_estimada_min: 60,
    descricao: 'Exame para visualizar o sistema digestivo.',
    hospital_id: hospitais[2].id
  },
  {
    id: uuidv4(),
    nome: 'Aplicação de Botox',
    tipo: 'ambulatorial',
    duracao_estimada_min: 30,
    descricao: 'Procedimento estético.',
    hospital_id: hospitais[2].id
  }
];

const generateRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
};

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const NOMES_PACIENTES = [
  'Ana Silva', 'Bruno Souza', 'Carla Dias', 'Diego Rocha', 'Elisa Ferreira',
  'Fábio Lima', 'Gabriela Alves', 'Hugo Mendes', 'Isabela Santos', 'Jorge Costa',
  'Karina Oliveira', 'Lucas Pereira', 'Marina Santos', 'Nicolas Barbosa', 'Olivia Martins'
];
const CIDADES_NATAL = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Curitiba', 'Porto Alegre'];

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes (ordem importante devido às foreign keys)
    await query('DELETE FROM agendamentos');
    await query('DELETE FROM procedimentos');
    await query('DELETE FROM medicos');
    await query('DELETE FROM usuarios');
    await query('DELETE FROM hospitais');

    console.log('🧹 Dados existentes removidos');

    // Inserir hospitais
    for (const hospital of hospitais) {
      await query(
        `INSERT INTO hospitais (id, nome, cidade, cnpj) 
         VALUES ($1, $2, $3, $4)`,
        [hospital.id, hospital.nome, hospital.cidade, hospital.cnpj]
      );
    }
    console.log(`🏥 ${hospitais.length} hospitais inseridos`);

    // Inserir usuários
    for (const usuario of usuarios) {
      await query(
        `INSERT INTO usuarios (id, email, hospital_id) 
         VALUES ($1, $2, $3)`,
        [usuario.id, usuario.email, usuario.hospital_id]
      );
    }
    console.log(`👤 ${usuarios.length} usuários inseridos`);

    // Inserir médicos
    for (const medico of medicos) {
      await query(
        `INSERT INTO medicos (id, nome, especialidade, crm, telefone, email, hospital_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [medico.id, medico.nome, medico.especialidade, medico.crm, medico.telefone, medico.email, medico.hospital_id]
      );
    }
    console.log(`👨‍⚕️ ${medicos.length} médicos inseridos`);

    // Inserir procedimentos
    for (const procedimento of procedimentos) {
      await query(
        `INSERT INTO procedimentos (id, nome, tipo, duracao_estimada_min, descricao, hospital_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [procedimento.id, procedimento.nome, procedimento.tipo, procedimento.duracao_estimada_min, procedimento.descricao, procedimento.hospital_id]
      );
    }
    console.log(`🏥 ${procedimentos.length} procedimentos inseridos`);

    // Gerar agendamentos aleatórios
    const agendamentos = [];
    for (let i = 0; i < 25; i++) {
      const dataNascimento = generateRandomDate(new Date(1950, 0, 1), new Date(2005, 0, 1));
      const dataAgendamento = generateRandomDate(
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth() + 2, 28)
      );
      
      // Escolher um hospital aleatório
      const hospital = randomItem(hospitais);
      
      // Filtrar médicos e procedimentos do hospital escolhido
      const medicosDoHospital = medicos.filter(m => m.hospital_id === hospital.id);
      const procedimentosDoHospital = procedimentos.filter(p => p.hospital_id === hospital.id);
      
      // Se não houver médicos ou procedimentos neste hospital, pular
      if (medicosDoHospital.length === 0 || procedimentosDoHospital.length === 0) {
        continue;
      }

      const agendamento = {
        id: uuidv4(),
        nome_paciente: randomItem(NOMES_PACIENTES),
        data_nascimento: dataNascimento,
        cidade_natal: randomItem(CIDADES_NATAL),
        telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        whatsapp: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        data_agendamento: dataAgendamento,
        status_liberacao: Math.random() > 0.5 ? 'liberado' : 'pendente',
        medico_id: randomItem(medicosDoHospital).id,
        procedimento_id: randomItem(procedimentosDoHospital).id,
        hospital_id: hospital.id
      };
      
      agendamentos.push(agendamento);
    }

    // Inserir agendamentos (com tratamento de conflitos)
    let agendamentosInseridos = 0;
    for (const agendamento of agendamentos) {
      try {
        await query(
          `INSERT INTO agendamentos (id, nome_paciente, data_nascimento, cidade_natal, telefone, whatsapp, 
           data_agendamento, status_liberacao, medico_id, procedimento_id, hospital_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            agendamento.id, agendamento.nome_paciente, agendamento.data_nascimento,
            agendamento.cidade_natal, agendamento.telefone, agendamento.whatsapp,
            agendamento.data_agendamento, agendamento.status_liberacao,
            agendamento.medico_id, agendamento.procedimento_id, agendamento.hospital_id
          ]
        );
        agendamentosInseridos++;
      } catch (error: any) {
        // Ignorar conflitos de horário (constraint unique)
        if (error.code !== '23505') {
          throw error;
        }
      }
    }
    console.log(`📅 ${agendamentosInseridos} agendamentos inseridos`);

    console.log('✅ Seed do banco de dados concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
};

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
