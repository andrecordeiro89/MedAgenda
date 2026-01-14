
import React, { useState, useMemo, useEffect } from 'react';
import { Agendamento, Medico, Procedimento, GradeCirurgicaDia, Especialidade, MetaEspecialidade, DiaSemana } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, Modal } from './ui';
import { formatDate, formatDateLocal, compareDates } from '../utils';
import GradeCirurgicaModal from './GradeCirurgicaModal';
import RelatorioSemanalModal from './RelatorioSemanalModal';
import { useAuth } from './PremiumLogin';
import { agendamentoService } from '../services/supabase';

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
  const { hospitalSelecionado, usuario } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGradeCirurgicaModalOpen, setIsGradeCirurgicaModalOpen] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1); // 0=Dom, 1=Seg, ..., 6=Sáb
  const [isRelatorioSemanalOpen, setIsRelatorioSemanalOpen] = useState(false);
  const [isReplicarMesOpen, setIsReplicarMesOpen] = useState(false);
  const [replicarSelecionados, setReplicarSelecionados] = useState<number[]>([]);
  const [replicandoMes, setReplicandoMes] = useState(false);
  const [replicarTeste, setReplicarTeste] = useState(false);
  const [replicarResumo, setReplicarResumo] = useState<{ especialidades: number; procedimentos: number; diasIgnorados: number; diasReplicados: number; deletados?: number } | null>(null);
  const [replicarAcao, setReplicarAcao] = useState<'replicar' | 'limpar'>('replicar');
  const [calendarDensity, setCalendarDensity] = useState<'compact' | 'full'>('full');
  const noScrollbarStyle = '.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}';

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
    const dateString = formatDateLocal(date); // YYYY-MM-DD (formato local, sem problemas de timezone)
    
    // Buscar agendamentos deste dia
    const agendamentosDoDia = agendamentos.filter(a => {
      const dataAgendamento = a.data_agendamento || a.dataAgendamento;
      // Usar compareDates para evitar problemas de timezone
      return compareDates(dataAgendamento || '', dateString);
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
          const dateStr = formatDateLocal(selectedDate);
          const dataAgendamento = a.data_agendamento || a.dataAgendamento;
          return dataAgendamento && compareDates(dataAgendamento, dateStr);
        }
      )
    : [];

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const mesesAlvo = useMemo(() => {
    const list: Array<{ label: string; year: number; monthIndex: number; key: number }> = [];
    for (let i = 1; i <= 12; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      list.push({
        label: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        key: i
      });
    }
    return list;
  }, [currentDate]);
  
  useEffect(() => {
    if (mesesAlvo.length > 0) {
      setReplicarSelecionados([mesesAlvo[0].key]);
    }
  }, [mesesAlvo.length]);
  
  const replicarParaMeses = async (selecoes: number[]) => {
    if (!hospitalId || selecoes.length === 0) return;
    setReplicandoMes(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      const anoMesOrigem = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const origem = dados.filter(a => {
        const d = (a.data_agendamento || a.dataAgendamento || '').trim();
        const np = (a.nome_paciente || a.nome || '').trim();
        return d.startsWith(anoMesOrigem) && np === '';
      });
      const porDia = new Map<string, Agendamento[]>();
      origem.forEach(a => {
        const d = (a.data_agendamento || a.dataAgendamento || '').trim();
        if (!porDia.has(d)) porDia.set(d, []);
        porDia.get(d)!.push(a);
      });
      const gruposPorDia = new Map<string, Array<{ especialidade: string; medico: string | null; procedimentos: string[] }>>();
      porDia.forEach((lista, dia) => {
        const grupos = new Map<string, { especialidade: string; medico: string | null; procedimentos: string[] }>();
        lista.forEach(ag => {
          const esp = ag.especialidade || '';
          if (!esp) return;
          const med = ag.medico || null;
          const chave = `${esp}|||${med || ''}`;
          if (!grupos.has(chave)) {
            grupos.set(chave, { especialidade: esp, medico: med, procedimentos: [] });
          }
          const proc = ag.procedimentos || '';
          if (proc.trim()) {
            grupos.get(chave)!.procedimentos.push(proc);
          }
        });
        gruposPorDia.set(dia, Array.from(grupos.values()));
      });
      const parseISODate = (s: string) => {
        const [y, m, d] = s.split('-').map(v => parseInt(v, 10));
        return new Date(y, m - 1, d);
      };
      const listarOcorrenciasDoWeekday = (year: number, monthIndex: number, weekday: number) => {
        const datas: Date[] = [];
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        for (let dia = 1; dia <= lastDay; dia++) {
          const dt = new Date(year, monthIndex, dia);
          if (dt.getDay() === weekday) datas.push(dt);
        }
        return datas;
      };
      for (const sel of selecoes) {
        const alvo = mesesAlvo.find(m => m.key === sel);
        if (!alvo) continue;
        let diasIgnorados = 0;
        let diasReplicados = 0;
        let totalEspecialidades = 0;
        let totalProcedimentos = 0;
        for (const [diaOrigem, grupos] of gruposPorDia.entries()) {
          const dtOrigem = parseISODate(diaOrigem);
          const weekday = dtOrigem.getDay();
          const monthIndexOrigem = dtOrigem.getMonth();
          const yearOrigem = dtOrigem.getFullYear();
          const ocorrenciasOrigem = listarOcorrenciasDoWeekday(yearOrigem, monthIndexOrigem, weekday);
          const idxOcorrencia = ocorrenciasOrigem.findIndex(d => d.getDate() === dtOrigem.getDate());
          if (idxOcorrencia < 0) {
            diasIgnorados++;
            continue;
          }
          const ocorrenciasAlvo = listarOcorrenciasDoWeekday(alvo.year, alvo.monthIndex, weekday);
          const target = ocorrenciasAlvo[idxOcorrencia] || null;
          if (!target) {
            diasIgnorados++;
            continue;
          }
          const dataFormatada = formatDateLocal(target);
          diasReplicados++;
          for (const grupo of grupos) {
            if (!replicarTeste) {
              await agendamentoService.create({
                nome_paciente: '',
                data_nascimento: '2000-01-01',
                data_agendamento: dataFormatada,
                especialidade: grupo.especialidade,
                medico: grupo.medico || null,
                hospital_id: hospitalId || null,
                cidade_natal: null,
                telefone: null,
                is_grade_cirurgica: true
              });
            }
            totalEspecialidades++;
            for (const proc of grupo.procedimentos) {
              if (!replicarTeste) {
                await agendamentoService.create({
                  nome_paciente: '',
                  data_nascimento: '2000-01-01',
                  data_agendamento: dataFormatada,
                  especialidade: grupo.especialidade,
                  medico: grupo.medico || null,
                  procedimentos: proc,
                  hospital_id: hospitalId || null,
                  cidade_natal: null,
                  telefone: null
                });
              }
              totalProcedimentos++;
            }
          }
        }
        setReplicarResumo({ especialidades: totalEspecialidades, procedimentos: totalProcedimentos, diasIgnorados, diasReplicados });
      }
      if (!replicarTeste) setIsReplicarMesOpen(false);
    } catch {
    } finally {
      setReplicandoMes(false);
    }
  };
  
  const limparMeses = async (selecoes: number[]) => {
    if (!hospitalId || selecoes.length === 0) return;
    setReplicandoMes(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      let deletados = 0;
      let diasProcessados = 0;
      let diasIgnorados = 0;
      for (const sel of selecoes) {
        const alvo = mesesAlvo.find(m => m.key === sel);
        if (!alvo) continue;
        const lastDay = new Date(alvo.year, alvo.monthIndex + 1, 0).getDate();
        for (let dia = 1; dia <= lastDay; dia++) {
          const target = new Date(alvo.year, alvo.monthIndex, dia);
          if (target.getMonth() !== alvo.monthIndex) {
            diasIgnorados++;
            continue;
          }
          const dataFormatada = formatDateLocal(target);
          const toDelete = dados.filter(a => {
            const d = (a.data_agendamento || a.dataAgendamento || '').trim();
            const np = (a.nome_paciente || a.nome || '').trim();
            return d === dataFormatada && np === '';
          });
          diasProcessados++;
          if (!replicarTeste) {
            for (const ag of toDelete) {
              await agendamentoService.delete(ag.id);
              deletados++;
            }
          } else {
            deletados += toDelete.length;
          }
        }
      }
      setReplicarResumo({ especialidades: 0, procedimentos: 0, diasIgnorados, diasReplicados: diasProcessados, deletados });
      if (!replicarTeste) setIsReplicarMesOpen(false);
    } catch {
    } finally {
      setReplicandoMes(false);
    }
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
    const dateString = formatDateLocal(date); // YYYY-MM-DD (formato local, sem problemas de timezone)
    
    // Debug para fevereiro de 2025 (segundas-feiras)
    const isFebruary2025 = currentDate.getFullYear() === 2025 && currentDate.getMonth() === 1; // Mês 1 = fevereiro
    const isMonday = date.getDay() === 1; // 1 = segunda-feira
    
    if (isFebruary2025 && isMonday) {
      console.log(`🔍 DEBUG FEVEREIRO 2025 - Segunda-feira ${dateString}:`);
      console.log(`  Data formatada: ${dateString}`);
      console.log(`  Total agendamentos no array: ${agendamentos.length}`);
      
      // Verificar agendamentos que deveriam aparecer neste dia
      const agendamentosFevereiro = agendamentos.filter(a => {
        const dataAgendamento = a.data_agendamento || a.dataAgendamento;
        return dataAgendamento && dataAgendamento.includes('2025-02');
      });
      console.log(`  Agendamentos de fevereiro/2025: ${agendamentosFevereiro.length}`);
      
      if (agendamentosFevereiro.length > 0) {
        const segundasFevereiro = agendamentosFevereiro.filter(a => {
          const dataAgendamento = a.data_agendamento || a.dataAgendamento;
          if (!dataAgendamento) return false;
          
          // Verificar se é segunda-feira
          const dataObj = new Date(dataAgendamento + 'T00:00:00');
          return dataObj.getDay() === 1; // Segunda-feira
        });
        console.log(`  Agendamentos de segundas de fevereiro: ${segundasFevereiro.length}`);
        segundasFevereiro.slice(0, 3).forEach((a, idx) => {
          console.log(`    Agendamento ${idx + 1}:`, {
            data_agendamento: a.data_agendamento,
            dataAgendamento: a.dataAgendamento,
            especialidade: a.especialidade,
            procedimentos: a.procedimentos,
            nome_paciente: a.nome_paciente,
            temProcedimentos: a.procedimentos && a.procedimentos.trim() !== ''
          });
        });
      }
    }
    
    // Usar data_agendamento (campo real do banco) ou dataAgendamento (compatibilidade)
    // Usar compareDates para evitar problemas de timezone
    const dayAppointments = agendamentos.filter(a => {
      const dataAgendamento = a.data_agendamento || a.dataAgendamento;
      if (!dataAgendamento) return false;
      return compareDates(dataAgendamento, dateString);
    });

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
      if (!agendamento.especialidade) {
        // Debug: agendamentos sem especialidade
        if (isFebruary2025 && isMonday) {
          console.log(`  ⚠️ Agendamento sem especialidade:`, {
            id: agendamento.id,
            nome_paciente: agendamento.nome_paciente,
            procedimentos: agendamento.procedimentos
          });
        }
        return;
      }
      
      // Buscar especialidade no array para obter o ID
      const especialidade = especialidades.find(e => e.nome === agendamento.especialidade);
      const especialidadeId = especialidade?.id || agendamento.especialidade;
      const especialidadeNome = agendamento.especialidade;
      
      // Debug para fevereiro
      if (isFebruary2025 && isMonday) {
        console.log(`  📋 Processando agendamento:`, {
          especialidade: especialidadeNome,
          especialidadeId: especialidadeId,
          nome_paciente: agendamento.nome_paciente,
          temPaciente: agendamento.nome_paciente && agendamento.nome_paciente.trim() !== ''
        });
      }
      
      // Inicializar contador se não existir
      if (!especialidadesComProcedimentos[especialidadeId]) {
        // Buscar meta configurada para esta especialidade neste dia da semana
        const meta = metasEspecialidades.find(m => 
          m.especialidadeId === especialidadeId && 
          m.diaSemana === diaSemana && 
          m.ativo === true &&
          m.hospitalId === hospitalId
        );
        
        // Debug para fevereiro
        if (isFebruary2025 && isMonday) {
          console.log(`  🔍 Buscando meta para:`, {
            especialidadeId: especialidadeId,
            especialidadeNome: especialidadeNome,
            diaSemana: diaSemana,
            hospitalId: hospitalId,
            totalMetas: metasEspecialidades.length,
            metaEncontrada: meta ? meta.quantidadeAgendamentos : null,
            todasMetasParaEspecialidade: metasEspecialidades.filter(m => m.especialidadeId === especialidadeId)
          });
        }
        
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
        className={`border-r border-b p-1 cursor-pointer transition-colors relative ${calendarDensity === 'full' ? 'no-scrollbar overflow-auto' : 'overflow-hidden'} ${
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
          {(dateString === '2025-12-01' || (isFebruary2025 && isMonday)) && console.log(`🔍 DEBUG ${dateString} - Especialidades para barras:`, Object.keys(especialidadesComProcedimentos).length, Object.values(especialidadesComProcedimentos))}
          {(() => {
            const espList = Object.values(especialidadesComProcedimentos);
            const bars = calendarDensity === 'compact' ? espList.slice(0, 8) : espList;
            return bars.map((esp) => {
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
                  <div className="truncate font-medium text-slate-700">
                    {esp.nome}
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${atingiuMeta ? 'bg-green-500' : percentual >= 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>
                  <div className={`text-[8px] text-center font-medium ${atingiuMeta ? 'text-green-700 font-bold' : 'text-slate-600'}`}>
                    {esp.totalProcedimentos}/{metaProcedimentos}
                  </div>
                </div>
              );
            });
          })()}
          {calendarDensity === 'compact' && (() => {
            const total = Object.values(especialidadesComProcedimentos).length;
            const shown = Math.min(8, total);
            const hidden = Math.max(0, total - shown);
            return hidden > 0 ? (
              <div className="text-[8px] text-slate-500">{`+${hidden} especialidade(s)`}</div>
            ) : null;
          })()}
        </div>
      </div>
    );
  }

  return (
    <div>
        <style>{noScrollbarStyle}</style>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Grade</h2>
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeftIcon /></button>
                <h3 className="text-base font-semibold capitalize">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100"><ChevronRightIcon /></button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRelatorioSemanalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-300 font-medium transition-colors shadow-sm text-[12px] whitespace-nowrap"
                  title="Gerar relatório semanal em PDF"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartilhar Grade
                </button>
                {usuario?.email === 'diretoria@medagenda.com' && (
                  <button
                    onClick={() => setIsReplicarMesOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 font-medium transition-colors shadow-sm text-[12px] whitespace-nowrap"
                    title="Replicar a estrutura de grade para próximos meses"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h6m-9 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Replicar Mês
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarDensity('compact')}
                    className={`px-2 py-1 rounded text-[11px] border ${calendarDensity === 'compact' ? 'bg-gray-700 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                    title="Mostrar poucas barras por dia"
                  >
                    Compacto
                  </button>
                  <button
                    onClick={() => setCalendarDensity('full')}
                    className={`px-2 py-1 rounded text-[11px] border ${calendarDensity === 'full' ? 'bg-gray-700 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
                    title="Mostrar todas as barras por dia"
                  >
                    Completo
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center font-semibold text-slate-500 border-t border-l">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="py-2 border-r border-b">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 h-[92vh] overflow-hidden text-center border-l">
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
            userEmail={usuario?.email}
        />

        {/* Modal de Relatório Semanal */}
        <RelatorioSemanalModal
            isOpen={isRelatorioSemanalOpen}
            onClose={() => setIsRelatorioSemanalOpen(false)}
            hospitalId={hospitalId}
            hospitalNome={hospitalSelecionado?.nome}
        />
        
        <Modal
          isOpen={isReplicarMesOpen}
          onClose={() => setIsReplicarMesOpen(false)}
          title="Replicar Mês"
        >
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Selecione os meses de destino:</div>
            <div className="grid grid-cols-2 gap-2">
              {mesesAlvo.map(m => (
                <label key={m.key} className="flex items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={replicarSelecionados.includes(m.key)}
                    onChange={() => {
                      setReplicarSelecionados(prev => prev.includes(m.key) ? prev.filter(k => k !== m.key) : [...prev, m.key]);
                    }}
                    className="w-4 h-4 accent-amber-600 border-amber-300"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700">Ação:</span>
              <button
                onClick={() => setReplicarAcao('replicar')}
                className={`px-2 py-1 rounded border text-xs ${replicarAcao === 'replicar' ? 'bg-amber-600 text-white border-amber-700' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
              >
                Replicar
              </button>
              <button
                onClick={() => setReplicarAcao('limpar')}
                className={`px-2 py-1 rounded border text-xs ${replicarAcao === 'limpar' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-800 border-gray-300'}`}
              >
                Limpar
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={replicarTeste}
                onChange={() => setReplicarTeste(v => !v)}
                className="w-4 h-4 accent-amber-600 border-amber-300"
              />
              Executar como teste (não grava no banco)
            </label>
            {replicarResumo && (
              <div className="text-sm text-slate-700">
                {replicarAcao === 'replicar' && (
                  <>
                    <div>Especialidades: {replicarResumo.especialidades}</div>
                    <div>Procedimentos: {replicarResumo.procedimentos}</div>
                  </>
                )}
                {typeof replicarResumo.deletados === 'number' && (
                  <div>Registros a excluir: {replicarResumo.deletados}</div>
                )}
                <div>Dias replicados: {replicarResumo.diasReplicados}</div>
                <div>Dias ignorados: {replicarResumo.diasIgnorados}</div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsReplicarMesOpen(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded border border-gray-300 text-sm"
                disabled={replicandoMes}
              >
                Cancelar
              </button>
              <button
                onClick={() => (replicarAcao === 'replicar' ? replicarParaMeses(replicarSelecionados) : limparMeses(replicarSelecionados))}
                className={`px-3 py-1.5 rounded text-sm ${replicandoMes ? 'bg-gray-400 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                disabled={replicandoMes || replicarSelecionados.length === 0}
              >
                {replicandoMes ? (replicarAcao === 'replicar' ? 'Replicando...' : 'Limpando...') : (replicarAcao === 'replicar' ? 'Replicar' : 'Limpar')}
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
};

export default CalendarView;
