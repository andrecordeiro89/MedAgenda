// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Tipos para as respostas da API
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

// Tipos adaptados para o backend
export interface MedicoAPI {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  telefone: string;
  email: string;
}

export interface ProcedimentoAPI {
  id: string;
  nome: string;
  tipo: 'cirurgico' | 'ambulatorial';
  duracao_estimada_min: number;
  descricao?: string;
}

export interface AgendamentoAPI {
  id: string;
  nome_paciente: string;
  data_nascimento: string;
  cidade_natal?: string;
  telefone?: string;
  whatsapp?: string;
  data_agendamento: string;
  horario: string;
  status_liberacao: 'pendente' | 'liberado';
  medico_id: string;
  procedimento_id: string;
  medico?: MedicoAPI;
  procedimento?: ProcedimentoAPI;
  idade?: number;
}

// Classe para gerenciar as chamadas da API
class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Métodos para Médicos
  async getMedicos(search?: string): Promise<MedicoAPI[]> {
    const endpoint = search ? `/medicos?q=${encodeURIComponent(search)}` : '/medicos';
    const response = await this.request<MedicoAPI[]>(endpoint);
    return response.data || [];
  }

  async getMedico(id: string): Promise<MedicoAPI> {
    const response = await this.request<MedicoAPI>(`/medicos/${id}`);
    if (!response.data) {
      throw new Error('Médico não encontrado');
    }
    return response.data;
  }

  async createMedico(medico: Omit<MedicoAPI, 'id'>): Promise<MedicoAPI> {
    const response = await this.request<MedicoAPI>('/medicos', {
      method: 'POST',
      body: JSON.stringify(medico),
    });
    if (!response.data) {
      throw new Error('Erro ao criar médico');
    }
    return response.data;
  }

  async updateMedico(id: string, medico: Partial<Omit<MedicoAPI, 'id'>>): Promise<MedicoAPI> {
    const response = await this.request<MedicoAPI>(`/medicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medico),
    });
    if (!response.data) {
      throw new Error('Erro ao atualizar médico');
    }
    return response.data;
  }

  async deleteMedico(id: string): Promise<void> {
    await this.request(`/medicos/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Procedimentos
  async getProcedimentos(search?: string, tipo?: 'cirurgico' | 'ambulatorial'): Promise<ProcedimentoAPI[]> {
    let endpoint = '/procedimentos';
    const params = new URLSearchParams();
    
    if (search) params.append('q', search);
    if (tipo) params.append('tipo', tipo);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await this.request<ProcedimentoAPI[]>(endpoint);
    return response.data || [];
  }

  async getProcedimento(id: string): Promise<ProcedimentoAPI> {
    const response = await this.request<ProcedimentoAPI>(`/procedimentos/${id}`);
    if (!response.data) {
      throw new Error('Procedimento não encontrado');
    }
    return response.data;
  }

  async createProcedimento(procedimento: Omit<ProcedimentoAPI, 'id'>): Promise<ProcedimentoAPI> {
    const response = await this.request<ProcedimentoAPI>('/procedimentos', {
      method: 'POST',
      body: JSON.stringify(procedimento),
    });
    if (!response.data) {
      throw new Error('Erro ao criar procedimento');
    }
    return response.data;
  }

  async updateProcedimento(id: string, procedimento: Partial<Omit<ProcedimentoAPI, 'id'>>): Promise<ProcedimentoAPI> {
    const response = await this.request<ProcedimentoAPI>(`/procedimentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(procedimento),
    });
    if (!response.data) {
      throw new Error('Erro ao atualizar procedimento');
    }
    return response.data;
  }

  async deleteProcedimento(id: string): Promise<void> {
    await this.request(`/procedimentos/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Agendamentos
  async getAgendamentos(params?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    medicoId?: string;
    status?: 'pendente' | 'liberado';
  }): Promise<AgendamentoAPI[]> {
    let endpoint = '/agendamentos';
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('q', params.search);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.medicoId) searchParams.append('medicoId', params.medicoId);
    if (params?.status) searchParams.append('status', params.status);
    
    if (searchParams.toString()) {
      endpoint += `?${searchParams.toString()}`;
    }

    const response = await this.request<AgendamentoAPI[]>(endpoint);
    return response.data || [];
  }

  async getAgendamento(id: string): Promise<AgendamentoAPI> {
    const response = await this.request<AgendamentoAPI>(`/agendamentos/${id}`);
    if (!response.data) {
      throw new Error('Agendamento não encontrado');
    }
    return response.data;
  }

  async getAgendamentosByDate(date: string): Promise<AgendamentoAPI[]> {
    const response = await this.request<AgendamentoAPI[]>(`/agendamentos/date/${date}`);
    return response.data || [];
  }

  async createAgendamento(agendamento: Omit<AgendamentoAPI, 'id' | 'medico' | 'procedimento' | 'idade'>): Promise<AgendamentoAPI> {
    const response = await this.request<AgendamentoAPI>('/agendamentos', {
      method: 'POST',
      body: JSON.stringify(agendamento),
    });
    if (!response.data) {
      throw new Error('Erro ao criar agendamento');
    }
    return response.data;
  }

  async updateAgendamento(id: string, agendamento: Partial<Omit<AgendamentoAPI, 'id' | 'medico' | 'procedimento' | 'idade'>>): Promise<AgendamentoAPI> {
    const response = await this.request<AgendamentoAPI>(`/agendamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agendamento),
    });
    if (!response.data) {
      throw new Error('Erro ao atualizar agendamento');
    }
    return response.data;
  }

  async deleteAgendamento(id: string): Promise<void> {
    await this.request(`/agendamentos/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para estatísticas
  async getAgendamentosStatistics(): Promise<{
    total: number;
    pendentes: number;
    liberados: number;
    cirurgicos: number;
    ambulatoriais: number;
    proximosAgendamentos: AgendamentoAPI[];
  }> {
    const response = await this.request<any>('/agendamentos/statistics');
    return response.data || {
      total: 0,
      pendentes: 0,
      liberados: 0,
      cirurgicos: 0,
      ambulatoriais: 0,
      proximosAgendamentos: []
    };
  }

  async getProcedimentosStatistics(): Promise<{
    total: number;
    cirurgicos: number;
    ambulatoriais: number;
    duracaoMedia: number;
  }> {
    const response = await this.request<any>('/procedimentos/statistics');
    return response.data || {
      total: 0,
      cirurgicos: 0,
      ambulatoriais: 0,
      duracaoMedia: 0
    };
  }

  // Verificar saúde da API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Instância singleton da API
export const apiService = new ApiService();

// Funções de conversão entre tipos frontend e backend
export const convertMedicoFromAPI = (medico: MedicoAPI) => ({
  id: medico.id,
  nome: medico.nome,
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
});

export const convertMedicoToAPI = (medico: any): Omit<MedicoAPI, 'id'> => ({
  nome: medico.nome,
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
});

export const convertProcedimentoFromAPI = (procedimento: ProcedimentoAPI) => ({
  id: procedimento.id,
  nome: procedimento.nome,
  tipo: procedimento.tipo,
  duracaoEstimada: procedimento.duracao_estimada_min,
  descricao: procedimento.descricao || '',
});

export const convertProcedimentoToAPI = (procedimento: any): Omit<ProcedimentoAPI, 'id'> => ({
  nome: procedimento.nome,
  tipo: procedimento.tipo,
  duracao_estimada_min: procedimento.duracaoEstimada,
  descricao: procedimento.descricao,
});

export const convertAgendamentoFromAPI = (agendamento: AgendamentoAPI) => ({
  id: agendamento.id,
  nome: agendamento.nome_paciente,
  dataNascimento: agendamento.data_nascimento,
  idade: agendamento.idade || 0,
  procedimentoId: agendamento.procedimento_id,
  medicoId: agendamento.medico_id,
  cidadeNatal: agendamento.cidade_natal || '',
  statusLiberacao: agendamento.status_liberacao === 'liberado' ? 'v' as const : 'x' as const,
  telefone: agendamento.telefone || '',
  whatsapp: agendamento.whatsapp || '',
  dataAgendamento: agendamento.data_agendamento,
  horario: agendamento.horario,
  tipo: agendamento.procedimento?.tipo || 'ambulatorial' as const,
});

export const convertAgendamentoToAPI = (agendamento: any): Omit<AgendamentoAPI, 'id' | 'medico' | 'procedimento' | 'idade'> => ({
  nome_paciente: agendamento.nome,
  data_nascimento: agendamento.dataNascimento,
  cidade_natal: agendamento.cidadeNatal || undefined,
  telefone: agendamento.telefone || undefined,
  whatsapp: agendamento.whatsapp || undefined,
  data_agendamento: agendamento.dataAgendamento,
  horario: agendamento.horario,
  status_liberacao: agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente',
  medico_id: agendamento.medicoId,
  procedimento_id: agendamento.procedimentoId,
});
