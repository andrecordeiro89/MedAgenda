
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
  
  // Verificar se há grades configuradas para cada dia do mês sendo visualizado
  // Só considera configurada se tiver pelo menos UMA ESPECIALIDADE selecionada
  const getDiasComGrade = (): Set<number> => {
    const diasComGrade = new Set<number>();
    
    // Percorrer cada dia do mês atual sendo visualizado
    const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const diaSemanaKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][date.getDay()];
      
      // Formato correto da chave: grade_hospitalId_diaSemana_YYYY-MM do dia específico
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const mesReferencia = `${ano}-${mes}`;
      const storageKey = `grade_${hospitalId}_${diaSemanaKey}_${mesReferencia}`;
      
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Verificar se há pelo menos UM item do tipo 'especialidade' em qualquer dia
          const temEspecialidade = parsed.dias?.some((g: any) => 
            g.itens?.some((item: any) => item.tipo === 'especialidade')
          );
          
          if (temEspecialidade) {
            // Adicionar o dia da semana (0-6) ao set
            diasComGrade.add(date.getDay());
          }
        } catch (e) {
          // Ignorar erros de parse
          console.error('Erro ao verificar grade:', e);
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

    // Obter dados da grade cirúrgica para este dia da semana
    const diaSemanaKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][date.getDay()];
    
    // Buscar grade do mês do DIA específico (não do mês sendo visualizado)
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const mesReferencia = `${ano}-${mes}`;
    const storageKey = `grade_${hospitalId}_${diaSemanaKey}_${mesReferencia}`;
    
    // Estrutura para armazenar especialidades e seus procedimentos
    const especialidadesComProcedimentos: Record<string, {
      nome: string;
      totalProcedimentos: number;
      especialidadeId: string;
    }> = {};

    // Ler a grade cirúrgica do localStorage
    const savedGrade = localStorage.getItem(storageKey);
    if (savedGrade) {
      try {
        const parsed = JSON.parse(savedGrade);
        if (parsed.dias && Array.isArray(parsed.dias)) {
          // Para cada dia na grade
          parsed.dias.forEach((dia: any) => {
            if (dia.itens && Array.isArray(dia.itens)) {
              let especialidadeAtual: string | null = null;
              let especialidadeNome: string | null = null;
              let especialidadeId: string | null = null;

              // Percorrer itens da grade
              dia.itens.forEach((item: any) => {
                if (item.tipo === 'especialidade') {
                  // Nova especialidade encontrada
                  especialidadeAtual = item.texto;
                  especialidadeNome = item.texto;
                  especialidadeId = item.especialidadeId || item.texto;
                  
                  // Inicializar contador se não existir
                  if (!especialidadesComProcedimentos[especialidadeId]) {
                    especialidadesComProcedimentos[especialidadeId] = {
                      nome: especialidadeNome,
                      totalProcedimentos: 0,
                      especialidadeId: especialidadeId
                    };
                  }
                } else if (item.tipo === 'procedimento' && especialidadeAtual && especialidadeId) {
                  // Contar procedimento para a especialidade atual
                  especialidadesComProcedimentos[especialidadeId].totalProcedimentos++;
                }
              });
            }
          });
        }
      } catch (e) {
        console.error('Erro ao processar grade:', e);
      }
    }

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
        
        {/* Barras de progresso por especialidade da grade cirúrgica */}
        <div className="mt-1 space-y-0.5">
          {Object.values(especialidadesComProcedimentos).map((esp) => {
            // Definir meta de procedimentos (pode ser ajustável no futuro)
            const metaProcedimentos = 10; // Meta padrão de procedimentos por especialidade
            const percentual = Math.min((esp.totalProcedimentos / metaProcedimentos) * 100, 100);
            const atingiuMeta = esp.totalProcedimentos >= metaProcedimentos;

            return (
              <div
                key={esp.especialidadeId}
                className="text-[9px] leading-tight"
                title={`${esp.nome} - ${esp.totalProcedimentos} procedimento(s)`}
              >
                {/* Nome da especialidade (truncado) */}
                <div className="truncate font-medium text-slate-700">
                  {esp.nome}
                </div>
                {/* Barra de progresso */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      atingiuMeta ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
                {/* Contador de procedimentos */}
                <div className="text-[8px] text-slate-600 text-center font-medium">
                  {esp.totalProcedimentos} proc.
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
