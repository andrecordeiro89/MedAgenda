import React, { useState, useEffect, useRef } from 'react';
import { agendamentoService } from '../services/supabase';
import { Agendamento } from '../types';
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
  const [filtroMedico, setFiltroMedico] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroObservacao, setFiltroObservacao] = useState<string>('');
  
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
  
  // Estado para controlar visualização de pendências
  const [mostrarPendencias, setMostrarPendencias] = useState(false);
  const { success, error: toastError, warning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmActionRef = useRef<(() => void) | null>(null);

  // Carregar agendamentos
  useEffect(() => {
    carregarAgendamentos();
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
        
        // CASO 4: Demais casos (registros parcialmente preenchidos) → OCULTAR
        return false; // ❌ Excluir para manter consistência com outras telas
      });
      
      // NÃO FILTRAR POR documentos_ok - mostrar TODOS os pacientes válidos
      const paraFaturamento = semGradeCirurgica;
      
      // DEBUG: Análise detalhada e contagem de pacientes únicos
      const totalOriginal = dados.length;
      const totalFiltrado = paraFaturamento.length;
      const totalExcluidos = totalOriginal - totalFiltrado;
      
      // Contar pacientes ÚNICOS no total filtrado
      const pacientesUnicos = new Set<string>();
      paraFaturamento.forEach(ag => {
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
      const comPaciente = paraFaturamento.filter(ag => 
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
      
      setAgendamentos(paraFaturamento);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
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

  // FILTRO PRINCIPAL: Apenas registros COM PACIENTE (não contar procedimentos vazios)
  const agendamentosComPaciente = agendamentos.filter(ag => {
    // Deve ter nome de paciente
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    // Deve ter procedimento (não pode ser linha vazia)
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    return temPaciente && temProcedimento;
  });
  
  // Separar agendamentos em PRONTOS e PENDENTES (apenas os que têm paciente)
  const agendamentosProntos = agendamentosComPaciente.filter(ag => 
    ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true
  );
  
  const agendamentosPendentes = agendamentosComPaciente.filter(ag => 
    !(ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true)
  );
  
  // Calcular pacientes únicos para os KPIs (usando Set - mais simples e direto)
  const totalPacientesUnicos = getPacientesUnicos(agendamentosComPaciente);
  const totalPendentesUnicos = getPacientesUnicos(agendamentosPendentes);
  
  // Aplicar filtros
  const aplicarFiltros = (lista: Agendamento[]) => {
    return lista.filter(ag => {
      // Filtro por paciente
      if (filtroPaciente) {
        const nomePaciente = (ag.nome_paciente || ag.nome || '').toLowerCase();
        if (!nomePaciente.includes(filtroPaciente.toLowerCase())) return false;
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
      
      // Filtro por médico
      if (filtroMedico) {
        const medico = (ag.medico || '').toLowerCase();
        if (!medico.includes(filtroMedico.toLowerCase())) return false;
      }
      
      // Filtro por status
      if (filtroStatus) {
        if (filtroStatus === 'sem_status') {
          // Filtrar apenas os que NÃO têm status definido
          if (ag.faturamento_status) return false;
        } else {
          // Filtrar pelo status específico
          if (ag.faturamento_status !== filtroStatus) return false;
        }
      }
      
      // Filtro por observação
      if (filtroObservacao) {
        const temObservacao = ag.observacao_faturamento && ag.observacao_faturamento.trim() !== '';
        if (filtroObservacao === 'com_observacao' && !temObservacao) return false;
        if (filtroObservacao === 'sem_observacao' && temObservacao) return false;
      }
      
      return true;
    });
  };
  
  const agendamentosProntosFiltrados = aplicarFiltros(agendamentosProntos);
  const agendamentosPendentesFiltrados = aplicarFiltros(agendamentosPendentes);
  
  // Limpar todos os filtros
  const limparFiltros = () => {
    setFiltroPaciente('');
    setFiltroDataConsulta('');
    setFiltroDataCirurgia('');
    setFiltroMedico('');
    setFiltroStatus('');
    setFiltroObservacao('');
  };
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroPaciente || filtroDataConsulta || filtroDataCirurgia || filtroMedico || filtroStatus || filtroObservacao;
  
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
  
  // Ordenar por data e médico
  const ordenarPorDataEMedico = (lista: Agendamento[]) => {
    return [...lista].sort((a, b) => {
      // PRIORIDADE 1: Coluna selecionada para ordenação
      let dataA: string;
      let dataB: string;
      
      if (colunaOrdenacao === 'data_consulta') {
        dataA = a.data_consulta || '9999-12-31';
        dataB = b.data_consulta || '9999-12-31';
      } else {
        // Default: data_cirurgia
        dataA = a.data_agendamento || a.dataAgendamento || '9999-12-31';
        dataB = b.data_agendamento || b.dataAgendamento || '9999-12-31';
      }
      
      if (dataA !== dataB) {
        const comparacao = dataA.localeCompare(dataB);
        return direcaoOrdenacao === 'asc' ? comparacao : -comparacao;
      }
      
      // PRIORIDADE 2: Nome do médico (alfabético)
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
  const agendamentosProntosOrdenados = ordenarPorDataEMedico(agendamentosProntosFiltrados);
  const agendamentosPendentesOrdenados = ordenarPorDataEMedico(agendamentosPendentesFiltrados);
  
  // Paginação
  const totalRegistros = agendamentosProntosOrdenados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
  
  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPaciente, filtroDataConsulta, filtroDataCirurgia, filtroMedico, filtroStatus, filtroObservacao]);
  
  // Rolar para o topo da tabela quando mudar de página
  useEffect(() => {
    if (tabelaRef.current && paginaAtual > 1) {
      tabelaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [paginaAtual]);
  
  // Aplicar paginação
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const agendamentosPaginados = agendamentosProntosOrdenados.slice(indexInicio, indexFim);

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
  
  // Obter estilo do select de status
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
  
  // Estado para controlar observação em edição
  const [observacaoEmEdicao, setObservacaoEmEdicao] = useState<{ [id: string]: string }>({});
  const [salvandoObservacao, setSalvandoObservacao] = useState<string | null>(null);
  
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


  // Renderizar linha de agendamento
  const renderizarLinhaAgendamento = (ag: Agendamento) => {
    const expandida = isLinhaExpandida(ag.id);
    
    return (
      <React.Fragment key={ag.id}>
        {/* Linha principal */}
        <tr className="hover:bg-gray-50">
          {/* Paciente */}
          <td className="px-4 py-3 w-48">
            <div className="flex items-center gap-1">
              <div 
                className="text-sm font-medium text-gray-900 truncate"
                title={ag.nome_paciente || ag.nome || '-'}
              >
                {ag.nome_paciente || ag.nome || '-'}
              </div>
              {ag.observacao_faturamento && (
                <span 
                  className="flex-shrink-0 text-amber-500" 
                  title={`Observação: ${ag.observacao_faturamento}`}
                >
                  📝
                </span>
              )}
            </div>
          </td>
          
          {/* Procedimento */}
          <td className="px-4 py-3 w-56">
            <div 
              className="text-sm text-gray-700 truncate"
              title={formatarProcedimento(ag)}
            >
              {formatarProcedimento(ag)}
            </div>
          </td>
          
          {/* Médico */}
          <td className="px-4 py-3 w-40">
            <div 
              className="text-sm text-gray-700 truncate"
              title={ag.medico || '-'}
            >
              {ag.medico || '-'}
            </div>
          </td>
          
          {/* Data Consulta */}
          <td className="px-4 py-3 w-32">
            <div className="text-sm text-gray-500">
              {formatarData(ag.data_consulta)}
            </div>
          </td>
          
          {/* Data Cirurgia */}
          <td className="px-4 py-3 w-32">
            <div className="text-sm text-gray-500">
              {formatarData(ag.data_agendamento || ag.dataAgendamento)}
            </div>
          </td>
          
          {/* Status */}
          <td className="px-4 py-3 w-32">
            <select
              value={ag.faturamento_status || ''}
              onChange={(e) => handleAtualizarStatus(ag, e.target.value as 'pendente' | 'auditor' | 'autorizado' | null || null)}
              className={`w-full px-2 py-1 text-xs font-medium rounded border cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${getStatusSelectStyle(ag.faturamento_status)}`}
              title="Selecione o status do faturamento"
            >
              <option value="">Selecione...</option>
              <option value="pendente">Pendente</option>
              <option value="auditor">Auditor</option>
              <option value="autorizado">Autorizado</option>
            </select>
          </td>
          
          {/* Ações - Download */}
          <td className="px-4 py-4 whitespace-nowrap text-sm">
            <div className="flex flex-col gap-2">
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download G-SUS
                  </>
                )}
              </button>
            </div>
          </td>
          
          {/* Botão Expandir/Recolher */}
          <td className="px-4 py-4 whitespace-nowrap">
            <button
              onClick={() => toggleExpandirLinha(ag.id)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={expandida ? 'Recolher detalhes' : 'Expandir detalhes'}
            >
              <svg 
                className={`w-5 h-5 transition-transform ${expandida ? 'rotate-90' : ''}`}
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
            <td colSpan={8} className="px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
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
              </div>
              
              {/* Campo de Observação do Faturamento */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-600">📝</span>
                  <label className="text-sm font-semibold text-gray-700">
                    Observação do Faturamento
                  </label>
                </div>
                <textarea
                  value={observacaoEmEdicao[ag.id!] ?? ag.observacao_faturamento ?? ''}
                  onChange={(e) => setObservacaoEmEdicao(prev => ({ ...prev, [ag.id!]: e.target.value }))}
                  placeholder="Digite uma observação sobre este paciente..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none transition-colors"
                  rows={2}
                  disabled={salvandoObservacao === ag.id}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {ag.observacao_faturamento ? 'Observação salva' : 'Nenhuma observação salva'}
                  </span>
                  <button
                    onClick={() => handleSalvarObservacao(ag)}
                    disabled={salvandoObservacao === ag.id || !observacaoModificada(ag)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                      observacaoModificada(ag)
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {salvandoObservacao === ag.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar Observação
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Observação de NÃO LIBERADO (se houver) */}
              {ag.faturamento_liberado === false && ag.faturamento_observacao && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
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
              
              {/* Links para documentos individuais */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs font-semibold text-gray-700 mb-2">Documentos disponíveis:</div>
                <div className="flex flex-wrap gap-2">
                  {ag.documentos_urls && (() => {
                    try {
                      const urls = JSON.parse(ag.documentos_urls);
                      if (Array.isArray(urls) && urls.length > 0) {
                        return urls.map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Doc {index + 1}
                          </a>
                        ));
                      }
                    } catch {}
                    return null;
                  })()}
                  
                  {ag.ficha_pre_anestesica_url && (
                    <a
                      href={ag.ficha_pre_anestesica_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          
          {/* Filtro Médico */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Médico
            </label>
            <input
              type="text"
              value={filtroMedico}
              onChange={(e) => setFiltroMedico(e.target.value)}
              placeholder="Nome do médico..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          
          {/* Filtro Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">Todos</option>
              <option value="sem_status">Sem status</option>
              <option value="pendente">Pendente</option>
              <option value="auditor">Auditor</option>
              <option value="autorizado">Autorizado</option>
            </select>
          </div>
          
          {/* Filtro Observação */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observação
            </label>
            <select
              value={filtroObservacao}
              onChange={(e) => setFiltroObservacao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">Todos</option>
              <option value="com_observacao">📝 Com observação</option>
              <option value="sem_observacao">Sem observação</option>
            </select>
          </div>
        </div>
        
        {/* Indicador de resultados filtrados */}
        {temFiltrosAtivos && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Prontos: <span className="font-semibold text-gray-800">{agendamentosProntosFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentosProntos.length}</span> • 
              Pendentes: <span className="font-semibold text-gray-800">{agendamentosPendentesFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentosPendentes.length}</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Cards de Resumo - Compactos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* Card: Prontos */}
        <div className="bg-white rounded-lg shadow px-3 py-2 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Prontos para Faturamento</p>
              <p className="text-xl font-bold text-gray-900">{agendamentosProntosOrdenados.length}</p>
              <p className="text-[10px] text-gray-500">Exames + Pré-Op anexados</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        
        {/* Card: Pendentes */}
        <div className="bg-white rounded-lg shadow px-3 py-2 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Pendências</p>
              <p className="text-xl font-bold text-gray-900">{totalPendentesUnicos}</p>
              <p className="text-[10px] text-gray-500">Falta exames ou pré-op</p>
            </div>
            <button
              onClick={() => setMostrarPendencias(!mostrarPendencias)}
              className="text-2xl hover:scale-110 transition-transform cursor-pointer"
              title={mostrarPendencias ? 'Ocultar pendências' : 'Ver pendências'}
            >
              ⚠️
            </button>
          </div>
        </div>
        
        {/* Card: Total */}
        <div className="bg-white rounded-lg shadow px-3 py-2 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total de Pacientes</p>
              <p className="text-xl font-bold text-gray-900">{totalPacientesUnicos}</p>
              <p className="text-[10px] text-gray-500">Com procedimento associado</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
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
                      <span className="font-semibold">{totalRegistros}</span> pacientes prontos
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
          
          {/* Tabela de Prontos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                      Procedimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Médico
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors select-none"
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
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 transition-colors select-none"
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Ações
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      {/* Botão expandir */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">Nenhum paciente pronto encontrado</p>
                          <p className="text-sm text-gray-400">
                            {temFiltrosAtivos 
                              ? 'Nenhum paciente corresponde aos filtros aplicados.'
                              : 'Não há pacientes com exames e pré-op anexados.'
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
                      <span className="font-semibold">{totalRegistros}</span> pacientes prontos
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
                <span>• Tabela exibe pacientes com exames E pré-op anexados</span>
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
        </>
      )}
      
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


