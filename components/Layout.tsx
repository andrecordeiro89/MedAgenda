import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { View, Agendamento } from '../types';
import { HomeIcon, CalendarIcon, ListIcon, XIcon } from './ui';
import { useAuth, useHospitalFilter } from './PremiumLogin';
import { agendamentoService } from '../services/supabase';

interface LayoutProps {
  currentView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
    const { usuario, hospitalSelecionado, logout } = useAuth();
    const { hasAccessToView } = useHospitalFilter();
    const [isMenuOpen, setMenuOpen] = useState(false);
    
    // Estados para alertas de pendências
    const [alertasAberto, setAlertasAberto] = useState(false);
    const [pendencias, setPendencias] = useState<Agendamento[]>([]);
    const [carregandoPendencias, setCarregandoPendencias] = useState(false);
    const alertasRef = useRef<HTMLDivElement>(null);
    
    // Carregar pendências dos próximos 7 dias
    useEffect(() => {
        const carregarPendencias = async () => {
            if (!hospitalSelecionado?.id) return;
            
            setCarregandoPendencias(true);
            try {
                const dados = await agendamentoService.getAll(hospitalSelecionado.id);
                
                // Data de hoje e daqui a 7 dias
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const em7Dias = new Date(hoje);
                em7Dias.setDate(em7Dias.getDate() + 7);
                
                // Filtrar pacientes nos próximos 7 dias com pendências
                const pendenciasFiltradas = dados.filter(ag => {
                    // Deve ter paciente e procedimento
                    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
                    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
                    if (!temPaciente || !temProcedimento) return false;
                    
                    // Verificar data de cirurgia nos próximos 7 dias
                    const dataCirurgia = ag.data_agendamento || ag.dataAgendamento;
                    if (!dataCirurgia) return false;
                    
                    const dataAg = new Date(dataCirurgia + 'T00:00:00');
                    const dentroDoRange = dataAg >= hoje && dataAg <= em7Dias;
                    if (!dentroDoRange) return false;
                    
                    // Verificar se falta exames OU pré-operatório
                    // null, undefined ou false = pendência
                    const faltaExames = !ag.documentos_ok;
                    const faltaPreOp = !ag.ficha_pre_anestesica_ok;
                    
                    return faltaExames || faltaPreOp;
                });
                
                // Ordenar por data de cirurgia (mais próximo primeiro)
                pendenciasFiltradas.sort((a, b) => {
                    const dataA = a.data_agendamento || a.dataAgendamento || '';
                    const dataB = b.data_agendamento || b.dataAgendamento || '';
                    return dataA.localeCompare(dataB);
                });
                
                setPendencias(pendenciasFiltradas);
            } catch (error) {
                console.error('Erro ao carregar pendências:', error);
            } finally {
                setCarregandoPendencias(false);
            }
        };
        
        carregarPendencias();
        
        // Atualizar a cada 5 minutos
        const interval = setInterval(carregarPendencias, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [hospitalSelecionado?.id]);
    
    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (alertasRef.current && !alertasRef.current.contains(event.target as Node)) {
                setAlertasAberto(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Formatar data
    const formatarData = (data: string | null | undefined) => {
        if (!data) return '-';
        const parts = data.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}`;
        }
        return data;
    };
    
    // Calcular dias até a cirurgia
    const diasAte = (data: string | null | undefined) => {
        if (!data) return null;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataAg = new Date(data + 'T00:00:00');
        const diff = Math.ceil((dataAg.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };
    
    const handleNavClick = (view: View) => {
        onViewChange(view);
        setMenuOpen(false);
    };

    // Todas as opções de navegação possíveis
    const allNavLinks = [
        { view: 'dashboard' as View, label: 'Dashboard', icon: <HomeIcon className="w-5 h-5"/> },
        { view: 'calendar' as View, label: 'Agenda', icon: <CalendarIcon className="w-5 h-5"/> },
        { view: 'documentacao' as View, label: 'Documentação', icon: <ListIcon className="w-5 h-5"/> },
        { view: 'anestesista' as View, label: 'Anestesista', icon: <ListIcon className="w-5 h-5"/> },
        { view: 'faturamento' as View, label: 'Faturamento', icon: <ListIcon className="w-5 h-5"/> }
    ];
    
    // Filtrar links baseado nas permissões do usuário
    const navLinks = allNavLinks.filter(link => hasAccessToView(link.view));

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Barra unificada neutra */}
            <header className="bg-gradient-to-r from-gray-700 to-gray-900 shadow-lg sticky top-0 z-30">
                <div className="w-full px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-6">
                        {/* Logo e nome - lado esquerdo (fixo) */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-white"/>
                            </div>
                            <h1 className="text-xl font-bold text-white whitespace-nowrap">MedAgenda</h1>
                        </div>

                        {/* Navegação central - Desktop (flexível) */}
                        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-3xl">
                            {navLinks.map(link => (
                                <button 
                                    key={link.view}
                                    onClick={() => handleNavClick(link.view)}
                                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium whitespace-nowrap ${
                                        currentView === link.view
                                        ? 'bg-white/20 text-white shadow-sm backdrop-blur-md border border-white/30'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {link.icon}
                                    <span className="ml-2">{link.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Usuário, Hospital e botão sair - lado direito (fixo) */}
                        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                            {/* Sininho de Alertas */}
                            <div className="relative" ref={alertasRef}>
                                <button
                                    onClick={() => setAlertasAberto(!alertasAberto)}
                                    className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title={`${pendencias.length} pendência(s) nos próximos 7 dias`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {pendencias.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                                            {pendencias.length > 99 ? '99+' : pendencias.length}
                                        </span>
                                    )}
                                </button>
                                
                                {/* Dropdown de Alertas */}
                                {alertasAberto && (
                                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                                        {/* Cabeçalho */}
                                        <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">🔔</span>
                                                    <h3 className="text-white font-bold">Pendências - Próximos 7 dias</h3>
                                                </div>
                                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                    {pendencias.length}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Lista de pendências */}
                                        <div className="max-h-96 overflow-y-auto">
                                            {carregandoPendencias ? (
                                                <div className="p-6 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto mb-2"></div>
                                                    <p className="text-gray-500 text-sm">Carregando...</p>
                                                </div>
                                            ) : pendencias.length === 0 ? (
                                                <div className="p-6 text-center">
                                                    <span className="text-4xl mb-2 block">✅</span>
                                                    <p className="text-gray-600 font-medium">Nenhuma pendência!</p>
                                                    <p className="text-gray-400 text-sm">Todos os pacientes dos próximos 7 dias estão com documentação completa.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {pendencias.map((ag) => {
                                                        const dias = diasAte(ag.data_agendamento || ag.dataAgendamento);
                                                        const faltaExames = ag.documentos_ok !== true;
                                                        const faltaPreOp = ag.ficha_pre_anestesica_ok !== true;
                                                        
                                                        return (
                                                            <div 
                                                                key={ag.id} 
                                                                className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    onViewChange('documentacao');
                                                                    setAlertasAberto(false);
                                                                }}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                                            {ag.nome_paciente || ag.nome}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 truncate">
                                                                            {ag.procedimentos}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            {faltaExames && (
                                                                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                                                                                    ❌ Exames
                                                                                </span>
                                                                            )}
                                                                            {faltaPreOp && (
                                                                                <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                                                                                    ❌ Pré-Op
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="text-xs font-medium text-gray-700">
                                                                            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
                                                                        </p>
                                                                        <p className={`text-xs font-bold ${
                                                                            dias === 0 ? 'text-red-600' :
                                                                            dias === 1 ? 'text-orange-600' :
                                                                            dias && dias <= 3 ? 'text-amber-600' :
                                                                            'text-gray-500'
                                                                        }`}>
                                                                            {dias === 0 ? '🚨 HOJE' :
                                                                             dias === 1 ? '⚠️ Amanhã' :
                                                                             `${dias} dias`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Rodapé */}
                                        {pendencias.length > 0 && (
                                            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                                                <button
                                                    onClick={() => {
                                                        onViewChange('documentacao');
                                                        setAlertasAberto(false);
                                                    }}
                                                    className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium py-1"
                                                >
                                                    Ver todos na Documentação →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-right">
                                <div className="text-white font-medium text-sm whitespace-nowrap">
                                    {usuario?.email || 'Usuário não logado'}
                                </div>
                                <div className="text-white/70 text-xs whitespace-nowrap">
                                    {hospitalSelecionado?.nome || 'Hospital não selecionado'}{hospitalSelecionado?.cidade && ` • ${hospitalSelecionado.cidade}`}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all duration-200 border border-white/20 hover:border-white/30 text-sm font-medium whitespace-nowrap"
                            >
                                Sair
                            </button>
                        </div>

                        {/* Botão mobile */}
                        <button 
                            className="md:hidden text-white flex-shrink-0" 
                            onClick={() => setMenuOpen(!isMenuOpen)} 
                            aria-label="Abrir menu"
                        >
                             {isMenuOpen ? <XIcon className="h-6 w-6" /> : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                             )}
                        </button>
                    </div>
                </div>

                {/* Menu mobile */}
                <div className={`transition-all duration-300 ease-in-out md:hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <nav className="bg-white/10 backdrop-blur-md border-t border-white/20 px-6 py-4 flex flex-col gap-2">
                        {navLinks.map(link => (
                             <button 
                                key={link.view}
                                onClick={() => handleNavClick(link.view)}
                                className={`flex items-center px-3 py-3 rounded-lg cursor-pointer transition-colors duration-200 text-base font-medium ${
                                    currentView === link.view
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {link.icon}
                                <span className="ml-3">{link.label}</span>
                            </button>
                        ))}
                        
                        {/* Usuário, Hospital e sair no mobile */}
                        <div className="border-t border-white/20 pt-4 mt-2">
                            <div className="px-3 py-2 text-white/80 text-sm">
                                <div className="font-medium">{usuario?.email || 'Usuário não logado'}</div>
                                <div className="text-white/60">
                                    {hospitalSelecionado?.nome || 'Hospital não selecionado'}
                                    {hospitalSelecionado?.cidade && ` • ${hospitalSelecionado.cidade}`}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full mt-2 px-3 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200 border border-white/20 text-base font-medium"
                            >
                                Sair
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main className={`py-6 ${
                // Telas que ocupam largura total (para tabelas grandes)
                currentView === 'documentacao' || currentView === 'anestesista' || currentView === 'faturamento'
                    ? 'w-full px-6 lg:px-8' 
                    // Outras telas mantêm container centralizado
                    : 'container mx-auto max-w-7xl px-4'
            }`}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
