// ============================================================================
// TIPOS SIMPLIFICADOS - Apenas 4 Tabelas
// ============================================================================

export type View = 'dashboard' | 'calendar';

// ============================================================================
// TABELA: hospitais
// ============================================================================
export interface Hospital {
  id: string;
  nome: string;
  cidade: string;
  cnpj: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TABELA: usuarios
// ============================================================================
export interface Usuario {
  id: string;
  email: string;
  hospital_id: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TABELA: especialidades
// ============================================================================
export interface Especialidade {
  id: string;
  nome: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TABELA: agendamentos
// ============================================================================
export interface Agendamento {
  id: string;
  nome_paciente: string;
  data_nascimento: string; // YYYY-MM-DD
  cidade_natal?: string | null;
  telefone?: string | null;
  data_agendamento: string; // YYYY-MM-DD
  hospital_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

// Para o sistema de autenticação
export interface AppUser {
  email: string;
  hospitais?: Hospital[];
}

// Para o contexto de autenticação
export interface AuthContextType {
  usuario: AppUser | null;
  hospitalSelecionado: Hospital | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  selectHospital: (hospital: Hospital) => void;
  logout: () => void;
}

