import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import { 
  AuthProvider, 
  useAuth, 
  PremiumLoginSystem, 
  PremiumHospitalHeader,
  useHospitalFilter 
} from './components/PremiumLogin';
import { 
    medicoService,
    procedimentoService,
    agendamentoService,
    testSupabaseConnection
} from './services/supabase';

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO (COM LOGIN PREMIUM)
// ============================================================================
const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { hospitalSelecionado, addHospitalFilter } = useHospitalFilter();
    
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado dos dados
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

    // Função para carregar dados filtrados por hospital
    const loadData = async () => {
        if (!hospitalSelecionado) return;

        try {
            setLoading(true);
            setError(null);

            // Verificar se Supabase está disponível
            const isHealthy = await testSupabaseConnection();
            if (!isHealthy) {
                throw new Error('Erro de conexão com Supabase. Verifique as credenciais em services/supabase.ts');
            }

            // URLs com filtro por hospital
            const agendamentosUrl = addHospitalFilter('/api/agendamentos');
            const medicosUrl = addHospitalFilter('/api/medicos');
            const procedimentosUrl = addHospitalFilter('/api/procedimentos');

            // Carregar dados filtrados por hospital
            const [agendamentosData, medicosData, procedimentosData] = await Promise.all([
                fetch(agendamentosUrl).then(res => res.json()).then(data => data.success ? data.data : []),
                fetch(medicosUrl).then(res => res.json()).then(data => data.success ? data.data : []),
                fetch(procedimentosUrl).then(res => res.json()).then(data => data.success ? data.data : [])
            ]);

            setAgendamentos(agendamentosData);
            setMedicos(medicosData);
            setProcedimentos(procedimentosData);

        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // Carregar dados quando hospital for selecionado
    useEffect(() => {
        if (isAuthenticated && hospitalSelecionado) {
            loadData();
        }
    }, [isAuthenticated, hospitalSelecionado]);

    // Se não estiver autenticado, mostrar tela de login premium
    if (!isAuthenticated) {
        return <PremiumLoginSystem />;
    }

    // Loading screen premium
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    {/* Logo animado */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-2xl animate-pulse">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    
                    {/* Spinner animado */}
                    <div className="relative mb-6">
                        <div className="w-16 h-16 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">Carregando Sistema</h2>
                    <p className="text-blue-100 mb-4">
                        {hospitalSelecionado ? `Conectando ao ${hospitalSelecionado.nome}...` : 'Inicializando...'}
                    </p>
                    
                    {/* Barra de progresso animada */}
                    <div className="w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error screen premium
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    {/* Ícone de erro */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-2xl">
                        <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado</h2>
                    <p className="text-pink-100 mb-6 leading-relaxed">{error}</p>
                    
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Renderizar conteúdo da aplicação
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <Dashboard 
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView 
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                    />
                );
            case 'management':
                return (
                    <ManagementView
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                        onDataUpdate={loadData}
                        hospitalId={hospitalSelecionado?.id}
                    />
                );
            default:
                return <div>View não encontrada</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PremiumHospitalHeader />
            <Layout 
                currentView={currentView} 
                onViewChange={setCurrentView}
            >
                <div className="animate-fadeIn">
                    {renderContent()}
                </div>
            </Layout>
            
            {/* Estilos CSS customizados */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

// ============================================================================
// COMPONENTE APP PRINCIPAL (COM PROVIDER DE AUTENTICAÇÃO PREMIUM)
// ============================================================================
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
