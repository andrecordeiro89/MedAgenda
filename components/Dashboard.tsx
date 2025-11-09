
import React, { useState, useEffect } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { Card } from './ui';
import { useAuth } from './PremiumLogin';
import { agendamentoService } from '../services/supabase';

interface DashboardProps {
    agendamentos: Agendamento[];
    medicos: Medico[];
    procedimentos: Procedimento[];
    onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agendamentos: agendamentosProps, medicos, procedimentos, onRefresh }) => {
    const { hospitalSelecionado } = useAuth();
    const [agendamentosComDocumentacao, setAgendamentosComDocumentacao] = useState<Agendamento[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    
    // Carregar agendamentos com campos de documentação do Supabase
    useEffect(() => {
        const carregarAgendamentosComDocs = async () => {
            if (!hospitalSelecionado?.id) return;
            
            setLoadingDocs(true);
            try {
                const dados = await agendamentoService.getAll(hospitalSelecionado.id);
                setAgendamentosComDocumentacao(dados);
            } catch (error) {
                console.error('Erro ao carregar agendamentos com documentação:', error);
                // Em caso de erro, usar os agendamentos recebidos como props
                setAgendamentosComDocumentacao(agendamentosProps);
            } finally {
                setLoadingDocs(false);
            }
        };
        
        carregarAgendamentosComDocs();
    }, [hospitalSelecionado?.id, agendamentosProps]);
    
    // Usar agendamentos com documentação se disponíveis, senão usar os props
    const agendamentos = agendamentosComDocumentacao.length > 0 ? agendamentosComDocumentacao : agendamentosProps;
    
    // Obter data atual no fuso horário de Brasília (America/Sao_Paulo)
    const getDataAtualBrasilia = () => {
        const agora = new Date();
        // Converter para o fuso horário de Brasília
        const dataAtualBrasilia = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        return dataAtualBrasilia.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Formatar data para exibição em português brasileiro
    const formatarDataCompleta = (dataString: string) => {
        const data = new Date(dataString + 'T00:00:00');
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        });
    };

    const dataHoje = getDataAtualBrasilia();
    const agendamentosHoje = agendamentos.filter(a => a.dataAgendamento === dataHoje);
    
    // Função para obter o tipo correto do agendamento baseado no procedimento
    const getAgendamentoTipo = (agendamento: Agendamento) => {
        const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
        return procedimento?.tipo || agendamento.tipo || 'ambulatorial';
    };
    
    // Calcular KPIs baseados na documentação (mesma lógica da tela Documentação)
    const aguardandoDocs = agendamentos.filter(a => {
        // Aguardando docs: documentos_ok não é true (pode ser false, null ou undefined)
        return !(a.documentos_ok === true);
    }).length;
    
    const aguardandoFicha = agendamentos.filter(a => {
        // Aguardando ficha: tem docs OK mas não tem ficha OK
        return a.documentos_ok === true && !(a.ficha_pre_anestesica_ok === true);
    }).length;
    
    const liberados = agendamentos.filter(a => {
        // Liberado: tem docs OK E ficha OK
        return a.documentos_ok === true && a.ficha_pre_anestesica_ok === true;
    }).length;
    
    // Debug: log dos KPIs calculados
    useEffect(() => {
        if (agendamentos.length > 0) {
            console.log('📊 Dashboard KPIs:', {
                total: agendamentos.length,
                aguardandoDocs,
                aguardandoFicha,
                liberados,
                amostra: agendamentos.slice(0, 3).map(a => ({
                    id: a.id,
                    nome: a.nome_paciente || a.nome,
                    documentos_ok: a.documentos_ok,
                    ficha_pre_anestesica_ok: a.ficha_pre_anestesica_ok
                }))
            });
        }
    }, [agendamentos, aguardandoDocs, aguardandoFicha, liberados]);

    // Funções auxiliares para buscar dados relacionados
    const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'Médico não encontrado';
    const getMedicoEspecialidade = (id: string) => medicos.find(m => m.id === id)?.especialidade || 'N/A';

    return (
        <div>
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .blink-animation {
                    animation: blink 1.5s ease-in-out infinite;
                }
            `}</style>
            <div className="mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                    Bem-vindo ao {hospitalSelecionado?.nome || 'Sistema MedAgenda'}
                </h2>
                <p className="text-slate-600 text-base">
                    Painel de controle e resumo das atividades
                </p>
            </div>
            
            {/* Barra Consolidada com Data e Todos os KPIs */}
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
                <div className="flex flex-col space-y-4">
                    {/* Linha 1: Data e Horário */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">
                                {formatarDataCompleta(dataHoje)}
                            </h3>
                            <p className="text-sm text-slate-600">
                                {hospitalSelecionado?.cidade || 'Brasil'} • Horário de Brasília • {new Date().toLocaleTimeString('pt-BR', {
                                    timeZone: 'America/Sao_Paulo',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                    
                    {/* Linha 2: Todos os KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* KPI 1: Aguardando Docs */}
                        <div className={`text-center p-4 rounded-lg border-2 ${
                            aguardandoDocs > 0 
                                ? 'border-red-500 bg-red-50/80 blink-animation shadow-lg shadow-red-200' 
                                : 'border-white/40 bg-white/60'
                        }`}>
                            <div className="flex items-center justify-center mb-2">
                                <svg className={`w-6 h-6 mr-2 ${aguardandoDocs > 0 ? 'text-red-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className={`text-2xl font-bold ${aguardandoDocs > 0 ? 'text-red-600' : 'text-red-500'}`}>
                                    {aguardandoDocs}
                                </p>
                            </div>
                            <p className={`text-sm font-semibold ${aguardandoDocs > 0 ? 'text-red-700' : 'text-slate-700'}`}>Aguardando Docs</p>
                            {aguardandoDocs > 0 && (
                                <p className="text-xs text-red-600 mt-1 font-medium blink-animation">⚠️ Atenção necessária</p>
                            )}
                        </div>
                        
                        {/* KPI 2: Aguardando Ficha */}
                        <div className={`text-center p-4 rounded-lg border-2 ${
                            aguardandoFicha > 0 
                                ? 'border-yellow-500 bg-yellow-50/80 blink-animation shadow-lg shadow-yellow-200' 
                                : 'border-white/40 bg-white/60'
                        }`}>
                            <div className="flex items-center justify-center mb-2">
                                <svg className={`w-6 h-6 mr-2 ${aguardandoFicha > 0 ? 'text-yellow-600' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className={`text-2xl font-bold ${aguardandoFicha > 0 ? 'text-yellow-600' : 'text-yellow-500'}`}>
                                    {aguardandoFicha}
                                </p>
                            </div>
                            <p className={`text-sm font-semibold ${aguardandoFicha > 0 ? 'text-yellow-700' : 'text-slate-700'}`}>Aguardando Ficha</p>
                            {aguardandoFicha > 0 && (
                                <p className="text-xs text-yellow-600 mt-1 font-medium blink-animation">⚠️ Atenção necessária</p>
                            )}
                        </div>
                        
                        {/* KPI 3: Liberado */}
                        <div className="text-center p-4 bg-white/60 rounded-lg border-2 border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-2xl font-bold text-green-600">{liberados}</p>
                            </div>
                            <p className="text-sm text-slate-700 font-semibold">Liberado</p>
                            {liberados > 0 && (
                                <p className="text-xs text-green-600 mt-1 font-medium">✅ Pronto para faturamento</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Agendamentos do Dia Atual */}
            <div className="mt-8">
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Agendamentos de Hoje</h3>
                        <span className="text-sm text-slate-500">
                            {new Date().toLocaleTimeString('pt-BR', {
                                timeZone: 'America/Sao_Paulo',
                                hour: '2-digit',
                                minute: '2-digit'
                            })} (Brasília)
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        {agendamentosHoje.length > 0 ? (
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-3 md:px-4 lg:px-6 py-2 md:py-3">Paciente</th>
                                        <th scope="col" className="px-3 md:px-4 lg:px-6 py-2 md:py-3 hidden md:table-cell">Médico</th>
                                        <th scope="col" className="px-3 md:px-4 lg:px-6 py-2 md:py-3 hidden lg:table-cell">Especialidade</th>
                                        <th scope="col" className="px-3 md:px-4 lg:px-6 py-2 md:py-3">Procedimento</th>
                                        <th scope="col" className="px-3 md:px-4 lg:px-6 py-2 md:py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agendamentosHoje
                                        .sort((a, b) => a.nome.localeCompare(b.nome))
                                        .map(a => (
                                            <tr key={a.id} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-slate-900">{a.nome}</td>
                                                <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 hidden md:table-cell">{getMedicoName(a.medicoId)}</td>
                                                <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 hidden lg:table-cell">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {getMedicoEspecialidade(a.medicoId)}
                                                    </span>
                                                </td>
                                                <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                                                    {procedimentos.find(p => p.id === a.procedimentoId)?.nome || 'N/A'}
                                                </td>
                                                <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${a.statusLiberacao === 'v' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {a.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-slate-500 text-lg">Nenhum agendamento para hoje</p>
                                <p className="text-slate-400 text-sm mt-1">Aproveite para organizar a agenda de amanhã!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
