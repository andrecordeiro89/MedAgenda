import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Button, Input, Card } from './ui';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
export type UserRole = 'admin' | 'recepcao' | 'triagem' | 'faturamento';

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
  role: UserRole; // Novo campo para controle de acesso
}

interface AuthContextType {
  usuario: Usuario | null;
  hospitalSelecionado: Hospital | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null; // Novo campo para facilitar acesso
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
// CONTEXT DE AUTENTICAÇÃO PREMIUM
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
  const [isLoading, setIsLoading] = useState(false);

  // PERSISTÊNCIA: Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedAuth = localStorage.getItem('medagenda-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUsuario(authData.usuario);
        setHospitalSelecionado(authData.hospital);
        setIsAuthenticated(true);
        console.log('🔄 Login restaurado do localStorage:', authData.hospital.nome);
      } catch (error) {
        console.error('Erro ao restaurar login:', error);
        localStorage.removeItem('medagenda-auth');
      }
    }
  }, []);

  const login = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Sistema simples sem autenticação real - mapear email para hospital + role
      const emailHospitalMap: { [key: string]: { id: string; nome: string; cidade: string; cnpj: string; role: UserRole } } = {
        // Hospitais de exemplo (manter para compatibilidade)
        'admin@hospitalsaopaulo.com': {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nome: 'Hospital São Paulo',
          cidade: 'São Paulo',
          cnpj: '12.345.678/0001-90',
          role: 'admin'
        },
        'admin@hospitalrio.com': {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nome: 'Hospital Rio de Janeiro',
          cidade: 'Rio de Janeiro',
          cnpj: '98.765.432/0001-10',
          role: 'admin'
        },
        'admin@hospitalbrasilia.com': {
          id: '550e8400-e29b-41d4-a716-446655440003',
          nome: 'Hospital Brasília',
          cidade: 'Brasília',
          cnpj: '11.222.333/0001-44',
          role: 'admin'
        },
        // Hospitais reais com IDs do banco
        'agendamento.sm@medagenda.com': {
          id: '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba',
          nome: 'Hospital Municipal Santa Alice',
          cidade: 'Santa Mariana',
          cnpj: '14.736.446/0001-93',
          role: 'admin'
        },
        'agendamento.fax@medagenda.com': {
          id: '4111b99d-8b4a-4b51-9561-a2fbd14e776e',
          nome: 'Hospital Municipal Juarez Barreto de Macedo',
          cidade: 'Faxinal',
          cnpj: '14.736.446/0006-06',
          role: 'admin'
        },
        'agendamento.car@medagenda.com': {
          id: 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da',
          nome: 'Hospital Municipal São José',
          cidade: 'Carlópolis',
          cnpj: '14.736.446/0007-89',
          role: 'admin'
        },
        'agendamento.ara@medagenda.com': {
          id: '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a',
          nome: 'Hospital Municipal 18 de Dezembro',
          cidade: 'Arapoti',
          cnpj: '14.736.446/0008-60',
          role: 'admin'
        },
        'agendamento.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin'
        },
        'recepcao.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'recepcao' // ✅ Acesso restrito: Dashboard + Documentação
        },
        'triagem.foz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'triagem' // ✅ Acesso restrito: Dashboard + Documentação
        },
        'tifoz@medagenda.com': {
          id: 'ece028c8-3c6d-4d0a-98aa-efaa3565b55f',
          nome: 'Hospital Nossa Senhora Aparecida',
          cidade: 'Foz do Iguaçu',
          cnpj: '14.736.446/0009-40',
          role: 'admin' // 🔧 Usuário TI - Acesso total + permissão especial para editar procedimentos base
        },
        'agendamento.frg@medagenda.com': {
          id: '933de4fb-ebfd-4838-bb43-153a7354d333',
          nome: 'Hospital Maternidade Nossa Senhora Aparecida',
          cidade: 'Fazenda Rio Grande',
          cnpj: '14.736.446/0010-84',
          role: 'admin'
        },
        'agendamento.rbs@medagenda.com': {
          id: '4a2527c1-df09-4a36-a08f-adc63f555123',
          nome: 'Hospital Maternidade Rio Branco do Sul',
          cidade: 'Rio Branco do Sul',
          cnpj: '14.736.446/0012-46',
          role: 'admin'
        },
        'agendamento.apu@medagenda.com': {
          id: '54ccade1-9f7a-47c7-9bba-7fe02bfa9eb7',
          nome: 'Hospital Torao Tokuda',
          cidade: 'Apucarana',
          cnpj: '08325231001400',
          role: 'admin'
        }
      };

      const hospitalData = emailHospitalMap[email];
      
      if (!hospitalData) {
        throw new Error('Email não cadastrado no sistema');
      }

      // Criar usuário com role
      const usuario: Usuario = {
        id: `user-${Date.now()}`,
        email: email,
        hospital_id: hospitalData.id,
        hospital: hospitalData,
        role: hospitalData.role
      };

      setUsuario(usuario);
      setHospitalSelecionado(hospitalData);
      setIsAuthenticated(true);

      // PERSISTÊNCIA: Salvar no localStorage
      localStorage.setItem('medagenda-auth', JSON.stringify({
        usuario: usuario,
        hospital: hospitalData
      }));
      console.log('💾 Login salvo no localStorage:', hospitalData.nome, `(${hospitalData.role})`);
      
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
    
    // PERSISTÊNCIA: Limpar localStorage
    localStorage.removeItem('medagenda-auth');
    console.log('🚪 Logout - localStorage limpo');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        hospitalSelecionado,
        isAuthenticated,
        isLoading,
        userRole: usuario?.role || null,
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
// HOOK PARA FILTROS POR HOSPITAL E PERMISSÕES
// ============================================================================
export const useHospitalFilter = () => {
  const { hospitalSelecionado, userRole } = useAuth();

  // Função para adicionar filtro de hospital em query string (URL)
  const addHospitalFilter = (url: string): string => {
    if (!hospitalSelecionado) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}hospitalId=${hospitalSelecionado.id}`;
  };

  // Verificar se usuário tem acesso a uma view
  const hasAccessToView = (viewName: string): boolean => {
    if (!userRole) return false;
    
    // Admin tem acesso a tudo
    if (userRole === 'admin') return true;
    
    // Recepcao e Triagem têm acesso apenas a Dashboard e Documentação
    if (userRole === 'recepcao' || userRole === 'triagem') {
      return viewName === 'dashboard' || viewName === 'documentacao';
    }
    
    // Faturamento tem acesso a Dashboard, Documentação e Faturamento
    if (userRole === 'faturamento') {
      return ['dashboard', 'documentacao', 'faturamento'].includes(viewName);
    }
    
    return false;
  };

  return {
    hospitalSelecionado,
    addHospitalFilter,
    hasAccessToView,
    userRole
  };
};

// ============================================================================
// COMPONENTE DE LOGIN PREMIUM
// ============================================================================
interface PremiumLoginFormProps {
  onSuccess: (hospitais: Hospital[]) => void;
}

const PremiumLoginForm: React.FC<PremiumLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { login, isLoading } = useAuth();

  // Animação de digitação
  useEffect(() => {
    if (email.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Email deve ter formato válido');
      return;
    }

    setError('');

    try {
      await login(email);
      
      // Login bem-sucedido - usuário já está logado e hospital selecionado
      // Não precisa chamar onSuccess pois o login já fez tudo
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background com gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-50">
        <div className="absolute inset-0 opacity-20">
          {/* Padrão de pontos decorativo */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
        
        {/* Bolinhas de tinta guache espalhadas por todo o fundo */}
        {/* Linha 1 - Top */}
        <div className="absolute top-8 left-12 w-16 h-16 bg-sky-300 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        <div className="absolute top-12 left-32 w-12 h-12 bg-yellow-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute top-16 left-52 w-20 h-20 bg-emerald-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute top-6 right-16 w-14 h-14 bg-cyan-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute top-20 right-32 w-18 h-18 bg-blue-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute top-10 right-52 w-16 h-16 bg-indigo-200 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
        
        {/* Linha 2 - Upper Middle */}
        <div className="absolute top-24 left-8 w-22 h-22 bg-teal-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute top-32 left-28 w-14 h-14 bg-lime-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute top-28 left-48 w-16 h-16 bg-rose-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute top-36 right-12 w-20 h-20 bg-amber-200 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        <div className="absolute top-24 right-36 w-12 h-12 bg-violet-200 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
        <div className="absolute top-40 right-56 w-18 h-18 bg-pink-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        
        {/* Linha 3 - Center */}
        <div className="absolute top-1/2 left-16 w-24 h-24 bg-sky-300 rounded-full mix-blend-multiply filter blur-sm opacity-45"></div>
        <div className="absolute top-1/2 left-40 w-14 h-14 bg-yellow-300 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-emerald-300 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute top-1/2 right-44 w-20 h-20 bg-cyan-300 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        
        {/* Linha 4 - Lower Middle */}
        <div className="absolute bottom-32 left-12 w-18 h-18 bg-blue-300 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute bottom-28 left-36 w-16 h-16 bg-indigo-300 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute bottom-36 left-56 w-14 h-14 bg-teal-300 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute bottom-40 right-8 w-22 h-22 bg-lime-300 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        <div className="absolute bottom-32 right-32 w-12 h-12 bg-rose-300 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
        <div className="absolute bottom-28 right-52 w-20 h-20 bg-amber-300 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        
        {/* Linha 5 - Bottom */}
        <div className="absolute bottom-16 left-20 w-16 h-16 bg-violet-300 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute bottom-12 left-44 w-18 h-18 bg-pink-300 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute bottom-8 right-16 w-14 h-14 bg-sky-400 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
        <div className="absolute bottom-20 right-40 w-16 h-16 bg-yellow-400 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        
        {/* Bolinhas extras para preenchimento */}
        <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-emerald-400 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-cyan-400 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/3 w-14 h-14 bg-blue-400 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
        <div className="absolute bottom-1/3 right-1/4 w-18 h-18 bg-indigo-400 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
      </div>

      {/* Container principal */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-4 shadow-2xl">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">MedAgenda</h1>
          <p className="text-slate-600 text-lg">Sistema Multi-Hospitalar</p>
          <div className="w-24 h-1 bg-gradient-to-r from-sky-300 to-cyan-300 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Card de login */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de email */}
            <div className="space-y-2">
              <label className="text-slate-700 font-medium text-sm">Email Corporativo</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="seu.email@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all duration-300 ${
                    isTyping ? 'ring-2 ring-blue-400/50' : ''
                  } ${error ? 'ring-2 ring-red-400/50 border-red-400/50' : ''}`}
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm animate-shake">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                isLoading || !email.trim()
                  ? 'bg-gray-500/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Entrar no Sistema</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>


          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm mb-2">
              Sistema seguro e confiável para gestão hospitalar
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-600 text-sm">Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-600 text-sm">Multi-Hospital</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-600 text-sm">Rápido</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos CSS customizados */}
      <style jsx="true">{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE SELEÇÃO DE HOSPITAL PREMIUM
// ============================================================================
interface PremiumHospitalSelectorProps {
  hospitais: Hospital[];
  onSelect: (hospital: Hospital) => void;
  onBack: () => void;
}

const PremiumHospitalSelector: React.FC<PremiumHospitalSelectorProps> = ({ 
  hospitais, 
  onSelect, 
  onBack 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background similar ao login */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-50">
        <div className="absolute inset-0 opacity-20">
          {/* Padrão de pontos decorativo */}
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
      </div>

      {/* Container principal */}
      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Título */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Selecione o Hospital</h2>
          <p className="text-blue-100">Escolha qual hospital deseja acessar</p>
        </div>

        {/* Cards dos hospitais */}
        <div className="space-y-4">
          {hospitais.map((hospital, index) => (
            <button
              key={hospital.id}
              onClick={() => onSelect(hospital)}
              className="w-full p-6 text-left bg-white/90 backdrop-blur-md hover:bg-white/95 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-[1.02] group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-sky-300 to-emerald-300 rounded-full"></div>
                    <h3 className="text-slate-700 font-semibold text-lg">{hospital.nome}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-1">{hospital.cidade}</p>
                  <p className="text-slate-500 text-xs">CNPJ: {hospital.cnpj}</p>
                </div>
                <svg className="w-6 h-6 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Botão voltar */}
        <button
          onClick={onBack}
          className="w-full mt-6 py-3 px-6 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-300 hover:border-gray-400 text-slate-700 transition-all duration-200"
        >
          ← Voltar ao Login
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DE LOGIN PREMIUM
// ============================================================================
export const PremiumLoginSystem: React.FC = () => {
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
      <PremiumHospitalSelector
        hospitais={hospitaisDisponiveis}
        onSelect={handleHospitalSelect}
        onBack={handleBack}
      />
    );
  }

  return <PremiumLoginForm onSuccess={handleLoginSuccess} />;
};

// ============================================================================
// COMPONENTE DE CABEÇALHO PREMIUM
// ============================================================================
export const PremiumHospitalHeader: React.FC = () => {
  const { usuario, hospitalSelecionado, logout } = useAuth();

  if (!hospitalSelecionado || !usuario) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-sky-300 to-blue-400 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {hospitalSelecionado.nome}
              </h1>
              <p className="text-blue-100 text-sm">
                {hospitalSelecionado.cidade} • {usuario.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all duration-200 border border-white/20 hover:border-white/30"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

