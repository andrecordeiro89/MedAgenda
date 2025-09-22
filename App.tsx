
import React, { useState, useEffect } from 'react';
import { View, Agendamento, Medico, Procedimento } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import { 
    medicoService,
    procedimentoService,
    agendamentoService,
    testSupabaseConnection
} from './services/supabase';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado dos dados
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

    // Função para carregar todos os dados
    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Verificar se Supabase está disponível
            const isHealthy = await testSupabaseConnection();
            if (!isHealthy) {
                throw new Error('Erro de conexão com Supabase. Verifique as credenciais em services/supabase.ts');
            }

            // Carregar dados em paralelo
            const [agendamentosData, medicosData, procedimentosData] = await Promise.all([
                agendamentoService.getAll(),
                medicoService.getAll(),
                procedimentoService.getAll()
            ]);

            // Dados já vêm no formato correto do Supabase
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

    // Carregar dados na inicialização
    useEffect(() => {
        loadData();
    }, []);

    // Função para recarregar dados (será passada para componentes filhos)
    const refreshData = () => {
        loadData();
    };

    const renderView = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-slate-600">Carregando dados...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-md">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            <strong className="font-bold">Erro!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                        <button 
                            onClick={refreshData}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <Dashboard agendamentos={agendamentos} onRefresh={refreshData} />;
            case 'calendar':
                return (
                    <CalendarView 
                        agendamentos={agendamentos} 
                        medicos={medicos} 
                        procedimentos={procedimentos}
                        onRefresh={refreshData}
                    />
                );
            case 'management':
                return (
                    <ManagementView 
                        agendamentos={agendamentos} 
                        medicos={medicos} 
                        procedimentos={procedimentos} 
                        onRefresh={refreshData}
                    />
                );
            default:
                return <Dashboard agendamentos={agendamentos} onRefresh={refreshData} />;
        }
    };
    
    return (
        <Layout currentView={currentView} onViewChange={setCurrentView}>
            {renderView()}
        </Layout>
    );
};

export default App;
