import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import { 
  AuthProvider, 
  useAuth, 
  LoginSystem, 
  HospitalHeader,
  useHospitalFilter 
} from './components/LoginSystem';
import { 
    medicoService,
    procedimentoService,
    agendamentoService,
    testSupabaseConnection
} from './services/supabase';

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO (COM AUTENTICAÇÃO)
// ============================================================================
const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
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

    // Se não estiver autenticado, mostrar tela de login
    if (!isAuthenticated) {
        return <LoginSystem />;
    }

    // Renderizar conteúdo da aplicação
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Carregando dados do {hospitalSelecionado?.nome}...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center max-w-md mx-auto p-6">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={loadData}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            );
        }

        // Renderizar view atual
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
            <HospitalHeader />
            <Layout 
                currentView={currentView} 
                onViewChange={setCurrentView}
            >
                {renderContent()}
            </Layout>
        </div>
    );
};

// ============================================================================
// COMPONENTE APP PRINCIPAL (COM PROVIDER DE AUTENTICAÇÃO)
// ============================================================================
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
