export type StatusLiberacao = 'pendente' | 'liberado';
export type TipoAgendamento = 'cirurgico' | 'ambulatorial';

export interface Hospital {
  id: string;
  nome: string;
  cidade: string;
  cnpj: string;
}

export interface Usuario {
  id: string;
  email: string;
  hospital_id: string;
  hospital?: Hospital;
}

export interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  telefone: string;
  email: string;
  hospital_id: string;
  hospital?: Hospital;
}

export interface Procedimento {
  id: string;
  nome: string;
  tipo: TipoAgendamento;
  duracao_estimada_min: number;
  descricao?: string;
  hospital_id: string;
  hospital?: Hospital;
}

export interface Agendamento {
  id: string;
  nome_paciente: string;
  data_nascimento: string; // YYYY-MM-DD
  cidade_natal?: string;
  telefone?: string;
  whatsapp?: string;
  data_agendamento: string; // YYYY-MM-DD
  status_liberacao: StatusLiberacao;
  medico_id: string;
  procedimento_id: string;
  hospital_id: string;
  hospital?: Hospital;
}

// DTOs para requests
export interface CreateHospitalDTO {
  nome: string;
  cidade: string;
  cnpj: string;
}

export interface UpdateHospitalDTO extends Partial<CreateHospitalDTO> {}

export interface CreateUsuarioDTO {
  email: string;
  hospital_id: string;
}

export interface UpdateUsuarioDTO extends Partial<CreateUsuarioDTO> {}

export interface CreateMedicoDTO {
  nome: string;
  especialidade: string;
  crm: string;
  telefone: string;
  email: string;
  hospital_id: string;
}

export interface UpdateMedicoDTO extends Partial<CreateMedicoDTO> {}

export interface CreateProcedimentoDTO {
  nome: string;
  tipo: TipoAgendamento;
  duracao_estimada_min: number;
  descricao?: string;
  hospital_id: string;
}

export interface UpdateProcedimentoDTO extends Partial<CreateProcedimentoDTO> {}

export interface CreateAgendamentoDTO {
  nome_paciente: string;
  data_nascimento: string;
  cidade_natal?: string;
  telefone?: string;
  whatsapp?: string;
  data_agendamento: string;
  status_liberacao: StatusLiberacao;
  medico_id: string;
  procedimento_id: string;
  hospital_id: string;
}

export interface UpdateAgendamentoDTO extends Partial<CreateAgendamentoDTO> {}

// Response types com dados relacionados
export interface AgendamentoWithDetails extends Agendamento {
  medico?: Medico;
  procedimento?: Procedimento;
  idade?: number; // Calculada dinamicamente
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
