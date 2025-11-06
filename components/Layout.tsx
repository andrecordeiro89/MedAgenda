import React, { useState, ReactNode } from 'react';
import { View } from '../types';
import { HomeIcon, CalendarIcon, ListIcon, XIcon } from './ui';
import { useAuth } from './PremiumLogin';

interface LayoutProps {
  currentView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
    const { usuario, hospitalSelecionado, logout } = useAuth();
    const [isMenuOpen, setMenuOpen] = useState(false);
    
    const handleNavClick = (view: View) => {
        onViewChange(view);
        setMenuOpen(false);
    };

    const navLinks = [
        { view: 'dashboard' as View, label: 'Dashboard', icon: <HomeIcon className="w-5 h-5"/> },
        { view: 'calendar' as View, label: 'Agenda', icon: <CalendarIcon className="w-5 h-5"/> },
        { view: 'management' as View, label: 'Gerenciamento', icon: <ListIcon className="w-5 h-5"/> },
        { view: 'avaliacao-anestesica' as View, label: 'Avaliação Anestésica', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> }
    ];

    const handleNewAppointment = () => {
        onViewChange('management');
        // Garantir que a aba agendamentos seja selecionada e abrir modal
        setTimeout(() => {
            // Primeiro clicar na aba agendamentos
            const agendamentosTab = document.querySelector('[data-tab="agendamentos"]') as HTMLButtonElement;
            if (agendamentosTab) agendamentosTab.click();
            
            // Depois clicar no botão novo
            setTimeout(() => {
                const newButton = document.querySelector('[data-new-appointment="true"]') as HTMLButtonElement;
                if (newButton) newButton.click();
            }, 50);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Barra unificada colorida */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo e nome - lado esquerdo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-white"/>
                            </div>
                            <h1 className="text-xl font-bold text-white">MedAgenda</h1>
                        </div>

                        {/* Navegação central - Desktop */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navLinks.map(link => (
                                <button 
                                    key={link.view}
                                    onClick={() => handleNavClick(link.view)}
                                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium ${
                                        currentView === link.view
                                        ? 'bg-white/20 text-white shadow-sm backdrop-blur-md border border-white/30'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {link.icon}
                                    <span className="ml-2">{link.label}</span>
                                </button>
                            ))}
                            
                            {/* Botão Novo Agendamento */}
                            <button 
                                onClick={handleNewAppointment}
                                className="flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm font-medium bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/40 ml-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="ml-2">Novo Agendamento</span>
                            </button>
                        </nav>

                        {/* Usuário, Hospital e botão sair - lado direito */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-white font-medium text-sm">
                                    {usuario?.email || 'Usuário não logado'}
                                </div>
                                <div className="text-white/70 text-xs">
                                    {hospitalSelecionado?.nome || 'Hospital não selecionado'} • {hospitalSelecionado?.cidade || ''}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all duration-200 border border-white/20 hover:border-white/30 text-sm font-medium"
                            >
                                Sair
                            </button>
                        </div>

                        {/* Botão mobile */}
                        <button 
                            className="md:hidden text-white" 
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
                    <nav className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4 flex flex-col gap-2">
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
                        
                        {/* Botão Novo Agendamento - Mobile */}
                        <button 
                            onClick={handleNewAppointment}
                            className="flex items-center px-3 py-3 rounded-lg cursor-pointer transition-colors duration-200 text-base font-medium bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/40 mt-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span className="ml-3">Novo Agendamento</span>
                        </button>
                        
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

            <main className="p-3 md:p-6 lg:p-8 container mx-auto max-w-7xl">
                {children}
            </main>
        </div>
    );
};

export default Layout;
