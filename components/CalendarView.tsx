
import React, { useState } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, Modal } from './ui';
import { formatDate } from '../utils';

interface CalendarViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ agendamentos, medicos, procedimentos }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="border-r border-b"></div>);

  const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'N/A';
  const getProcedimentoName = (id: string) => procedimentos.find(p => p.id === id)?.nome || 'N/A';

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const selectedDateAppointments = selectedDate
    ? agendamentos.filter(
        a => a.dataAgendamento === selectedDate.toISOString().split('T')[0]
      )
    : [];

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    const dayAppointments = agendamentos.filter(a => a.dataAgendamento === dateString);

    const isToday = date.toDateString() === today.toDateString();

    days.push(
      <div
        key={day}
        className="border-r border-b p-2 cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => handleDayClick(day)}
      >
        <div className={`flex justify-center items-center w-8 h-8 rounded-full ${isToday ? 'bg-primary text-white' : ''}`}>{day}</div>
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {dayAppointments.some(a => a.tipo === 'ambulatorial') && <div className="w-2 h-2 rounded-full bg-blue-500" title="Ambulatorial"></div>}
            {dayAppointments.some(a => a.tipo === 'cirurgico') && <div className="w-2 h-2 rounded-full bg-red-500" title="Cirúrgico"></div>}
            {dayAppointments.some(a => a.statusLiberacao === 'v') && <div className="w-2 h-2 rounded-full bg-green-500" title="Liberado"></div>}
            {dayAppointments.some(a => a.statusLiberacao === 'x') && <div className="w-2 h-2 rounded-full bg-orange-500" title="Pendente"></div>}
        </div>
      </div>
    );
  }

  const LegendItem: React.FC<{color: string, label: string}> = ({color, label}) => (
    <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm text-slate-600">{label}</span>
    </div>
  );

  return (
    <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Calendário de Agendamentos</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
                <h3 className="text-xl font-semibold capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
            </div>
             <div className="flex flex-wrap gap-4 mb-4 p-2 justify-center">
                <LegendItem color="bg-blue-500" label="Ambulatorial" />
                <LegendItem color="bg-red-500" label="Cirúrgico" />
                <LegendItem color="bg-green-500" label="Liberado" />
                <LegendItem color="bg-orange-500" label="Pendente" />
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-slate-500 border-t border-l">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-2 border-r border-b">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 h-[60vh] text-center border-l">
                {days}
            </div>
        </div>

        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Agendamentos para ${selectedDate ? selectedDate.toLocaleDateString('pt-BR') : ''}`}
        >
            {selectedDateAppointments.length > 0 ? (
                <ul className="space-y-4">
                {selectedDateAppointments.map(a => (
                    <li key={a.id} className="p-3 bg-slate-50 rounded-md border-l-4 border-primary">
                        <p className="font-semibold">{a.nome} - {a.horario}</p>
                        <p className="text-sm text-slate-600">Procedimento: {getProcedimentoName(a.procedimentoId)}</p>
                        <p className="text-sm text-slate-600">Médico: {getMedicoName(a.medicoId)}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p>Nenhum agendamento para esta data.</p>
            )}
        </Modal>
    </div>
  );
};

export default CalendarView;
