
export type StatusLiberacao = 'x' | 'v'; // x = pendente, v = liberado
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';
export type View = 'dashboard' | 'calendar' | 'management' | 'external';

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
    especialidade: string; // Manter para compatibilidade temporária
    especialidadeId?: string; // Nova referência para tabela especialidades
    crm: string;
    telefone: string;
    email: string;
    hospitalId?: string; // VOLTA AO MODELO SIMPLES
}

// Nova interface para relacionamento N:N
export interface MedicoHospital {
    id: string;
    medicoId: string;
    hospitalId: string;
    ativo: boolean;
    dataInicio: string; // YYYY-MM-DD
    dataFim?: string; // YYYY-MM-DD
    observacoes?: string;
}

// Interface para hospital
export interface Hospital {
    id: string;
    nome: string;
    cidade: string;
    cnpj: string;
}

export interface Especialidade {
    id: string;
    nome: string;
    descricao?: string;
}

// Dia da semana para metas
export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

// Interface para metas de agendamento por especialidade
export interface MetaEspecialidade {
    id: string;
    especialidadeId: string;
    especialidadeNome?: string; // Populado via JOIN
    diaSemana: DiaSemana;
    quantidadeAgendamentos: number;
    ativo: boolean;
    hospitalId: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Procedimento {
    id: string;
    nome: string;
    tipo: TipoAgendamento;
    duracaoEstimada: number; // in minutes
    descricao: string;
    especialidade?: string; // Nome da especialidade (coluna física)
    especialidadeId?: string; // ID da especialidade (relacionamento)
    hospitalId?: string; // ID do hospital
}

// Interfaces para Grade Cirúrgica
export interface GradeCirurgicaItem {
    id: string;
    tipo: 'especialidade' | 'procedimento';
    texto: string;
    ordem: number;
}

export interface GradeCirurgicaDia {
    data: string; // YYYY-MM-DD
    diaSemana: DiaSemana;
    itens: GradeCirurgicaItem[];
}

export interface GradeCirurgica {
    id: string;
    hospitalId: string;
    diaSemana: DiaSemana;
    mesReferencia: string; // YYYY-MM (ex: 2024-03)
    dias: GradeCirurgicaDia[];
    ativa: boolean;
    created_at?: string;
    updated_at?: string;
}

// Interface para procedimentos externos (SIGTAP)
export interface ExternalProcedureRecord {
    codigo_procedimento_original: string;
    procedure_description: string;
    complexity?: string;
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
