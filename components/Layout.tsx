import React, { useState, ReactNode } from 'react';
import { View } from '../types';
import { HomeIcon, CalendarIcon, ListIcon, XIcon } from './ui';

interface LayoutProps {
  currentView: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    
    const handleNavClick = (view: View) => {
        onViewChange(view);
        setMenuOpen(false); // Always close mobile menu on navigation
    };

    const navLinks = [
        { view: 'dashboard' as View, label: 'Dashboard', icon: <HomeIcon className="w-5 h-5"/> },
        { view: 'calendar' as View, label: 'Calendário', icon: <CalendarIcon className="w-5 h-5"/> },
        { view: 'management' as View, label: 'Gerenciamento', icon: <ListIcon className="w-5 h-5"/> }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-md sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg">
                                <CalendarIcon className="w-6 h-6 text-white"/>
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">AgendaMed</h1>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navLinks.map(link => (
                                <a 
                                    key={link.view}
                                    onClick={() => handleNavClick(link.view)}
                                    className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 text-sm font-medium ${
                                        currentView === link.view
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-blue-100 hover:text-primary'
                                    }`}
                                >
                                    {link.icon}
                                    <span className="ml-2">{link.label}</span>
                                </a>
                            ))}
                        </nav>

                        {/* Mobile Hamburger Button */}
                        <button className="md:hidden text-slate-600" onClick={() => setMenuOpen(!isMenuOpen)} aria-label="Abrir menu" aria-expanded={isMenuOpen}>
                             {isMenuOpen ? <XIcon className="h-6 w-6" /> : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                             )}
                        </button>
                    </div>
                </div>

                 {/* Mobile Navigation Menu */}
                <div className={`transition-all duration-300 ease-in-out md:hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <nav className="bg-white border-t border-slate-200 p-4 flex flex-col gap-2">
                        {navLinks.map(link => (
                             <a 
                                key={link.view}
                                onClick={() => handleNavClick(link.view)}
                                className={`flex items-center px-3 py-3 rounded-md cursor-pointer transition-colors duration-200 text-base font-medium ${
                                    currentView === link.view
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-blue-100 hover:text-primary'
                                }`}
                            >
                                {link.icon}
                                <span className="ml-3">{link.label}</span>
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="p-4 md:p-8 container mx-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
