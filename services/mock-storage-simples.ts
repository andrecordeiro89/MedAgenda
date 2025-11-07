// ============================================================================
// MOCK STORAGE SIMPLIFICADO - Apenas 4 Tabelas
// ============================================================================

import { Hospital, Usuario, Especialidade, Agendamento } from '../types-simples';

// ============================================================================
// DADOS INICIAIS
// ============================================================================

const HOSPITAIS_INICIAIS: Hospital[] = [
  {
    id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba',
    nome: 'Hospital Municipal Santa Alice',
    cidade: 'Santa Mariana',
    cnpj: '14.736.446/0001-93'
  },
  {
    id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e',
    nome: 'Hospital Municipal Juarez Barreto de Macedo',
    cidade: 'Faxinal',
    cnpj: '14.736.446/0006-06'
  },
  {
    id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da',
    nome: 'Hospital Municipal São José',
    cidade: 'Carlópolis',
    cnpj: '14.736.446/0007-89'
  },
  {
    id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a',
    nome: 'Hospital Municipal 18 de Dezembro',
    cidade: 'Arapoti',
    cnpj: '14.736.446/0008-60'
  }
];

const ESPECIALIDADES_INICIAIS: Especialidade[] = [
  { id: 'esp-1', nome: 'Ortopedia' },
  { id: 'esp-2', nome: 'Cardiologia' },
  { id: 'esp-3', nome: 'Neurologia' },
  { id: 'esp-4', nome: 'Pediatria' },
  { id: 'esp-5', nome: 'Ginecologia' },
  { id: 'esp-6', nome: 'Urologia' },
  { id: 'esp-7', nome: 'Oftalmologia' },
  { id: 'esp-8', nome: 'Dermatologia' },
  { id: 'esp-9', nome: 'Cirurgia Geral' },
  { id: 'esp-10', nome: 'Anestesiologia' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string, defaultValue: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Erro ao ler ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key}:`, error);
  }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

export function initializeMockData() {
  if (!localStorage.getItem('mock_hospitais')) {
    saveToStorage('mock_hospitais', HOSPITAIS_INICIAIS);
  }
  if (!localStorage.getItem('mock_especialidades')) {
    saveToStorage('mock_especialidades', ESPECIALIDADES_INICIAIS);
  }
  console.log('✅ Dados iniciais configurados');
}

// ============================================================================
// SERVICE: HOSPITAIS
// ============================================================================

export const mockHospitalService = {
  getAll(): Hospital[] {
    return getFromStorage('mock_hospitais', HOSPITAIS_INICIAIS);
  },

  getById(id: string): Hospital | undefined {
    return this.getAll().find(h => h.id === id);
  }
};

// ============================================================================
// SERVICE: ESPECIALIDADES
// ============================================================================

export const mockEspecialidadeService = {
  getAll(): Especialidade[] {
    return getFromStorage('mock_especialidades', ESPECIALIDADES_INICIAIS);
  }
};

// ============================================================================
// SERVICE: AGENDAMENTOS
// ============================================================================

export const mockAgendamentoService = {
  getAll(hospitalId?: string): Agendamento[] {
    const agendamentos = getFromStorage<Agendamento>('mock_agendamentos', []);
    if (hospitalId) {
      return agendamentos.filter(a => a.hospital_id === hospitalId);
    }
    return agendamentos;
  },

  getByDate(date: string, hospitalId?: string): Agendamento[] {
    return this.getAll(hospitalId).filter(a => a.data_agendamento === date);
  },

  create(agendamento: Omit<Agendamento, 'id'>): Agendamento {
    const agendamentos = getFromStorage<Agendamento>('mock_agendamentos', []);
    const novo: Agendamento = {
      id: generateId(),
      ...agendamento
    };
    agendamentos.push(novo);
    saveToStorage('mock_agendamentos', agendamentos);
    return novo;
  },

  update(id: string, data: Partial<Agendamento>): Agendamento {
    const agendamentos = getFromStorage<Agendamento>('mock_agendamentos', []);
    const index = agendamentos.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Agendamento não encontrado');
    
    agendamentos[index] = { ...agendamentos[index], ...data };
    saveToStorage('mock_agendamentos', agendamentos);
    return agendamentos[index];
  },

  delete(id: string): void {
    const agendamentos = getFromStorage<Agendamento>('mock_agendamentos', []);
    const filtered = agendamentos.filter(a => a.id !== id);
    saveToStorage('mock_agendamentos', filtered);
  }
};

// ============================================================================
// EXPORTAR SERVIÇOS
// ============================================================================

export const mockServicesSimples = {
  hospital: mockHospitalService,
  especialidade: mockEspecialidadeService,
  agendamento: mockAgendamentoService
};

// ============================================================================
// LIMPAR DADOS ANTIGOS
// ============================================================================

export function limparDadosAntigos() {
  const chavesAntigas = [
    'mock_medicos',
    'mock_procedimentos',
    'mock_metas',
    'medagenda-current-view'
  ];
  
  chavesAntigas.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Limpar grades cirúrgicas antigas
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('grade_')) {
      localStorage.removeItem(key);
    }
  }
  
  console.log('🗑️ Dados antigos removidos');
}

// Inicializar ao importar
initializeMockData();

