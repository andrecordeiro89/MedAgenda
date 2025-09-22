
import React, { useReducer, useState } from 'react';
import { AppState, Action, Agendamento, Medico, Procedimento, View } from './types';
import { AGENDAMENTOS, MEDICOS, PROCEDIMENTOS } from './data';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import ManagementView from './components/ManagementView';
import { generateUUID, calculateAge } from './utils';

const initialState: AppState = {
    agendamentos: AGENDAMENTOS,
    medicos: MEDICOS,
    procedimentos: PROCEDIMENTOS,
};

function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        // Agendamento
        case 'ADD_AGENDAMENTO':
            const newAgendamento: Agendamento = {
                ...(action.payload as Omit<Agendamento, 'id'>),
                id: generateUUID(),
                idade: calculateAge(action.payload.dataNascimento),
            };
            return { ...state, agendamentos: [...state.agendamentos, newAgendamento] };
        case 'UPDATE_AGENDAMENTO':
            const updatedAgendamento = {
                ...action.payload,
                idade: calculateAge(action.payload.dataNascimento),
            };
            return {
                ...state,
                agendamentos: state.agendamentos.map(a => a.id === action.payload.id ? updatedAgendamento : a),
            };
        case 'DELETE_AGENDAMENTO':
            return { ...state, agendamentos: state.agendamentos.filter(a => a.id !== action.payload) };

        // Medico
        case 'ADD_MEDICO':
            const newMedico: Medico = {
                ...(action.payload as Omit<Medico, 'id'>),
                id: generateUUID(),
            };
            return { ...state, medicos: [...state.medicos, newMedico] };
        case 'UPDATE_MEDICO':
            return {
                ...state,
                medicos: state.medicos.map(m => m.id === action.payload.id ? action.payload : m),
            };
        case 'DELETE_MEDICO':
            return { ...state, medicos: state.medicos.filter(m => m.id !== action.payload) };

        // Procedimento
        case 'ADD_PROCEDIMENTO':
             const newProcedimento: Procedimento = {
                ...(action.payload as Omit<Procedimento, 'id'>),
                id: generateUUID(),
            };
            return { ...state, procedimentos: [...state.procedimentos, newProcedimento] };
        case 'UPDATE_PROCEDIMENTO':
            return {
                ...state,
                procedimentos: state.procedimentos.map(p => p.id === action.payload.id ? action.payload : p),
            };
        case 'DELETE_PROCEDIMENTO':
            return { ...state, procedimentos: state.procedimentos.filter(p => p.id !== action.payload) };
            
        default:
            return state;
    }
}


const App: React.FC = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [currentView, setCurrentView] = useState<View>('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard agendamentos={state.agendamentos} />;
            case 'calendar':
                return <CalendarView agendamentos={state.agendamentos} medicos={state.medicos} procedimentos={state.procedimentos}/>;
            case 'management':
                return <ManagementView 
                            agendamentos={state.agendamentos} 
                            medicos={state.medicos} 
                            procedimentos={state.procedimentos} 
                            dispatch={dispatch} 
                        />;
            default:
                return <Dashboard agendamentos={state.agendamentos} />;
        }
    };
    
    return (
        <Layout currentView={currentView} onViewChange={setCurrentView}>
            {renderView()}
        </Layout>
    );
};

export default App;
