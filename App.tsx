import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento, Especialidade, MetaEspecialidade } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import AvaliacaoAnestesicaView from './components/AvaliacaoAnestesicaView';
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
    simpleMedicoHospitalService,
    simpleMetaEspecialidadeService
} from './services/api-simple';
import { testSupabaseConnection } from './services/supabase';
import { DataCacheProvider } from './contexts/DataCacheContext';

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

    // Se não estiver autenticado, mostrar tela de login premium
    if (!isAuthenticated) {
        return <PremiumLoginSystem />;
    }

    // Loading screen padrão
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                {/* Bolinhas de fundo para consistência */}
                <div className="absolute top-8 left-12 w-16 h-16 bg-sky-300 rounded-full mix-blend-multiply filter blur-sm opacity-40"></div>
                <div className="absolute top-1/4 right-16 w-20 h-20 bg-yellow-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
                <div className="absolute bottom-1/4 left-20 w-18 h-18 bg-emerald-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
                <div className="absolute bottom-16 right-20 w-16 h-16 bg-cyan-200 rounded-full mix-blend-multiply filter blur-sm opacity-35"></div>
                <div className="absolute top-1/2 left-1/4 w-14 h-14 bg-blue-200 rounded-full mix-blend-multiply filter blur-sm opacity-30"></div>
                <div className="absolute top-1/3 right-1/3 w-22 h-22 bg-indigo-200 rounded-full mix-blend-multiply filter blur-sm opacity-25"></div>
                
                <div className="text-center relative z-10">
                    {/* Loading spinner padrão com pontos */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
                            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-sky-500 animate-spin"></div>
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
                        hospitalId={hospitalSelecionado?.id || ''}
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
                        metasEspecialidades={metasEspecialidades}
                        hospitalId={hospitalSelecionado?.id || ''}
                        onRefresh={() => loadData(false)}
                    />
                );
            case 'avaliacao-anestesica':
                return (
                    <AvaliacaoAnestesicaView
                        agendamentos={agendamentos}
                        medicos={medicos}
                        procedimentos={procedimentos}
                        hospitalId={hospitalSelecionado?.id || ''}
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
            <DataCacheProvider>
                <AppContent />
            </DataCacheProvider>
        </AuthProvider>
    );
};

export default App;