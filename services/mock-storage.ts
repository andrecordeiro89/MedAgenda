// ============================================================================
// MOCK STORAGE SERVICE - Simula backend usando localStorage
// Use este serviço enquanto não tiver o banco de dados pronto
// Mantém toda a funcionalidade do frontend funcionando
// ============================================================================

import { 
  Agendamento, 
  Medico, 
  Procedimento, 
  Especialidade, 
  MetaEspecialidade,
  Hospital,
  DiaSemana 
} from '../types';

// ============================================================================
// DADOS INICIAIS MOCK
// ============================================================================

const MOCK_HOSPITAIS: Hospital[] = [
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

const MOCK_ESPECIALIDADES: Especialidade[] = [
  { id: 'esp-1', nome: 'Ortopedia' },
  { id: 'esp-2', nome: 'Cardiologia' },
  { id: 'esp-3', nome: 'Neurologia' },
  { id: 'esp-4', nome: 'Pediatria' },
  { id: 'esp-5', nome: 'Ginecologia' },
  { id: 'esp-6', nome: 'Urologia' },
  { id: 'esp-7', nome: 'Oftalmologia' },
  { id: 'esp-8', nome: 'Dermatologia' },
  { id: 'esp-9', nome: 'Psiquiatria' },
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
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
  }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

export function initializeMockData() {
  // Inicializar hospitais se não existirem
  if (!localStorage.getItem('mock_hospitais')) {
    saveToStorage('mock_hospitais', MOCK_HOSPITAIS);
  }

  // Inicializar especialidades se não existirem
  if (!localStorage.getItem('mock_especialidades')) {
    saveToStorage('mock_especialidades', MOCK_ESPECIALIDADES);
  }

  console.log('✅ Dados mock inicializados no localStorage');
}

// ============================================================================
// SERVICE: HOSPITAIS
// ============================================================================

export const mockHospitalService = {
  getAll(): Hospital[] {
    return getFromStorage('mock_hospitais', MOCK_HOSPITAIS);
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
    return getFromStorage('mock_especialidades', MOCK_ESPECIALIDADES);
  },

  create(especialidade: Omit<Especialidade, 'id'>): Especialidade {
    const especialidades = this.getAll();
    const nova: Especialidade = {
      id: generateId(),
      ...especialidade
    };
    especialidades.push(nova);
    saveToStorage('mock_especialidades', especialidades);
    return nova;
  },

  update(id: string, data: Partial<Especialidade>): Especialidade {
    const especialidades = this.getAll();
    const index = especialidades.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Especialidade não encontrada');
    
    especialidades[index] = { ...especialidades[index], ...data };
    saveToStorage('mock_especialidades', especialidades);
    return especialidades[index];
  },

  delete(id: string): void {
    const especialidades = this.getAll();
    const filtered = especialidades.filter(e => e.id !== id);
    saveToStorage('mock_especialidades', filtered);
  }
};

// ============================================================================
// SERVICE: MÉDICOS
// ============================================================================

export const mockMedicoService = {
  getAll(hospitalId: string): Medico[] {
    const medicos = getFromStorage<Medico>('mock_medicos', []);
    return medicos.filter(m => m.hospitalId === hospitalId);
  },

  create(medico: Omit<Medico, 'id'>, hospitalId: string): Medico {
    const medicos = getFromStorage<Medico>('mock_medicos', []);
    const novo: Medico = {
      id: generateId(),
      ...medico,
      hospitalId
    };
    medicos.push(novo);
    saveToStorage('mock_medicos', medicos);
    return novo;
  },

  update(id: string, data: Partial<Medico>): Medico {
    const medicos = getFromStorage<Medico>('mock_medicos', []);
    const index = medicos.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Médico não encontrado');
    
    medicos[index] = { ...medicos[index], ...data };
    saveToStorage('mock_medicos', medicos);
    return medicos[index];
  },

  delete(id: string): void {
    const medicos = getFromStorage<Medico>('mock_medicos', []);
    const filtered = medicos.filter(m => m.id !== id);
    saveToStorage('mock_medicos', filtered);
  }
};

// ============================================================================
// SERVICE: PROCEDIMENTOS
// ============================================================================

export const mockProcedimentoService = {
  getAll(hospitalId: string): Procedimento[] {
    const procedimentos = getFromStorage<Procedimento>('mock_procedimentos', []);
    return procedimentos.filter(p => p.hospitalId === hospitalId);
  },

  create(procedimento: Omit<Procedimento, 'id'>): Procedimento {
    const procedimentos = getFromStorage<Procedimento>('mock_procedimentos', []);
    const novo: Procedimento = {
      id: generateId(),
      ...procedimento
    };
    procedimentos.push(novo);
    saveToStorage('mock_procedimentos', procedimentos);
    return novo;
  },

  update(id: string, data: Partial<Procedimento>): Procedimento {
    const procedimentos = getFromStorage<Procedimento>('mock_procedimentos', []);
    const index = procedimentos.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Procedimento não encontrado');
    
    procedimentos[index] = { ...procedimentos[index], ...data };
    saveToStorage('mock_procedimentos', procedimentos);
    return procedimentos[index];
  },

  delete(id: string): void {
    const procedimentos = getFromStorage<Procedimento>('mock_procedimentos', []);
    const filtered = procedimentos.filter(p => p.id !== id);
    saveToStorage('mock_procedimentos', filtered);
  }
};

// ============================================================================
// SERVICE: AGENDAMENTOS
// ============================================================================

export const mockAgendamentoService = {
  getAll(hospitalId: string): Agendamento[] {
    const agendamentos = getFromStorage<Agendamento>('mock_agendamentos', []);
    return agendamentos.filter(a => a.hospitalId === hospitalId);
  },

  getByDate(date: string, hospitalId: string): Agendamento[] {
    return this.getAll(hospitalId).filter(a => a.dataAgendamento === date);
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
// SERVICE: METAS DE ESPECIALIDADES
// ============================================================================

export const mockMetaEspecialidadeService = {
  getAll(hospitalId: string): MetaEspecialidade[] {
    const metas = getFromStorage<MetaEspecialidade>('mock_metas', []);
    return metas.filter(m => m.hospitalId === hospitalId);
  },

  create(meta: Omit<MetaEspecialidade, 'id' | 'created_at' | 'updated_at' | 'especialidadeNome'>): MetaEspecialidade {
    const metas = getFromStorage<MetaEspecialidade>('mock_metas', []);
    const especialidades = mockEspecialidadeService.getAll();
    const especialidade = especialidades.find(e => e.id === meta.especialidadeId);
    
    const nova: MetaEspecialidade = {
      id: generateId(),
      ...meta,
      especialidadeNome: especialidade?.nome || 'N/A',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    metas.push(nova);
    saveToStorage('mock_metas', metas);
    return nova;
  },

  update(id: string, data: Partial<Omit<MetaEspecialidade, 'id' | 'created_at' | 'updated_at' | 'especialidadeNome'>>): MetaEspecialidade {
    const metas = getFromStorage<MetaEspecialidade>('mock_metas', []);
    const index = metas.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Meta não encontrada');
    
    const especialidades = mockEspecialidadeService.getAll();
    const especialidade = data.especialidadeId 
      ? especialidades.find(e => e.id === data.especialidadeId)
      : especialidades.find(e => e.id === metas[index].especialidadeId);
    
    metas[index] = {
      ...metas[index],
      ...data,
      especialidadeNome: especialidade?.nome || metas[index].especialidadeNome,
      updated_at: new Date().toISOString()
    };
    saveToStorage('mock_metas', metas);
    return metas[index];
  },

  delete(id: string): void {
    const metas = getFromStorage<MetaEspecialidade>('mock_metas', []);
    const filtered = metas.filter(m => m.id !== id);
    saveToStorage('mock_metas', filtered);
  },

  getByEspecialidade(especialidadeId: string, hospitalId: string): MetaEspecialidade[] {
    return this.getAll(hospitalId).filter(m => m.especialidadeId === especialidadeId && m.ativo);
  }
};

// ============================================================================
// SERVICE: GRADES CIRÚRGICAS
// ============================================================================

export const mockGradeCirurgicaService = {
  async getGrade(hospitalId: string, diaSemana: string, mesReferencia: string) {
    const key = `grade_${hospitalId}_${diaSemana}_${mesReferencia}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  async saveGrade(grade: any): Promise<void> {
    const key = `grade_${grade.hospitalId}_${grade.diaSemana}_${grade.mesReferencia}`;
    localStorage.setItem(key, JSON.stringify(grade));
  },

  async getGradesByHospital(hospitalId: string): Promise<any[]> {
    const grades: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`grade_${hospitalId}_`)) {
        const data = localStorage.getItem(key);
        if (data) grades.push(JSON.parse(data));
      }
    }
    return grades;
  },

  async deleteGrade(gradeId: string): Promise<void> {
    // Simples implementação - você pode melhorar
    console.log('Grade deletada:', gradeId);
  },

  async getPrefixosMaisUsados(limit: number = 20): Promise<string[]> {
    // Retornar alguns prefixos comuns
    return ['LCA', 'MENISCO', 'PTJ', 'ARTROSCOPIA', 'PRÓTESE'];
  }
};

// ============================================================================
// FUNÇÃO PARA LIMPAR TODOS OS DADOS MOCK
// ============================================================================

export function clearAllMockData() {
  const keys = [
    'mock_hospitais',
    'mock_especialidades',
    'mock_medicos',
    'mock_procedimentos',
    'mock_agendamentos',
    'mock_metas'
  ];
  
  keys.forEach(key => localStorage.removeItem(key));
  
  // Limpar grades
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('grade_')) {
      localStorage.removeItem(key);
    }
  }
  
  console.log('🗑️ Todos os dados mock foram limpos');
}

// ============================================================================
// FUNÇÃO PARA POPULAR DADOS DE EXEMPLO
// ============================================================================

export function populateSampleData(hospitalId: string) {
  // Adicionar médicos de exemplo
  const medicos = [
    {
      nome: 'Dr. João Silva',
      especialidade: 'Ortopedia',
      crm: '12345-SP',
      telefone: '(11) 98765-4321',
      email: 'joao.silva@hospital.com'
    },
    {
      nome: 'Dra. Maria Santos',
      especialidade: 'Cardiologia',
      crm: '54321-SP',
      telefone: '(11) 91234-5678',
      email: 'maria.santos@hospital.com'
    },
    {
      nome: 'Dr. Pedro Costa',
      especialidade: 'Neurologia',
      crm: '67890-SP',
      telefone: '(11) 95678-1234',
      email: 'pedro.costa@hospital.com'
    }
  ];

  medicos.forEach(medico => {
    mockMedicoService.create(medico, hospitalId);
  });

  // Adicionar procedimentos de exemplo
  const procedimentos = [
    {
      nome: 'Consulta de Rotina',
      tipo: 'ambulatorial' as const,
      duracaoEstimada: 30,
      descricao: 'Consulta médica de rotina',
      hospitalId
    },
    {
      nome: 'Cirurgia de Joelho',
      tipo: 'cirurgico' as const,
      duracaoEstimada: 120,
      descricao: 'Procedimento cirúrgico no joelho',
      hospitalId
    },
    {
      nome: 'Eletrocardiograma',
      tipo: 'ambulatorial' as const,
      duracaoEstimada: 45,
      descricao: 'Exame do coração',
      hospitalId
    }
  ];

  procedimentos.forEach(proc => {
    mockProcedimentoService.create(proc);
  });

  console.log(`✅ Dados de exemplo adicionados para o hospital ${hospitalId}`);
}

// ============================================================================
// EXPORTAR TODOS OS SERVIÇOS
// ============================================================================

export const mockServices = {
  hospital: mockHospitalService,
  especialidade: mockEspecialidadeService,
  medico: mockMedicoService,
  procedimento: mockProcedimentoService,
  agendamento: mockAgendamentoService,
  metaEspecialidade: mockMetaEspecialidadeService,
  gradeCirurgica: mockGradeCirurgicaService
};

// Inicializar dados ao importar o módulo
initializeMockData();

