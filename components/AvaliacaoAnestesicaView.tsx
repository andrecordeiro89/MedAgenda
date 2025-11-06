
import React, { useState } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, Modal } from './ui';
import { formatDate } from '../utils';

interface AvaliacaoAnestesicaViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
  hospitalId: string;
  onRefresh?: () => void;
}

const AvaliacaoAnestesicaView: React.FC<AvaliacaoAnestesicaViewProps> = ({ 
  agendamentos, 
  medicos, 
  procedimentos,
  hospitalId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Agendamento | null>(null);
  const [isDocumentosModalOpen, setIsDocumentosModalOpen] = useState(false);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="border-r border-b"></div>);

  const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'N/A';
  const getProcedimentoName = (id: string) => procedimentos.find(p => p.id === id)?.nome || 'N/A';
  
  // Função para obter o tipo correto do agendamento baseado no procedimento
  const getAgendamentoTipo = (agendamento: Agendamento) => {
    const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
    return procedimento?.tipo || agendamento.tipo || 'ambulatorial';
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handlePacienteClick = (agendamento: Agendamento) => {
    setSelectedPaciente(agendamento);
    setIsDocumentosModalOpen(true);
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
        className="border-r border-b p-2 cursor-pointer transition-colors hover:bg-blue-50"
        onClick={() => handleDayClick(day)}
      >
        <div className={`flex justify-center items-center w-8 h-8 rounded-full ${
          isToday ? 'bg-primary text-white font-bold' : ''
        }`}>
          {day}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {dayAppointments.some(a => getAgendamentoTipo(a) === 'ambulatorial') && <div className="w-2 h-2 rounded-full bg-blue-500" title="Ambulatorial"></div>}
            {dayAppointments.some(a => getAgendamentoTipo(a) === 'cirurgico') && <div className="w-2 h-2 rounded-full bg-red-500" title="Cirúrgico"></div>}
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
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Avaliação Anestésica</h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
                <h3 className="text-xl font-semibold capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
            </div>
             <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-800 font-medium mb-2">
                  📋 <strong>Avaliação Anestésica:</strong> Clique no nome do paciente para acessar documentos
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <LegendItem color="bg-blue-500" label="Ambulatorial" />
                  <LegendItem color="bg-red-500" label="Cirúrgico" />
                  <LegendItem color="bg-green-500" label="Liberado" />
                  <LegendItem color="bg-orange-500" label="Pendente" />
                </div>
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

        {/* Modal de Agendamentos com Links Clicáveis */}
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Avaliações para ${selectedDate ? selectedDate.toLocaleDateString('pt-BR') : ''}`}
        >
            {selectedDateAppointments.length > 0 ? (
                <ul className="space-y-4">
                {selectedDateAppointments.map(a => (
                    <li key={a.id} className="p-3 bg-slate-50 rounded-md border-l-4 border-purple-500">
                        <button
                          onClick={() => handlePacienteClick(a)}
                          className="font-semibold text-purple-600 hover:text-purple-800 hover:underline text-left transition-colors"
                        >
                          {a.nome}
                        </button>
                        <p className="text-sm text-slate-600 mt-1">Procedimento: {getProcedimentoName(a.procedimentoId)}</p>
                        <p className="text-sm text-slate-600">Médico: {getMedicoName(a.medicoId)}</p>
                        <p className="text-sm text-slate-600">
                          Status: <span className={`font-medium ${a.statusLiberacao === 'v' ? 'text-green-600' : 'text-orange-600'}`}>
                            {a.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                          </span>
                        </p>
                    </li>
                ))}
                </ul>
            ) : (
                <p>Nenhum agendamento para esta data.</p>
            )}
        </Modal>

        {/* Modal de Documentos do Paciente */}
        <Modal
            isOpen={isDocumentosModalOpen}
            onClose={() => {
              setIsDocumentosModalOpen(false);
              setSelectedPaciente(null);
            }}
            title={`Documentos - ${selectedPaciente?.nome || ''}`}
            size="large"
        >
            {selectedPaciente && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">Informações do Paciente</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Nome:</span>
                      <p className="font-medium">{selectedPaciente.nome}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Idade:</span>
                      <p className="font-medium">{selectedPaciente.idade} anos</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Data de Nascimento:</span>
                      <p className="font-medium">{formatDate(selectedPaciente.dataNascimento)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Telefone:</span>
                      <p className="font-medium">{selectedPaciente.telefone}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">WhatsApp:</span>
                      <p className="font-medium">{selectedPaciente.whatsapp}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Cidade:</span>
                      <p className="font-medium">{selectedPaciente.cidadeNatal}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Médico:</span>
                      <p className="font-medium">{getMedicoName(selectedPaciente.medicoId)}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Procedimento:</span>
                      <p className="font-medium">{getProcedimentoName(selectedPaciente.procedimentoId)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">Documentos e Anexos</h3>
                  <div className="bg-slate-50 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-600 mb-2">Funcionalidade em desenvolvimento</p>
                    <p className="text-sm text-slate-500">
                      Aqui serão exibidos os documentos de avaliação anestésica salvos no banco de dados
                    </p>
                    <button className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      Upload de Documento
                    </button>
                  </div>
                </div>
              </div>
            )}
        </Modal>
    </div>
  );
};

export default AvaliacaoAnestesicaView;

