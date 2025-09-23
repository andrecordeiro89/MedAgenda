
export type StatusLiberacao = 'x' | 'v'; // x = pendente, v = liberado
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';
export type View = 'dashboard' | 'calendar' | 'management';

export interface Agendamento {
  id: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  idade: number;
  procedimentoId: string;
  medicoId: string;
  cidadeNatal: string;
  statusLiberacao: StatusLiberacao;
  telefone: string;
  whatsapp: string;
  dataAgendamento: string; // YYYY-MM-DD
  tipo: TipoAgendamento;
  hospitalId?: string; // ID do hospital
}

export interface Medico {
    id: string;
    nome: string;
    especialidade: string;
    crm: string;
    telefone: string;
    email: string;
    hospitalId?: string; // ID do hospital
}

export interface Procedimento {
    id: string;
    nome: string;
    tipo: TipoAgendamento;
    duracaoEstimada: number; // in minutes
    descricao: string;
    hospitalId?: string; // ID do hospital
}

export interface AppState {
    agendamentos: Agendamento[];
    medicos: Medico[];
    procedimentos: Procedimento[];
}

export type Action =
    | { type: 'ADD_AGENDAMENTO'; payload: Agendamento }
    | { type: 'UPDATE_AGENDAMENTO'; payload: Agendamento }
    | { type: 'DELETE_AGENDAMENTO'; payload: string }
    | { type: 'ADD_MEDICO'; payload: Medico }
    | { type: 'UPDATE_MEDICO'; payload: Medico }
    | { type: 'DELETE_MEDICO'; payload: string }
    | { type: 'ADD_PROCEDIMENTO'; payload: Procedimento }
    | { type: 'UPDATE_PROCEDIMENTO'; payload: Procedimento }
    | { type: 'DELETE_PROCEDIMENTO'; payload: string };
