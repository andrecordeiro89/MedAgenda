import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento, Especialidade } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import { 
  AuthProvider, 
  useAuth, 
  PremiumLoginSystem,
  useHospitalFilter 
} from './components/PremiumLogin';
import { 
    simpleMedicoService, 
    simpleProcedimentoService,
    simpleAgendamentoService,
    simpleEspecialidadeService,
    simpleMedicoHospitalService
} from './services/api-simple';
import { testSupabaseConnection } from './services/supabase';

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO (COM LOGIN PREMIUM)
// ============================================================================
const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { hospitalSelecionado, addHospitalFilter } = useHospitalFilter();
    
    // PERSISTÊNCIA: Carregar tela atual do localStorage
    const [currentView, setCurrentView] = useState<View>(() => {
        const savedView = localStorage.getItem('medagenda-current-view');
        return (savedView as View) || 'dashboard';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado dos dados
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
    const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

    // PERSISTÊNCIA: Salvar tela atual no localStorage quando muda
    const changeView = (newView: View) => {
        setCurrentView(newView);
        localStorage.setItem('medagenda-current-view', newView);
        console.log('📱 Tela salva no localStorage:', newView);
    };

    // Função para carregar dados filtrados por hospital
    const loadData = async (showGlobalLoading = true) => {
        if (!hospitalSelecionado) return;

        try {
            // Só mostra loading global se for o carregamento inicial
            if (showGlobalLoading) {
                setLoading(true);
                setError(null);
            }

            console.log('🏥 Carregando dados do hospital:', hospitalSelecionado.nome);

            // Verificar se Supabase está disponível
            const isHealthy = await testSupabaseConnection();
            if (!isHealthy) {
                throw new Error('Erro de conexão com Supabase. Verifique as credenciais em services/supabase.ts');
            }

            // Carregar dados filtrados por hospital usando serviços simplificados
            const hospitalId = hospitalSelecionado.id;
            const [agendamentosData, medicosData, procedimentosData, especialidadesData] = await Promise.all([
                simpleAgendamentoService.getAll(hospitalId),
                simpleMedicoService.getAll(hospitalId),
                simpleProcedimentoService.getAll(hospitalId),
                simpleEspecialidadeService.getAll() // Especialidades são globais, não por hospital
            ]);

            setAgendamentos(agendamentosData);
            setMedicos(medicosData);
            setProcedimentos(procedimentosData);
            setEspecialidades(especialidadesData);

            console.log('✅ Dados carregados:', {
                hospital: hospitalSelecionado.nome,
                agendamentos: agendamentosData.length,
                medicos: medicosData.length,
                procedimentos: procedimentosData.length,
                especialidades: especialidadesData.length
            });

            // Verificar se especialidades foram carregadas
            if (especialidadesData.length === 0) {
                console.warn('⚠️ Nenhuma especialidade encontrada. Verifique se a tabela foi criada no banco.');
            }

        } catch (err) {
            console.error('❌ Erro ao carregar dados:', err);
            if (showGlobalLoading) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados');
            }
        } finally {
            if (showGlobalLoading) {
                setLoading(false);
            }
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

    // Loading screen padrão
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    {/* Loading spinner padrão com pontos */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-4 border-white/20"></div>
                            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">Carregando Sistema</h3>
                    <p className="text-white/70 text-sm">
                        {hospitalSelecionado ? `Conectando ao ${hospitalSelecionado.nome}...` : 'Inicializando...'}
                    </p>
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
                        onRefresh={() => loadData(false)}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView 
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                        onRefresh={() => loadData(false)}
                    />
                );
            case 'management':
                return (
                    <ManagementView
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                        especialidades={especialidades}
                        onRefresh={() => loadData(false)}
                    />
                );
            default:
                return <div>View não encontrada</div>;
        }
    };

    return (
        <div>
            <Layout 
                currentView={currentView} 
                onViewChange={changeView}
            >
                <div className="animate-fadeIn">
                    {renderContent()}
                </div>
            </Layout>
                
                {/* Estilos CSS customizados */}
                <style jsx="true">{`
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