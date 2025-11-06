
import React, { useState, useMemo } from 'react';
import { Agendamento, Medico, Procedimento, GradeCirurgicaDia, Especialidade, MetaEspecialidade, DiaSemana } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, Modal } from './ui';
import { formatDate } from '../utils';
import GradeCirurgicaModal from './GradeCirurgicaModal';

interface CalendarViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
  especialidades: Especialidade[];
  metasEspecialidades: MetaEspecialidade[];
  hospitalId: string;
  onRefresh?: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  agendamentos, 
  medicos, 
  procedimentos,
  especialidades,
  metasEspecialidades = [], // Default para array vazio
  hospitalId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradeCirurgicaModalOpen, setIsGradeCirurgicaModalOpen] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 0=Dom, 1=Seg, ..., 6=Sáb

  // Debug: verificar se metas estão carregadas
  console.log('📊 CalendarView - Metas carregadas:', metasEspecialidades.length);
  
  // Verificar se há grades configuradas para cada dia da semana
  const getDiasComGrade = (): Set<number> => {
    const diasComGrade = new Set<number>();
    for (let dia = 0; dia <= 6; dia++) {
      const diaSemanaKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dia];
      const storageKey = `gradeCirurgica_${hospitalId}_${diaSemanaKey}_${currentDate.getFullYear()}_${currentDate.getMonth() + 2}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.some((g: any) => g.itens && g.itens.length > 0)) {
            diasComGrade.add(dia);
          }
        } catch (e) {
          // Ignorar erros
        }
      }
    }
    return diasComGrade;
  };
  
  const diasComGrade = getDiasComGrade();

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
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
    
    setSelectedDate(date);
    setSelectedDayOfWeek(dayOfWeek);
    
    // Sempre abrir modal de grade cirúrgica
    setIsGradeCirurgicaModalOpen(true);
  };


  const selectedDateAppointments = selectedDate
    ? agendamentos.filter(
        a => a.dataAgendamento === selectedDate.toISOString().split('T')[0]
      )
    : [];

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  // Mapear dia da semana para DiaSemana
  const diaSemanaMap: Record<number, DiaSemana> = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado'
  };

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    const dayAppointments = agendamentos.filter(a => a.dataAgendamento === dateString);

    const isToday = date.toDateString() === today.toDateString();
    const temGrade = diasComGrade.has(date.getDay());
    const diaSemana = diaSemanaMap[date.getDay()];

    // Agrupar agendamentos por médico e contar
    const agendamentosPorMedico = dayAppointments.reduce((acc, agendamento) => {
      const medico = medicos.find(m => m.id === agendamento.medicoId);
      if (medico) {
        if (!acc[medico.id]) {
          acc[medico.id] = {
            medico,
            count: 0,
            especialidadeId: medico.especialidadeId || ''
          };
        }
        acc[medico.id].count++;
      }
      return acc;
    }, {} as Record<string, { medico: Medico; count: number; especialidadeId: string }>);

    // Obter metas para este dia da semana (verificar se metasEspecialidades existe)
    const metasDoDia = metasEspecialidades?.filter(m => m.diaSemana === diaSemana && m.ativo) || [];

    days.push(
      <div
        key={day}
        className={`border-r border-b p-1 cursor-pointer transition-colors relative overflow-hidden ${
          temGrade ? 'hover:bg-green-50' : 'hover:bg-blue-50'
        }`}
        onClick={() => handleDayClick(day)}
        title={temGrade ? 'Grade cirúrgica configurada - Clique para editar' : 'Clique para configurar Grade Cirúrgica'}
      >
        {/* Indicador de Grade Configurada */}
        {temGrade && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-sm z-10" title="Grade configurada"></div>
        )}
        
        {/* Número do dia */}
        <div className={`flex justify-center items-center w-6 h-6 rounded-full text-xs mx-auto ${
          isToday ? 'bg-primary text-white font-bold' : temGrade ? 'font-semibold text-green-700' : ''
        }`}>
          {day}
        </div>
        
        {/* Barras de progresso por médico/especialidade */}
        <div className="mt-1 space-y-0.5">
          {Object.values(agendamentosPorMedico).map(({ medico, count, especialidadeId }) => {
            // Buscar meta para esta especialidade neste dia
            const meta = metasDoDia.find(m => m.especialidadeId === especialidadeId);
            const metaQuantidade = meta?.quantidadeAgendamentos || 10; // Default 10 se não houver meta
            const percentual = Math.min((count / metaQuantidade) * 100, 100);
            const atingiuMeta = count >= metaQuantidade;

            return (
              <div
                key={medico.id}
                className="text-[8px] leading-tight"
                title={`${medico.nome} - ${count}/${metaQuantidade}`}
              >
                {/* Nome do médico (truncado) */}
                <div className="truncate font-medium text-slate-700">
                  {medico.nome.split(' ')[0]}
                </div>
                {/* Barra de progresso */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      atingiuMeta ? 'bg-green-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
                {/* Contador */}
                <div className="text-[7px] text-slate-500 text-center">
                  {count}/{metaQuantidade}
                </div>
              </div>
            );
          })}
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
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💡 <strong>Dica:</strong> Clique em qualquer dia para configurar a Grade Cirúrgica
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <LegendItem color="bg-blue-500" label="Ambulatorial" />
                  <LegendItem color="bg-red-500" label="Cirúrgico" />
                  <LegendItem color="bg-green-500" label="Liberado" />
                  <LegendItem color="bg-orange-500" label="Pendente" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-slate-600 font-semibold">Grade Configurada</span>
                  </div>
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

        {/* Modal de Agendamentos Normais */}
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Agendamentos para ${selectedDate ? selectedDate.toLocaleDateString('pt-BR') : ''}`}
        >
            {selectedDateAppointments.length > 0 ? (
                <ul className="space-y-4">
                {selectedDateAppointments.map(a => (
                    <li key={a.id} className="p-3 bg-slate-50 rounded-md border-l-4 border-primary">
                        <p className="font-semibold">{a.nome}</p>
                        <p className="text-sm text-slate-600">Procedimento: {getProcedimentoName(a.procedimentoId)}</p>
                        <p className="text-sm text-slate-600">Médico: {getMedicoName(a.medicoId)}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p>Nenhum agendamento para esta data.</p>
            )}
        </Modal>

        {/* Modal de Grade Cirúrgica (abre ao clicar em qualquer dia) */}
        <GradeCirurgicaModal
            isOpen={isGradeCirurgicaModalOpen}
            onClose={() => setIsGradeCirurgicaModalOpen(false)}
            mesAtual={currentDate}
            diaSemanaClicado={selectedDayOfWeek}
            hospitalId={hospitalId}
            especialidades={especialidades}
        />
    </div>
  );
};

export default CalendarView;
