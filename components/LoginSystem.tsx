import React, { useState, createContext, useContext, ReactNode } from 'react';
import { Button, Modal, Input, FormField, Card } from './ui';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface Hospital {
  id: string;
  nome: string;
  cidade: string;
  cnpj: string;
}

interface Usuario {
  id: string;
  email: string;
  hospital_id: string;
  hospital?: Hospital;
}

interface AuthContextType {
  usuario: Usuario | null;
  hospitalSelecionado: Hospital | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  selecionarHospital: (hospital: Hospital) => void;
  logout: () => void;
}

interface LoginResponse {
  success: boolean;
  data: {
    usuario: Usuario;
    hospitais: Hospital[];
  };
  message?: string;
  error?: string;
}

// ============================================================================
// CONTEXT DE AUTENTICAÇÃO
// ============================================================================
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER DE AUTENTICAÇÃO
// ============================================================================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [hospitalSelecionado, setHospitalSelecionado] = useState<Hospital | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string): Promise<void> => {
    try {
      const response = await fetch('/api/usuarios/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data: LoginResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      setUsuario(data.data.usuario);
      
      // Se usuário tem apenas um hospital, seleciona automaticamente
      if (data.data.hospitais.length === 1) {
        setHospitalSelecionado(data.data.hospitais[0]);
        setIsAuthenticated(true);
      }
      // Se tem múltiplos hospitais, usuário precisa escolher
      // A seleção será feita no componente HospitalSelector
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const selecionarHospital = (hospital: Hospital) => {
    setHospitalSelecionado(hospital);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUsuario(null);
    setHospitalSelecionado(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        hospitalSelecionado,
        isAuthenticated,
        login,
        selecionarHospital,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// COMPONENTE DE LOGIN
// ============================================================================
interface LoginFormProps {
  onSuccess: (hospitais: Hospital[]) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email);
      
      // Buscar hospitais disponíveis para o usuário
      const response = await fetch('/api/usuarios/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data: LoginResponse = await response.json();
      
      if (data.success) {
        onSuccess(data.data.hospitais);
      }
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MedAgenda</h1>
        <p className="text-gray-600 mt-2">Sistema Multi-Hospitalar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" error={error}>
          <Input
            type="email"
            placeholder="seu.email@hospital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Usuários de teste:</p>
        <ul className="mt-2 space-y-1">
          <li>admin@hospitalsaopaulo.com</li>
          <li>admin@hospitalrio.com</li>
          <li>coordenador@hospitalbh.com</li>
        </ul>
      </div>
    </Card>
  );
};

// ============================================================================
// COMPONENTE DE SELEÇÃO DE HOSPITAL
// ============================================================================
interface HospitalSelectorProps {
  hospitais: Hospital[];
  onSelect: (hospital: Hospital) => void;
  onBack: () => void;
}

const HospitalSelector: React.FC<HospitalSelectorProps> = ({ 
  hospitais, 
  onSelect, 
  onBack 
}) => {
  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Selecione o Hospital</h2>
        <p className="text-gray-600 mt-2">Escolha qual hospital deseja acessar</p>
      </div>

      <div className="space-y-3">
        {hospitais.map((hospital) => (
          <button
            key={hospital.id}
            onClick={() => onSelect(hospital)}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-gray-900">{hospital.nome}</div>
            <div className="text-sm text-gray-600">{hospital.cidade}</div>
            <div className="text-xs text-gray-500">CNPJ: {hospital.cnpj}</div>
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={onBack}
        className="w-full mt-4"
      >
        Voltar
      </Button>
    </Card>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DE LOGIN
// ============================================================================
export const LoginSystem: React.FC = () => {
  const [hospitaisDisponiveis, setHospitaisDisponiveis] = useState<Hospital[]>([]);
  const [showHospitalSelector, setShowHospitalSelector] = useState(false);
  const { selecionarHospital } = useAuth();

  const handleLoginSuccess = (hospitais: Hospital[]) => {
    setHospitaisDisponiveis(hospitais);
    if (hospitais.length > 1) {
      setShowHospitalSelector(true);
    }
    // Se tem apenas 1 hospital, o AuthProvider já seleciona automaticamente
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    selecionarHospital(hospital);
    setShowHospitalSelector(false);
  };

  const handleBack = () => {
    setShowHospitalSelector(false);
    setHospitaisDisponiveis([]);
  };

  if (showHospitalSelector) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <HospitalSelector
          hospitais={hospitaisDisponiveis}
          onSelect={handleHospitalSelect}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
};

// ============================================================================
// COMPONENTE DE CABEÇALHO COM INFO DO HOSPITAL
// ============================================================================
export const HospitalHeader: React.FC = () => {
  const { usuario, hospitalSelecionado, logout } = useAuth();

  if (!hospitalSelecionado || !usuario) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {hospitalSelecionado.nome}
            </h1>
            <p className="text-sm text-gray-600">
              {hospitalSelecionado.cidade} • {usuario.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={logout}
        >
          Sair
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// HOOK PARA FILTROS POR HOSPITAL
// ============================================================================
export const useHospitalFilter = () => {
  const { hospitalSelecionado } = useAuth();

  const addHospitalFilter = (url: string): string => {
    if (!hospitalSelecionado) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}hospitalId=${hospitalSelecionado.id}`;
  };

  return { hospitalSelecionado, addHospitalFilter };
};
