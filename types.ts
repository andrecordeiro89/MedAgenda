
export type StatusLiberacao = 'x' | 'v'; // x = pendente, v = liberado
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';
export type View = 'dashboard' | 'calendar' | 'management' | 'avaliacao-anestesica';

export interface Agendamento {
  id: string;
  nome_paciente: string; // CAMPO REAL DO BANCO
  data_nascimento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  idade?: number; // Calculado no frontend
  procedimento_id: string; // CAMPO REAL DO BANCO
  medico_id: string; // CAMPO REAL DO BANCO
  cidade_natal: string; // CAMPO REAL DO BANCO
  status_liberacao: StatusLiberacao; // CAMPO REAL DO BANCO (x ou v)
  telefone: string; // CAMPO REAL DO BANCO
  whatsapp: string; // CAMPO REAL DO BANCO
  data_agendamento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  hospital_id: string; // CAMPO REAL DO BANCO
  
  // Campos auxiliares (populados via JOIN ou calculados)
  tipo?: TipoAgendamento; // Calculado baseado no procedimento
  nome?: string; // Alias para nome_paciente (compatibilidade)
  dataNascimento?: string; // Alias para data_nascimento (compatibilidade)
  dataAgendamento?: string; // Alias para data_agendamento (compatibilidade)
  procedimentoId?: string; // Alias para procedimento_id (compatibilidade)
  medicoId?: string; // Alias para medico_id (compatibilidade)
  cidadeNatal?: string; // Alias para cidade_natal (compatibilidade)
  hospitalId?: string; // Alias para hospital_id (compatibilidade)
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
    nome: string; // CAMPO REAL DO BANCO (único campo)
}

// Interface para usuários da aplicação
export interface AppUser {
    id: string;
    login: string; // CAMPO REAL DO BANCO
    senha: string; // CAMPO REAL DO BANCO (use hash em produção!)
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
    nome: string; // CAMPO REAL DO BANCO (único campo existente)
    prefixo?: string; // NOVA COLUNA A ADICIONAR (prefixo do procedimento, ex: LCA, MENISCO)
    
    // Campos auxiliares (calculados ou obtidos via JOIN)
    tipo?: TipoAgendamento; // Calculado ou configurado
    duracaoEstimada?: number; // Calculado ou configurado
    descricao?: string; // Se precisar no futuro
    especialidade?: string; // Nome da especialidade (via JOIN)
    especialidadeId?: string; // ID da especialidade (via JOIN)
    hospitalId?: string; // ID do hospital (via JOIN)
}

// Interfaces para Grade Cirúrgica
export interface GradeCirurgicaItem {
    id: string;
    tipo: 'especialidade' | 'procedimento';
    texto: string;
    ordem: number;
    pacientes?: string[]; // Lista de nomes de pacientes vinculados ao procedimento
    especialidadeId?: string; // ID da especialidade (quando tipo='especialidade')
    procedimentoId?: string; // ID do procedimento (quando tipo='procedimento')
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
