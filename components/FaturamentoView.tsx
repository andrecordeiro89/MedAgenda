import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { agendamentoService, supabase, medicoService } from '../services/supabase';
import { Agendamento, Medico } from '../types';
import { Modal } from './ui';
import JSZip from 'jszip';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

export const FaturamentoView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null); // ID do agendamento sendo baixado
  
  // Estado para controlar linhas expandidas
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());
  
  // Estados para filtros de busca
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroDataConsulta, setFiltroDataConsulta] = useState<string>('');
  const [filtroDataCirurgia, setFiltroDataCirurgia] = useState<string>('');
  const [filtroMesCirurgia, setFiltroMesCirurgia] = useState<string>('');
  const [filtroStatusExames, setFiltroStatusExames] = useState<string>('');
  const [filtroAih, setFiltroAih] = useState<string>('');
  const [filtroStatusInterno, setFiltroStatusInterno] = useState<string>('');
  const [filtroConfirmado, setFiltroConfirmado] = useState<string>('');
  const [filtroProntuario, setFiltroProntuario] = useState<string>('');
  const [filtroMedicoId, setFiltroMedicoId] = useState<string>('');
  const [medicosDisponiveis, setMedicosDisponiveis] = useState<Medico[]>([]);
  const [filtroObservacao, setFiltroObservacao] = useState<string>('');
  const [filtroDataInsercao, setFiltroDataInsercao] = useState<string>('');
  const [cancelInfoOpen, setCancelInfoOpen] = useState<{ [id: string]: boolean }>({});
  const [aihDropdownOpen, setAihDropdownOpen] = useState<{ [id: string]: boolean }>({});
  
  // Estados para ordenação
  const [colunaOrdenacao, setColunaOrdenacao] = useState<'data_consulta' | 'data_cirurgia' | null>('data_cirurgia');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');
  
  // Estados para modal de NÃO LIBERADO
  const [modalNaoLiberadoAberto, setModalNaoLiberadoAberto] = useState(false);
  const [agendamentoNaoLiberado, setAgendamentoNaoLiberado] = useState<Agendamento | null>(null);
  const [observacaoNaoLiberado, setObservacaoNaoLiberado] = useState<string>('');
  const [salvandoNaoLiberado, setSalvandoNaoLiberado] = useState(false);
  
  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const tabelaRef = useRef<HTMLDivElement>(null);
  const [reportModalAberto, setReportModalAberto] = useState(false);
  const [reportAihStatus, setReportAihStatus] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportConfirmModalAberto, setReportConfirmModalAberto] = useState(false);
  const [reportConfirmStatus, setReportConfirmStatus] = useState<string>('');
  const [reportConfirmStartDate, setReportConfirmStartDate] = useState<string>('');
  const [reportConfirmEndDate, setReportConfirmEndDate] = useState<string>('');
  const confirmStatusOptions = ['Confirmado', 'Aguardando'];
  const aihStatusOptions = [
    'Autorizado',
    'Pendência Hospital',
    'Pendência Faturamento',
    'Auditor Externo',
    'Aguardando Ciência SMS',
    'Agendado',
    'AG Regulação',
    'Solicitar',
    'Emitida',
    'AIH Represada',
    'AG Ciência SMS',
    'N/A - Urgência'
  ];
  
  // Estado para controlar visualização de pendências
  const [mostrarPendencias, setMostrarPendencias] = useState(false);
  const { success, error: toastError, warning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [filtroJustificativa, setFiltroJustificativa] = useState<string>('');
  const [justificadosHoje, setJustificadosHoje] = useState<number>(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [justificadosHojeLista, setJustificadosHojeLista] = useState<Agendamento[]>([]);
  const [bellDate, setBellDate] = useState<string>('');
  const confirmActionRef = useRef<(() => void) | null>(null);
  
  const hojeLocalStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  useEffect(() => {
    setBellDate(hojeLocalStr());
  }, []);

  // Carregar agendamentos
  useEffect(() => {
    carregarAgendamentos();
  }, [hospitalId]);
  
  useEffect(() => {
    const carregarMedicos = async () => {
      try {
        const medicos = await medicoService.getAll(hospitalId);
        setMedicosDisponiveis(medicos || []);
      } catch {}
    };
    if (hospitalId) carregarMedicos();
  }, [hospitalId]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      console.log('💰 Agendamentos carregados para faturamento:', dados);
      console.log('💰 Campos de faturamento do primeiro registro:', dados[0] ? {
        faturamento_status: dados[0].faturamento_status,
        faturamento_liberado: dados[0].faturamento_liberado,
        faturamento_observacao: dados[0].faturamento_observacao
      } : 'Nenhum registro');
      
      // Filtrar registros de grade cirúrgica (MESMA LÓGICA que Documentação e Anestesia)
      const semGradeCirurgica = dados.filter(ag => {
        const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
        const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
        
        // CASO 1: Tem paciente E procedimento → SEMPRE MOSTRAR (mesmo se is_grade_cirurgica = true)
        if (temPaciente && temProcedimento) {
          return true; // ✅ Incluir
        }
        
        // CASO 2: Registro estrutural de grade (sem paciente) → OCULTAR
        if (ag.is_grade_cirurgica === true && !temPaciente) {
          return false; // ❌ Excluir (é apenas estrutura)
        }
        
        // CASO 3: Registro vazio (sem procedimento E sem paciente) → OCULTAR
        if (!temProcedimento && !temPaciente) {
          return false; // ❌ Excluir
        }
        
        // CASO 4: Demais casos → MOSTRAR (mesma lógica da Documentação)
        return true;
      });
      const agendamentosFiltrados = semGradeCirurgica;
      
      // DEBUG: Análise detalhada e contagem de pacientes únicos
      const totalOriginal = dados.length;
      const totalFiltrado = agendamentosFiltrados.length;
      const totalExcluidos = totalOriginal - totalFiltrado;
      
      // Contar pacientes ÚNICOS no total filtrado
      const pacientesUnicos = new Set<string>();
      agendamentosFiltrados.forEach(ag => {
        const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
        if (nomePaciente && nomePaciente !== '') {
          pacientesUnicos.add(nomePaciente);
        }
      });
      
      console.log('💰 FATURAMENTO - CONTAGEM:');
      console.log(`  Total de REGISTROS no banco: ${totalOriginal}`);
      console.log(`  Total de REGISTROS após filtro: ${totalFiltrado}`);
      console.log(`  Total de REGISTROS excluídos: ${totalExcluidos}`);
      console.log(`  🎯 PACIENTES ÚNICOS (final): ${pacientesUnicos.size}`);
      
      // Estatísticas (apenas pacientes reais, não procedimentos vazios)
      const comPaciente = agendamentosFiltrados.filter(ag => 
        ag.nome_paciente && ag.nome_paciente.trim() !== '' &&
        ag.procedimentos && ag.procedimentos.trim() !== ''
      );
      const prontos = comPaciente.filter(ag => 
        ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true
      ).length;
      const pendentes = comPaciente.filter(ag => 
        !(ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true)
      ).length;
      
      console.log('  Total de REGISTROS (com paciente e procedimento):', comPaciente.length);
      console.log('   - Prontos (exames + pré-op):', prontos);
      console.log('   - Pendentes:', pendentes);
      
      setAgendamentos(agendamentosFiltrados);
      const hoje = hojeLocalStr();
      const countHoje = agendamentosFiltrados.filter(a => {
        const hora = a.justificativa_alteracao_agendamento_nome_hora || a.updated_at || '';
        const d = hora ? (hora.includes('T') ? hora.split('T')[0] : hora.substring(0, 10)) : '';
        const temJust = !!((a.justificativa_alteracao_agendamento || '').trim() || (a.justificativa_alteracao_agendamento_nome || '').trim());
        return temJust && d === hoje;
      }).length;
      setJustificadosHoje(countHoje);
      const listaHoje = agendamentosFiltrados.filter(a => {
        const hora = a.justificativa_alteracao_agendamento_nome_hora || a.updated_at || '';
        const d = hora ? (hora.includes('T') ? hora.split('T')[0] : hora.substring(0, 10)) : '';
        const temJust = !!((a.justificativa_alteracao_agendamento || '').trim() || (a.justificativa_alteracao_agendamento_nome || '').trim());
        return temJust && d === hoje;
      });
      setJustificadosHojeLista(listaHoje);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const channel = supabase
      .channel(`fat-just-${hospitalId || 'all'}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendamentos' }, (payload: any) => {
        const novo = payload?.new;
        if (!novo) return;
        if (hospitalId && novo.hospital_id && novo.hospital_id !== hospitalId) return;
        setAgendamentos(prev => {
          const atualizados = prev.map(a => a.id === novo.id ? { ...a, justificativa_alteracao_agendamento: novo.justificativa_alteracao_agendamento, justificativa_alteracao_agendamento_nome: novo.justificativa_alteracao_agendamento_nome, justificativa_alteracao_agendamento_nome_hora: novo.justificativa_alteracao_agendamento_nome_hora, updated_at: novo.updated_at } : a);
          const hoje = hojeLocalStr();
          const countHoje = atualizados.filter(ax => {
            const hora = ax.justificativa_alteracao_agendamento_nome_hora || ax.updated_at || '';
            const d = hora ? (hora.includes('T') ? hora.split('T')[0] : hora.substring(0, 10)) : '';
            const temJust = !!((ax.justificativa_alteracao_agendamento || '').trim() || (ax.justificativa_alteracao_agendamento_nome || '').trim());
            return temJust && d === hoje;
          }).length;
          setJustificadosHoje(countHoje);
          const listaHoje = atualizados.filter(ax => {
            const hora = ax.justificativa_alteracao_agendamento_nome_hora || ax.updated_at || '';
            const d = hora ? (hora.includes('T') ? hora.split('T')[0] : hora.substring(0, 10)) : '';
            const temJust = !!((ax.justificativa_alteracao_agendamento || '').trim() || (ax.justificativa_alteracao_agendamento_nome || '').trim());
            return temJust && d === hoje;
          });
          setJustificadosHojeLista(listaHoje);
          return atualizados;
        });
      });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId]);

  // Status e estilos iguais aos da Documentação
  const getAihStatusStyle = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'autorizado':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'pendência hospital':
      case 'pendencia hospital':
        return 'bg-orange-50 border-orange-400 text-orange-800';
      case 'pendência faturamento':
      case 'pendencia faturamento':
        return 'bg-rose-50 border-rose-400 text-rose-800';
      case 'auditor externo':
        return 'bg-indigo-50 border-indigo-400 text-indigo-800';
      case 'aguardando ciência sms':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      case 'agendado':
        return 'bg-slate-100 border-slate-400 text-slate-900';
      case 'ag regulação':
        return 'bg-indigo-50 border-indigo-400 text-indigo-800';
      case 'solicitar':
        return 'bg-amber-50 border-amber-400 text-amber-800';
      case 'emitida':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'aih represada':
        return 'bg-red-50 border-red-400 text-red-800';
      case 'ag ciência sms':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      case 'ag. correção':
        return 'bg-teal-50 border-teal-400 text-teal-800';
      case 'n/a - urgência':
        return 'bg-purple-50 border-purple-400 text-purple-800';
      default:
        return 'bg-white border-gray-300 text-gray-600';
    }
  };
  const getAihDotColor = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'autorizado':
        return 'bg-green-500';
      case 'pendência hospital':
      case 'pendencia hospital':
        return 'bg-orange-500';
      case 'pendência faturamento':
      case 'pendencia faturamento':
        return 'bg-rose-500';
      case 'auditor externo':
        return 'bg-indigo-500';
      case 'aguardando ciência sms':
        return 'bg-blue-500';
      case 'agendado':
        return 'bg-slate-500';
      case 'ag regulação':
        return 'bg-indigo-500';
      case 'solicitar':
        return 'bg-amber-500';
      case 'emitida':
        return 'bg-green-500';
      case 'aih represada':
        return 'bg-red-500';
      case 'ag ciência sms':
        return 'bg-blue-500';
      case 'ag. correção':
        return 'bg-teal-500';
      case 'n/a - urgência':
        return 'bg-purple-500';
      default:
        return 'bg-gray-300';
    }
  };
  const getLiberacaoStatusStyle = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'liberado':
      case 'liberado para cirurgia':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'anestesista':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      case 'cardio':
        return 'bg-violet-50 border-violet-400 text-violet-800';
      case 'exames':
        return 'bg-amber-50 border-amber-400 text-amber-800';
      case 'não liberado':
      case 'não liberado para cirurgia':
        return 'bg-red-50 border-red-400 text-red-800';
      case 'confirmado com paciente':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'cirurgia cancelada':
        return 'bg-red-50 border-red-400 text-red-800';
      default:
        return 'bg-white border-gray-300 text-gray-600';
    }
  };
  const getLiberacaoDotColor = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'liberado':
      case 'liberado para cirurgia':
        return 'bg-green-500';
      case 'anestesista':
        return 'bg-blue-500';
      case 'cardio':
        return 'bg-violet-500';
      case 'exames':
        return 'bg-amber-500';
      case 'não liberado':
      case 'não liberado para cirurgia':
        return 'bg-red-500';
      case 'confirmado com paciente':
        return 'bg-green-500';
      case 'cirurgia cancelada':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  const getStatusPaciente = (ag: Agendamento) => {
    const temExames = ag.documentos_ok === true;
    if (temExames) return { texto: 'COM EXAMES', cor: 'bg-green-100 text-green-800', grupo: 'com_exames' as const };
    return { texto: 'SEM EXAMES', cor: 'bg-red-100 text-red-800', grupo: 'sem_exames' as const };
  };
  const getStatusPreOp = (ag: Agendamento) => {
    const temPreOp = ag.ficha_pre_anestesica_ok === true;
    if (temPreOp) return { texto: 'COM PRE-OP', cor: 'bg-blue-100 text-blue-800' };
    return { texto: 'SEM PRE-OP', cor: 'bg-orange-100 text-orange-800' };
  };

  // Atualizações iguais às da Documentação
  const [salvandoAIH, setSalvandoAIH] = useState<Set<string>>(new Set());
  const [salvandoLiberacao, setSalvandoLiberacao] = useState<Set<string>>(new Set());
  const handleAtualizarStatusLiberacao = async (agendamentoId: string | undefined, novoStatus: string | null) => {
    if (!agendamentoId) return;
    try {
      setSalvandoLiberacao(prev => new Set(prev).add(agendamentoId));
      await agendamentoService.update(agendamentoId, { status_de_liberacao: novoStatus });
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoId ? { ...ag, status_de_liberacao: novoStatus } : ag));
      success('Status de liberação atualizado');
    } catch (error: any) {
      console.error('Erro ao atualizar status de liberação:', error);
      toastError(`Erro ao atualizar status: ${error.message}`);
    } finally {
      setSalvandoLiberacao(prev => {
        const next = new Set(prev);
        next.delete(agendamentoId);
        return next;
      });
    }
  };
  const handleAtualizarConfirmacao = async (agendamentoId: string | undefined, novaConfirmacao: string) => {
    if (!agendamentoId) return;
    try {
      await agendamentoService.update(agendamentoId, { confirmacao: novaConfirmacao });
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoId ? { ...ag, confirmacao: novaConfirmacao } : ag));
    } catch (error: any) {
      console.error('Erro ao atualizar confirmação:', error);
      toastError(`Erro ao atualizar confirmação: ${error.message}`);
    }
  };

  // Formatar data
  const formatarData = (data: string | null | undefined) => {
    if (!data || data === '2000-01-01') return '-';
    const dataStr = String(data).trim();
    if (dataStr === '' || dataStr === 'null' || dataStr === 'undefined') return '-';
    if (dataStr.includes('/')) return dataStr;
    const parts = dataStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return dataStr;
  };
  
  // Formatar procedimento com especificação (se houver)
  const formatarProcedimento = (ag: Agendamento): string => {
    const base = ag.procedimentos || '';
    const especificacao = ag.procedimento_especificacao || '';
    
    if (!base) return '-';
    if (!especificacao) return base;
    
    return `${base} - ${especificacao}`;
  };

  const ageFromISO = (iso?: string | null): number | null => {
    if (!iso) return null;
    const parts = String(iso).split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const today = new Date();
    let age = today.getFullYear() - year;
    const mDiff = (today.getMonth() + 1) - month;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) age--;
    return isNaN(age) ? null : age;
  };
  const imageToBase64 = (url: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas ctx'));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Helper: Contar pacientes únicos em uma lista de agendamentos
  const getPacientesUnicos = (agendamentosList: Agendamento[]): number => {
    const pacientes = new Set<string>();
    agendamentosList.forEach(ag => {
      const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
      if (nomePaciente && nomePaciente !== '') {
        pacientes.add(nomePaciente);
      }
    });
    return pacientes.size;
  };

  // Agrupar por paciente único (para relatórios, se necessário no futuro)
  const agruparPorPacienteUnico = (agendamentosList: Agendamento[]): Agendamento[] => {
    const pacientesMap = new Map<string, Agendamento>();
    
    agendamentosList.forEach(ag => {
      const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
      if (!nomePaciente || nomePaciente === '') return;
      
      if (pacientesMap.has(nomePaciente)) {
        const existente = pacientesMap.get(nomePaciente)!;
        const dataExistente = new Date(existente.created_at || 0).getTime();
        const dataAtual = new Date(ag.created_at || 0).getTime();
        
        if (dataAtual > dataExistente) {
          pacientesMap.set(nomePaciente, ag);
        }
      } else {
        pacientesMap.set(nomePaciente, ag);
      }
    });
    
    return Array.from(pacientesMap.values());
  };

  // Conjuntos iguais aos da Documentação para pendências
  const agendamentosComPaciente = agendamentos.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    if (temPaciente && temProcedimento) return true;
    if (ag.is_grade_cirurgica === true && !temPaciente) return false;
    if (!temProcedimento && !temPaciente) return false;
    return true;
  });
  const agendamentosProntos = agendamentosComPaciente.filter(ag => ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true);
  const agendamentosPendentes = agendamentosComPaciente.filter(ag => !(ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true));
  
  // Calcular pacientes únicos para os KPIs (usando Set - mais simples e direto)
  const totalPacientesUnicos = getPacientesUnicos(agendamentosComPaciente);
  const totalPendentesUnicos = getPacientesUnicos(agendamentosPendentes);
  
  // Aplicar filtros (mantidos)
  const aplicarFiltros = (lista: Agendamento[]) => {
    return lista.filter(ag => {
      // Filtro por Status dos Exames
      if (filtroStatusExames) {
        const statusEx = getStatusPaciente(ag);
        if (statusEx.texto.toUpperCase() !== filtroStatusExames.toUpperCase()) return false;
      }
      
      // Filtro por paciente
      if (filtroPaciente) {
        const nomePaciente = (ag.nome_paciente || ag.nome || '').toLowerCase();
        if (!nomePaciente.includes(filtroPaciente.toLowerCase())) return false;
      }
      
      // Filtro por Nº Prontuário
      if (filtroProntuario) {
        const filtroDigits = (filtroProntuario || '').replace(/\D/g, '');
        const prDigits = (ag.n_prontuario || '').toString().replace(/\D/g, '');
        if (!prDigits.includes(filtroDigits)) return false;
      }
      
      // Filtro por data consulta
      if (filtroDataConsulta) {
        const dataConsulta = formatarData(ag.data_consulta).toLowerCase();
        if (!dataConsulta.includes(filtroDataConsulta.toLowerCase())) return false;
      }
      
      // Filtro por data cirurgia
      if (filtroDataCirurgia) {
        const dataCirurgia = formatarData(ag.data_agendamento || ag.dataAgendamento).toLowerCase();
        if (!dataCirurgia.includes(filtroDataCirurgia.toLowerCase())) return false;
      }
      
      // Filtro por mês da cirurgia (formato: "YYYY-MM")
      if (filtroMesCirurgia) {
        const dataCirurgiaRaw = ag.data_agendamento || ag.dataAgendamento;
        if (!dataCirurgiaRaw) return false;
        const mesCirurgia = dataCirurgiaRaw.substring(0, 7); // "YYYY-MM"
        if (mesCirurgia !== filtroMesCirurgia) return false;
      }
      
      // Filtro por médico
      if (filtroMedicoId) {
        const agMedicoId = ag.medico_id || (ag as any).medicoId || '';
        if (agMedicoId) {
          if (agMedicoId !== filtroMedicoId) return false;
        } else {
          const sel = medicosDisponiveis.find(m => m.id === filtroMedicoId);
          const nomeSel = (sel?.nome || '').trim().toLowerCase();
          const nomeAg = (ag.medico || '').trim().toLowerCase();
          if (!nomeSel || nomeAg !== nomeSel) return false;
        }
      }
      
      // Filtro por Status AIH
      if (filtroAih) {
        const aih = (ag.status_aih || 'Pendência Faturamento').toString().toLowerCase();
        if (aih !== filtroAih.toLowerCase()) return false;
      }
      
      // Filtro por Status Interno
      if (filtroStatusInterno) {
        const interno = (ag.status_de_liberacao || '').toString().toLowerCase();
        if (interno !== filtroStatusInterno.toLowerCase()) return false;
      }
      
      // Filtro por Confirmado
      if (filtroConfirmado) {
        const c = (ag.confirmacao || '').toString().toLowerCase();
        if (filtroConfirmado.toLowerCase() === 'confirmado') {
          if (c !== 'confirmado') return false;
        } else if (filtroConfirmado.toLowerCase() === 'aguardando') {
          if (c === 'confirmado') return false;
        }
      }
      
      // Filtro por observação (Agendamento e Faturamento)
      if (filtroObservacao) {
        const obsAg = (ag.observacao_agendamento || '').trim();
        const obsFat = (ag.faturamento_observacao || ag.observacao_faturamento || '').trim();
        const hasAg = !!obsAg;
        const hasFat = !!obsFat;
        if (filtroObservacao === 'obs_agendamento' && !(hasAg && !hasFat)) return false;
        if (filtroObservacao === 'obs_faturamento' && !(hasFat && !hasAg)) return false;
        if (filtroObservacao === 'obs_ambos' && !(hasAg && hasFat)) return false;
        if (filtroObservacao === 'sem_observacao' && (hasAg || hasFat)) return false;
      }
      
      if (filtroJustificativa) {
        const hasJust = !!((ag.justificativa_alteracao_agendamento || '').trim() || (ag.justificativa_alteracao_agendamento_nome || '').trim());
        if (filtroJustificativa === 'com_justificativa' && !hasJust) return false;
        if (filtroJustificativa === 'sem_justificativa' && hasJust) return false;
        if (filtroJustificativa === 'com_justificativa') {
          const aihRaw = (ag.status_aih || '').toString().trim().toLowerCase();
          if (aihRaw === 'autorizado' || aihRaw === 'n/a - urgência' || aihRaw === 'n/a - urgencia') return false;
        }
      }
      
      // Filtro por Data de Inserção (created_at, formato YYYY-MM-DD)
      if (filtroDataInsercao) {
        const created = (ag.created_at || '').toString();
        const datePart = created.includes('T') ? created.split('T')[0] : created.substring(0, 10);
        if (!datePart || datePart !== filtroDataInsercao) return false;
      }
      
      return true;
    });
  };
  
  const agendamentosComAnexosFiltrados = aplicarFiltros(agendamentosComPaciente);
  const agendamentosPendentesFiltrados = aplicarFiltros(agendamentosPendentes);
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroStatusExames('');
    setFiltroPaciente('');
    setFiltroProntuario('');
    setFiltroDataConsulta('');
    setFiltroDataCirurgia('');
    setFiltroMesCirurgia('');
    setFiltroMedicoId('');
    setFiltroAih('');
    setFiltroStatusInterno('');
    setFiltroConfirmado('');
    setFiltroObservacao('');
    setFiltroJustificativa('');
    setFiltroDataInsercao('');
  };

  const handleAbrirModalRelatorio = () => {
    setReportAihStatus(filtroAih || '');
    setReportStartDate('');
    setReportEndDate('');
    setReportModalAberto(true);
  };

  const handleEmitirRelatorio = () => {
    const statusSelecionado = (reportAihStatus || '').trim();
    if (!statusSelecionado) {
      toastError('Selecione o Status AIH para emitir o relatório');
      return;
    }
    const start = reportStartDate ? new Date(reportStartDate) : null;
    const end = reportEndDate ? new Date(reportEndDate) : null;
    if (start && end && start > end) {
      toastError('Período inválido: data inicial maior que a final');
      return;
    }
    const lista = agendamentos.filter(ag => {
      const s = (ag.status_aih || '').toString().trim();
      if (s !== statusSelecionado) return false;
      const d = parseDateStr(ag.data_agendamento || ag.dataAgendamento);
      if (start && (!d || d < start)) return false;
      if (end && (!d || d > end)) return false;
      return true;
    });
    if (lista.length === 0) {
      toastError('Nenhum registro encontrado para o status selecionado');
      return;
    }
    const periodoTxt = `${reportStartDate ? new Date(reportStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportEndDate ? new Date(reportEndDate).toLocaleDateString('pt-BR') : '-'}`;
    const headers = [
      'Paciente','Prontuario','Município','Telefone',
      'Data Nascimento','Idade',
      'Procedimento','Esp. Procedimento','Cirurgião',
      'Data Consulta','Data Cirurgia',
      'Status AIH','Status Interno','Confirmado',
      'Obs. Agendamento','Obs. Faturamento',
      'Justificativa','Justificativa por','Justificativa data/hora',
      'Exames OK','Pré-Op OK','Complementares OK',
      'Complementares URLs','Ficha Pré-Op URL'
    ];
    const aoaRows = lista.map(ag => {
      const idade = ageFromISO(ag.data_nascimento || ag.dataNascimento);
      let complUrls = '';
      try {
        if (ag.complementares_urls) {
          const arr = JSON.parse(ag.complementares_urls);
          if (Array.isArray(arr)) complUrls = arr.join('; ');
        }
      } catch {}
      return [
        ag.nome_paciente || ag.nome || '',
        ag.n_prontuario || '',
        ag.cidade_natal || ag.cidadeNatal || '',
        ag.telefone || '',
        formatarData(ag.data_nascimento || ag.dataNascimento),
        idade !== null ? String(idade) : '',
        formatarProcedimento(ag) || '',
        ag.procedimento_especificacao || '',
        ag.medico || '',
        formatarData(ag.data_consulta),
        formatarData(ag.data_agendamento || ag.dataAgendamento),
        ag.status_aih || '',
        ag.status_de_liberacao || '',
        ag.confirmacao || '',
        ag.observacao_agendamento || '',
        (ag.observacao_faturamento || ag.faturamento_observacao || ''),
        ag.justificativa_alteracao_agendamento || '',
        ag.justificativa_alteracao_agendamento_nome || '',
        ag.justificativa_alteracao_agendamento_nome_hora || '',
        ag.documentos_ok ? 'Sim' : 'Não',
        ag.ficha_pre_anestesica_ok ? 'Sim' : 'Não',
        ag.complementares_ok ? 'Sim' : 'Não',
        complUrls,
        ag.ficha_pre_anestesica_url || ''
      ];
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[`Relatório Status AIH: ${statusSelecionado} • Período: ${periodoTxt} • Total: ${lista.length}`], headers, ...aoaRows]);
    ws['!merges'] = [{ s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: 0 } }];
    XLSX.utils.book_append_sheet(wb, ws, statusSelecionado.slice(0, 30));
    const statusMap: Record<string, number> = {};
    const medicoMap: Record<string, number> = {};
    const espMap: Record<string, number> = {};
    const confirmadoMap: Record<string, number> = {};
    const internoMap: Record<string, number> = {};
    lista.forEach(ag => {
      const s = (ag.status_aih || '').trim() || '-';
      statusMap[s] = (statusMap[s] || 0) + 1;
      const m = (ag.medico || '').trim() || '-';
      medicoMap[m] = (medicoMap[m] || 0) + 1;
      const e = (ag.especialidade || '').trim() || '-';
      espMap[e] = (espMap[e] || 0) + 1;
      const c = (ag.confirmacao || '').trim() || '-';
      confirmadoMap[c] = (confirmadoMap[c] || 0) + 1;
      const i = (ag.status_de_liberacao || '').trim() || '-';
      internoMap[i] = (internoMap[i] || 0) + 1;
    });
    const resumoData: any[][] = [];
    resumoData.push([`Resumo • Status: ${statusSelecionado} • Período: ${periodoTxt} • Total: ${lista.length}`]);
    resumoData.push([]);
    resumoData.push(['Por Status AIH']);
    resumoData.push(['Status AIH','Qtd']);
    Object.entries(statusMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>resumoData.push([k,String(v)]));
    resumoData.push([]);
    resumoData.push(['Por Médico']);
    resumoData.push(['Médico','Qtd']);
    Object.entries(medicoMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>resumoData.push([k,String(v)]));
    resumoData.push([]);
    resumoData.push(['Por Especialidade']);
    resumoData.push(['Especialidade','Qtd']);
    Object.entries(espMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>resumoData.push([k,String(v)]));
    resumoData.push([]);
    resumoData.push(['Por Confirmado']);
    resumoData.push(['Confirmado','Qtd']);
    Object.entries(confirmadoMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>resumoData.push([k,String(v)]));
    resumoData.push([]);
    resumoData.push(['Por Status Interno']);
    resumoData.push(['Status Interno','Qtd']);
    Object.entries(internoMap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>resumoData.push([k,String(v)]));
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!merges'] = [{ s: { c: 0, r: 0 }, e: { c: 5, r: 0 } }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    const now = new Date();
    const nomeArquivo = `Relatorio_AIH_${statusSelecionado}_${now.toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setReportModalAberto(false);
    success('Relatório Excel gerado');
  };

  const handleAbrirModalRelatorioConfirmado = () => {
    setReportConfirmStatus(filtroConfirmado || '');
    setReportConfirmStartDate('');
    setReportConfirmEndDate('');
    setReportConfirmModalAberto(true);
  };

  const gerarPDFRelatorioConfirmado = async () => {
    const statusSelecionado = (reportConfirmStatus || '').trim();
    if (!statusSelecionado) {
      toastError('Selecione o status Confirmado para emitir o relatório');
      return;
    }
    const start = reportConfirmStartDate ? new Date(reportConfirmStartDate) : null;
    const end = reportConfirmEndDate ? new Date(reportConfirmEndDate) : null;
    if (start && end && start > end) {
      toastError('Período inválido: data inicial maior que a final');
      return;
    }
    const lista = agendamentos.filter(ag => {
      const c = (ag.confirmacao || '').toString().trim();
      if (c !== statusSelecionado) return false;
      const d = parseDateStr(ag.data_agendamento || ag.dataAgendamento);
      if (start && (!d || d < start)) return false;
      if (end && (!d || d > end)) return false;
      return true;
    });
    if (lista.length === 0) {
      toastError('Nenhum registro encontrado para o status selecionado');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    try {
      const logoPath = '/CIS Sem fundo.jpg';
      const logoBase64 = await imageToBase64(logoPath);
      const logoWidth = 25;
      const logoHeight = 15;
      doc.addImage(logoBase64, 'JPEG', 14, 8, logoWidth, logoHeight, undefined, 'FAST');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const titleY = 8 + (logoHeight / 2) - 3;
      doc.text(`Relatório - Confirmado: ${statusSelecionado}`, 14 + logoWidth + 5, titleY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportConfirmStartDate ? new Date(reportConfirmStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportConfirmEndDate ? new Date(reportConfirmEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14 + logoWidth + 5, titleY + 7);
      doc.text(`Total de registros: ${lista.length}`, 14 + logoWidth + 5, titleY + 12);
    } catch {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório - Confirmado: ${statusSelecionado}`, 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportConfirmStartDate ? new Date(reportConfirmStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportConfirmEndDate ? new Date(reportConfirmEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14, 22);
      doc.text(`Total de registros: ${lista.length}`, 14, 27);
    }
    const tableData = lista.map(ag => [
      formatarData(ag.data_agendamento || ag.dataAgendamento),
      ag.especialidade || '-',
      formatarProcedimento(ag) || '-',
      ag.procedimento_especificacao || '-',
      ag.medico || '-',
      ag.nome_paciente || ag.nome || '-',
      ag.n_prontuario || '-',
      ageFromISO(ag.data_nascimento || ag.dataNascimento) !== null ? String(ageFromISO(ag.data_nascimento || ag.dataNascimento)) : '-',
      ag.cidade_natal || ag.cidadeNatal || '-',
      ag.telefone || '-',
      formatarData(ag.data_consulta),
      formatarData(ag.data_nascimento || ag.dataNascimento),
      ag.confirmacao || '-'
    ]);
    autoTable(doc, {
      head: [['Data', 'Especialidade', 'Procedimento', 'Esp. Procedimento', 'Médico', 'Paciente', 'Prontuário', 'Idade', 'Cidade', 'Telefone', 'Consulta', 'Nascimento', 'Confirmado']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: { top: 0.8, right: 1, bottom: 0.8, left: 1 }, overflow: 'linebreak', halign: 'left', valign: 'middle' },
      headStyles: { fillColor: [128, 128, 128], textColor: 255, fontStyle: 'bold', fontSize: 6, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 16, halign: 'left', overflow: 'ellipsize' },
        1: { cellWidth: 23, halign: 'left', overflow: 'linebreak' },
        2: { cellWidth: 26, halign: 'left', overflow: 'linebreak' },
        3: { cellWidth: 26, halign: 'left', overflow: 'linebreak' },
        4: { cellWidth: 28, halign: 'left', overflow: 'linebreak' },
        5: { cellWidth: 27, halign: 'left', overflow: 'linebreak' },
        6: { cellWidth: 16, halign: 'center', overflow: 'ellipsize' },
        7: { cellWidth: 12, halign: 'center', overflow: 'ellipsize' },
        8: { cellWidth: 19, halign: 'left', overflow: 'ellipsize' },
        9: { cellWidth: 19, halign: 'left', overflow: 'ellipsize' },
        10: { cellWidth: 18, halign: 'center', overflow: 'ellipsize' },
        11: { cellWidth: 18, halign: 'center', overflow: 'ellipsize' },
        12: { cellWidth: 24, halign: 'left', overflow: 'linebreak' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function (data: any) {
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });
    const nomeArquivo = `Relatorio_Confirmado_${statusSelecionado}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nomeArquivo);
  };
  const gerarPDFRelatorioAIH = async () => {
    const statusSelecionado = (reportAihStatus || '').trim();
    if (!statusSelecionado) {
      toastError('Selecione o Status AIH para emitir o relatório');
      return;
    }
    const start = reportStartDate ? new Date(reportStartDate) : null;
    const end = reportEndDate ? new Date(reportEndDate) : null;
    if (start && end && start > end) {
      toastError('Período inválido: data inicial maior que a final');
      return;
    }
    const lista = agendamentos.filter(ag => {
      const s = (ag.status_aih || '').toString().trim();
      if (s !== statusSelecionado) return false;
      const d = parseDateStr(ag.data_agendamento || ag.dataAgendamento);
      if (start && (!d || d < start)) return false;
      if (end && (!d || d > end)) return false;
      return true;
    });
    if (lista.length === 0) {
      toastError('Nenhum registro encontrado para o status selecionado');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    try {
      const logoPath = '/CIS Sem fundo.jpg';
      const logoBase64 = await imageToBase64(logoPath);
      const logoWidth = 25;
      const logoHeight = 15;
      doc.addImage(logoBase64, 'JPEG', 14, 8, logoWidth, logoHeight, undefined, 'FAST');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const titleY = 8 + (logoHeight / 2) - 3;
      doc.text(`Relatório - Status AIH: ${statusSelecionado}`, 14 + logoWidth + 5, titleY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportStartDate ? new Date(reportStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportEndDate ? new Date(reportEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14 + logoWidth + 5, titleY + 7);
      doc.text(`Total de registros: ${lista.length}`, 14 + logoWidth + 5, titleY + 12);
    } catch {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório - Status AIH: ${statusSelecionado}`, 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportStartDate ? new Date(reportStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportEndDate ? new Date(reportEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14, 22);
      doc.text(`Total de registros: ${lista.length}`, 14, 27);
    }
    const tableData = lista.map(ag => [
      formatarData(ag.data_agendamento || ag.dataAgendamento),
      ag.especialidade || '-',
      formatarProcedimento(ag) || '-',
      ag.procedimento_especificacao || '-',
      ag.medico || '-',
      ag.nome_paciente || ag.nome || '-',
      ag.n_prontuario || '-',
      ageFromISO(ag.data_nascimento || ag.dataNascimento) !== null ? String(ageFromISO(ag.data_nascimento || ag.dataNascimento)) : '-',
      ag.cidade_natal || ag.cidadeNatal || '-',
      ag.telefone || '-',
      formatarData(ag.data_consulta),
      formatarData(ag.data_nascimento || ag.dataNascimento),
      ag.status_aih || '-'
    ]);
    autoTable(doc, {
      head: [['Data', 'Especialidade', 'Procedimento', 'Esp. Procedimento', 'Médico', 'Paciente', 'Prontuário', 'Idade', 'Cidade', 'Telefone', 'Consulta', 'Nascimento', 'Status AIH']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: { top: 0.8, right: 1, bottom: 0.8, left: 1 }, overflow: 'linebreak', halign: 'left', valign: 'middle' },
      headStyles: { fillColor: [128, 128, 128], textColor: 255, fontStyle: 'bold', fontSize: 6, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 16, halign: 'left', overflow: 'ellipsize' },
        1: { cellWidth: 23, halign: 'left', overflow: 'linebreak' },
        2: { cellWidth: 26, halign: 'left', overflow: 'linebreak' },
        3: { cellWidth: 26, halign: 'left', overflow: 'linebreak' },
        4: { cellWidth: 28, halign: 'left', overflow: 'linebreak' },
        5: { cellWidth: 27, halign: 'left', overflow: 'linebreak' },
        6: { cellWidth: 16, halign: 'center', overflow: 'ellipsize' },
        7: { cellWidth: 12, halign: 'center', overflow: 'ellipsize' },
        8: { cellWidth: 19, halign: 'left', overflow: 'ellipsize' },
        9: { cellWidth: 19, halign: 'left', overflow: 'ellipsize' },
        10: { cellWidth: 18, halign: 'center', overflow: 'ellipsize' },
        11: { cellWidth: 18, halign: 'center', overflow: 'ellipsize' },
        12: { cellWidth: 24, halign: 'left', overflow: 'linebreak' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function (data: any) {
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    });
    const nomeArquivo = `Relatorio_AIH_${statusSelecionado}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nomeArquivo);
  };
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroStatusExames || filtroPaciente || filtroProntuario || filtroDataConsulta || filtroDataCirurgia || filtroMesCirurgia || filtroMedicoId || filtroAih || filtroStatusInterno || filtroConfirmado || filtroObservacao || filtroJustificativa || filtroDataInsercao;
  
  // Alternar ordenação ao clicar no cabeçalho
  const handleOrdenacao = (coluna: 'data_consulta' | 'data_cirurgia') => {
    if (colunaOrdenacao === coluna) {
      // Se já está ordenando por essa coluna, alterna a direção
      setDirecaoOrdenacao(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é uma nova coluna, define ela como ordenação com direção ascendente
      setColunaOrdenacao(coluna);
      setDirecaoOrdenacao('asc');
    }
  };
  
  const parseDateStr = (s?: string | null) => {
    if (!s || s === '9999-12-31') return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const refDate = (ag: Agendamento) => {
    if (colunaOrdenacao === 'data_consulta') return parseDateStr(ag.data_consulta);
    return parseDateStr(ag.data_agendamento || ag.dataAgendamento);
  };
  const monthPriority = (d: Date | null) => {
    if (!d) return 3;
    const now = new Date();
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return 0;
    if (d > now) return 1;
    return 2;
  };
  // Ordenar por data e médico
  const ordenarPorDataEMedico = (lista: Agendamento[]) => {
    return [...lista].sort((a, b) => {
      const dA = refDate(a);
      const dB = refDate(b);
      const pA = monthPriority(dA);
      const pB = monthPriority(dB);
      if (pA !== pB) return pA - pB;
      const sA = dA ? dA.toISOString().slice(0, 10) : '9999-12-31';
      const sB = dB ? dB.toISOString().slice(0, 10) : '9999-12-31';
      if (sA !== sB) {
        const cmp = sA.localeCompare(sB);
        return direcaoOrdenacao === 'asc' ? cmp : -cmp;
      }
      
      const medicoA = (a.medico || '').trim().toUpperCase();
      const medicoB = (b.medico || '').trim().toUpperCase();
      
      if (medicoA !== medicoB) {
        if (!medicoA) return 1;
        if (!medicoB) return -1;
        return medicoA.localeCompare(medicoB, 'pt-BR');
      }
      
      return 0;
    });
  };
  
  // Aplicar ordenação
  const agendamentosComAnexosOrdenados = ordenarPorDataEMedico(agendamentosComAnexosFiltrados);
  const agendamentosPendentesOrdenados = ordenarPorDataEMedico(agendamentosPendentesFiltrados);
  
  // Paginação
  const totalRegistros = agendamentosComAnexosOrdenados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
  
  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatusExames, filtroPaciente, filtroProntuario, filtroDataConsulta, filtroDataCirurgia, filtroMesCirurgia, filtroMedicoId, filtroAih, filtroStatusInterno, filtroConfirmado, filtroObservacao, filtroJustificativa, filtroDataInsercao]);
  
  // Rolar para o topo da tabela quando mudar de página
  useEffect(() => {
    if (tabelaRef.current && paginaAtual > 1) {
      tabelaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [paginaAtual]);
  
  // Aplicar paginação
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const agendamentosPaginados = agendamentosComAnexosOrdenados.slice(indexInicio, indexFim);

  // Toggle expandir/recolher linha
  const toggleExpandirLinha = (agendamentoId: string | undefined) => {
    if (!agendamentoId) return;
    setLinhasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(agendamentoId)) {
        novo.delete(agendamentoId);
      } else {
        novo.add(agendamentoId);
      }
      return novo;
    });
  };
  
  // Abrir modal para marcar como NÃO LIBERADO
  const handleAbrirModalNaoLiberado = (ag: Agendamento) => {
    setAgendamentoNaoLiberado(ag);
    setObservacaoNaoLiberado(ag.faturamento_observacao || '');
    setModalNaoLiberadoAberto(true);
  };
  
  // Fechar modal de NÃO LIBERADO
  const handleFecharModalNaoLiberado = () => {
    setModalNaoLiberadoAberto(false);
    setAgendamentoNaoLiberado(null);
    setObservacaoNaoLiberado('');
  };
  
  // Salvar marcação de NÃO LIBERADO (com observação)
  const handleSalvarNaoLiberado = async () => {
    if (!agendamentoNaoLiberado?.id) return;
    
    // Validar observação obrigatória
    if (!observacaoNaoLiberado.trim()) {
      warning('A observação é obrigatória para marcar como NÃO LIBERADO');
      return;
    }
    
    setSalvandoNaoLiberado(true);
    try {
      const updateData: Partial<Agendamento> = {
        faturamento_liberado: false,
        faturamento_observacao: observacaoNaoLiberado.trim(),
        faturamento_data: new Date().toISOString()
      };
      
      await agendamentoService.update(agendamentoNaoLiberado.id, updateData);
      
      // Atualizar lista local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoNaoLiberado.id 
          ? { ...ag, ...updateData }
          : ag
      ));
      
      handleFecharModalNaoLiberado();
      success('Marcado como NÃO LIBERADO');
    } catch (error) {
      console.error('Erro ao salvar NÃO LIBERADO:', error);
      toastError('Erro ao salvar. Tente novamente');
    } finally {
      setSalvandoNaoLiberado(false);
    }
  };
  
  // Marcar como LIBERADO
  const handleMarcarLiberado = async (ag: Agendamento) => {
    if (!ag.id) return;
    
    // Se já está marcado como NÃO LIBERADO, limpar a marcação
    if (ag.faturamento_liberado === false) {
      setConfirmMessage('Este paciente está marcado como NÃO LIBERADO. Deseja limpar esta marcação e marcar como LIBERADO?');
      confirmActionRef.current = async () => {
        try {
          const updateData: Partial<Agendamento> = {
            faturamento_liberado: true,
            faturamento_observacao: null,
            faturamento_data: new Date().toISOString()
          };
          await agendamentoService.update(ag.id!, updateData);
          setAgendamentos(prev => prev.map(agItem => 
            agItem.id === ag.id 
              ? { ...agItem, ...updateData }
              : agItem
          ));
        } catch (error) {
          console.error('Erro ao marcar como liberado:', error);
          toastError('Erro ao salvar. Tente novamente');
        }
      };
      setConfirmOpen(true);
      return;
    } else if (ag.faturamento_liberado === true) {
      // Se já está LIBERADO, desmarcar (voltar para null)
      try {
        const updateData: Partial<Agendamento> = {
          faturamento_liberado: null,
          faturamento_observacao: null,
          faturamento_data: null
        };
        
        await agendamentoService.update(ag.id, updateData);
        
        // Atualizar lista local
        setAgendamentos(prev => prev.map(agItem => 
          agItem.id === ag.id 
            ? { ...agItem, ...updateData }
            : agItem
        ));
      } catch (error) {
        console.error('Erro ao desmarcar:', error);
        toastError('Erro ao desmarcar. Tente novamente');
      }
    } else {
      // Se está null (sem seleção), marcar como LIBERADO
      try {
        const updateData: Partial<Agendamento> = {
          faturamento_liberado: true,
          faturamento_data: new Date().toISOString()
        };
        
        await agendamentoService.update(ag.id, updateData);
        
        // Atualizar lista local
        setAgendamentos(prev => prev.map(agItem => 
          agItem.id === ag.id 
            ? { ...agItem, ...updateData }
            : agItem
        ));
      } catch (error) {
        console.error('Erro ao marcar como liberado:', error);
        toastError('Erro ao salvar. Tente novamente');
      }
    }
  };
  
  // Obter cor do checkbox LIBERADO
  const getCorLiberado = (ag: Agendamento) => {
    if (ag.faturamento_liberado === true) {
      return 'bg-green-100 text-green-800 border-2 border-green-500';
    }
    if (ag.faturamento_liberado === false) {
      return 'bg-gray-50 text-gray-600 border border-gray-300';
    }
    // null = sem seleção
    return 'bg-gray-50 text-gray-600 border border-gray-300 hover:border-green-400';
  };
  
  // Obter cor do checkbox NÃO LIBERADO
  const getCorNaoLiberado = (ag: Agendamento) => {
    if (ag.faturamento_liberado === false) {
      return 'bg-red-100 text-red-800 border-2 border-red-500';
    }
    if (ag.faturamento_liberado === true) {
      return 'bg-gray-50 text-gray-600 border border-gray-300';
    }
    // null = sem seleção
    return 'bg-gray-50 text-gray-600 border border-gray-300 hover:border-red-400';
  };
  
  // Atualizar status do faturamento
  const handleAtualizarStatus = async (ag: Agendamento, novoStatus: 'pendente' | 'auditor' | 'autorizado' | null) => {
    if (!ag.id) return;
    
    try {
      const updateData: Partial<Agendamento> = {
        faturamento_status: novoStatus
      };
      
      await agendamentoService.update(ag.id, updateData);
      
      // Atualizar lista local
      setAgendamentos(prev => prev.map(agItem => 
        agItem.id === ag.id 
          ? { ...agItem, ...updateData }
          : agItem
      ));
      
      if (novoStatus) {
        success(`Status atualizado para "${novoStatus.charAt(0).toUpperCase() + novoStatus.slice(1)}"`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toastError('Erro ao atualizar status. Tente novamente');
    }
  };
  
  // Obter estilo do select de status (faturamento)
  const getStatusSelectStyle = (status: string | null | undefined) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'auditor':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      case 'autorizado':
        return 'bg-green-50 border-green-400 text-green-800';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-600';
    }
  };

  // Estados e funções de Documentação (upload/visualização)
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalVisualizacaoAberto, setModalVisualizacaoAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'documentos' | 'ficha' | 'complementares'>('documentos');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [arquivosDocumentosSelecionados, setArquivosDocumentosSelecionados] = useState<File[]>([]);
  const [documentosAnexados, setDocumentosAnexados] = useState<string[]>([]);
  const fileInputDocumentosRef = useRef<HTMLInputElement>(null);
  const [arquivoFichaSelecionado, setArquivoFichaSelecionado] = useState<File | null>(null);
  const [fichaAnexada, setFichaAnexada] = useState<string | null>(null);
  const fileInputFichaRef = useRef<HTMLInputElement>(null);
  const [arquivosComplementaresSelecionados, setArquivosComplementaresSelecionados] = useState<File[]>([]);
  const [complementaresAnexados, setComplementaresAnexados] = useState<string[]>([]);
  const [tipoDeExame, setTipoDeExame] = useState<string>('');
  const [examesMeta, setExamesMeta] = useState<Array<{ url: string; tipo: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const handleAbrirModalUpload = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    setArquivosDocumentosSelecionados([]);
    setArquivoFichaSelecionado(null);
    setArquivosComplementaresSelecionados([]);
    setAbaAtiva('documentos');
    setModalUploadAberto(true);
    setTipoDeExame('');
    setExamesMeta([]);
    if (ag.documentos_urls) {
      try { const urls = JSON.parse(ag.documentos_urls); setDocumentosAnexados(Array.isArray(urls) ? urls : []); } catch { setDocumentosAnexados([]); }
    } else { setDocumentosAnexados([]); }
    const rawMeta: any = (ag as any).documentos_meta;
    if (typeof rawMeta === 'string') { try { const parsed = JSON.parse(rawMeta); setExamesMeta(Array.isArray(parsed) ? parsed : []); } catch { setExamesMeta([]); } }
    else if (Array.isArray(rawMeta)) { setExamesMeta(rawMeta); } else { setExamesMeta([]); }
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
    if (ag.complementares_urls) {
      try { const urls = JSON.parse(ag.complementares_urls); setComplementaresAnexados(Array.isArray(urls) ? urls : []); } catch { setComplementaresAnexados([]); }
    } else { setComplementaresAnexados([]); }
  };
  const handleAbrirModalVisualizacao = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    if (ag.documentos_urls) {
      try { const urls = JSON.parse(ag.documentos_urls); setDocumentosAnexados(Array.isArray(urls) ? urls : []); } catch { setDocumentosAnexados([]); }
    } else { setDocumentosAnexados([]); }
    const rawMeta2: any = (ag as any).documentos_meta;
    if (typeof rawMeta2 === 'string') { try { const parsed = JSON.parse(rawMeta2); setExamesMeta(Array.isArray(parsed) ? parsed : []); } catch { setExamesMeta([]); } }
    else if (Array.isArray(rawMeta2)) { setExamesMeta(rawMeta2); } else { setExamesMeta([]); }
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
    if (ag.complementares_urls) {
      try { const urls = JSON.parse(ag.complementares_urls); setComplementaresAnexados(Array.isArray(urls) ? urls : []); } catch { setComplementaresAnexados([]); }
    } else { setComplementaresAnexados([]); }
    setModalVisualizacaoAberto(true);
  };
  const handleSelecionarDocumentos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { const files = Array.from(e.target.files); setArquivosDocumentosSelecionados(prev => [...prev, ...files]); }
  };
  const handleRemoverDocumento = (index: number) => {
    setArquivosDocumentosSelecionados(prev => prev.filter((_, i) => i !== index));
    setTipoDeExame('');
  };
  const handleSelecionarFicha = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) { setArquivoFichaSelecionado(e.target.files[0]); }
  };
  const handleSelecionarComplementares = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { const files = Array.from(e.target.files); setArquivosComplementaresSelecionados(prev => [...prev, ...files]); }
  };
  const handleRemoverComplementar = (index: number) => {
    setArquivosComplementaresSelecionados(prev => prev.filter((_, i) => i !== index));
  };
  const handleUploadDocumentos = async () => {
    if (!agendamentoSelecionado?.id || arquivosDocumentosSelecionados.length === 0) return;
    if (!tipoDeExame || tipoDeExame.trim() === '') { warning('Selecione o tipo do exame antes de anexar'); return; }
    setUploading(true);
    const urlsUploaded: string[] = [];
    try {
      const getUniqueFileName = async (folder: string, originalName: string): Promise<string> => {
        const { data } = await supabase.storage.from('Documentos').list(folder, { limit: 1000 });
        const existing = new Set((data || []).map(f => f.name));
        if (!existing.has(originalName)) return originalName;
        const dot = originalName.lastIndexOf('.');
        const ext = dot >= 0 ? originalName.slice(dot) : '';
        const base = dot >= 0 ? originalName.slice(0, dot) : originalName;
        let i = 1; let candidate = `${base} (${i})${ext}`;
        while (existing.has(candidate)) { i++; candidate = `${base} (${i})${ext}`; }
        return candidate;
      };
      const folder = `documentos/${agendamentoSelecionado.id}`;
      for (const arquivo of arquivosDocumentosSelecionados) {
        const uniqueName = await getUniqueFileName(folder, arquivo.name);
        const filePath = `${folder}/${uniqueName}`;
        const { error: uploadError } = await supabase.storage.from('Documentos').upload(filePath, arquivo, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Erro ao fazer upload de ${arquivo.name}: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('Documentos').getPublicUrl(filePath);
        if (urlData?.publicUrl) { urlsUploaded.push(urlData.publicUrl); }
      }
      const todasUrls = [...documentosAnexados, ...urlsUploaded];
      const novasMetas = [...examesMeta, ...urlsUploaded.map(u => ({ url: u, tipo: tipoDeExame }))];
      const updateData: Partial<Agendamento> = {
        documentos_urls: JSON.stringify(todasUrls),
        documentos_ok: todasUrls.length > 0,
        documentos_data: new Date().toISOString(),
        tipo_de_exame: tipoDeExame,
        documentos_meta: novasMetas
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      setArquivosDocumentosSelecionados([]);
      setDocumentosAnexados(todasUrls);
      setTipoDeExame('');
      setExamesMeta(novasMetas);
      success('Exames anexados com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toastError(`Erro ao anexar documentos: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  const handleUploadFicha = async () => {
    if (!agendamentoSelecionado?.id || !arquivoFichaSelecionado) return;
    if (!agendamentoSelecionado.documentos_ok) { warning('É necessário anexar os exames primeiro'); setAbaAtiva('documentos'); return; }
    setUploading(true);
    try {
      const getUniqueFileName = async (folder: string, originalName: string): Promise<string> => {
        const { data } = await supabase.storage.from('Documentos').list(folder, { limit: 1000 });
        const existing = new Set((data || []).map(f => f.name));
        if (!existing.has(originalName)) return originalName;
        const dot = originalName.lastIndexOf('.'); const ext = dot >= 0 ? originalName.slice(dot) : ''; const base = dot >= 0 ? originalName.slice(0, dot) : originalName;
        let i = 1; let candidate = `${base} (${i})${ext}`; while (existing.has(candidate)) { i++; candidate = `${base} (${i})${ext}`; } return candidate;
      };
      const folder = `fichas/${agendamentoSelecionado.id}`;
      const uniqueName = await getUniqueFileName(folder, arquivoFichaSelecionado.name);
      const filePath = `${folder}/${uniqueName}`;
      const { error: uploadError } = await supabase.storage.from('Documentos').upload(filePath, arquivoFichaSelecionado, { cacheControl: '3600', upsert: false });
      if (uploadError) throw new Error(`Erro ao fazer upload da ficha: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('Documentos').getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Erro ao obter URL do arquivo');
      const updateData: Partial<Agendamento> = {
        ficha_pre_anestesica_url: urlData.publicUrl,
        ficha_pre_anestesica_ok: true,
        ficha_pre_anestesica_data: new Date().toISOString()
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      setArquivoFichaSelecionado(null);
      setFichaAnexada(urlData.publicUrl);
      success('Ficha pré-anestésica anexada com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toastError(`Erro ao anexar ficha: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoverDocumentoAnexado = async (url: string) => {
    if (!agendamentoSelecionado?.id) return;
    try {
      const novasUrls = documentosAnexados.filter(u => u !== url);
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('Documentos') + 1).join('/');
      const { error: deleteError } = await supabase.storage.from('Documentos').remove([filePath]);
      if (deleteError) console.error('Erro ao deletar arquivo:', deleteError);
      const metaFiltrada = examesMeta.filter(m => m.url !== url);
      const updateData: Partial<Agendamento> = {
        documentos_urls: novasUrls.length > 0 ? JSON.stringify(novasUrls) : null,
        documentos_ok: novasUrls.length > 0,
        documentos_data: novasUrls.length > 0 ? new Date().toISOString() : null,
        tipo_de_exame: novasUrls.length > 0 ? (agendamentoSelecionado.tipo_de_exame || tipoDeExame || null) : null,
        documentos_meta: metaFiltrada.length > 0 ? metaFiltrada : null
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setDocumentosAnexados(novasUrls);
      setExamesMeta(metaFiltrada);
      setTipoDeExame('');
      setAgendamentoSelecionado(prev => prev ? { ...prev, ...updateData } : prev);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      if (fileInputDocumentosRef.current) { fileInputDocumentosRef.current.value = ''; }
      success('Documento removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover documento:', error);
      toastError(`Erro ao remover documento: ${error.message}`);
    }
  };
  const handleUploadComplementares = async () => {
    if (!agendamentoSelecionado?.id || arquivosComplementaresSelecionados.length === 0) return;
    setUploading(true);
    const urlsUploaded: string[] = [];
    try {
      const getUniqueFileName = async (folder: string, originalName: string): Promise<string> => {
        const { data } = await supabase.storage.from('Documentos').list(folder, { limit: 1000 });
        const existing = new Set((data || []).map(f => f.name));
        if (!existing.has(originalName)) return originalName;
        const dot = originalName.lastIndexOf('.'); const ext = dot >= 0 ? originalName.slice(dot) : ''; const base = dot >= 0 ? originalName.slice(0, dot) : originalName;
        let i = 1; let candidate = `${base} (${i})${ext}`; while (existing.has(candidate)) { i++; candidate = `${base} (${i})${ext}`; } return candidate;
      };
      const folder = `complementares/${agendamentoSelecionado.id}`;
      for (const arquivo of arquivosComplementaresSelecionados) {
        const uniqueName = await getUniqueFileName(folder, arquivo.name);
        const filePath = `${folder}/${uniqueName}`;
        const { error: uploadError } = await supabase.storage.from('Documentos').upload(filePath, arquivo, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Erro ao fazer upload de ${arquivo.name}: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('Documentos').getPublicUrl(filePath);
        if (urlData?.publicUrl) { urlsUploaded.push(urlData.publicUrl); }
      }
      const todasUrls = [...complementaresAnexados, ...urlsUploaded];
      const updateData: Partial<Agendamento> = {
        complementares_urls: JSON.stringify(todasUrls),
        complementares_ok: todasUrls.length > 0,
        complementares_data: new Date().toISOString()
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      setArquivosComplementaresSelecionados([]);
      setComplementaresAnexados(todasUrls);
      success('Complementares anexados com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toastError(`Erro ao anexar complementares: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  const handleRemoverComplementarAnexado = async (url: string) => {
    if (!agendamentoSelecionado?.id) return;
    try {
      const novasUrls = complementaresAnexados.filter(u => u !== url);
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('Documentos') + 1).join('/');
      const { error: deleteError } = await supabase.storage.from('Documentos').remove([filePath]);
      if (deleteError) console.error('Erro ao deletar arquivo:', deleteError);
      const updateData: Partial<Agendamento> = {
        complementares_urls: novasUrls.length > 0 ? JSON.stringify(novasUrls) : null,
        complementares_ok: novasUrls.length > 0,
        complementares_data: novasUrls.length > 0 ? new Date().toISOString() : null
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setComplementaresAnexados(novasUrls);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      success('Documento complementar removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover complementar:', error);
      toastError(`Erro ao remover complementar: ${error.message}`);
    }
  };
  const handleRemoverFicha = async () => {
    if (!agendamentoSelecionado?.id || !fichaAnexada) return;
    try {
      const urlObj = new URL(fichaAnexada);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('Documentos') + 1).join('/');
      const { error: deleteError } = await supabase.storage.from('Documentos').remove([filePath]);
      if (deleteError) console.error('Erro ao deletar ficha:', deleteError);
      const updateData: Partial<Agendamento> = {
        ficha_pre_anestesica_url: null,
        ficha_pre_anestesica_ok: false,
        ficha_pre_anestesica_data: null
      };
      await agendamentoService.update(agendamentoSelecionado.id, updateData);
      setFichaAnexada(null);
      setAgendamentos(prev => prev.map(ag => ag.id === agendamentoSelecionado.id ? { ...ag, ...updateData } : ag));
      success('Ficha pré-operatória removida com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover ficha:', error);
      toastError(`Erro ao remover ficha: ${error.message}`);
    }
  };

  // Estado para controlar observação em edição
  const [observacaoEmEdicao, setObservacaoEmEdicao] = useState<{ [id: string]: string }>({});
  const [salvandoObservacao, setSalvandoObservacao] = useState<string | null>(null);
  const [justificativaEdicao, setJustificativaEdicao] = useState<{ [id: string]: string }>({});
  const [justificativaNomeEdicao, setJustificativaNomeEdicao] = useState<{ [id: string]: string }>({});
  const [salvandoJustificativaId, setSalvandoJustificativaId] = useState<string | null>(null);
  
  // Salvar observação do faturamento
  const handleSalvarObservacao = async (ag: Agendamento) => {
    if (!ag.id) return;
    
    const novaObservacao = observacaoEmEdicao[ag.id] ?? ag.observacao_faturamento ?? '';
    
    setSalvandoObservacao(ag.id);
    try {
      const updateData: Partial<Agendamento> = {
        observacao_faturamento: novaObservacao.trim() || null
      };
      
      await agendamentoService.update(ag.id, updateData);
      
      // Atualizar lista local
      setAgendamentos(prev => prev.map(agItem => 
        agItem.id === ag.id 
          ? { ...agItem, ...updateData }
          : agItem
      ));
      
      // Limpar estado de edição
      setObservacaoEmEdicao(prev => {
        const novo = { ...prev };
        delete novo[ag.id!];
        return novo;
      });
      
      success('Observação salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      toastError('Erro ao salvar observação. Tente novamente');
    } finally {
      setSalvandoObservacao(null);
    }
  };
  
  // Verificar se a observação foi modificada
  const observacaoModificada = (ag: Agendamento) => {
    if (!ag.id) return false;
    const original = ag.observacao_faturamento || '';
    const editada = observacaoEmEdicao[ag.id];
    if (editada === undefined) return false;
    return editada !== original;
  };
  
  const handleSalvarJustificativa = async (ag: Agendamento) => {
    if (!ag.id) return;
    const texto = (justificativaEdicao[ag.id] ?? ag.justificativa_alteracao_agendamento ?? '').trim();
    const nome = (justificativaNomeEdicao[ag.id] ?? ag.justificativa_alteracao_agendamento_nome ?? '').trim();
    const payload: Partial<Agendamento> = {
      justificativa_alteracao_agendamento: texto || null,
      justificativa_alteracao_agendamento_nome: nome || null,
      justificativa_alteracao_agendamento_nome_hora: new Date().toISOString()
    };
    try {
      setSalvandoJustificativaId(ag.id);
      await agendamentoService.update(ag.id, payload);
      setAgendamentos(prev => prev.map(a => a.id === ag.id ? { ...a, ...payload } : a));
      success('Justificativa salva');
    } catch (error) {
      console.error('Erro ao salvar justificativa:', error);
      toastError('Erro ao salvar justificativa. Tente novamente');
    } finally {
      setSalvandoJustificativaId(null);
    }
  };

  // Verificar se linha está expandida
  const isLinhaExpandida = (agendamentoId: string | undefined) => {
    return agendamentoId ? linhasExpandidas.has(agendamentoId) : false;
  };

  // Função auxiliar para baixar arquivo e retornar como blob
  const fetchFileAsBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
    }
    return await response.blob();
  };

  // Download de todos os documentos em um ZIP
  const handleDownloadTodos = async (ag: Agendamento) => {
    if (!ag.id) return;
    
    setDownloading(ag.id);
    
    try {
      // Verificar se há documentos para baixar
      const temDocumentos = ag.documentos_urls && ag.documentos_urls.trim() !== '';
      const temFicha = ag.ficha_pre_anestesica_url && ag.ficha_pre_anestesica_url.trim() !== '';

      if (!temDocumentos) {
        warning('Nenhum documento disponível para download');
        setDownloading(null);
        return;
      }
      
      // Se não tem ficha, avisar mas permitir download dos documentos
      if (!temFicha) {
        setConfirmMessage('Ficha pré-anestésica ainda não foi anexada. Deseja baixar apenas os documentos disponíveis?');
        confirmActionRef.current = () => {};
        setConfirmOpen(true);
      }

      // Criar instância do JSZip
      const zip = new JSZip();
      const nomePaciente = (ag.nome_paciente || ag.nome || 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
      const dataCirurgia = formatarData(ag.data_agendamento || ag.dataAgendamento).replace(/\//g, '-');
      const nomeArquivoZip = `G-SUS_${nomePaciente}_${dataCirurgia}.zip`;

      // Adicionar documentos ao ZIP
      if (temDocumentos) {
        try {
          const urls = JSON.parse(ag.documentos_urls);
          if (Array.isArray(urls) && urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
              const url = urls[i];
              try {
                const blob = await fetchFileAsBlob(url);
                const nomeArquivo = url.split('/').pop() || `documento_${i + 1}.pdf`;
                zip.file(`documentos/${nomeArquivo}`, blob);
              } catch (error) {
                console.error(`Erro ao baixar documento ${i + 1}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar documentos_urls:', error);
        }
      }

      // Adicionar ficha pré-anestésica ao ZIP
      if (temFicha && ag.ficha_pre_anestesica_url) {
        try {
          const blob = await fetchFileAsBlob(ag.ficha_pre_anestesica_url);
          const nomeFicha = ag.ficha_pre_anestesica_url.split('/').pop() || 'ficha-pre-anestesica.pdf';
          zip.file(`ficha-pre-anestesica/${nomeFicha}`, blob);
        } catch (error) {
          console.error('Erro ao baixar ficha pré-anestésica:', error);
        }
      }

      // Gerar o arquivo ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Criar link de download e fazer o download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = nomeArquivoZip;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar a URL do objeto
      URL.revokeObjectURL(link.href);

      console.log('✅ ZIP criado e baixado com sucesso:', nomeArquivoZip);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      toastError('Erro ao criar arquivo ZIP. Por favor, tente novamente');
    } finally {
      setDownloading(null);
    }
  };

  // Renderizar linha de agendamento (igual à Documentação + botão Download G-SUS)
  const renderizarLinhaAgendamento = (ag: Agendamento) => {
    const expandida = isLinhaExpandida(ag.id);
    const status = getStatusPaciente(ag);
    
    return (
      <React.Fragment key={ag.id}>
        {/* Linha principal - estrutura igual à Documentação */}
        <tr className="transition-colors hover:bg-gray-50">
          {/* Status AIH */}
          <td className="px-3 py-3 w-44">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${getAihDotColor(ag.status_aih || 'Pendência Faturamento')}`} />
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => ag.id && setAihDropdownOpen(prev => ({ ...prev, [ag.id!]: !prev[ag.id!] }))}
                  disabled={ag.id ? salvandoAIH.has(ag.id) : false}
                  className={`w-full px-2 py-1 text-xs border rounded text-left ${getAihStatusStyle(ag.status_aih || 'Pendência Faturamento')}`}
                  title="Atualizar Status AIH"
                >
                  <span
                    className="block"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {ag.status_aih || 'Pendência Faturamento'}
                  </span>
                </button>
                {ag.id && aihDropdownOpen[ag.id!] && (
                  <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded shadow z-20">
                    {[
                      'Selecione',
                      'Autorizado',
                      'Pendência Hospital',
                      'Pendência Faturamento',
                      'Auditor Externo',
                      'Aguardando Ciência SMS',
                      'Ag. Correção',
                      'N/A - Urgência',
                    ].map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={async () => {
                          setAihDropdownOpen(prev => ({ ...prev, [ag.id!]: false }));
                          const novo = op === 'Selecione' ? null : op;
                          try {
                            if (!ag.id) return;
                            setSalvandoAIH(prev => new Set(prev).add(ag.id!));
                            await agendamentoService.update(ag.id, { status_aih: novo });
                            setAgendamentos(prev => prev.map(x => x.id === ag.id ? { ...x, status_aih: novo } : x));
                            success('Status AIH atualizado');
                          } catch (err) {}
                          finally {
                            setSalvandoAIH(prev => {
                              const next = new Set(prev);
                              if (ag.id) next.delete(ag.id);
                              return next;
                            });
                          }
                        }}
                        className="w-full px-2 py-1 text-left text-xs hover:bg-gray-100"
                      >
                        <span
                          className="block"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {op}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
          {/* Paciente */}
          <td className="px-3 py-3 sm:w-auto md:w-auto lg:w-auto xl:w-auto">
            <div className="text-sm font-medium text-gray-900 whitespace-normal break-words leading-tight sm:text-xs" title={ag.nome_paciente || ag.nome || '-'}>
              <div className="flex items-center gap-1">
                <span className="truncate">{ag.nome_paciente || ag.nome || '-'}</span>
                {(((ag.observacao_agendamento || '') as string).trim() !== '') && (
                  <span className="flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-purple-500" title="Observação de Agendamento" />
                )}
                {(((observacaoEmEdicao[ag.id!] ?? ag.observacao_faturamento ?? ag.faturamento_observacao ?? '') as string).trim() !== '') && (
                  <span className="flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-orange-500" title="Observação de Faturamento" />
                )}
                {(((ag.justificativa_alteracao_agendamento || '').trim() || (ag.justificativa_alteracao_agendamento_nome || '').trim())) && (
                  <span className="flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-fuchsia-500" title="Justificativa registrada" />
                )}
              </div>
            </div>
          </td>
          {/* Nº Prontuário */}
          <td className="px-3 py-3 sm:w-28 md:w-32 lg:w-40">
            <span className="text-sm sm:text-xs text-gray-700">{ag.n_prontuario || '-'}</span>
          </td>
          {/* Procedimento */}
          <td className="px-3 py-3 sm:w-auto md:w-auto lg:w-auto xl:w-auto">
            <div className="text-sm text-gray-700 whitespace-normal break-words leading-tight sm:text-xs" title={formatarProcedimento(ag)}>
              {formatarProcedimento(ag)}
            </div>
          </td>
          {/* Médico */}
          <td className="px-3 py-3 w-48">
            <div className="text-sm sm:text-xs text-gray-700 whitespace-normal break-words leading-tight" title={ag.medico || '-'}>
              {ag.medico || '-'}
            </div>
          </td>
          {/* Data Consulta */}
          <td className="px-3 py-3 whitespace-nowrap text-sm sm:text-xs text-gray-500 w-28">
            {formatarData(ag.data_consulta)}
          </td>
          {/* Data Cirurgia */}
          <td className="px-3 py-3 whitespace-nowrap text-sm sm:text-xs text-gray-500 w-28">
            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
          </td>
          {/* Exames */}
          <td className="px-2 py-3 whitespace-nowrap w-32">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${status.cor}`}>{status.texto}</span>
          </td>
          {/* Status Interno */}
          <td className="px-3 py-3 w-36">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${getLiberacaoDotColor(ag.status_de_liberacao)}`} />
              <span className={`px-2 py-1 text-xs font-semibold rounded border ${getLiberacaoStatusStyle(ag.status_de_liberacao)}`}>{ag.status_de_liberacao || '-'}</span>
              {((ag.status_de_liberacao || '').toLowerCase() === 'cirurgia cancelada' && (ag.observacao_agendamento || '').trim() !== '' && ag.id) && (
                <div className="relative">
                  <button
                    className="px-1.5 py-0.5 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Ver motivo do cancelamento"
                    onClick={() => setCancelInfoOpen(prev => ({ ...prev, [ag.id!]: !prev[ag.id!] }))}
                  >
                    i
                  </button>
                  {cancelInfoOpen[ag.id!] && (
                    <div className="absolute z-10 mt-1 p-2 w-64 text-xs bg-white border border-slate-300 rounded shadow">
                      <div className="font-semibold text-slate-800 mb-1">Motivo do cancelamento</div>
                      <div className="text-slate-700">{ag.observacao_agendamento}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
          {/* Confirmado */}
          <td className="px-3 py-3 w-28 whitespace-nowrap">
            {(() => {
              const confirmado = (ag.confirmacao || '').toLowerCase() === 'confirmado';
              return (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                    confirmado ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {confirmado ? 'Confirmado' : 'Aguardando'}
                  </span>
                  <button
                    onClick={() => handleAtualizarConfirmacao(ag.id, confirmado ? 'Aguardando' : 'Confirmado')}
                    className={`p-1 rounded ${confirmado ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                    title={confirmado ? 'Desconfirmar' : 'Confirmar'}
                  >
                    {confirmado ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                </div>
              );
            })()}
          </td>
          {/* Documentação */}
          <td className="px-4 py-3 w-40">
            {(() => {
              let docsUrls = false;
              try {
                if (ag.documentos_urls) {
                  const urls = JSON.parse(ag.documentos_urls);
                  docsUrls = Array.isArray(urls) && urls.some((u: any) => typeof u === 'string' && u.trim() !== '');
                }
              } catch {
                docsUrls = !!(ag.documentos_urls && (ag.documentos_urls as any)?.trim?.() !== '');
              }
              const fichaUrl = !!(ag.ficha_pre_anestesica_url && ag.ficha_pre_anestesica_url.trim() !== '');
              const hasAnexo = ag.documentos_ok === true || ag.ficha_pre_anestesica_ok === true || docsUrls || fichaUrl;
              return (
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${hasAnexo ? 'bg-green-500' : 'bg-gray-300'}`} title={hasAnexo ? 'Possui algum anexo' : 'Sem anexos'} />
                  <button
                    onClick={() => { setAbaAtiva('documentos'); handleAbrirModalUpload(ag); }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                    title="Anexar ou visualizar documentos (exames e pré-op)"
                  >
                    Agendamento
                  </button>
                </div>
              );
            })()}
          </td>
          {/* Download G-SUS */}
          <td className="px-4 py-3 whitespace-nowrap text-sm">
            <button
              onClick={() => handleDownloadTodos(ag)}
              disabled={downloading === ag.id}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
              title="Download de todos os documentos em ZIP"
            >
              {downloading === ag.id ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                  Gerando ZIP...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download G-SUS
                </>
              )}
            </button>
          </td>
          {/* Expandir */}
          <td className="px-2 py-3 whitespace-nowrap text-center">
            <button
              onClick={() => toggleExpandirLinha(ag.id)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={expandida ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <svg className={`w-4 h-4 transition-transform ${expandida ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </td>
        </tr>
        
        {/* Linha expandida com detalhes (mantendo bloco de observação de faturamento) */}
        {expandida && (
          <tr className="bg-gray-50">
            <td colSpan={12} className="px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Nascimento</div>
                  <div className="text-sm text-gray-900">{formatarData(ag.data_nascimento || ag.dataNascimento)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Cidade</div>
                  <div className="text-sm text-gray-900">{ag.cidade_natal || ag.cidadeNatal || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Telefone</div>
                  <div className="text-sm text-gray-900">{ag.telefone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Médico</div>
                  <div className="text-sm text-gray-900">{ag.medico || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Procedimento</div>
                  <div className="text-sm text-gray-900">{ag.procedimentos || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Inserido em</div>
                  <div className="text-sm text-gray-900">
                    {ag.created_at
                      ? `${formatarData(ag.created_at.split('T')[0])} às ${new Date(ag.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Última modificação</div>
                  <div className="text-sm text-gray-900">
                    {ag.updated_at
                      ? `${formatarData(ag.updated_at.split('T')[0])} às ${new Date(ag.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : '-'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2"><span className="text-amber-600">📝</span><label className="text-sm font-semibold text-gray-700">Observação do Faturamento</label></div>
                  <textarea
                    value={observacaoEmEdicao[ag.id!] ?? ag.observacao_faturamento ?? ''}
                    onChange={(e) => setObservacaoEmEdicao(prev => ({ ...prev, [ag.id!]: e.target.value }))}
                    placeholder="Digite uma observação sobre este paciente..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none transition-colors"
                    rows={2}
                    disabled={salvandoObservacao === ag.id}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{ag.observacao_faturamento ? 'Observação salva' : 'Nenhuma observação salva'}</span>
                    <button
                      onClick={() => handleSalvarObservacao(ag)}
                      disabled={salvandoObservacao === ag.id || !observacaoModificada(ag)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${observacaoModificada(ag) ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      {salvandoObservacao === ag.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Salvar Observação
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {(() => {
                  const justificativaSalva = !!((ag.justificativa_alteracao_agendamento || '').trim() || (ag.justificativa_alteracao_agendamento_nome || '').trim());
                  return (
                    <div className={`p-3 border rounded-lg ${justificativaSalva ? 'bg-violet-50/70 border-violet-200 opacity-80' : 'bg-violet-50 border-violet-200'}`}>
                      <div className="flex items-center gap-2 mb-2"><span className="text-violet-600">✍️</span><label className="text-sm font-semibold text-gray-700">Justificativa de Alteração</label></div>
                      <div className="space-y-2">
                        <textarea
                          value={justificativaEdicao[ag.id!] ?? ag.justificativa_alteracao_agendamento ?? ''}
                          onChange={(e) => setJustificativaEdicao(prev => ({ ...prev, [ag.id!]: e.target.value }))}
                          placeholder="Descreva a justificativa da alteração..."
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none transition-colors ${justificativaSalva ? 'bg-violet-50 text-gray-700 border-violet-100' : 'border-gray-300'}`}
                          rows={2}
                          disabled={salvandoJustificativaId === ag.id}
                        />
                        <input
                          type="text"
                          value={justificativaNomeEdicao[ag.id!] ?? ag.justificativa_alteracao_agendamento_nome ?? ''}
                          onChange={(e) => setJustificativaNomeEdicao(prev => ({ ...prev, [ag.id!]: e.target.value }))}
                          placeholder="Nome do colaborador"
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors ${justificativaSalva ? 'bg-violet-50 text-gray-700 border-violet-100' : 'border-gray-300'}`}
                          disabled={salvandoJustificativaId === ag.id}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{justificativaSalva ? 'Justificativa salva' : 'Nenhuma justificativa registrada'}</span>
                          <button
                            onClick={() => handleSalvarJustificativa(ag)}
                            disabled={salvandoJustificativaId === ag.id}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${salvandoJustificativaId === ag.id ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                          >
                            {salvandoJustificativaId === ag.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Salvar
                              </>
                            )}
                          </button>
                        </div>
                        {(ag.justificativa_alteracao_agendamento_nome || ag.justificativa_alteracao_agendamento_nome_hora) && (
                          <div className="text-xs text-gray-500">
                            {ag.justificativa_alteracao_agendamento_nome && <>Por: {ag.justificativa_alteracao_agendamento_nome}</>}
                            {ag.justificativa_alteracao_agendamento_nome_hora && (
                              <> • {new Date(ag.justificativa_alteracao_agendamento_nome_hora).toLocaleDateString('pt-BR')} às {new Date(ag.justificativa_alteracao_agendamento_nome_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">📄</span>
                  <label className="text-sm font-semibold text-gray-700">Observação (Documentação)</label>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {(ag.observacao_agendamento || '').trim() || '-'}
                </div>
              </div>
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-600">🩺</span>
                  <label className="text-sm font-semibold text-gray-700">Observação (Anestesista)</label>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {(() => {
                    const status = (ag.avaliacao_anestesista || '').toLowerCase();
                    if (status === 'aprovado') {
                      return (ag.avaliacao_anestesista_observacao || '').trim() || '-';
                    }
                    if (status === 'reprovado') {
                      return (ag.avaliacao_anestesista_motivo_reprovacao || '').trim() || '-';
                    }
                    if (status === 'complementares') {
                      return (ag.avaliacao_anestesista_complementares || '').trim() || '-';
                    }
                    return '-';
                  })()}
                </div>
                {ag.avaliacao_anestesista_data && (
                  <div className="text-xs text-gray-500 mt-2">
                    Marcado em: {formatarData(ag.avaliacao_anestesista_data.split('T')[0])} às {new Date(ag.avaliacao_anestesista_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {ag.faturamento_liberado === false && ag.faturamento_observacao && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-red-800 mb-1">❌ NÃO LIBERADO PARA FATURAMENTO</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{ag.faturamento_observacao}</div>
                      {ag.faturamento_data && (
                        <div className="text-xs text-gray-500 mt-2">
                          Marcado em: {formatarData(ag.faturamento_data.split('T')[0])} às {new Date(ag.faturamento_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">Documentos disponíveis:</div>
                <div className="flex flex-wrap gap-2">
                  {ag.documentos_urls && (() => {
                    try {
                      const urls = JSON.parse(ag.documentos_urls);
                      if (Array.isArray(urls) && urls.length > 0) {
                        return urls.map((url: string, index: number) => (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Doc {index + 1}
                          </a>
                        ));
                      }
                    } catch {}
                    return null;
                  })()}
                  {ag.ficha_pre_anestesica_url && (
                    <a href={ag.ficha_pre_anestesica_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Ficha Pré-Anestésica
                    </a>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Faturamento G-SUS</h1>
          <p className="text-gray-600">
            Liberação de pacientes e download de documentos para entrada no sistema G-SUS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg border border-violet-200"
            onClick={() => setBellOpen(true)}
            title="Ver pacientes justificados hoje">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-semibold">Justificados hoje:</span>
            <span className="text-sm font-bold">{justificadosHoje}</span>
          </button>
          <button
            onClick={carregarAgendamentos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Atualizar lista"
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Seção de Filtros de Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">🔍 Filtros de Busca</h3>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">📄 Status dos Exames</label>
            <select
              value={filtroStatusExames}
              onChange={(e) => setFiltroStatusExames(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${filtroStatusExames ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <option value="">📊 Todos</option>
              <option value="COM EXAMES">✅ Com Exames</option>
              <option value="SEM EXAMES">⚠️ Sem Exames</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">🧾 Status AIH</label>
            <select
              value={filtroAih}
              onChange={(e) => setFiltroAih(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors bg-white font-medium ${filtroAih ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
            >
              <option value="">📊 Todos</option>
              <option value="Autorizado">Autorizado</option>
              <option value="Pendência Hospital">Pendência Hospital</option>
              <option value="Pendência Faturamento">Pendência Faturamento</option>
              <option value="Auditor Externo">Auditor Externo</option>
              <option value="Aguardando Ciência SMS">Aguardando Ciência SMS</option>
              <option value="N/A - Urgência">N/A - Urgência</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">📄 Data Inserção</label>
            <input
              type="date"
              value={filtroDataInsercao}
              onChange={(e) => setFiltroDataInsercao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status Interno</label>
            <select
              value={filtroStatusInterno}
              onChange={(e) => setFiltroStatusInterno(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${filtroStatusInterno ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <option value="">📊 Todos</option>
              <option value="Anestesista">Anestesista</option>
              <option value="Cardio">Cardio</option>
              <option value="Exames">Exames</option>
              <option value="Liberado para Cirurgia">Liberado para Cirurgia</option>
              <option value="Não Liberado para Cirurgia">Não Liberado para Cirurgia</option>
              <option value="Confirmado com Paciente">Confirmado com Paciente</option>
              <option value="Cirurgia Cancelada">Cirurgia Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirmado</label>
            <select
              value={filtroConfirmado}
              onChange={(e) => setFiltroConfirmado(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${filtroConfirmado ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <option value="">📊 Todos</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Aguardando">Aguardando</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Justificativa</label>
            <select
              value={filtroJustificativa}
              onChange={(e) => setFiltroJustificativa(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none transition-colors bg-white font-medium"
            >
              <option value="">📊 Todos</option>
              <option value="com_justificativa">🟣 Justificado</option>
              <option value="sem_justificativa">Sem justificativa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observação</label>
            <select
              value={filtroObservacao}
              onChange={(e) => setFiltroObservacao(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-colors bg-white font-medium"
              title="Filtrar por observação"
            >
              <option value="">📊 Todos</option>
              <option value="sem_observacao">Sem observação</option>
              <option value="obs_agendamento">🟣 Observação de Agendamento</option>
              <option value="obs_faturamento">🟠 Observação de Faturamento</option>
              <option value="obs_ambos">🟣+🟠 Ambas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Paciente</label>
            <input
              type="text"
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
              placeholder="Nome do paciente..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nº Prontuário</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={filtroProntuario}
              onChange={(e) => setFiltroProntuario(e.target.value)}
              placeholder="Digite números do prontuário..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              title="Filtrar por números do prontuário"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Médico</label>
            <select
              value={filtroMedicoId}
              onChange={(e) => setFiltroMedicoId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            >
              <option value="">Todos</option>
              {medicosDisponiveis
                .slice()
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Consulta</label>
            <input
              type="text"
              value={filtroDataConsulta}
              onChange={(e) => setFiltroDataConsulta(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Cirurgia</label>
            <input
              type="text"
              value={filtroDataCirurgia}
              onChange={(e) => setFiltroDataCirurgia(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">📅 Mês Cirurgia</label>
            <select
              value={filtroMesCirurgia}
              onChange={(e) => setFiltroMesCirurgia(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-colors bg-white font-medium ${filtroMesCirurgia ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
            >
              <option value="">Todos os meses</option>
              <option value="2025-10">Outubro/2025</option>
              <option value="2025-11">Novembro/2025</option>
              <option value="2025-12">Dezembro/2025</option>
              <option value="2026-01">Janeiro/2026</option>
              <option value="2026-02">Fevereiro/2026</option>
              <option value="2026-03">Março/2026</option>
              <option value="2026-04">Abril/2026</option>
              <option value="2026-05">Maio/2026</option>
              <option value="2026-06">Junho/2026</option>
              <option value="2026-07">Julho/2026</option>
              <option value="2026-08">Agosto/2026</option>
              <option value="2026-09">Setembro/2026</option>
              <option value="2026-10">Outubro/2026</option>
              <option value="2026-11">Novembro/2026</option>
              <option value="2026-12">Dezembro/2026</option>
            </select>
          </div>
        </div>
        
        {/* Observação movida para a barra de paginação */}
        
        {/* Indicador de resultados filtrados */}
        {temFiltrosAtivos && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Com anexos: <span className="font-semibold text-gray-800">{agendamentosComAnexosFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentosComPaciente.length}</span> • 
              Pendências: <span className="font-semibold text-gray-800">{agendamentosPendentesFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentosPendentes.length}</span>
            </p>
          </div>
        )}
      </div>
      
      

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando agendamentos para faturamento...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Controles de Paginação - Topo */}
      {totalPaginas > 1 && (
        <div ref={tabelaRef} className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min((paginaAtual - 1) * itensPorPagina + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(paginaAtual * itensPorPagina, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes com exames
                    </p>
                    {agendamentosPaginados.length > 0 && (
                      <p className="text-xs text-blue-600 font-medium">
                        📅 Cirurgias: {formatarData(agendamentosPaginados[0]?.data_agendamento || agendamentosPaginados[0]?.dataAgendamento)} 
                        {agendamentosPaginados.length > 1 && agendamentosPaginados[0]?.data_agendamento !== agendamentosPaginados[agendamentosPaginados.length - 1]?.data_agendamento && 
                          ` até ${formatarData(agendamentosPaginados[agendamentosPaginados.length - 1]?.data_agendamento || agendamentosPaginados[agendamentosPaginados.length - 1]?.dataAgendamento)}`
                        }
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Por página:</label>
                    <select
                      value={itensPorPagina}
                      onChange={(e) => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <div className="hidden md:flex items-center gap-3 ml-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                        Agendamento
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                        Faturamento
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-fuchsia-500" />
                        Justificativa
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 ml-4">
                    <button
                      onClick={handleAbrirModalRelatorio}
                      className="px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                      title="Emitir relatório por Status AIH"
                    >
                      Relatório Status AIH
                    </button>
                    <button
                      onClick={handleAbrirModalRelatorioConfirmado}
                      className="px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                      title="Emitir relatório por Confirmado"
                    >
                      Relatório Confirmado
                    </button>
                  </div>
                </div>
                </div>

      {/* Navegação de páginas */}
      <div className="flex items-center gap-2">
                  {/* Botão Anterior */}
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  {/* Números de páginas */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, paginaAtual - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPaginas, startPage + maxVisible - 1);
                      
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      // Primeira página
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setPaginaAtual(1)}
                            className="w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                        }
                      }

                      // Páginas visíveis
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPaginaAtual(i)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                              paginaAtual === i
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      // Última página
                      if (endPage < totalPaginas) {
                        if (endPage < totalPaginas - 1) {
                          pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                        }
                        pages.push(
                          <button
                            key={totalPaginas}
                            onClick={() => setPaginaAtual(totalPaginas)}
                            className="w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {totalPaginas}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Botão Próxima */}
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
      </div>
    </div>
  </div>
)}

<Modal
  isOpen={reportModalAberto}
  onClose={() => {
    setReportModalAberto(false);
  }}
  title="Emitir Relatório por Status AIH"
  size="small"
>
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Status AIH</label>
      <select
        value={reportAihStatus}
        onChange={(e) => setReportAihStatus(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
      >
        <option value="">Selecione</option>
        {aihStatusOptions.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
        <input
          type="date"
          value={reportStartDate}
          onChange={(e) => setReportStartDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Até</label>
        <input
          type="date"
          value={reportEndDate}
          onChange={(e) => setReportEndDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <button
        onClick={() => setReportModalAberto(false)}
        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        Fechar
      </button>
      <button
        onClick={handleEmitirRelatorio}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        Gerar Excel
      </button>
      <button
        onClick={gerarPDFRelatorioAIH}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 border border-gray-300"
      >
        Gerar PDF
      </button>
    </div>
  </div>
</Modal>

<Modal
  isOpen={reportConfirmModalAberto}
  onClose={() => {
    setReportConfirmModalAberto(false);
  }}
  title="Emitir Relatório por Confirmado"
  size="small"
>
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Confirmado</label>
      <select
        value={reportConfirmStatus}
        onChange={(e) => setReportConfirmStatus(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
      >
        <option value="">Selecione</option>
        {confirmStatusOptions.map(op => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
        <input
          type="date"
          value={reportConfirmStartDate}
          onChange={(e) => setReportConfirmStartDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Até</label>
        <input
          type="date"
          value={reportConfirmEndDate}
          onChange={(e) => setReportConfirmEndDate(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <button
        onClick={() => setReportConfirmModalAberto(false)}
        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        Fechar
      </button>
      <button
        onClick={gerarPDFRelatorioConfirmado}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 border border-gray-300"
      >
        Gerar PDF
      </button>
    </div>
  </div>
</Modal>
          {/* Tabela igual à Documentação + coluna de Download */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 table-auto">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 md:w-44 lg:w-48 xl:w-52">Status AIH</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-40">Nº Prontuário</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedimento</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 md:w-48 lg:w-56">Médico</th>
                    <th 
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-36 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleOrdenacao('data_consulta')}
                      title="Clique para ordenar por Data Consulta"
                    >
                      <div className="flex items-center gap-1">
                        Data Consulta
                        <span className="text-gray-400">
                          {colunaOrdenacao === 'data_consulta' ? (
                            direcaoOrdenacao === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </div>
                    </th>
                    <th 
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-36 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                      onClick={() => handleOrdenacao('data_cirurgia')}
                      title="Clique para ordenar por Data Cirurgia"
                    >
                      <div className="flex items-center gap-1">
                        Data Cirurgia
                        <span className="text-gray-400">
                          {colunaOrdenacao === 'data_cirurgia' ? (
                            direcaoOrdenacao === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors sm:w-28 md:w-32 lg:w-36" title="Agrupar por exames">Exames</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-36 md:w-40 lg:w-44 xl:w-52">Status Interno</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-36">Confirmado</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 md:w-48 lg:w-56">Agendamento</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-36">Download</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm sm:text-xs">
                  {agendamentosPaginados.length === 0 ? (
                    <tr>
                  <td colSpan={13} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">Nenhum paciente com anexos encontrado</p>
                          <p className="text-sm text-gray-400">
                            {temFiltrosAtivos 
                              ? 'Nenhum paciente corresponde aos filtros aplicados.'
                              : 'Não há pacientes com anexos (exames ou pré-op).'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agendamentosPaginados.map((ag) => renderizarLinhaAgendamento(ag))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Controles de Paginação - Rodapé */}
          {totalPaginas > 1 && (
            <div className="bg-white rounded-lg shadow p-4 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min((paginaAtual - 1) * itensPorPagina + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(paginaAtual * itensPorPagina, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes com exames
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Por página:</label>
                    <select
                      value={itensPorPagina}
                      onChange={(e) => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>

                {/* Navegação de páginas */}
                <div className="flex items-center gap-2">
                  {/* Botão Anterior */}
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  {/* Números de páginas */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, paginaAtual - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPaginas, startPage + maxVisible - 1);
                      
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setPaginaAtual(1)}
                            className="w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPaginaAtual(i)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                              paginaAtual === i
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < totalPaginas) {
                        if (endPage < totalPaginas - 1) {
                          pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                        }
                        pages.push(
                          <button
                            key={totalPaginas}
                            onClick={() => setPaginaAtual(totalPaginas)}
                            className="w-8 h-8 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {totalPaginas}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Botão Próxima */}
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Pendências */}
          {mostrarPendencias && agendamentosPendentesOrdenados.length > 0 && (
            <div className="mt-6 bg-yellow-50 rounded-lg shadow border-l-4 border-yellow-500 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  ⚠️ Pendências ({agendamentosPendentesOrdenados.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMostrarPendencias(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Ocultar pendências"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mb-3 p-3 bg-white rounded border border-yellow-300">
                <p className="text-sm text-gray-700">
                  <strong>Atenção:</strong> Estes pacientes ainda não estão prontos para faturamento pois faltam:
                </p>
                <ul className="text-sm text-gray-600 ml-4 mt-1">
                  <li>• Exames (ECG, laboratoriais, etc.) ou</li>
                  <li>• Ficha pré-operatória do anestesista</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-48">
                          Paciente
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-32">
                          Data Cirurgia
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-40">
                          Médico
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-56">
                          Pendências
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agendamentosPendentesOrdenados.map((ag) => (
                        <tr key={ag.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 truncate" title={ag.nome_paciente || ag.nome || '-'}>
                            {ag.nome_paciente || ag.nome || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 truncate" title={ag.medico || '-'}>
                            {ag.medico || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {!ag.documentos_ok && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                  ❌ Exames
                                </span>
                              )}
                              {!ag.ficha_pre_anestesica_ok && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                  ❌ Pré-Op
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Legenda - Compacta e Discreta */}
          <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>• Tabela exibe pacientes da Documentação (mesma estrutura)</span>
                <span>• Clique em "Pendências" para ver documentos faltantes</span>
                <span>• Expanda a linha (►) para detalhes completos</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>• <strong>✅ LIBERADO:</strong> Pronto para faturamento (visual)</span>
                <span>• <strong>❌ NÃO LIBERADO:</strong> Com pendências (requer observação)</span>
                <span>• <strong>Download G-SUS:</strong> Baixa documentos em ZIP</span>
              </div>
            </div>
          </div>

          {/* Modais de Documentação, mantidos nesta tela para usar a mesma tabela */}
          <Modal
            isOpen={modalUploadAberto}
            onClose={() => {
              setModalUploadAberto(false);
              setArquivosDocumentosSelecionados([]);
              setArquivoFichaSelecionado(null);
              setAgendamentoSelecionado(null);
              setTipoDeExame('');
            }}
            title={`Agendamento - ${agendamentoSelecionado?.nome_paciente || 'Paciente'}`}
            size="large"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Paciente:</strong> {agendamentoSelecionado?.nome_paciente || '-'}</p>
                <p className="text-sm text-gray-700"><strong>Procedimento:</strong> {agendamentoSelecionado?.procedimentos || '-'}</p>
                <p className="text-sm text-gray-700"><strong>Data Cirurgia:</strong> {formatarData(agendamentoSelecionado?.data_agendamento)}</p>
              </div>
              <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                  <button onClick={() => setAbaAtiva('documentos')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${abaAtiva === 'documentos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Anexos {agendamentoSelecionado?.documentos_ok && '✓'}</button>
                  <button onClick={() => setAbaAtiva('ficha')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${abaAtiva === 'ficha' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>📋 Pré-Operatório {agendamentoSelecionado?.ficha_pre_anestesica_ok && '✓'}</button>
                </nav>
              </div>
              {abaAtiva === 'documentos' && (
                <div className="space-y-4">
                  {documentosAnexados.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Documentos já anexados:</h3>
                      <div className="space-y-2">
                        {documentosAnexados.map((url, index) => {
                          const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                          const meta = examesMeta.find(m => m.url === url);
                          return (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                {fileName}
                              </a>
                              {meta?.tipo && (
                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 mr-2">{meta.tipo}</span>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmMessage('Tem certeza que deseja remover este documento?');
                                  confirmActionRef.current = () => handleRemoverDocumentoAnexado(url);
                                  setConfirmOpen(true);
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remover documento"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Adicionar novos anexos:</h3>
                    <input ref={fileInputDocumentosRef} type="file" multiple onChange={handleSelecionarDocumentos} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <button
                      onClick={() => { if (fileInputDocumentosRef.current) { fileInputDocumentosRef.current.value = ''; } setTipoDeExame(''); fileInputDocumentosRef.current?.click(); }}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center"
                    >
                      <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <p className="text-sm text-gray-600">Clique para selecionar arquivos</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
                    </button>
                    {arquivosDocumentosSelecionados.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                        {arquivosDocumentosSelecionados.map((arquivo, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 flex-1">{arquivo.name}</span>
                            <span className="text-xs text-gray-500 mr-2">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button onClick={() => handleRemoverDocumento(index)} className="text-red-600 hover:text-red-800 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo do anexo</label>
                          <select value={tipoDeExame} onChange={(e) => setTipoDeExame(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                            <option value="">Selecione</option>
                            <option value="Tomografia computadorizada">Tomografia computadorizada</option>
                            <option value="Ultrassonografia">Ultrassonografia</option>
                            <option value="Radiografia">Radiografia</option>
                            <option value="Ressonância magnética">Ressonância magnética</option>
                            <option value="Exames de laboratório">Exames de laboratório</option>
                            <option value="Termo de planejamento familiar">Termo de planejamento familiar</option>
                            <option value="Outros">Outros</option>
                          </select>
                          {!tipoDeExame && <p className="text-xs text-red-600 mt-1">Selecione o tipo do anexo para enviar</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button onClick={() => { setModalUploadAberto(false); setArquivosDocumentosSelecionados([]); setAgendamentoSelecionado(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors" disabled={uploading}>Cancelar</button>
                    <button onClick={handleUploadDocumentos} disabled={uploading || arquivosDocumentosSelecionados.length === 0 || !tipoDeExame} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                      {uploading ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>Enviando...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Anexar Arquivos</>)}
                    </button>
                  </div>
                </div>
              )}
              {abaAtiva === 'ficha' && (
                <div className="space-y-4">
                  {fichaAnexada && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Ficha pré-anestésica anexada:</h3>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <a href={fichaAnexada} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {fichaAnexada.split('/').pop() || 'Ficha Pré-Anestésica'}
                        </a>
                        <button
                          onClick={() => { setConfirmMessage('Tem certeza que deseja remover a ficha pré-operatória?'); confirmActionRef.current = () => handleRemoverFicha(); setConfirmOpen(true); }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remover ficha"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {!fichaAnexada && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Anexar ficha pré-anestésica:</h3>
                      <input ref={fileInputFichaRef} type="file" onChange={handleSelecionarFicha} className="hidden" accept=".pdf" />
                      <button onClick={() => fileInputFichaRef.current?.click()} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors text-center">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-sm text-gray-600">Clique para selecionar ficha pré-anestésica</p>
                        <p className="text-xs text-gray-400 mt-1">PDF</p>
                      </button>
                      {arquivoFichaSelecionado && (
                        <div className="mt-4 p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 flex-1">{arquivoFichaSelecionado.name}</span>
                            <span className="text-xs text-gray-500 mr-2">{(arquivoFichaSelecionado.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button onClick={() => setArquivoFichaSelecionado(null)} className="text-red-600 hover:text-red-800 p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 pt-4 border-t">
                        <button onClick={() => { setModalUploadAberto(false); setArquivoFichaSelecionado(null); setAgendamentoSelecionado(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors" disabled={uploading}>Cancelar</button>
                        <button onClick={handleUploadFicha} disabled={uploading || !arquivoFichaSelecionado || !!fichaAnexada} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                          {uploading ? (<><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>Enviando...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Anexar Ficha</>)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Modal>
          <Modal
            isOpen={modalVisualizacaoAberto}
            onClose={() => {
              setModalVisualizacaoAberto(false);
              setAgendamentoSelecionado(null);
              setDocumentosAnexados([]);
              setComplementaresAnexados([]);
              setFichaAnexada(null);
            }}
            title={`📄 Documentos - ${agendamentoSelecionado?.nome_paciente || 'Paciente'}`}
            size="large"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700"><strong>Paciente:</strong> {agendamentoSelecionado?.nome_paciente || '-'}</p>
                <p className="text-sm text-gray-700"><strong>Procedimento:</strong> {agendamentoSelecionado?.procedimentos || '-'}</p>
                <p className="text-sm text-gray-700"><strong>Data Cirurgia:</strong> {formatarData(agendamentoSelecionado?.data_agendamento)}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>Anexos</h3>
                {documentosAnexados.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {documentosAnexados.map((url, index) => {
                      const fileName = url.split('/').pop() || `Anexo ${index + 1}`;
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded hover:bg-green-100 transition-colors">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="truncate">{fileName}</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (<p className="text-sm text-gray-500 italic">Nenhum anexo enviado</p>)}
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>📋 Ficha Pré-Operatória</h3>
                {fichaAnexada ? (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors">
                    <a href={fichaAnexada} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate">{fichaAnexada.split('/').pop() || 'Ficha Pré-Anestésica'}</span>
                    </a>
                  </div>
                ) : (<p className="text-sm text-gray-500 italic">Nenhuma ficha anexada</p>)}
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>📁 Documentos Complementares</h3>
                {complementaresAnexados.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {complementaresAnexados.map((url, index) => {
                      const fileName = url.split('/').pop() || `Complementar ${index + 1}`;
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="truncate">{fileName}</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (<p className="text-sm text-gray-500 italic">Nenhum documento complementar anexado</p>)}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => { setModalVisualizacaoAberto(false); setAgendamentoSelecionado(null); setDocumentosAnexados([]); setComplementaresAnexados([]); setFichaAnexada(null); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Fechar</button>
              </div>
            </div>
          </Modal>
        </>
      )}

      <Modal
        isOpen={bellOpen}
        onClose={() => setBellOpen(false)}
        title="Pacientes Justificados Hoje"
        size="full"
        headerActions={
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={bellDate}
              onChange={(e) => setBellDate(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
              title="Selecionar data"
            />
            <button
              onClick={() => setBellDate(hojeLocalStr())}
              className="px-2 py-1 text-xs font-medium rounded bg-violet-600 text-white hover:bg-violet-700"
              title="Hoje"
            >
              Hoje
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {(() => {
            const temJust = (agendamentos || []).some(a => ((a.justificativa_alteracao_agendamento || '').trim() || (a.justificativa_alteracao_agendamento_nome || '').trim()));
            const rows = (agendamentos || []).filter(a => {
              const tem = ((a.justificativa_alteracao_agendamento || '').trim() || (a.justificativa_alteracao_agendamento_nome || '').trim());
              if (!tem) return false;
              const hora = a.justificativa_alteracao_agendamento_nome_hora || a.updated_at || '';
              const d = hora ? (hora.includes('T') ? hora.split('T')[0] : hora.substring(0, 10)) : '';
              return bellDate ? d === bellDate : true;
            });
            if (rows.length === 0) {
              return <p className="text-sm text-gray-600">Nenhum paciente justificado na data selecionada.</p>;
            }
            return (
              <div className="rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border-b border-gray-200 rounded-t-lg">
                  <div className="text-sm font-semibold text-violet-700">Data: {bellDate ? formatarData(bellDate) : '-'}</div>
                  <div className="px-2 py-1 text-xs font-semibold rounded bg-violet-100 text-violet-700">{rows.length} registro(s)</div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Paciente</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Procedimento</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Data Cirurgia</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Observação Faturamento</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Justificativa</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Autor</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((ag) => (
                      <tr key={ag.id} className="align-top odd:bg-white even:bg-gray-50 hover:bg-violet-50/50 transition-colors">
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{ag.nome_paciente || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">{ag.procedimentos || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">{formatarData(ag.data_agendamento || ag.dataAgendamento)}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{(ag.faturamento_observacao || ag.observacao_faturamento || '-')}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">{ag.justificativa_alteracao_agendamento || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{ag.justificativa_alteracao_agendamento_nome || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">
                          {(ag.justificativa_alteracao_agendamento_nome_hora || ag.updated_at)
                            ? `${new Date((ag.justificativa_alteracao_agendamento_nome_hora || ag.updated_at) as string).toLocaleDateString('pt-BR')} ${new Date((ag.justificativa_alteracao_agendamento_nome_hora || ag.updated_at) as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>
      {/* Modal para NÃO LIBERADO */}
      <Modal
        isOpen={modalNaoLiberadoAberto}
        onClose={handleFecharModalNaoLiberado}
        title="❌ Marcar como NÃO LIBERADO"
      >
        <div className="space-y-4">
          {/* Informações do paciente */}
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm font-semibold text-gray-700">Paciente:</div>
            <div className="text-base font-bold text-gray-900">
              {agendamentoNaoLiberado?.nome_paciente || agendamentoNaoLiberado?.nome || '-'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Cirurgia: {formatarData(agendamentoNaoLiberado?.data_agendamento || agendamentoNaoLiberado?.dataAgendamento)}
            </div>
          </div>
          
          {/* Alerta */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-red-800">
                <span className="font-semibold">Atenção!</span> Ao marcar como NÃO LIBERADO, você deve informar o motivo.
              </div>
            </div>
          </div>
          
          {/* Campo de observação */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motivo / Observação <span className="text-red-500">*</span>
            </label>
            <textarea
              value={observacaoNaoLiberado}
              onChange={(e) => setObservacaoNaoLiberado(e.target.value)}
              placeholder="Descreva o motivo de não liberar para faturamento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              rows={4}
              disabled={salvandoNaoLiberado}
            />
            <div className="text-xs text-gray-500 mt-1">
              Este campo é obrigatório e será salvo no sistema.
            </div>
          </div>
          
          {/* Botões */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleFecharModalNaoLiberado}
              disabled={salvandoNaoLiberado}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarNaoLiberado}
              disabled={salvandoNaoLiberado || !observacaoNaoLiberado.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {salvandoNaoLiberado ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar NÃO LIBERADO
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmação"
        message={confirmMessage}
        onConfirm={() => {
          const fn = confirmActionRef.current;
          setConfirmOpen(false);
          confirmActionRef.current = null;
          if (fn) fn();
        }}
        onCancel={() => {
          setConfirmOpen(false);
          confirmActionRef.current = null;
        }}
      />
    </div>
  );
};

export default FaturamentoView;


