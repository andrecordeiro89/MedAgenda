import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento, Especialidade, MetaEspecialidade } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import DocumentacaoView from './components/DocumentacaoView';
import AnestesiaView from './components/AnestesiaView';
import FaturamentoView from './components/FaturamentoView';
import { 
    AuthProvider, 
    useAuth, 
    PremiumLoginSystem,
    useHospitalFilter 
} from './components/PremiumLogin';
import { ToastProvider } from './contexts/ToastContext';
// ============================================================================
// MODO MOCK - Usando localStorage ao invés de Supabase
// Descomente as linhas abaixo quando o banco estiver pronto
// ============================================================================
// import { 
//     simpleMedicoService, 
//     simpleProcedimentoService,
//     simpleAgendamentoService,
//     simpleEspecialidadeService,
//     simpleMedicoHospitalService,
//     simpleMetaEspecialidadeService
// } from './services/api-simple';
// import { testSupabaseConnection } from './services/supabase';

// USANDO SERVIÇOS MOCK (localStorage) + ESPECIALIDADES DO SUPABASE
import {
    mockServices,
    populateSampleData
} from './services/mock-storage';

// Importar services REAIS do Supabase
import { especialidadeService, agendamentoService, testSupabaseConnection } from './services/supabase';

// Alias para manter compatibilidade com o código existente
const simpleMedicoService = mockServices.medico;
const simpleProcedimentoService = mockServices.procedimento;
const simpleAgendamentoService = agendamentoService; // ← AGORA USA SUPABASE REAL!
const simpleEspecialidadeService = especialidadeService; // ← AGORA USA SUPABASE!
const simpleMetaEspecialidadeService = mockServices.metaEspecialidade;

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO (COM LOGIN PREMIUM)
// ============================================================================
const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { hospitalSelecionado, addHospitalFilter, hasAccessToView } = useHospitalFilter();
    
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
    const [metasEspecialidades, setMetasEspecialidades] = useState<MetaEspecialidade[]>([]);

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
            const [agendamentosData, medicosData, procedimentosData, especialidadesData, metasData] = await Promise.all([
                simpleAgendamentoService.getAll(hospitalId),
                simpleMedicoService.getAll(hospitalId),
                simpleProcedimentoService.getAll(hospitalId),
                simpleEspecialidadeService.getAll(), // Especialidades são globais, não por hospital
                simpleMetaEspecialidadeService.getAll(hospitalId) // Metas são por hospital
            ]);

            setAgendamentos(agendamentosData);
            setMedicos(medicosData);
            setProcedimentos(procedimentosData);
            setEspecialidades(especialidadesData);
            setMetasEspecialidades(metasData);

            console.log('✅ Dados carregados:', {
                hospital: hospitalSelecionado.nome,
                agendamentos: agendamentosData.length,
                medicos: medicosData.length,
                procedimentos: procedimentosData.length,
                especialidades: especialidadesData.length,
                metas: metasData.length
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
    
    // Verificar se usuário tem acesso à view atual após o login
    useEffect(() => {
        if (isAuthenticated && !hasAccessToView(currentView)) {
            // Se não tem acesso, redirecionar para dashboard
            console.log(`⚠️ Usuário não tem acesso a "${currentView}". Redirecionando para dashboard...`);
            changeView('dashboard');
        }
    }, [isAuthenticated, currentView, hasAccessToView]);

    // Se não estiver autenticado, mostrar tela de login premium
    if (!isAuthenticated) {
        return <PremiumLoginSystem />;
    }

    // Loading screen padrão
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300"></div>
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                </div>
                <div className="text-center relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-300"></div>
                            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-gray-700 animate-spin"></div>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Carregando Sistema</h3>
                    <p className="text-slate-600 text-sm">
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
        // Verificar se o usuário tem acesso à view atual
        if (!hasAccessToView(currentView)) {
            // Se não tem acesso, mostrar mensagem de acesso negado
            return (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
                        <p className="text-slate-600 mb-4">
                            Você não tem permissão para acessar esta área do sistema.
                        </p>
                        <button
                            onClick={() => changeView('dashboard')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Voltar ao Dashboard
                        </button>
                    </div>
                </div>
            );
        }
        
        // Se tem acesso, renderizar a view normalmente
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
                        especialidades={especialidades}
                        metasEspecialidades={metasEspecialidades}
                        hospitalId={hospitalSelecionado?.id || ''}
                        onRefresh={() => loadData(false)}
                    />
                );
            case 'documentacao':
                return (
                    <DocumentacaoView 
                        hospitalId={hospitalSelecionado?.id || ''}
                    />
                );
            case 'anestesista':
                return (
                    <AnestesiaView 
                        hospitalId={hospitalSelecionado?.id || ''}
                    />
                );
            case 'faturamento':
                return (
                    <FaturamentoView 
                        hospitalId={hospitalSelecionado?.id || ''}
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
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </AuthProvider>
    );
};

export default App;
