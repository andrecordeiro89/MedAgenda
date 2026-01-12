import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { agendamentoService, supabase, medicoService } from '../services/supabase';
import { Agendamento, StatusLiberacao, Medico } from '../types';
import { Button, Modal } from './ui';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

export const DocumentacaoView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar linhas expandidas
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());
  
  // Estado para controlar agrupamento por status
  const [agruparPorStatus, setAgruparPorStatus] = useState(false);
  
  // Estado para controlar ordenação por anestesista
  const [ordenarPorAnestesista, setOrdenarPorAnestesista] = useState(false);
  
  // Estados para filtros de busca
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroAih, setFiltroAih] = useState<string>('');
  const [filtroStatusInterno, setFiltroStatusInterno] = useState<string>('');
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroProntuario, setFiltroProntuario] = useState<string>('');
  const [filtroConfirmado, setFiltroConfirmado] = useState<string>('');
  const [filtroObservacao, setFiltroObservacao] = useState<string>('');
  const [filtroDataConsulta, setFiltroDataConsulta] = useState<string>('');
  const [filtroDataCirurgia, setFiltroDataCirurgia] = useState<string>('');
  const [filtroMesCirurgia, setFiltroMesCirurgia] = useState<string>(''); // Filtro por mês da cirurgia
  const [filtroMedicoId, setFiltroMedicoId] = useState<string>('');
  const [medicosDisponiveis, setMedicosDisponiveis] = useState<Medico[]>([]);
  const [filtroAvaliacaoAnestesista, setFiltroAvaliacaoAnestesista] = useState<string>('');
  const [filtroDataInsercao, setFiltroDataInsercao] = useState<string>('');
  
  // Estados para ordenação por data
  const [colunaOrdenacao, setColunaOrdenacao] = useState<'data_consulta' | 'data_cirurgia' | null>('data_cirurgia');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');
  
  // Estados do modal
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalVisualizacaoAberto, setModalVisualizacaoAberto] = useState(false);
  const [modalCancelAberto, setModalCancelAberto] = useState(false);
  const [cancelAgendamento, setCancelAgendamento] = useState<Agendamento | null>(null);
  const [cancelObservacao, setCancelObservacao] = useState<string>('');
  const [salvandoCancel, setSalvandoCancel] = useState<boolean>(false);
  const [abaAtiva, setAbaAtiva] = useState<'documentos' | 'ficha' | 'complementares'>('documentos');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  
  // Estados para Exames (Recepção)
  const [arquivosDocumentosSelecionados, setArquivosDocumentosSelecionados] = useState<File[]>([]);
  const [documentosAnexados, setDocumentosAnexados] = useState<string[]>([]);
  const fileInputDocumentosRef = useRef<HTMLInputElement>(null);
  
  // Estados para Ficha Pré-Operatória (Anestesista)
  const [arquivoFichaSelecionado, setArquivoFichaSelecionado] = useState<File | null>(null);
  const [fichaAnexada, setFichaAnexada] = useState<string | null>(null);
  const fileInputFichaRef = useRef<HTMLInputElement>(null);
  
  // Estados para Complementares (NOVO)
  const [arquivosComplementaresSelecionados, setArquivosComplementaresSelecionados] = useState<File[]>([]);
  const [complementaresAnexados, setComplementaresAnexados] = useState<string[]>([]);
  const fileInputComplementaresRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const { success, error: toastError, warning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef<(() => void) | null>(null);
  const [tipoDeExame, setTipoDeExame] = useState<string>('');
  const [examesMeta, setExamesMeta] = useState<Array<{ url: string; tipo: string }>>([]);
  const [obsAgendamentoEdicao, setObsAgendamentoEdicao] = useState<{ [id: string]: string }>({});
  const [salvandoObsAgendamento, setSalvandoObsAgendamento] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<{ [id: string]: boolean }>({});
  
  const [salvandoAIH, setSalvandoAIH] = useState<Set<string>>(new Set());
  const [salvandoLiberacao, setSalvandoLiberacao] = useState<Set<string>>(new Set());
  
  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const tabelaRef = useRef<HTMLDivElement>(null);
  const [reportInternoModalAberto, setReportInternoModalAberto] = useState(false);
  const [reportInternoStatus, setReportInternoStatus] = useState<string>('');
  const [reportInternoStartDate, setReportInternoStartDate] = useState<string>('');
  const [reportInternoEndDate, setReportInternoEndDate] = useState<string>('');
  const internoStatusOptions = [
    'Anestesista',
    'Cardio',
    'Exames',
    'Liberado para Cirurgia',
    'Não Liberado para Cirurgia',
    'Confirmado com Paciente',
    'Cirurgia Cancelada'
  ];
  const [reportConfirmModalAberto, setReportConfirmModalAberto] = useState(false);
  const [reportConfirmStatus, setReportConfirmStatus] = useState<string>('');
  const [reportConfirmStartDate, setReportConfirmStartDate] = useState<string>('');
  const [reportConfirmEndDate, setReportConfirmEndDate] = useState<string>('');
  const confirmStatusOptions = ['Confirmado', 'Aguardando'];

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
  useEffect(() => {
    const channel = supabase
      .channel(`doc-aih-${hospitalId || 'all'}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agendamentos' }, (payload: any) => {
        const novo = payload?.new;
        if (!novo) return;
        if (hospitalId && novo.hospital_id && novo.hospital_id !== hospitalId) return;
        setAgendamentos(prev => prev.map(a => a.id === novo.id ? { ...a, status_aih: novo.status_aih } : a));
      });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hospitalId]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      console.log('📋 Agendamentos carregados:', dados);
      console.log('📊 Total de registros:', dados.length);
      
      // Filtrar registros de grade cirúrgica (não devem aparecer na tela de Documentação)
      // CRITÉRIO: Excluir apenas registros ESTRUTURAIS da grade (sem paciente cadastrado)
      // INCLUIR: Registros com pacientes reais, mesmo que venham da grade
      const agendamentosFiltrados = dados.filter(ag => {
        // ✅ MUDANÇA: Permitir registros de grade que TÊM paciente cadastrado
        // Registros de grade SEM paciente = estrutura (especialidade/procedimento vazio)
        // Registros de grade COM paciente = agendamento real
        
        const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
        const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
        
        // CASO 1: Tem paciente E procedimento → SEMPRE MOSTRAR (mesmo se is_grade_cirurgica = true)
        if (temPaciente && temProcedimento) {
          return true; // ✅ Mostrar na Documentação
        }
        
        // CASO 2: Registro estrutural de grade (sem paciente) → OCULTAR
        if (ag.is_grade_cirurgica === true && !temPaciente) {
          return false; // ❌ Ocultar (é apenas estrutura)
        }
        
        // CASO 3: Registro vazio (compatibilidade) → OCULTAR
        if (!temProcedimento && !temPaciente) {
          return false;
        }
        
        // CASO 4: Demais casos → MOSTRAR
        return true;
      });
      
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
      
      console.log('📋 DOCUMENTAÇÃO - CONTAGEM:');
      console.log(`  Total de REGISTROS no banco: ${totalOriginal}`);
      console.log(`  Total de REGISTROS após filtro: ${totalFiltrado}`);
      console.log(`  Total de REGISTROS excluídos: ${totalExcluidos}`);
      console.log(`  🎯 PACIENTES ÚNICOS (final): ${pacientesUnicos.size}`);
      
      // Analisar registros excluídos
      const excluidos = dados.filter(ag => !agendamentosFiltrados.includes(ag));
      const excluidosComPaciente = excluidos.filter(ag => ag.nome_paciente && ag.nome_paciente.trim() !== '');
      const excluidosSemPaciente = excluidos.filter(ag => !ag.nome_paciente || ag.nome_paciente.trim() === '');
      
      if (excluidosComPaciente.length > 0) {
        console.log(`  ⚠️ ATENÇÃO: ${excluidosComPaciente.length} registros COM PACIENTE foram excluídos!`);
        console.log('  Primeiros 3:', excluidosComPaciente.slice(0, 3).map(ag => ({
          paciente: ag.nome_paciente,
          procedimento: ag.procedimentos,
          is_grade: ag.is_grade_cirurgica,
          data: ag.data_agendamento
        })));
      }
      
      if (excluidosSemPaciente.length > 0) {
        console.log(`  ✅ ${excluidosSemPaciente.length} registros estruturais (sem paciente) foram excluídos corretamente`);
      }
      
      // ⚠️ DEBUG: Mostrar distribuição por data
      const porData: Record<string, number> = {};
      agendamentosFiltrados.forEach(ag => {
        const data = ag.data_agendamento || ag.dataAgendamento || 'sem_data';
        porData[data] = (porData[data] || 0) + 1;
      });
      console.log('📅 Registros por data:', porData);
      
      // ⚠️ DEBUG: Agrupar por paciente para ver duplicatas
      const porPaciente: Record<string, number> = {};
      agendamentosFiltrados.forEach(ag => {
        const nome = (ag.nome_paciente || ag.nome || 'sem_nome').trim().toLowerCase();
        porPaciente[nome] = (porPaciente[nome] || 0) + 1;
      });
      const comDuplicatas = Object.entries(porPaciente).filter(([_, count]) => count > 1);
      if (comDuplicatas.length > 0) {
        console.log('👥 Pacientes com múltiplos registros:', Object.fromEntries(comDuplicatas));
      }
      
      const normalizarConfirmacao = (v: string | null | undefined) => {
        const t = (v || '').toLowerCase();
        if (t === 'confirmado') return 'Confirmado';
        return 'Aguardando';
      };
      const lista = agendamentosFiltrados.map(ag => ({ ...ag, confirmacao: normalizarConfirmacao(ag.confirmacao) }));
      setAgendamentos(lista);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status do paciente - NOVA LÓGICA (Exames e Pré-Op separados)
  const getStatusPaciente = (ag: Agendamento) => {
    const temExames = ag.documentos_ok === true;
    
    // NOVA DEFINIÇÃO: "COM EXAMES" = tem documentos anexados (independente de pré-op)
    if (temExames) return { texto: 'COM EXAMES', cor: 'bg-green-100 text-green-800', grupo: 'com_exames' };
    return { texto: 'SEM EXAMES', cor: 'bg-red-100 text-red-800', grupo: 'sem_exames' };
  };
  
  // Status do Pré-Operatório (função separada)
  const getStatusPreOp = (ag: Agendamento) => {
    const temPreOp = ag.ficha_pre_anestesica_ok === true;
    
    if (temPreOp) return { texto: 'COM PRE-OP', cor: 'bg-blue-100 text-blue-800' };
    return { texto: 'SEM PRE-OP', cor: 'bg-orange-100 text-orange-800' };
  };
  
  // Função para obter status dos checkboxes (semáforo)
  const getCheckboxesStatus = (ag: Agendamento) => {
    return {
      exames: ag.documentos_ok === true,
      preOperatorio: ag.ficha_pre_anestesica_ok === true,
      complementares: ag.complementares_ok === true // Novo campo
    };
  };

  const getAihStatusStyle = (status: string | null | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'autorizado':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'pendência hospital':
        return 'bg-orange-50 border-orange-400 text-orange-800';
      case 'pendencia hospital':
        return 'bg-orange-50 border-orange-400 text-orange-800';
      case 'pendência faturamento':
        return 'bg-rose-50 border-rose-400 text-rose-800';
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
  const getAvaliacaoBadgeClass = (val?: string | null) => {
    const v = (val || '').toLowerCase();
    if (v === 'aprovado') return 'bg-green-100 text-green-800 border border-green-200';
    if (v === 'reprovado') return 'bg-red-100 text-red-800 border border-red-200';
    if (v === 'complementares') return 'bg-amber-100 text-amber-800 border border-amber-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
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

  // AGRUPAR POR PACIENTES ÚNICOS
  // Função para agrupar agendamentos por paciente (mostrar apenas 1 linha por paciente)
  const agruparPorPacienteUnico = (agendamentosList: Agendamento[]): Agendamento[] => {
    const pacientesMap = new Map<string, Agendamento>();
    
    agendamentosList.forEach(ag => {
      const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
      
      // Ignorar registros sem paciente
      if (!nomePaciente || nomePaciente === '') return;
      
      // Se já existe um registro deste paciente, mantém o mais relevante
      if (pacientesMap.has(nomePaciente)) {
        const existente = pacientesMap.get(nomePaciente)!;
        
        // Prioridade: 
        // 1. Registro mais recente (created_at)
        // 2. Registro com mais informações preenchidas
        const dataExistente = new Date(existente.created_at || 0).getTime();
        const dataAtual = new Date(ag.created_at || 0).getTime();
        
        // Se o registro atual é mais recente, substitui
        if (dataAtual > dataExistente) {
          pacientesMap.set(nomePaciente, ag);
        }
      } else {
        // Primeira vez que encontra este paciente
        pacientesMap.set(nomePaciente, ag);
      }
    });
    
    // Retornar array de agendamentos únicos por paciente
    return Array.from(pacientesMap.values());
  };
  
  // Filtrar agendamentos (ANTES de agrupar)
  const agendamentosFiltradosCompletos = agendamentos.filter(ag => {
    // Filtro por status de EXAMES (documentos)
    if (filtroStatus) {
      const status = getStatusPaciente(ag);
      // Comparação exata (case-insensitive)
      if (status.texto.toUpperCase() !== filtroStatus.toUpperCase()) return false;
    }
    
    // Removido filtro de PRÉ-OPERATÓRIO
    
    // Filtro por paciente
    if (filtroPaciente) {
      const nomePaciente = (ag.nome_paciente || ag.nome || '').toLowerCase();
      if (!nomePaciente.includes(filtroPaciente.toLowerCase())) return false;
    }
    
    // Filtro por Nº Prontuário (contém dígitos digitados)
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
      const agMedicoId = ag.medico_id || ag.medicoId || '';
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
    
    // Filtro Confirmado
    if (filtroConfirmado) {
      const c = (ag.confirmacao || '').toString().toLowerCase();
      if (filtroConfirmado.toLowerCase() === 'confirmado') {
        if (c !== 'confirmado') return false;
      } else if (filtroConfirmado.toLowerCase() === 'aguardando') {
        if (c === 'confirmado') return false;
      }
    }
    
    // Filtro Avaliação Anestesista
    if (filtroAvaliacaoAnestesista) {
      const val = (ag.avaliacao_anestesista || '').toString().toLowerCase();
      const f = filtroAvaliacaoAnestesista.toLowerCase();
      if (f === 'sem_avaliacao') {
        if (val) return false;
      } else {
        if (val !== f) return false;
      }
    }
    
    // Filtro Observação (ag.observacao_agendamento)
    if (filtroObservacao) {
      const temObs = !!(ag.observacao_agendamento && ag.observacao_agendamento.trim() !== '');
      if (filtroObservacao === 'com_observacao' && !temObs) return false;
      if (filtroObservacao === 'sem_observacao' && temObs) return false;
    }
    
    if (filtroDataInsercao) {
      const created = (ag.created_at || '').toString();
      const datePart = created.includes('T') ? created.split('T')[0] : created.substring(0, 10);
      if (!datePart || datePart !== filtroDataInsercao) return false;
    }
    
    if (filtroConfirmado) {
      const c = (ag.confirmacao || '').toString().toLowerCase();
      if (filtroConfirmado.toLowerCase() === 'confirmado') {
        if (c !== 'confirmado') return false;
      } else if (filtroConfirmado.toLowerCase() === 'aguardando') {
        if (c === 'confirmado') return false;
      }
    }
    
    return true;
  });
  
  // SEMPRE MOSTRAR TODOS OS REGISTROS (sem agrupamento por paciente)
  let agendamentosFiltrados = agendamentosFiltradosCompletos;
  
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
  // ORDENAR: mês atual primeiro, depois pela DATA selecionada e MÉDICO
  agendamentosFiltrados = [...agendamentosFiltrados].sort((a, b) => {
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
    
    // PRIORIDADE: nome do médico
    const medicoA = (a.medico || '').trim().toUpperCase();
    const medicoB = (b.medico || '').trim().toUpperCase();
    
    if (medicoA !== medicoB) {
      if (!medicoA) return 1;
      if (!medicoB) return -1;
      return medicoA.localeCompare(medicoB, 'pt-BR');
    }
    
    if (ordenarPorAnestesista) {
      const statusA = (a.status_de_liberacao || a.status_liberacao || '').toString().toLowerCase();
      const statusB = (b.status_de_liberacao || b.status_liberacao || '').toString().toLowerCase();
      
      const prioridade: Record<string, number> = {
        'liberado': 1,
        'exames': 2,
        'cardio': 3,
        'anestesista': 4,
        'não liberado': 5,
        'nao liberado': 5
      };
      
      const prioridadeA = prioridade[statusA] || 999;
      const prioridadeB = prioridade[statusB] || 999;
      
      // Se prioridades diferentes, ordenar por prioridade
      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }
    }
    
    // PRIORIDADE 4: Se tudo igual, manter ordem de criação
    return 0;
  });
  
  // Total de registros (antes da paginação)
  const totalRegistros = agendamentosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
  
  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, filtroPaciente, filtroProntuario, filtroDataConsulta, filtroDataCirurgia, filtroMesCirurgia, filtroMedicoId, filtroAih, filtroStatusInterno, filtroConfirmado, filtroObservacao, filtroAvaliacaoAnestesista, filtroDataInsercao]);
  
  // Rolar para o topo da tabela quando mudar de página
  useEffect(() => {
    if (tabelaRef.current && paginaAtual > 1) {
      tabelaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [paginaAtual]);
  
  // APLICAR PAGINAÇÃO (somente se não estiver agrupado por status)
  let agendamentosPaginados = agendamentosFiltrados;
  if (!agruparPorStatus) {
    const indexInicio = (paginaAtual - 1) * itensPorPagina;
    const indexFim = indexInicio + itensPorPagina;
    agendamentosPaginados = agendamentosFiltrados.slice(indexInicio, indexFim);
  }
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroStatus('');
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
    setFiltroAvaliacaoAnestesista('');
    setFiltroDataInsercao('');
  };
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroStatus || filtroPaciente || filtroProntuario || filtroDataConsulta || filtroDataCirurgia || filtroMesCirurgia || filtroMedicoId || filtroAih || filtroStatusInterno || filtroConfirmado || filtroObservacao || filtroAvaliacaoAnestesista || filtroDataInsercao;

  // Agrupar agendamentos por status
  const agendamentosAgrupados = () => {
    if (!agruparPorStatus) {
      return { semGrupo: agendamentosPaginados };
    }

    // Quando agrupado, usar todos os registros (sem paginação)
    const grupos: Record<string, Agendamento[]> = {
      sem_exames: [],
      com_exames: []
    };

    agendamentosFiltrados.forEach(ag => {
      const status = getStatusPaciente(ag);
      grupos[status.grupo] = grupos[status.grupo] || [];
      grupos[status.grupo].push(ag);
    });

    return grupos;
  };

  // Toggle agrupamento por status
  const toggleAgruparPorStatus = () => {
    setAgruparPorStatus(prev => !prev);
    // Recolher todas as linhas ao alternar agrupamento
    setLinhasExpandidas(new Set());
  };

  const obsAgendamentoModificada = (ag: Agendamento) => {
    if (!ag.id) return false;
    const original = ag.observacao_agendamento || '';
    const editada = obsAgendamentoEdicao[ag.id];
    if (editada === undefined) return false;
    return editada !== original;
  };

  const handleSalvarObservacaoAgendamento = async (ag: Agendamento) => {
    if (!ag.id) return;
    const nova = (obsAgendamentoEdicao[ag.id] ?? ag.observacao_agendamento ?? '').trim();
    setSalvandoObsAgendamento(ag.id);
    try {
      const updateData: Partial<Agendamento> = {
        observacao_agendamento: nova || null
      };
      await agendamentoService.update(ag.id, updateData);
      setAgendamentos(prev => prev.map(x => x.id === ag.id ? { ...x, ...updateData } : x));
      setObsAgendamentoEdicao(prev => {
        const next = { ...prev };
        delete next[ag.id!];
        return next;
      });
      success('Observação do agendamento salva');
    } catch (error: any) {
      console.error('Erro ao salvar observação do agendamento:', error);
      toastError('Erro ao salvar observação. Tente novamente');
    } finally {
      setSalvandoObsAgendamento(null);
    }
  };

  const handleApagarObservacaoAgendamento = async (ag: Agendamento) => {
    if (!ag.id) return;
    setSalvandoObsAgendamento(ag.id);
    try {
      const updateData: Partial<Agendamento> = {
        observacao_agendamento: null
      };
      await agendamentoService.update(ag.id, updateData);
      setAgendamentos(prev => prev.map(x => x.id === ag.id ? { ...x, ...updateData } : x));
      setObsAgendamentoEdicao(prev => {
        const next = { ...prev };
        delete next[ag.id!];
        return next;
      });
      success('Observação do agendamento apagada');
    } catch (error: any) {
      console.error('Erro ao apagar observação do agendamento:', error);
      toastError('Erro ao apagar observação. Tente novamente');
    } finally {
      setSalvandoObsAgendamento(null);
      setConfirmOpen(false);
      confirmActionRef.current = null;
    }
  };
  
  // Toggle ordenação por anestesista
  const toggleOrdenarPorAnestesista = () => {
    setOrdenarPorAnestesista(prev => !prev);
  };

  // Abrir modal de upload
  const handleAbrirModalUpload = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    setArquivosDocumentosSelecionados([]);
    setArquivoFichaSelecionado(null);
    setArquivosComplementaresSelecionados([]);
    setAbaAtiva('documentos');
    setModalUploadAberto(true);
    setTipoDeExame('');
    setExamesMeta([]);
    
    // Carregar exames já anexados
    if (ag.documentos_urls) {
      try {
        const urls = JSON.parse(ag.documentos_urls);
        setDocumentosAnexados(Array.isArray(urls) ? urls : []);
      } catch {
        setDocumentosAnexados([]);
      }
    } else {
      setDocumentosAnexados([]);
    }
    
    // Carregar tipos por anexo
    const rawMeta: any = (ag as any).documentos_meta;
    if (typeof rawMeta === 'string') {
      try {
        const parsed = JSON.parse(rawMeta);
        setExamesMeta(Array.isArray(parsed) ? parsed : []);
      } catch {
        setExamesMeta([]);
      }
    } else if (Array.isArray(rawMeta)) {
      setExamesMeta(rawMeta);
    } else {
      setExamesMeta([]);
    }
    
    // Carregar ficha pré-operatória já anexada
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
    
    // Carregar complementares já anexados (NOVO)
    if (ag.complementares_urls) {
      try {
        const urls = JSON.parse(ag.complementares_urls);
        setComplementaresAnexados(Array.isArray(urls) ? urls : []);
      } catch {
        setComplementaresAnexados([]);
      }
    } else {
      setComplementaresAnexados([]);
    }
  };


  const handleAbrirModalRelatorioInterno = () => {
    setReportInternoStatus(filtroStatusInterno || '');
    setReportInternoStartDate('');
    setReportInternoEndDate('');
    setReportInternoModalAberto(true);
  };

  const handleEmitirRelatorioInterno = () => {
    const statusSelecionado = (reportInternoStatus || '').trim();
    if (!statusSelecionado) {
      toastError('Selecione o Status Interno para emitir o relatório');
      return;
    }
    const start = reportInternoStartDate ? new Date(reportInternoStartDate) : null;
    const end = reportInternoEndDate ? new Date(reportInternoEndDate) : null;
    if (start && end && start > end) {
      toastError('Período inválido: data inicial maior que a final');
      return;
    }
    const lista = agendamentos.filter(ag => {
      const s = (ag.status_de_liberacao || ag.status_liberacao || '').toString().trim();
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
    const rows = lista.map(ag => ({
      Paciente: ag.nome_paciente || ag.nome || '',
      Prontuario: ag.n_prontuario || '',
      Procedimento: ag.procedimentos || '',
      Medico: ag.medico || '',
      DataConsulta: formatarData(ag.data_consulta),
      DataCirurgia: formatarData(ag.data_agendamento || ag.dataAgendamento),
      StatusInterno: ag.status_de_liberacao || '',
      Confirmado: ag.confirmacao || '',
      StatusAIH: ag.status_aih || '',
      ExamesOK: ag.documentos_ok ? 'Sim' : 'Não',
      FichaPreOpOK: ag.ficha_pre_anestesica_ok ? 'Sim' : 'Não'
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, statusSelecionado.slice(0, 30));
    const now = new Date();
    const nomeArquivo = `Relatorio_StatusInterno_${statusSelecionado}_${now.toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
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
    setReportInternoModalAberto(false);
    success('Relatório gerado');
  };
  const gerarPDFRelatorioInterno = async () => {
    const statusSelecionado = (reportInternoStatus || '').trim();
    if (!statusSelecionado) {
      toastError('Selecione o Status Interno para emitir o relatório');
      return;
    }
    const start = reportInternoStartDate ? new Date(reportInternoStartDate) : null;
    const end = reportInternoEndDate ? new Date(reportInternoEndDate) : null;
    if (start && end && start > end) {
      toastError('Período inválido: data inicial maior que a final');
      return;
    }
    const lista = agendamentos.filter(ag => {
      const s = (ag.status_de_liberacao || ag.status_liberacao || '').toString().trim();
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
      doc.text(`Relatório - Status Interno: ${statusSelecionado}`, 14 + logoWidth + 5, titleY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportInternoStartDate ? new Date(reportInternoStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportInternoEndDate ? new Date(reportInternoEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14 + logoWidth + 5, titleY + 7);
      doc.text(`Total de registros: ${lista.length}`, 14 + logoWidth + 5, titleY + 12);
    } catch {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório - Status Interno: ${statusSelecionado}`, 14, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const periodoTxt = `${reportInternoStartDate ? new Date(reportInternoStartDate).toLocaleDateString('pt-BR') : '-'} a ${reportInternoEndDate ? new Date(reportInternoEndDate).toLocaleDateString('pt-BR') : '-'}`;
      doc.text(`Período: ${periodoTxt}`, 14, 22);
      doc.text(`Total de registros: ${lista.length}`, 14, 27);
    }
    const tableData = lista.map(ag => [
      formatarData(ag.data_agendamento || ag.dataAgendamento),
      ag.especialidade || '-',
      ag.procedimentos || '-',
      ag.procedimento_especificacao || '-',
      ag.medico || '-',
      ag.nome_paciente || ag.nome || '-',
      ag.n_prontuario || '-',
      ageFromISO(ag.data_nascimento || ag.dataNascimento) !== null ? String(ageFromISO(ag.data_nascimento || ag.dataNascimento)) : '-',
      ag.cidade_natal || ag.cidadeNatal || '-',
      ag.telefone || '-',
      formatarData(ag.data_consulta),
      formatarData(ag.data_nascimento || ag.dataNascimento),
      ag.status_de_liberacao || ag.status_liberacao || '-'
    ]);
    autoTable(doc, {
      head: [['Data', 'Especialidade', 'Procedimento', 'Esp. Procedimento', 'Médico', 'Paciente', 'Prontuário', 'Idade', 'Cidade', 'Telefone', 'Consulta', 'Nascimento', 'Status Interno']],
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
    const nomeArquivo = `Relatorio_StatusInterno_${statusSelecionado}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nomeArquivo);
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
      ag.procedimentos || '-',
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

  const handleAbrirModalRelatorioConfirmado = () => {
    setReportConfirmStatus(filtroConfirmado || '');
    setReportConfirmStartDate('');
    setReportConfirmEndDate('');
    setReportConfirmModalAberto(true);
  };

  const handleEmitirRelatorioConfirmado = () => {
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
    const rows = lista.map(ag => ({
      Paciente: ag.nome_paciente || ag.nome || '',
      Prontuario: ag.n_prontuario || '',
      Procedimento: ag.procedimentos || '',
      Medico: ag.medico || '',
      DataConsulta: formatarData(ag.data_consulta),
      DataCirurgia: formatarData(ag.data_agendamento || ag.dataAgendamento),
      StatusInterno: ag.status_de_liberacao || '',
      Confirmado: ag.confirmacao || '',
      StatusAIH: ag.status_aih || '',
      ExamesOK: ag.documentos_ok ? 'Sim' : 'Não',
      FichaPreOpOK: ag.ficha_pre_anestesica_ok ? 'Sim' : 'Não'
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, statusSelecionado.slice(0, 30));
    const now = new Date();
    const nomeArquivo = `Relatorio_Confirmado_${statusSelecionado}_${now.toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
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
    setReportConfirmModalAberto(false);
    success('Relatório gerado');
  };

  // Abrir modal para visualizar documentos
  const handleAbrirModalVisualizacao = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    
    // Carregar documentos de exames
    if (ag.documentos_urls) {
      try {
        const urls = JSON.parse(ag.documentos_urls);
        setDocumentosAnexados(Array.isArray(urls) ? urls : []);
      } catch {
        setDocumentosAnexados([]);
      }
    } else {
      setDocumentosAnexados([]);
    }
    
    // Carregar tipos por anexo
    const rawMeta2: any = (ag as any).documentos_meta;
    if (typeof rawMeta2 === 'string') {
      try {
        const parsed = JSON.parse(rawMeta2);
        setExamesMeta(Array.isArray(parsed) ? parsed : []);
      } catch {
        setExamesMeta([]);
      }
    } else if (Array.isArray(rawMeta2)) {
      setExamesMeta(rawMeta2);
    } else {
      setExamesMeta([]);
    }
    
    // Carregar ficha pré-operatória
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
    
    // Carregar documentos complementares
    if (ag.complementares_urls) {
      try {
        const urls = JSON.parse(ag.complementares_urls);
        setComplementaresAnexados(Array.isArray(urls) ? urls : []);
      } catch {
        setComplementaresAnexados([]);
      }
    } else {
      setComplementaresAnexados([]);
    }
    
    setModalVisualizacaoAberto(true);
  };

  // Selecionar documentos (Recepção)
  const handleSelecionarDocumentos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setArquivosDocumentosSelecionados(prev => [...prev, ...files]);
    }
  };

  // Remover documento da lista de seleção
  const handleRemoverDocumento = (index: number) => {
    setArquivosDocumentosSelecionados(prev => prev.filter((_, i) => i !== index));
    setTipoDeExame('');
  };

  // Selecionar ficha pré-anestésica (Anestesista)
  const handleSelecionarFicha = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoFichaSelecionado(e.target.files[0]);
    }
  };
  
  // Selecionar complementares (NOVO)
  const handleSelecionarComplementares = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setArquivosComplementaresSelecionados(prev => [...prev, ...files]);
    }
  };
  
  // Remover complementar da lista de seleção (NOVO)
  const handleRemoverComplementar = (index: number) => {
    setArquivosComplementaresSelecionados(prev => prev.filter((_, i) => i !== index));
  };

  // Upload de Documentos (Recepção)
  const handleUploadDocumentos = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || arquivosDocumentosSelecionados.length === 0) {
      return;
    }
    if (!tipoDeExame || tipoDeExame.trim() === '') {
      toastError('Selecione o tipo do exame antes de anexar');
      return;
    }

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
        let i = 1;
        let candidate = `${base} (${i})${ext}`;
        while (existing.has(candidate)) {
          i++;
          candidate = `${base} (${i})${ext}`;
        }
        return candidate;
      };
      const folder = `documentos/${agendamentoSelecionado.id}`;
      // Upload de cada arquivo
      for (const arquivo of arquivosDocumentosSelecionados) {
        const uniqueName = await getUniqueFileName(folder, arquivo.name);
        const filePath = `${folder}/${uniqueName}`;

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Documentos')
          .upload(filePath, arquivo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          throw new Error(`Erro ao fazer upload de ${arquivo.name}: ${uploadError.message}`);
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('Documentos')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          urlsUploaded.push(urlData.publicUrl);
        }
      }

      // Combinar URLs antigas com novas
      const todasUrls = [...documentosAnexados, ...urlsUploaded];
      const novasMetas = [
        ...examesMeta,
        ...urlsUploaded.map(u => ({ url: u, tipo: tipoDeExame }))
      ];

      // Atualizar banco de dados
      const updateData: Partial<Agendamento> = {
        documentos_urls: JSON.stringify(todasUrls),
        documentos_ok: todasUrls.length > 0,
        documentos_data: new Date().toISOString(),
        tipo_de_exame: tipoDeExame,
        documentos_meta: novasMetas
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      // Limpar e atualizar estado
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

  // Upload de Ficha Pré-Anestésica (Anestesista)
  const handleUploadFicha = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || !arquivoFichaSelecionado) {
      return;
    }

    // Verificar se exames estão OK
    if (!agendamentoSelecionado.documentos_ok) {
      warning('É necessário anexar os exames primeiro');
      setAbaAtiva('documentos');
      return;
    }

    setUploading(true);

    try {
      const getUniqueFileName = async (folder: string, originalName: string): Promise<string> => {
        const { data } = await supabase.storage.from('Documentos').list(folder, { limit: 1000 });
        const existing = new Set((data || []).map(f => f.name));
        if (!existing.has(originalName)) return originalName;
        const dot = originalName.lastIndexOf('.');
        const ext = dot >= 0 ? originalName.slice(dot) : '';
        const base = dot >= 0 ? originalName.slice(0, dot) : originalName;
        let i = 1;
        let candidate = `${base} (${i})${ext}`;
        while (existing.has(candidate)) {
          i++;
          candidate = `${base} (${i})${ext}`;
        }
        return candidate;
      };
      const folder = `fichas/${agendamentoSelecionado.id}`;
      const uniqueName = await getUniqueFileName(folder, arquivoFichaSelecionado.name);
      const filePath = `${folder}/${uniqueName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Documentos')
        .upload(filePath, arquivoFichaSelecionado, {
          cacheControl: '3600',
          upsert: false
        });

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          throw new Error(`Erro ao fazer upload da ficha: ${uploadError.message}`);
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('Documentos')
          .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL do arquivo');
      }

      // Atualizar banco de dados
      const updateData: Partial<Agendamento> = {
        ficha_pre_anestesica_url: urlData.publicUrl,
        ficha_pre_anestesica_ok: true,
        ficha_pre_anestesica_data: new Date().toISOString()
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      // Limpar e atualizar estado
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

  // Remover documento anexado
  const handleRemoverDocumentoAnexado = async (url: string) => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id) return;

    

    try {
      // Remover do array de URLs
      const novasUrls = documentosAnexados.filter(u => u !== url);
      
      // Extrair caminho do arquivo da URL para deletar do storage
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('Documentos') + 1).join('/');

      // Deletar do storage
      const { error: deleteError } = await supabase.storage
        .from('Documentos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erro ao deletar arquivo:', deleteError);
      }

      // Atualizar banco
      const metaFiltrada = examesMeta.filter(m => m.url !== url);
      const updateData: Partial<Agendamento> = {
        documentos_urls: novasUrls.length > 0 ? JSON.stringify(novasUrls) : null,
        documentos_ok: novasUrls.length > 0,
        documentos_data: novasUrls.length > 0 ? new Date().toISOString() : null,
        tipo_de_exame: novasUrls.length > 0 ? (agendamentoSelecionado.tipo_de_exame || tipoDeExame || null) : null,
        documentos_meta: metaFiltrada.length > 0 ? metaFiltrada : null
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado
      setDocumentosAnexados(novasUrls);
      setExamesMeta(metaFiltrada);
      setTipoDeExame('');
      setAgendamentoSelecionado(prev => prev ? { ...prev, ...updateData } : prev);
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));
      if (fileInputDocumentosRef.current) {
        fileInputDocumentosRef.current.value = '';
      }

      success('Documento removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover documento:', error);
      toastError(`Erro ao remover documento: ${error.message}`);
    }
  };

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

  // Verificar se linha está expandida
  const isLinhaExpandida = (agendamentoId: string | undefined) => {
    return agendamentoId ? linhasExpandidas.has(agendamentoId) : false;
  };

  // Renderizar linha de agendamento
  const renderizarLinhaAgendamento = (ag: Agendamento) => {
    const status = getStatusPaciente(ag);
    const expandida = isLinhaExpandida(ag.id);
    
    // Verificar se exames E pré-operatório estão completos
    const temExamesEPreOp = ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true;
    
    return (
      <React.Fragment key={ag.id}>
        {/* Linha principal */}
        <tr className="transition-colors hover:bg-gray-50">
          {/* Status AIH */}
          <td className="px-2 py-3 w-28">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${getAihDotColor(ag.status_aih || 'Pendência Faturamento')}`} />
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getAihStatusStyle(ag.status_aih || 'Pendência Faturamento')}`}>
                {ag.status_aih || 'Pendência Faturamento'}
              </span>
            </div>
          </td>
          {/* Paciente */}
          <td className="px-3 py-3 sm:w-auto md:w-auto lg:w-auto xl:w-auto">
            <div 
              className="text-sm font-medium text-gray-900 whitespace-normal break-words leading-tight sm:text-xs"
              title={ag.nome_paciente || ag.nome || '-'}
            >
              <div className="flex items-center gap-1">
                <span className="truncate">{ag.nome_paciente || ag.nome || '-'}</span>
                {(((obsAgendamentoEdicao[ag.id!] ?? ag.observacao_agendamento ?? '') as string).trim() !== '') && (
                  <span
                    className="flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
                    title="Possui observação do agendamento"
                  />
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
            <div 
              className="text-sm text-gray-700 whitespace-normal break-words leading-tight sm:text-xs"
              title={ag.procedimentos || '-'}
            >
              {ag.procedimentos || '-'}
            </div>
          </td>
          
          {/* Médico */}
          <td className="px-3 py-3 w-48">
            <div 
              className="text-sm sm:text-xs text-gray-700 whitespace-normal break-words leading-tight"
              title={ag.medico || '-'}
            >
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
          
          {/* Status */}
          <td className="px-4 py-3 whitespace-nowrap w-32">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${status.cor}`}>
              {status.texto}
            </span>
          </td>
          
          <td className="px-3 py-3 w-36">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${getLiberacaoDotColor(ag.status_de_liberacao)}`} />
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => ag.id && setStatusDropdownOpen(prev => ({ ...prev, [ag.id!]: !prev[ag.id!] }))}
                  disabled={ag.id ? salvandoLiberacao.has(ag.id) : false}
                  className={`w-full px-2 py-1 text-xs border rounded text-left ${getLiberacaoStatusStyle(ag.status_de_liberacao)}`}
                  title="Atualizar Status Interno"
                >
                  <span
                    className="block"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {ag.status_de_liberacao || 'Selecione'}
                  </span>
                </button>
                {ag.id && statusDropdownOpen[ag.id!] && (
                  <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded shadow z-20">
                    {[
                      'Selecione',
                      'Anestesista',
                      'Cardio',
                      'Exames',
                      'Liberado para Cirurgia',
                      'Não Liberado para Cirurgia',
                      'Confirmado com Paciente',
                      'Cirurgia Cancelada',
                    ].map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          setStatusDropdownOpen(prev => ({ ...prev, [ag.id!]: false }));
                          handleAtualizarStatusLiberacao(ag.id, op === 'Selecione' ? null : op);
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
          
          {/* Avaliação Anestesista */}
          <td className="px-3 py-3 w-36 whitespace-nowrap">
            {(() => {
              const val = (ag.avaliacao_anestesista || '').toLowerCase();
              const texto = val === 'aprovado' ? 'Aprovado' : val === 'reprovado' ? 'Reprovado' : val === 'complementares' ? 'Complementares' : '-';
              return (
                <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${getAvaliacaoBadgeClass(val)}`}>
                  {texto}
                </span>
              );
            })()}
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
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })()}
          </td>
          
          {/* Documentação - Botão único com indicador */}
          <td className="px-4 py-3 w-40">
            {(() => {
              let docsUrls = false;
              try {
                if (ag.documentos_urls) {
                  const urls = JSON.parse(ag.documentos_urls);
                  docsUrls = Array.isArray(urls) && urls.some((u: any) => typeof u === 'string' && u.trim() !== '');
                }
              } catch {
                docsUrls = !!(ag.documentos_urls && ag.documentos_urls.trim() !== '');
              }
              const fichaUrl = !!(ag.ficha_pre_anestesica_url && ag.ficha_pre_anestesica_url.trim() !== '');
              const hasAnexo = ag.documentos_ok === true || ag.ficha_pre_anestesica_ok === true || docsUrls || fichaUrl;
              return (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${hasAnexo ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={hasAnexo ? 'Possui algum anexo' : 'Sem anexos'}
                  />
                  <button
                    onClick={() => {
                      setAbaAtiva('documentos');
                      handleAbrirModalUpload(ag);
                    }}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                    title="Anexar ou visualizar documentação (exames e pré-op)"
                  >
                    Documentação
                  </button>
                </div>
              );
            })()}
          </td>
          
          
          {/* Botão Expandir/Recolher */}
          <td className="px-2 py-3 whitespace-nowrap text-center">
            <button
              onClick={() => toggleExpandirLinha(ag.id)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={expandida ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${expandida ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </td>
        </tr>
        
         {/* Linha expandida com detalhes */}
         {expandida && (
           <tr className="bg-gray-50">
            <td colSpan={12} className="px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Nascimento */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Nascimento
                  </div>
                  <div className="text-sm text-gray-900">
                    {formatarData(ag.data_nascimento || ag.dataNascimento)}
                  </div>
                </div>
                
                {/* Cidade */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Cidade
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.cidade_natal || ag.cidadeNatal || '-'}
                  </div>
                </div>
                
                {/* Telefone */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Telefone
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.telefone || '-'}
                  </div>
                </div>
                
                {/* Médico */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Médico
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.medico || '-'}
                  </div>
                </div>
                
                {/* Procedimento */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Procedimento
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.procedimentos || '-'}
                  </div>
                </div>
                
                {/* Inserido em */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Inserido em
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.created_at
                      ? `${formatarData(ag.created_at.split('T')[0])} às ${new Date(ag.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : '-'}
                  </div>
                </div>
                
                {/* Última modificação */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Última modificação
                  </div>
                  <div className="text-sm text-gray-900">
                    {ag.updated_at
                      ? `${formatarData(ag.updated_at.split('T')[0])} às ${new Date(ag.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : '-'}
                  </div>
                </div>
                </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">📝</span>
                  <label className="text-sm font-semibold text-gray-700">
                    Observação do Agendamento
                  </label>
                </div>
                <textarea
                  value={obsAgendamentoEdicao[ag.id!] ?? ag.observacao_agendamento ?? ''}
                  onChange={(e) => setObsAgendamentoEdicao(prev => ({ ...prev, [ag.id!]: e.target.value }))}
                  placeholder="Digite uma observação sobre este agendamento..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors"
                  rows={2}
                  disabled={salvandoObsAgendamento === ag.id}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {ag.observacao_agendamento ? 'Observação salva' : 'Nenhuma observação salva'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSalvarObservacaoAgendamento(ag)}
                      disabled={salvandoObsAgendamento === ag.id || !obsAgendamentoModificada(ag)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                        obsAgendamentoModificada(ag)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {salvandoObsAgendamento === ag.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Salvar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmMessage('Tem certeza que deseja apagar a observação do agendamento?');
                        confirmActionRef.current = () => handleApagarObservacaoAgendamento(ag);
                        setConfirmOpen(true);
                      }}
                      disabled={salvandoObsAgendamento === ag.id || !(ag.observacao_agendamento?.trim())}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                        ag.observacao_agendamento?.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      title="Apagar observação"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Apagar
                    </button>
                  </div>
                </div>
              </div>
              
              {ag.avaliacao_anestesista && (
                <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                  ag.avaliacao_anestesista === 'aprovado'
                    ? 'bg-green-50 border-green-500'
                    : ag.avaliacao_anestesista === 'reprovado'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className={`text-sm font-bold mb-1 ${
                    ag.avaliacao_anestesista === 'aprovado'
                      ? 'text-green-800'
                      : ag.avaliacao_anestesista === 'reprovado'
                      ? 'text-red-800'
                      : 'text-amber-800'
                  }`}>
                    {ag.avaliacao_anestesista === 'aprovado' && '✅ AVALIAÇÃO ANESTESISTA: APROVADO'}
                    {ag.avaliacao_anestesista === 'reprovado' && '❌ AVALIAÇÃO ANESTESISTA: REPROVADO'}
                    {ag.avaliacao_anestesista === 'complementares' && 'ℹ️ AVALIAÇÃO ANESTESISTA: COMPLEMENTARES'}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ag.avaliacao_anestesista === 'aprovado' && (ag.avaliacao_anestesista_observacao || '-')}
                    {ag.avaliacao_anestesista === 'reprovado' && (ag.avaliacao_anestesista_motivo_reprovacao || '-')}
                    {ag.avaliacao_anestesista === 'complementares' && (ag.avaliacao_anestesista_complementares || '-')}
                  </div>
                  {ag.avaliacao_anestesista_data && (
                    <div className="text-xs text-gray-500 mt-2">
                      Marcado em: {formatarData(ag.avaliacao_anestesista_data.split('T')[0])} às {new Date(ag.avaliacao_anestesista_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              )}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Atualizar status de liberação
  const handleAtualizarStatusLiberacao = async (agendamentoId: string | undefined, novoStatus: string | null) => {
    if (!agendamentoId) return;
    const agAtual = agendamentos.find(a => a.id === agendamentoId);
    if ((novoStatus || '').toLowerCase() === 'cirurgia cancelada') {
      const obsAtual = (obsAgendamentoEdicao[agendamentoId] ?? agAtual?.observacao_agendamento ?? '').trim();
      setCancelAgendamento(agAtual || null);
      setCancelObservacao(obsAtual);
      setModalCancelAberto(true);
      return;
    }
    try {
      setSalvandoLiberacao(prev => new Set(prev).add(agendamentoId));
      await agendamentoService.update(agendamentoId, { status_de_liberacao: novoStatus });
      
      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoId
          ? { ...ag, status_de_liberacao: novoStatus }
          : ag
      ));
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

  // Atualizar confirmação
  const handleAtualizarConfirmacao = async (agendamentoId: string | undefined, novaConfirmacao: string) => {
    if (!agendamentoId) return;
    
    try {
      await agendamentoService.update(agendamentoId, {
        confirmacao: novaConfirmacao
      });
      
      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoId
          ? { ...ag, confirmacao: novaConfirmacao }
          : ag
      ));
    } catch (error: any) {
      console.error('Erro ao atualizar confirmação:', error);
      toastError(`Erro ao atualizar confirmação: ${error.message}`);
    }
  };
  
  const handleConfirmarCancelamento = async () => {
    const ag = cancelAgendamento;
    if (!ag?.id) return;
    const motivo = (cancelObservacao || '').trim();
    if (motivo === '') {
      toastError('Informe o motivo do cancelamento');
      return;
    }
    try {
      setSalvandoCancel(true);
      const updateData: Partial<Agendamento> = {
        status_de_liberacao: 'Cirurgia Cancelada',
        observacao_agendamento: motivo
      };
      await agendamentoService.update(ag.id, updateData);
      setAgendamentos(prev => prev.map(x => x.id === ag.id ? { ...x, ...updateData } : x));
      setObsAgendamentoEdicao(prev => {
        const next = { ...prev };
        delete next[ag.id!];
        return next;
      });
      setModalCancelAberto(false);
      setCancelAgendamento(null);
      setCancelObservacao('');
      success('Cancelamento registrado com motivo');
    } catch (error: any) {
      console.error('Erro ao salvar cancelamento:', error);
      toastError('Erro ao registrar cancelamento');
    } finally {
      setSalvandoCancel(false);
    }
  };

  // Upload de Complementares (NOVO)
  const handleUploadComplementares = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || arquivosComplementaresSelecionados.length === 0) {
      return;
    }

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
        let i = 1;
        let candidate = `${base} (${i})${ext}`;
        while (existing.has(candidate)) {
          i++;
          candidate = `${base} (${i})${ext}`;
        }
        return candidate;
      };
      const folder = `complementares/${agendamentoSelecionado.id}`;
      // Upload de cada arquivo
      for (const arquivo of arquivosComplementaresSelecionados) {
        const uniqueName = await getUniqueFileName(folder, arquivo.name);
        const filePath = `${folder}/${uniqueName}`;

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('Documentos')
          .upload(filePath, arquivo, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          throw new Error(`Erro ao fazer upload de ${arquivo.name}: ${uploadError.message}`);
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('Documentos')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          urlsUploaded.push(urlData.publicUrl);
        }
      }

      // Combinar URLs antigas com novas
      const todasUrls = [...complementaresAnexados, ...urlsUploaded];

      // Atualizar banco de dados
      const updateData: Partial<Agendamento> = {
        complementares_urls: JSON.stringify(todasUrls),
        complementares_ok: todasUrls.length > 0,
        complementares_data: new Date().toISOString()
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      // Limpar e atualizar estado
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

  // Remover complementar anexado (NOVO)
  const handleRemoverComplementarAnexado = async (url: string) => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id) return;

    

    try {
      // Remover do array de URLs
      const novasUrls = complementaresAnexados.filter(u => u !== url);
      
      // Extrair caminho do arquivo da URL para deletar do storage
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('Documentos') + 1).join('/');

      // Deletar do storage
      const { error: deleteError } = await supabase.storage
        .from('Documentos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erro ao deletar arquivo:', deleteError);
      }

      // Atualizar banco
      const updateData: Partial<Agendamento> = {
        complementares_urls: novasUrls.length > 0 ? JSON.stringify(novasUrls) : null,
        complementares_ok: novasUrls.length > 0,
        complementares_data: novasUrls.length > 0 ? new Date().toISOString() : null
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado
      setComplementaresAnexados(novasUrls);
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      success('Documento complementar removido com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover complementar:', error);
      toastError(`Erro ao remover complementar: ${error.message}`);
    }
  };
  
  // Remover ficha pré-anestésica
  const handleRemoverFicha = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || !fichaAnexada) return;

    

    try {
      // Extrair caminho do arquivo da URL para deletar do storage
      const urlObj = new URL(fichaAnexada);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('documentos-medicos') + 1).join('/');

      // Deletar do storage
      const { error: deleteError } = await supabase.storage
        .from('Documentos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erro ao deletar ficha:', deleteError);
      }

      // Atualizar banco
      const updateData: Partial<Agendamento> = {
        ficha_pre_anestesica_url: null,
        ficha_pre_anestesica_ok: false,
        ficha_pre_anestesica_data: null
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado
      setFichaAnexada(null);
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      success('Ficha pré-operatória removida com sucesso');
    } catch (error: any) {
      console.error('Erro ao remover ficha:', error);
      toastError(`Erro ao remover ficha: ${error.message}`);
    }
  };

  return (
    <div className="p-0">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Documentação Pré-Cirúrgica</h1>
          <p className="text-gray-600">
            Gerenciamento de documentos dos pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Filtro Status EXAMES - DESTACADO */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              📄 Status dos Exames
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${
                filtroStatus 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">📊 Todos</option>
              <option value="COM EXAMES">✅ Com Exames</option>
              <option value="SEM EXAMES">⚠️ Sem Exames</option>
            </select>
          </div>
          
          
          {/* Filtro Status Interno */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status Interno
            </label>
            <select
              value={filtroStatusInterno}
              onChange={(e) => setFiltroStatusInterno(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${
                filtroStatusInterno 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
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
          
          
          {/* Filtro Status PRÉ-OPERATÓRIO removido */}
          
          {/* Filtro Paciente */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Paciente
            </label>
            <input
              type="text"
              value={filtroPaciente}
              onChange={(e) => setFiltroPaciente(e.target.value)}
              placeholder="Nome do paciente..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          
          {/* Filtro Nº Prontuário */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nº Prontuário
            </label>
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
          
          {/* Filtro Médico */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Médico
            </label>
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
          
          {/* Filtro Data Consulta */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Data Consulta
            </label>
            <input
              type="text"
              value={filtroDataConsulta}
              onChange={(e) => setFiltroDataConsulta(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          
          {/* Filtro Data Cirurgia */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Data Cirurgia
            </label>
            <input
              type="text"
              value={filtroDataCirurgia}
              onChange={(e) => setFiltroDataCirurgia(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          
          {/* Filtro Status AIH */}
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        🧾 Status AIH
      </label>
      <select
        value={filtroAih}
        onChange={(e) => setFiltroAih(e.target.value)}
        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors bg-white font-medium ${
          filtroAih 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-gray-300'
        }`}
      >
        <option value="">📊 Todos</option>
        <option value="Autorizado">Autorizado</option>
        <option value="Pendência Hospital">Pendência Hospital</option>
        <option value="Pendência Faturamento">Pendência Faturamento</option>
        <option value="Auditor Externo">Auditor Externo</option>
        <option value="Aguardando Ciência SMS">Aguardando Ciência SMS</option>
        <option value="Agendado">Agendado</option>
        <option value="AG Regulação">AG Regulação</option>
        <option value="Solicitar">Solicitar</option>
        <option value="Emitida">Emitida</option>
        <option value="AIH Represada">AIH Represada</option>
        <option value="AG Ciência SMS">AG Ciência SMS</option>
        <option value="N/A - Urgência">N/A - Urgência</option>
      </select>
    </div>
          
          {/* Filtro Confirmado */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirmado
            </label>
            <select
              value={filtroConfirmado}
              onChange={(e) => setFiltroConfirmado(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors bg-white font-medium ${
                filtroConfirmado 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">📊 Todos</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Aguardando">Aguardando</option>
            </select>
          </div>
          
          {/* Filtro Avaliação Anestesista */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Avaliação Anestesista
            </label>
            <select
              value={filtroAvaliacaoAnestesista}
              onChange={(e) => setFiltroAvaliacaoAnestesista(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none transition-colors bg-white font-medium ${
                filtroAvaliacaoAnestesista 
                  ? 'border-violet-500 bg-violet-50' 
                  : 'border-gray-300'
              }`}
            >
              <option value="">📊 Todos</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
              <option value="complementares">Complementares</option>
              <option value="sem_avaliacao">Sem avaliação</option>
            </select>
          </div>
          
          {/* Filtro Mês da Cirurgia */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              📅 Mês Cirurgia
            </label>
            <select
              value={filtroMesCirurgia}
              onChange={(e) => setFiltroMesCirurgia(e.target.value)}
              className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-colors bg-white font-medium ${
                filtroMesCirurgia 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-300'
              }`}
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
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              📄 Data Inserção
            </label>
            <input
              type="date"
              value={filtroDataInsercao}
              onChange={(e) => setFiltroDataInsercao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
            />
          </div>
          
          {/* Filtro Médico (removido input; usar dropdown acima) */}
        </div>
        
        {/* Indicador de resultados filtrados */}
        {temFiltrosAtivos && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Mostrando <span className="font-semibold text-gray-800">{agendamentosFiltrados.length}</span> registro(s) de <span className="font-semibold text-gray-800">{agendamentos.length}</span> total
            </p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando agendamentos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Paginação Superior */}
          {!agruparPorStatus && (
            <div ref={tabelaRef} className="mb-4 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Informações e seletor de itens por página */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min((paginaAtual - 1) * itensPorPagina + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(paginaAtual * itensPorPagina, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes
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
                  <div className="hidden sm:flex items-center gap-2 ml-4">
                    <label className="text-sm text-gray-600">Observação:</label>
                    <select
                      value={filtroObservacao}
                      onChange={(e) => setFiltroObservacao(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      title="Filtrar por observação"
                    >
                      <option value="">Todos</option>
                      <option value="com_observacao">📝 Com observação</option>
                      <option value="sem_observacao">Sem observação</option>
                    </select>
                    <button
                      onClick={handleAbrirModalRelatorioInterno}
                      className="px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
                      title="Emitir relatório por Status Interno"
                    >
                      Relatório Status Interno
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

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 table-auto">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-32 md:w-36 lg:w-40 xl:w-44">
                      Status AIH
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-40">
                      Nº Prontuário
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimento
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 md:w-48 lg:w-56">
                      Médico
                    </th>
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
                    <th 
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors sm:w-28 md:w-32 lg:w-36"
                      onClick={toggleAgruparPorStatus}
                      title={agruparPorStatus ? 'Clique para desagrupar' : 'Clique para agrupar por exames'}
                    >
                      <div className="flex items-center gap-2">
                        Exames
                        {agruparPorStatus && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-36 md:w-40 lg:w-44 xl:w-52">
                      Status Interno
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-36 md:w-40 lg:w-44">
                      Avaliação Anestesista
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-28 md:w-32 lg:w-36">
                      Confirmado
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 md:w-48 lg:w-56">
                      Documentação
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      {/* Botão expandir */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm sm:text-xs">
                  {(() => {
                    const grupos = agendamentosAgrupados();
                    
                    // Se não está agrupado
                    if (!agruparPorStatus) {
                      const lista = grupos.semGrupo || [];
                      if (lista.length === 0) {
                        return (
                          <tr>
                            <td colSpan={13} className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 font-medium">Nenhum agendamento encontrado</p>
                                <p className="text-sm text-gray-400">
                                  {filtroStatus 
                                    ? `Não há pacientes com exames "${filtroStatus}".` 
                                    : temFiltrosAtivos
                                    ? 'Nenhum paciente corresponde aos filtros aplicados.'
                                    : 'Não há pacientes agendados no sistema.'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      
                      return lista.map((ag) => renderizarLinhaAgendamento(ag));
                    }
                    
                    // Se está agrupado
                    const gruposOrdenados = [
                      { chave: 'sem_exames', titulo: 'Sem Exames', cor: 'bg-red-50 border-red-200' },
                      { chave: 'com_exames', titulo: 'Com Exames', cor: 'bg-green-50 border-green-200' }
                    ];
                    
                    return gruposOrdenados.map((grupoInfo) => {
                      const agendamentosGrupo = grupos[grupoInfo.chave] || [];
                      if (agendamentosGrupo.length === 0) return null;
                      
                      return (
                        <React.Fragment key={grupoInfo.chave}>
                          {/* Cabeçalho do grupo */}
                          <tr className={`${grupoInfo.cor} border-t-2 border-b-2`}>
                            <td colSpan={10} className="px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">{grupoInfo.titulo}</span>
                                  <span className="text-sm text-gray-600">({agendamentosGrupo.length})</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          {/* Linhas do grupo */}
                          {agendamentosGrupo.map((ag) => renderizarLinhaAgendamento(ag))}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {!agruparPorStatus && totalRegistros > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Informações e seletor de itens por página */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min((paginaAtual - 1) * itensPorPagina + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(paginaAtual * itensPorPagina, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes
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

          {/* Legenda */}
          <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border-l-4 border-blue-500 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-blue-600">📌</span> Sistema de Documentação Visual
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="flex items-start gap-2 bg-white p-2 rounded">
                <span className="text-green-600">🩺</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Exames</p>
                  <p className="text-xs text-gray-600">ECG, laboratoriais, raio-x</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded">
                <span className="text-green-600">📋</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Pré-operatório</p>
                  <p className="text-xs text-gray-600">Ficha pré-anestésica</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded">
                <span className="text-green-600">📁</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Complementares</p>
                  <p className="text-xs text-gray-600">Documentos adicionais</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 italic flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Clique nos itens da coluna <strong>DOCUMENTAÇÃO</strong> para anexar ou visualizar arquivos
            </p>
          </div>
        </>
      )}

      {/* Modal de Upload com Abas */}
      <Modal
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setArquivosDocumentosSelecionados([]);
          setArquivoFichaSelecionado(null);
          setAgendamentoSelecionado(null);
          setTipoDeExame('');
        }}
        title={`Documentação - ${agendamentoSelecionado?.nome_paciente || 'Paciente'}`}
        size="large"
      >
        <div className="space-y-4">
          {/* Informações do Paciente */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Paciente:</strong> {agendamentoSelecionado?.nome_paciente || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Procedimento:</strong> {agendamentoSelecionado?.procedimentos || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Data Cirurgia:</strong> {formatarData(agendamentoSelecionado?.data_agendamento)}
            </p>
          </div>

          {/* Abas */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-4">
              <button
                onClick={() => setAbaAtiva('documentos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'documentos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Anexos {agendamentoSelecionado?.documentos_ok && '✓'}
              </button>
              <button
                onClick={() => setAbaAtiva('ficha')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'ficha'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Pré-Operatório {agendamentoSelecionado?.ficha_pre_anestesica_ok && '✓'}
              </button>
              {/* Complementares removidos */}
            </nav>
          </div>

          {/* Conteúdo da Aba: Exames */}
          {abaAtiva === 'documentos' && (
            <div className="space-y-4">
              {/* Anexos já anexados */}
              {documentosAnexados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Documentos já anexados:</h3>
                  <div className="space-y-2">
                    {documentosAnexados.map((url, index) => {
                      const fileName = url.split('/').pop() || `Documento ${index + 1}`;
                      const meta = examesMeta.find(m => m.url === url);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {fileName}
                          </a>
                          {meta?.tipo && (
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 mr-2">
                              {meta.tipo}
                            </span>
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
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Área de Upload de Anexos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Adicionar novos anexos:</h3>
                
                <input
                  ref={fileInputDocumentosRef}
                  type="file"
                  multiple
                  onChange={handleSelecionarDocumentos}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                <button
                  onClick={() => {
                    if (fileInputDocumentosRef.current) {
                      fileInputDocumentosRef.current.value = '';
                    }
                    setTipoDeExame('');
                    fileInputDocumentosRef.current?.click();
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center"
                >
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Clique para selecionar arquivos</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
                </button>

              {/* Lista de arquivos selecionados */}
              {arquivosDocumentosSelecionados.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                  {arquivosDocumentosSelecionados.map((arquivo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 flex-1">{arquivo.name}</span>
                      <span className="text-xs text-gray-500 mr-2">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        onClick={() => handleRemoverDocumento(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {/* Tipo do anexo - obrigatório */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo do anexo</label>
                    <select
                      value={tipoDeExame}
                      onChange={(e) => setTipoDeExame(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Selecione</option>
                      <option value="Tomografia computadorizada">Tomografia computadorizada</option>
                      <option value="Ultrassonografia">Ultrassonografia</option>
                      <option value="Radiografia">Radiografia</option>
                      <option value="Ressonância magnética">Ressonância magnética</option>
                      <option value="Exames de laboratório">Exames de laboratório</option>
                      <option value="Termo de planejamento familiar">Termo de planejamento familiar</option>
                      <option value="Outros">Outros</option>
                    </select>
                    {!tipoDeExame && (
                      <p className="text-xs text-red-600 mt-1">Selecione o tipo do anexo para enviar</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação - Anexos */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                  onClick={() => {
                    setModalUploadAberto(false);
                    setArquivosDocumentosSelecionados([]);
                    setAgendamentoSelecionado(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={uploading}
                >
                  Cancelar
                </button>
              <button
                onClick={handleUploadDocumentos}
                disabled={uploading || arquivosDocumentosSelecionados.length === 0 || !tipoDeExame}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Anexar Arquivos
                  </>
                )}
              </button>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba: Ficha Pré-Anestésica */}
          {abaAtiva === 'ficha' && (
            <div className="space-y-4">
              {/* Ficha já anexada */}
              {fichaAnexada && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Ficha pré-anestésica anexada:</h3>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <a
                      href={fichaAnexada}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {fichaAnexada.split('/').pop() || 'Ficha Pré-Anestésica'}
                    </a>
            <button
              onClick={() => {
                setConfirmMessage('Tem certeza que deseja remover a ficha pré-operatória?');
                confirmActionRef.current = () => handleRemoverFicha();
                setConfirmOpen(true);
              }}
              className="text-red-600 hover:text-red-800 p-1"
              title="Remover ficha"
            >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Área de Upload de Ficha */}
              {!fichaAnexada && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Anexar ficha pré-anestésica:</h3>
                  
                  <input
                    ref={fileInputFichaRef}
                    type="file"
                    onChange={handleSelecionarFicha}
                    className="hidden"
                    accept=".pdf"
                  />

                  <button
                    onClick={() => fileInputFichaRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors text-center"
                  >
                    <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">Clique para selecionar ficha pré-anestésica</p>
                    <p className="text-xs text-gray-400 mt-1">PDF</p>
                  </button>

                  {/* Arquivo selecionado */}
                  {arquivoFichaSelecionado && (
                    <div className="mt-4 p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 flex-1">{arquivoFichaSelecionado.name}</span>
                        <span className="text-xs text-gray-500 mr-2">
                          {(arquivoFichaSelecionado.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          onClick={() => setArquivoFichaSelecionado(null)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de ação - Ficha */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setModalUploadAberto(false);
                    setArquivoFichaSelecionado(null);
                    setAgendamentoSelecionado(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadFicha}
                  disabled={uploading || !arquivoFichaSelecionado || !!fichaAnexada}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Anexar Ficha
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Conteúdo da aba de complementares removido */}
        </div>
      </Modal>

      

      <Modal
        isOpen={reportInternoModalAberto}
        onClose={() => {
          setReportInternoModalAberto(false);
        }}
        title="Emitir Relatório por Status Interno"
        size="small"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status Interno</label>
            <select
              value={reportInternoStatus}
              onChange={(e) => setReportInternoStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">Selecione</option>
              {internoStatusOptions.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
              <input
                type="date"
                value={reportInternoStartDate}
                onChange={(e) => setReportInternoStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Até</label>
              <input
                type="date"
                value={reportInternoEndDate}
                onChange={(e) => setReportInternoEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setReportInternoModalAberto(false)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Fechar
            </button>
            <button
              onClick={gerarPDFRelatorioInterno}
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

      {/* Modal de Motivo do Cancelamento */}
      <Modal
        isOpen={modalCancelAberto}
        onClose={() => {
          setModalCancelAberto(false);
          setCancelAgendamento(null);
          setCancelObservacao('');
        }}
        title={`Cancelar Cirurgia - ${cancelAgendamento?.nome_paciente || 'Paciente'}`}
        size="small"
      >
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 p-2 rounded">
            <div className="text-xs text-red-700">
              Selecionei “Cirurgia Cancelada”. Informe o motivo do cancelamento abaixo.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div><strong>Procedimento:</strong> {cancelAgendamento?.procedimentos || '-'}</div>
            <div><strong>Data Cirurgia:</strong> {formatarData(cancelAgendamento?.data_agendamento)}</div>
          </div>
          <textarea
            value={cancelObservacao}
            onChange={(e) => setCancelObservacao(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            rows={3}
            disabled={salvandoCancel}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setModalCancelAberto(false);
                setCancelAgendamento(null);
                setCancelObservacao('');
              }}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={salvandoCancel}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarCancelamento}
              className={`px-4 py-2 text-sm rounded text-white ${salvandoCancel ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
              disabled={salvandoCancel}
            >
              Salvar motivo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Visualização de Documentos */}
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
          {/* Informações do Paciente */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Paciente:</strong> {agendamentoSelecionado?.nome_paciente || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Procedimento:</strong> {agendamentoSelecionado?.procedimentos || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Data Cirurgia:</strong> {formatarData(agendamentoSelecionado?.data_agendamento)}
            </p>
          </div>

          {/* Seção de Anexos */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Anexos
            </h3>
            {documentosAnexados.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documentosAnexados.map((url, index) => {
                  const fileName = url.split('/').pop() || `Anexo ${index + 1}`;
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded hover:bg-green-100 transition-colors">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{fileName}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum anexo enviado</p>
            )}
          </div>

          {/* Seção de Ficha Pré-Operatória */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              📋 Ficha Pré-Operatória
            </h3>
            {fichaAnexada ? (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors">
                <a
                  href={fichaAnexada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{fichaAnexada.split('/').pop() || 'Ficha Pré-Anestésica'}</span>
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma ficha anexada</p>
            )}
          </div>

          {/* Seção de Documentos Complementares */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              📁 Documentos Complementares
            </h3>
            {complementaresAnexados.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {complementaresAnexados.map((url, index) => {
                  const fileName = url.split('/').pop() || `Complementar ${index + 1}`;
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100 transition-colors">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline flex-1"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="truncate">{fileName}</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum documento complementar anexado</p>
            )}
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => {
                setModalVisualizacaoAberto(false);
                setAgendamentoSelecionado(null);
                setDocumentosAnexados([]);
                setComplementaresAnexados([]);
                setFichaAnexada(null);
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
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

export default DocumentacaoView;

