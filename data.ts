
import { Medico, Procedimento, Agendamento } from './types';
import { generateUUID, calculateAge } from './utils';

export const MEDICOS: Medico[] = [
  { id: 'm1', nome: 'Dr. Carlos Andrade', especialidade: 'Cardiologia', crm: '12345-SP', telefone: '(11) 98765-4321', email: 'carlos.andrade@hospital.com' },
  { id: 'm2', nome: 'Dra. Ana Beatriz', especialidade: 'Ortopedia', crm: '54321-RJ', telefone: '(21) 91234-5678', email: 'ana.beatriz@hospital.com' },
  { id: 'm3', nome: 'Dr. João Paulo', especialidade: 'Neurologia', crm: '67890-MG', telefone: '(31) 95678-1234', email: 'joao.paulo@hospital.com' },
  { id: 'm4', nome: 'Dra. Mariana Costa', especialidade: 'Pediatria', crm: '09876-BA', telefone: '(71) 98888-7777', email: 'mariana.costa@hospital.com' },
  { id: 'm5', nome: 'Dr. Ricardo Gomes', especialidade: 'Dermatologia', crm: '11223-PR', telefone: '(41) 97777-8888', email: 'ricardo.gomes@hospital.com' },
];

export const PROCEDIMENTOS: Procedimento[] = [
  { id: 'p1', nome: 'Consulta de Rotina', tipo: 'ambulatorial', duracaoEstimada: 30, descricao: 'Check-up geral com o clínico.' },
  { id: 'p2', nome: 'Eletrocardiograma', tipo: 'ambulatorial', duracaoEstimada: 45, descricao: 'Exame para avaliar a atividade elétrica do coração.' },
  { id: 'p3', nome: 'Cirurgia de Apendicite', tipo: 'cirurgico', duracaoEstimada: 90, descricao: 'Remoção do apêndice inflamado.' },
  { id: 'p4', nome: 'Fisioterapia Ortopédica', tipo: 'ambulatorial', duracaoEstimada: 60, descricao: 'Sessão de reabilitação física.' },
  { id: 'p5', nome: 'Endoscopia', tipo: 'cirurgico', duracaoEstimada: 60, descricao: 'Exame para visualizar o sistema digestivo.' },
  { id: 'p6', nome: 'Aplicação de Botox', tipo: 'ambulatorial', duracaoEstimada: 30, descricao: 'Procedimento estético.' },
];

const generateRandomDate = (start: Date, end: Date): string => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
};

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


const NOMES_PACIENTES = ['Ana Silva', 'Bruno Souza', 'Carla Dias', 'Diego Rocha', 'Elisa Ferreira', 'Fábio Lima', 'Gabriela Alves', 'Hugo Mendes', 'Isabela Santos', 'Jorge Costa'];
const CIDADES_NATAL = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Curitiba', 'Porto Alegre'];

export const AGENDAMENTOS: Agendamento[] = Array.from({ length: 25 }, (_, i) => {
    const dataNascimento = generateRandomDate(new Date(1950, 0, 1), new Date(2005, 0, 1));
    const dataAgendamento = generateRandomDate(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 28));
    const procedimento = randomItem(PROCEDIMENTOS);
    return {
        id: generateUUID(),
        nome: randomItem(NOMES_PACIENTES),
        dataNascimento,
        idade: calculateAge(dataNascimento),
        procedimentoId: procedimento.id,
        medicoId: randomItem(MEDICOS).id,
        cidadeNatal: randomItem(CIDADES_NATAL),
        statusLiberacao: Math.random() > 0.5 ? 'v' : 'x',
        telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        whatsapp: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        dataAgendamento,
        tipo: procedimento.tipo,
    };
});
