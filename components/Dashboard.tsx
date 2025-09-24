
import React from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { Card } from './ui';
import { useAuth } from './PremiumLogin';

interface DashboardProps {
    agendamentos: Agendamento[];
    medicos: Medico[];
    procedimentos: Procedimento[];
    onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agendamentos, medicos, procedimentos }) => {
    const { hospitalSelecionado } = useAuth();
    
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
    
    const totalAgendamentos = agendamentos.length;
    const pendentes = agendamentos.filter(a => a.statusLiberacao === 'x').length;
    const liberados = agendamentos.filter(a => a.statusLiberacao === 'v').length;
    const cirurgicos = agendamentos.filter(a => getAgendamentoTipo(a) === 'cirurgico').length;
    const ambulatoriais = agendamentos.filter(a => getAgendamentoTipo(a) === 'ambulatorial').length;

    // Funções auxiliares para buscar dados relacionados
    const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'Médico não encontrado';
    const getMedicoEspecialidade = (id: string) => medicos.find(m => m.id === id)?.especialidade || 'N/A';

    return (
        <div>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {/* KPI 1: Total de Agendamentos */}
                        <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <p className="text-lg font-bold text-blue-600">{totalAgendamentos}</p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Total de Agendamentos</p>
                        </div>
                        
                        {/* KPI 2: Agendamentos Liberados */}
                        <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-lg font-bold text-green-600">{liberados}</p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Agendamentos Liberados</p>
                        </div>
                        
                        {/* KPI 3: Agendamentos Pendentes */}
                        <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-lg font-bold text-orange-600">{pendentes}</p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Agendamentos Pendentes</p>
                        </div>
                        
                        {/* KPI 4: Procedimentos Cirúrgicos */}
                        <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20l16-16M8 4l8 8M4 8l8 8" />
                                    <circle cx="18" cy="6" r="2" strokeWidth={2} />
                                </svg>
                                <p className="text-lg font-bold text-red-600">{cirurgicos}</p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Procedimentos Cirúrgicos</p>
                        </div>
                        
                        {/* KPI 5: Atendimentos Ambulatoriais */}
                        <div className="text-center p-3 bg-white/60 rounded-lg border border-white/40">
                            <div className="flex items-center justify-center mb-2">
                                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <p className="text-lg font-bold text-indigo-600">{ambulatoriais}</p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Atendimentos Ambulatoriais</p>
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
