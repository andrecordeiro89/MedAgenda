
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
  console.log('📊 CalendarView - Total agendamentos recebidos:', agendamentos.length);
  
  // Debug: verificar formato das datas dos agendamentos
  if (agendamentos.length > 0) {
    console.log('📊 CalendarView - Primeiros 3 agendamentos:', agendamentos.slice(0, 3).map(a => ({
      id: a.id,
      data_agendamento: a.data_agendamento,
      dataAgendamento: a.dataAgendamento,
      especialidade: a.especialidade,
      procedimentos: a.procedimentos,
      nome_paciente: a.nome_paciente
    })));
  }
  
  // Verificar se há grade configurada para um dia específico
  // Grade = agendamentos com data_agendamento = data do dia E procedimentos preenchido (não vazio)
  // IMPORTANTE: Não contar registros com procedimentos vazio (são linhas de especialidade)
  const temGradeParaDia = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Buscar agendamentos deste dia
    const agendamentosDoDia = agendamentos.filter(a => {
      const dataAgendamento = a.data_agendamento || a.dataAgendamento;
      return dataAgendamento === dateString;
    });
    
    // Debug para o dia 01/12/2025
    if (dateString === '2025-12-01') {
      console.log('🔍 DEBUG 01/12/2025 - Agendamentos encontrados:', agendamentosDoDia.length);
      agendamentosDoDia.forEach((a, idx) => {
        console.log(`  Agendamento ${idx + 1}:`, {
          id: a.id,
          data_agendamento: a.data_agendamento,
          dataAgendamento: a.dataAgendamento,
          especialidade: a.especialidade,
          procedimentos: a.procedimentos,
          nome_paciente: a.nome_paciente,
          temProcedimentos: a.procedimentos && a.procedimentos.trim() !== ''
        });
      });
    }
    
    // Verificar se há pelo menos um agendamento com procedimentos preenchido (não vazio)
    // Isso indica que há uma grade configurada para este dia
    const temGrade = agendamentosDoDia.some(a => {
      const temProcedimentos = a.procedimentos && a.procedimentos.trim() !== '';
      return temProcedimentos;
    });
    
    if (dateString === '2025-12-01') {
      console.log('🔍 DEBUG 01/12/2025 - temGrade:', temGrade);
    }
    
    return temGrade;
  };

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
        a => {
          const dateStr = selectedDate.toISOString().split('T')[0];
          return (a.data_agendamento === dateStr || a.dataAgendamento === dateStr);
        }
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
    // Usar data_agendamento (campo real do banco) ou dataAgendamento (compatibilidade)
    const dayAppointments = agendamentos.filter(a => 
      (a.data_agendamento === dateString || a.dataAgendamento === dateString)
    );

    const isToday = date.toDateString() === today.toDateString();
    const temGrade = temGradeParaDia(date);
    const diaSemana = diaSemanaMap[date.getDay()];

    // Estrutura para armazenar especialidades e seus procedimentos (com pacientes reais)
    const especialidadesComProcedimentos: Record<string, {
      nome: string;
      totalProcedimentos: number;
      especialidadeId: string;
      meta?: number; // Meta configurada para esta especialidade neste dia
    }> = {};

    // IMPORTANTE: Filtrar apenas agendamentos com procedimentos preenchido (não vazio)
    // Registros com procedimentos vazio são linhas de especialidade e não devem ser contados
    const agendamentosComProcedimentos = dayAppointments.filter(a => {
      const temProcedimentos = a.procedimentos && a.procedimentos.trim() !== '';
      return temProcedimentos;
    });

    // Debug para o dia 01/12/2025
    if (dateString === '2025-12-01') {
      console.log('🔍 DEBUG 01/12/2025 - Barras de progresso:');
      console.log('  Total agendamentos do dia:', dayAppointments.length);
      console.log('  Agendamentos com procedimentos:', agendamentosComProcedimentos.length);
      agendamentosComProcedimentos.forEach((a, idx) => {
        console.log(`  Procedimento ${idx + 1}:`, {
          especialidade: a.especialidade,
          procedimentos: a.procedimentos,
          nome_paciente: a.nome_paciente,
          temPaciente: a.nome_paciente && a.nome_paciente.trim() !== ''
        });
      });
    }

    // Agrupar por especialidade
    agendamentosComProcedimentos.forEach(agendamento => {
      if (!agendamento.especialidade) return;
      
      // Buscar especialidade no array para obter o ID
      const especialidade = especialidades.find(e => e.nome === agendamento.especialidade);
      const especialidadeId = especialidade?.id || agendamento.especialidade;
      const especialidadeNome = agendamento.especialidade;
      
      // Inicializar contador se não existir
      if (!especialidadesComProcedimentos[especialidadeId]) {
        // Buscar meta configurada para esta especialidade neste dia da semana
        const meta = metasEspecialidades.find(m => 
          m.especialidadeId === especialidadeId && 
          m.diaSemana === diaSemana && 
          m.ativo === true &&
          m.hospitalId === hospitalId
        );
        
        especialidadesComProcedimentos[especialidadeId] = {
          nome: especialidadeNome,
          totalProcedimentos: 0,
          especialidadeId: especialidadeId,
          meta: meta?.quantidadeAgendamentos
        };
      }
      
      // Contar apenas procedimentos com pacientes reais (nome_paciente preenchido)
      // Isso mostra o progresso real em relação à meta
      const temPaciente = agendamento.nome_paciente && agendamento.nome_paciente.trim() !== '';
      if (temPaciente) {
        especialidadesComProcedimentos[especialidadeId].totalProcedimentos++;
      }
    });

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
        
        {/* Barras de progresso por especialidade (com dados reais e metas configuradas) */}
        <div className="mt-1 space-y-0.5">
          {dateString === '2025-12-01' && console.log('🔍 DEBUG 01/12/2025 - Especialidades para barras:', Object.keys(especialidadesComProcedimentos).length, Object.values(especialidadesComProcedimentos))}
          {Object.values(especialidadesComProcedimentos).map((esp) => {
            // Usar meta configurada ou padrão de 10 se não houver meta
            const metaProcedimentos = esp.meta || 10;
            const percentual = metaProcedimentos > 0 
              ? Math.min((esp.totalProcedimentos / metaProcedimentos) * 100, 100)
              : 0;
            const atingiuMeta = metaProcedimentos > 0 && esp.totalProcedimentos >= metaProcedimentos;
            const faltam = Math.max(0, metaProcedimentos - esp.totalProcedimentos);

            return (
              <div
                key={esp.especialidadeId}
                className="text-[9px] leading-tight"
                title={`${esp.nome} - ${esp.totalProcedimentos} de ${metaProcedimentos} procedimento(s)${faltam > 0 ? ` (faltam ${faltam})` : ' - Meta atingida!'}`}
              >
                {/* Nome da especialidade (truncado) */}
                <div className="truncate font-medium text-slate-700">
                  {esp.nome}
                </div>
                {/* Barra de progresso */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      atingiuMeta ? 'bg-green-500' : 
                      percentual >= 75 ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`}
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
                {/* Contador de procedimentos */}
                <div className={`text-[8px] text-center font-medium ${
                  atingiuMeta ? 'text-green-700 font-bold' : 'text-slate-600'
                }`}>
                  {esp.totalProcedimentos}/{metaProcedimentos}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
