
export type StatusLiberacao = 'anestesista' | 'cardio' | 'exames' | 'liberado'; // Status de liberação do paciente
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';
export type View = 'dashboard' | 'calendar' | 'documentacao' | 'faturamento';

export interface Agendamento {
  id?: string;
  nome_paciente: string; // CAMPO REAL DO BANCO
  data_nascimento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  cidade_natal?: string | null; // CAMPO REAL DO BANCO (nullable)
  telefone?: string | null; // CAMPO REAL DO BANCO (nullable)
  data_agendamento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  data_consulta?: string | null; // NOVO CAMPO - Data da consulta médica (YYYY-MM-DD)
  hospital_id?: string | null; // CAMPO REAL DO BANCO (nullable)
  especialidade?: string | null; // NOVO CAMPO - Nome da especialidade
  medico?: string | null; // NOVO CAMPO - Nome do médico
  procedimentos?: string | null; // NOVO CAMPO - Nome do procedimento
  created_at?: string;
  updated_at?: string;
  
  // Campos de documentação (fluxo pré-cirúrgico)
  documentos_ok?: boolean; // Indica se documentos foram anexados pela recepção
  documentos_urls?: string | null; // JSON com URLs dos documentos (ECG, exames, etc.)
  documentos_data?: string | null; // Data/hora do upload dos documentos
  ficha_pre_anestesica_ok?: boolean; // Indica se ficha pré-anestésica foi anexada
  ficha_pre_anestesica_url?: string | null; // URL da ficha pré-anestésica
  ficha_pre_anestesica_data?: string | null; // Data/hora do upload da ficha
  observacoes?: string | null; // Observações gerais
  
  // Campo para identificar registros de grade cirúrgica
  is_grade_cirurgica?: boolean; // Indica se é apenas estrutura de grade (não aparece em Documentação)
  
  // Campos auxiliares (compatibilidade antiga - podem ser removidos depois)
  idade?: number;
  procedimento_id?: string;
  medico_id?: string;
  status_liberacao?: StatusLiberacao;
  confirmacao?: string; // Status de confirmação: 'Aguardando' ou 'Confirmado'
  whatsapp?: string;
  tipo?: TipoAgendamento;
  nome?: string;
  dataNascimento?: string;
  dataAgendamento?: string;
  procedimentoId?: string;
  medicoId?: string;
  cidadeNatal?: string;
  hospitalId?: string;
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

// Dados completos do paciente para exibição
export interface PacienteGrade {
    nome: string;
    dataNascimento: string; // YYYY-MM-DD
    cidade?: string | null;
    telefone?: string | null;
    dataConsulta?: string | null;
}

export interface GradeCirurgicaItem {
    id: string;
    tipo: 'especialidade' | 'procedimento';
    texto: string;
    ordem: number;
    pacientes?: PacienteGrade[]; // Lista de pacientes com dados completos
    especialidadeId?: string; // ID da especialidade (quando tipo='especialidade')
    procedimentoId?: string; // ID do procedimento (quando tipo='procedimento')
    agendamentoId?: string; // ID do agendamento no banco (para UPDATE)
    medicoId?: string; // ID do médico associado ao procedimento (quando tipo='procedimento')
    medicoNome?: string; // Nome do médico associado ao procedimento (para exibição)
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

// Interface para cidades
export interface Cidade {
    id: string;
    nome: string;
    estado?: string; // Opcional - pode não existir na tabela
    created_at?: string;
    updated_at?: string;
}