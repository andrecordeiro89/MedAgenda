
export type StatusLiberacao = 'pendente' | 'anestesista' | 'cardio' | 'exames' | 'liberado'; // Status de liberação do paciente
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';
export type View = 'dashboard' | 'calendar' | 'documentacao' | 'anestesista' | 'faturamento';

export interface Agendamento {
  id?: string;
  nome_paciente: string; // CAMPO REAL DO BANCO
  data_nascimento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  cidade_natal?: string | null; // CAMPO REAL DO BANCO (nullable)
  telefone?: string | null; // CAMPO REAL DO BANCO (nullable)
  n_prontuario?: string | null;
  data_agendamento: string; // CAMPO REAL DO BANCO (YYYY-MM-DD)
  data_consulta?: string | null; // NOVO CAMPO - Data da consulta médica (YYYY-MM-DD)
  hospital_id?: string | null; // CAMPO REAL DO BANCO (nullable)
  especialidade?: string | null; // NOVO CAMPO - Nome da especialidade
  medico?: string | null; // NOVO CAMPO - Nome do médico
  procedimentos?: string | null; // NOVO CAMPO - Nome do procedimento (FIXO - marca d'água)
  procedimento_especificacao?: string | null; // NOVO CAMPO - Especificação/subnome do procedimento (editável)
  created_at?: string;
  updated_at?: string;
  status_aih?: string | null; // Novo: Status AIH textual
  status_de_liberacao?: string | null; // Novo: Status de liberação textual simples
  tipo_de_exame?: string | null; // Novo: Tipo de exame selecionado para anexos
  documentos_meta?: any | null;
  observacao_agendamento?: string | null; // Novo: Observação geral do agendamento (Documentação)
  
  // Campos de documentação (fluxo pré-cirúrgico)
  documentos_ok?: boolean; // Indica se exames foram anexados pela recepção
  documentos_urls?: string | null; // JSON com URLs dos exames (ECG, laboratoriais, etc.)
  documentos_data?: string | null; // Data/hora do upload dos exames
  ficha_pre_anestesica_ok?: boolean; // Indica se ficha pré-operatória foi anexada
  ficha_pre_anestesica_url?: string | null; // URL da ficha pré-operatória
  ficha_pre_anestesica_data?: string | null; // Data/hora do upload da ficha
  complementares_ok?: boolean; // NOVO: Indica se documentos complementares foram anexados
  complementares_urls?: string | null; // NOVO: JSON com URLs dos complementares
  complementares_data?: string | null; // NOVO: Data/hora do upload dos complementares
  observacoes?: string | null; // Observações gerais
  
  // Campo para identificar registros de grade cirúrgica
  is_grade_cirurgica?: boolean; // Indica se é apenas estrutura de grade (não aparece em Documentação)
  
  // Campos de avaliação do anestesista
  avaliacao_anestesista?: 'aprovado' | 'reprovado' | 'complementares' | null; // Status da avaliação
  avaliacao_anestesista_observacao?: string | null; // Observações sobre a aprovação
  avaliacao_anestesista_motivo_reprovacao?: string | null; // Motivo da reprovação
  avaliacao_anestesista_complementares?: string | null; // Observações complementares
  avaliacao_anestesista_data?: string | null; // Data/hora da avaliação
  
  // Campos de liberação para faturamento G-SUS
  faturamento_liberado?: boolean | null; // NULL=não avaliado, TRUE=liberado (visual), FALSE=não liberado (salvo)
  faturamento_observacao?: string | null; // Observação obrigatória quando faturamento_liberado = FALSE
  faturamento_data?: string | null; // Data/hora da marcação
  faturamento_status?: 'pendente' | 'auditor' | 'autorizado' | null; // Status do processo: pendente, auditor, autorizado
  observacao_faturamento?: string | null; // Observação livre do faturamento
  
  // Justificativa de alteração em Agendamento (auditoria)
  justificativa_alteracao_agendamento?: string | null;
  justificativa_alteracao_agendamento_nome?: string | null;
  justificativa_alteracao_agendamento_nome_hora?: string | null;
  
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
    prontuario?: string | null;
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
    especificacao?: string; // Especificação editável do procedimento (ex: "meniscectomia medial à esquerda")
    statusAih?: string | null; // Status AIH do procedimento/agendamento
    n_prontuario?: string | null; // Nº do prontuário (espelho direto do banco)
    avaliacaoAnestesista?: 'aprovado' | 'reprovado' | 'complementares' | null; // Status da avaliação do anestesista (triagem visual)
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
