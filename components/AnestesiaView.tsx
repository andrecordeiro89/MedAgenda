import React, { useState, useEffect, useRef } from 'react';
import { agendamentoService, supabase } from '../services/supabase';
import { Agendamento } from '../types';
import { Modal } from './ui';
import { ToastContainer, ToastType } from './Toast';
import { useToast } from '../contexts/ToastContext';

export const AnestesiaView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();
  
  // Sistema de toasts
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  
  // Estado para controlar filtro de status (era abas, agora é filtro)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'concluidos'>('todos');
  
  // Função para mostrar toast
  const mostrarToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  
  // Função para remover toast
  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Estado para controlar linhas expandidas
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());
  
  // Estados para filtros de busca
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroDataCirurgia, setFiltroDataCirurgia] = useState<string>('');
  const [filtroMedico, setFiltroMedico] = useState<string>('');
  
  // Estados do modal
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalVisualizacaoAberto, setModalVisualizacaoAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  
  // Estados para Ficha Pré-Operatória (Anestesista)
  const [arquivoFichaSelecionado, setArquivoFichaSelecionado] = useState<File | null>(null);
  const [fichaAnexada, setFichaAnexada] = useState<string | null>(null);
  const fileInputFichaRef = useRef<HTMLInputElement>(null);
  
  // Estados para Avaliação do Anestesista
  const [avaliacaoEmEdicao, setAvaliacaoEmEdicao] = useState<string | null>(null); // ID do agendamento sendo avaliado
  const [avaliacaoTipo, setAvaliacaoTipo] = useState<'aprovado' | 'reprovado' | 'complementares' | null>(null);
  const [avaliacaoObservacao, setAvaliacaoObservacao] = useState('');
  const [avaliacaoMotivoReprovacao, setAvaliacaoMotivoReprovacao] = useState('');
  const [avaliacaoComplementares, setAvaliacaoComplementares] = useState('');
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  
  // Estados para visualização de documentos
  const [documentosExames, setDocumentosExames] = useState<string[]>([]);
  const [documentosComplementares, setDocumentosComplementares] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  
  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);
  const tabelaRef = useRef<HTMLDivElement>(null);

  // Carregar agendamentos
  useEffect(() => {
    carregarAgendamentos();
  }, [hospitalId]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      
      console.log('🩺 ANESTESIA - Total de agendamentos retornados:', dados.length);
      
      // Filtrar apenas registros válidos (MESMA LÓGICA que Documentação e Faturamento)
      const agendamentosFiltrados = dados.filter(ag => {
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
        return false; // ❌ Excluir para manter consistência
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
      
      console.log('🩺 ANESTESIA - CONTAGEM:');
      console.log(`  Total de REGISTROS no banco: ${totalOriginal}`);
      console.log(`  Total de REGISTROS após filtro: ${totalFiltrado}`);
      console.log(`  Total de REGISTROS excluídos: ${totalExcluidos}`);
      console.log(`  🎯 PACIENTES ÚNICOS (final): ${pacientesUnicos.size}`);
      
      setAgendamentos(agendamentosFiltrados);
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

  // Agrupar por paciente único (para a tabela)
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
  
  // Calcular contadores para os filtros (PACIENTES ÚNICOS usando Set)
  const totalTodos = getPacientesUnicos(agendamentos);
  const totalPendentes = getPacientesUnicos(
    agendamentos.filter(ag => ag.ficha_pre_anestesica_ok !== true)
  );
  const totalConcluidos = getPacientesUnicos(
    agendamentos.filter(ag => ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true)
  );
  
  // Filtrar agendamentos por status (substituindo a lógica de abas)
  const agendamentosPorStatus = agendamentos.filter(ag => {
    const temExames = ag.documentos_ok === true;
    const temPreOperatorio = ag.ficha_pre_anestesica_ok === true;
    
    if (filtroStatus === 'todos') {
      // Todos: mostrar todos os agendamentos
      return true;
    } else if (filtroStatus === 'pendentes') {
      // Pendentes: SEM pré-operatório (independente de ter ou não exames)
      return !temPreOperatorio;
    } else if (filtroStatus === 'concluidos') {
      // Concluídos: COM exames E COM pré-operatório
      return temExames && temPreOperatorio;
    }
    return true;
  });
  
  // Filtrar agendamentos por texto
  const agendamentosFiltradosCompletos = agendamentosPorStatus.filter(ag => {
    if (filtroPaciente) {
      const nomePaciente = (ag.nome_paciente || ag.nome || '').toLowerCase();
      if (!nomePaciente.includes(filtroPaciente.toLowerCase())) return false;
    }
    
    if (filtroDataCirurgia) {
      const dataCirurgia = formatarData(ag.data_agendamento || ag.dataAgendamento).toLowerCase();
      if (!dataCirurgia.includes(filtroDataCirurgia.toLowerCase())) return false;
    }
    
    if (filtroMedico) {
      const medico = (ag.medico || '').toLowerCase();
      if (!medico.includes(filtroMedico.toLowerCase())) return false;
    }
    
    return true;
  });
  
  let agendamentosFiltrados = agruparPorPacienteUnico(agendamentosFiltradosCompletos);
  
  // Ordenar por data de cirurgia
  agendamentosFiltrados = [...agendamentosFiltrados].sort((a, b) => {
    const dataA = a.data_agendamento || a.dataAgendamento || '9999-12-31';
    const dataB = b.data_agendamento || b.dataAgendamento || '9999-12-31';
    return dataA.localeCompare(dataB);
  });
  
  // Total e paginação
  const totalRegistros = agendamentosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
  
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPaciente, filtroDataCirurgia, filtroMedico, filtroStatus]);
  
  useEffect(() => {
    if (tabelaRef.current && paginaAtual > 1) {
      tabelaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [paginaAtual]);
  
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const agendamentosPaginados = agendamentosFiltrados.slice(indexInicio, indexFim);
  
  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroPaciente('');
    setFiltroDataCirurgia('');
    setFiltroMedico('');
  };
  
  const temFiltrosAtivos = filtroStatus !== 'todos' || filtroPaciente || filtroDataCirurgia || filtroMedico;

  // Toggle expandir linha
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

  const isLinhaExpandida = (agendamentoId: string | undefined) => {
    return agendamentoId ? linhasExpandidas.has(agendamentoId) : false;
  };

  // Abrir modal para anexar ficha
  const handleAbrirModal = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    setArquivoFichaSelecionado(null);
    setModalUploadAberto(true);
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
  };

  // Abrir modal para visualizar documentos (aba concluídos)
  const handleAbrirModalVisualizacao = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    
    // Carregar documentos de exames
    try {
      const examesUrls = ag.documentos_urls ? JSON.parse(ag.documentos_urls) : [];
      setDocumentosExames(Array.isArray(examesUrls) ? examesUrls : []);
    } catch {
      setDocumentosExames([]);
    }
    
    // Carregar ficha pré-operatória
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
    
    // Carregar documentos complementares
    try {
      const complementaresUrls = ag.complementares_urls ? JSON.parse(ag.complementares_urls) : [];
      setDocumentosComplementares(Array.isArray(complementaresUrls) ? complementaresUrls : []);
    } catch {
      setDocumentosComplementares([]);
    }
    
    setModalVisualizacaoAberto(true);
  };

  // Upload de Ficha
  const handleUploadFicha = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || !arquivoFichaSelecionado) {
      return;
    }

    setUploading(true);

    try {
      const fileExt = arquivoFichaSelecionado.name.split('.').pop();
      const fileName = `ficha-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `fichas/${agendamentoSelecionado.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Documentos')
        .upload(filePath, arquivoFichaSelecionado, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro ao fazer upload da ficha: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('Documentos')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL do arquivo');
      }

      const updateData: Partial<Agendamento> = {
        ficha_pre_anestesica_url: urlData.publicUrl,
        ficha_pre_anestesica_ok: true,
        ficha_pre_anestesica_data: new Date().toISOString()
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Remover da lista (já tem ficha agora)
      setAgendamentos(prev => prev.filter(ag => ag.id !== agendamentoSelecionado.id));
      
      setArquivoFichaSelecionado(null);
      setFichaAnexada(urlData.publicUrl);
      setModalUploadAberto(false);
      
      success('Ficha pré-anestésica anexada com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toastError(`Erro ao anexar ficha: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Selecionar ficha
  const handleSelecionarFicha = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivoFichaSelecionado(e.target.files[0]);
    }
  };

  // Iniciar avaliação do anestesista
  const handleIniciarAvaliacao = (ag: Agendamento) => {
    setAvaliacaoEmEdicao(ag.id || null);
    setAvaliacaoTipo(ag.avaliacao_anestesista || null);
    setAvaliacaoObservacao(ag.avaliacao_anestesista_observacao || '');
    setAvaliacaoMotivoReprovacao(ag.avaliacao_anestesista_motivo_reprovacao || '');
    setAvaliacaoComplementares(ag.avaliacao_anestesista_complementares || '');
  };

  // Cancelar avaliação
  const handleCancelarAvaliacao = (agendamentoId?: string) => {
    setAvaliacaoEmEdicao(null);
    setAvaliacaoTipo(null);
    setAvaliacaoObservacao('');
    setAvaliacaoMotivoReprovacao('');
    setAvaliacaoComplementares('');
    
    // Recolher a linha se um ID foi fornecido
    if (agendamentoId) {
      setLinhasExpandidas(prev => {
        const novo = new Set(prev);
        novo.delete(agendamentoId);
        return novo;
      });
    }
  };

  // Salvar avaliação do anestesista
  const handleSalvarAvaliacao = async (agendamentoId: string) => {
    if (!avaliacaoTipo) {
      mostrarToast('Selecione o tipo de avaliação (Aprovado, Reprovado ou Complementares)', 'warning');
      return;
    }

    // Validar campos obrigatórios (apenas se houver tipo selecionado e texto digitado)
    if (avaliacaoTipo === 'aprovado' && !avaliacaoObservacao.trim()) {
      mostrarToast('Preencha a observação sobre a aprovação', 'warning');
      return;
    }

    if (avaliacaoTipo === 'reprovado' && !avaliacaoMotivoReprovacao.trim()) {
      mostrarToast('Preencha o motivo da reprovação', 'warning');
      return;
    }

    if (avaliacaoTipo === 'complementares' && !avaliacaoComplementares.trim()) {
      mostrarToast('Preencha as observações complementares', 'warning');
      return;
    }

    setSalvandoAvaliacao(true);
    try {
      console.log('🔍 DEBUG - Iniciando salvamento de avaliação');
      console.log('🔍 DEBUG - ID do agendamento:', agendamentoId);
      console.log('🔍 DEBUG - Tipo de avaliação:', avaliacaoTipo);
      
      const updateData: Partial<Agendamento> = {
        avaliacao_anestesista: avaliacaoTipo,
        avaliacao_anestesista_data: new Date().toISOString()
      };

      // Adicionar campos específicos baseado no tipo
      if (avaliacaoTipo === 'aprovado') {
        updateData.avaliacao_anestesista_observacao = avaliacaoObservacao.trim();
        updateData.avaliacao_anestesista_motivo_reprovacao = null;
        updateData.avaliacao_anestesista_complementares = null;
      } else if (avaliacaoTipo === 'reprovado') {
        updateData.avaliacao_anestesista_motivo_reprovacao = avaliacaoMotivoReprovacao.trim();
        updateData.avaliacao_anestesista_observacao = null;
        updateData.avaliacao_anestesista_complementares = null;
      } else if (avaliacaoTipo === 'complementares') {
        updateData.avaliacao_anestesista_complementares = avaliacaoComplementares.trim();
        updateData.avaliacao_anestesista_observacao = null;
        updateData.avaliacao_anestesista_motivo_reprovacao = null;
      }

      console.log('🔍 DEBUG - Dados que serão enviados:', updateData);

      await agendamentoService.update(agendamentoId, updateData);

      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoId 
          ? { ...ag, ...updateData }
          : ag
      ));

      // Limpar formulário e recolher linha
      handleCancelarAvaliacao(agendamentoId);

      mostrarToast('Avaliação salva com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      mostrarToast(`Erro ao salvar avaliação: ${error.message}`, 'error');
    } finally {
      setSalvandoAvaliacao(false);
    }
  };
  
  // Limpar/Remover avaliação do anestesista
  const handleLimparAvaliacao = async (agendamentoId: string) => {
    setSalvandoAvaliacao(true);
    try {
      const updateData: Partial<Agendamento> = {
        avaliacao_anestesista: null,
        avaliacao_anestesista_observacao: null,
        avaliacao_anestesista_motivo_reprovacao: null,
        avaliacao_anestesista_complementares: null,
        avaliacao_anestesista_data: null
      };

      await agendamentoService.update(agendamentoId, updateData);

      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoId 
          ? { ...ag, ...updateData }
          : ag
      ));

      // Limpar formulário e recolher linha
      handleCancelarAvaliacao(agendamentoId);

      mostrarToast('Avaliação removida com sucesso!', 'info');
    } catch (error: any) {
      console.error('Erro ao limpar avaliação:', error);
      mostrarToast(`Erro ao limpar avaliação: ${error.message}`, 'error');
    } finally {
      setSalvandoAvaliacao(false);
    }
  };

  // Renderizar linha
  const renderizarLinhaAgendamento = (ag: Agendamento) => {
    const expandida = isLinhaExpandida(ag.id);
    const estaEditando = avaliacaoEmEdicao === ag.id;
    
    // Sinalização verde: paciente com exames E ficha pré-anestésica (igual tela Documentação)
    const temExamesEPreOp = ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true;
    
    return (
      <React.Fragment key={ag.id}>
        <tr className={`transition-colors ${
          temExamesEPreOp 
            ? 'bg-green-50/50 hover:bg-green-100/50 border-l-4 border-green-500' 
            : 'hover:bg-gray-50'
        }`}>
          {/* Paciente */}
          <td className="px-4 py-3 w-48">
            <div 
              className="text-sm font-medium text-gray-900 truncate"
              title={ag.nome_paciente || ag.nome || '-'}
            >
              {ag.nome_paciente || ag.nome || '-'}
            </div>
          </td>
          
          {/* Procedimento */}
          <td className="px-4 py-3 w-56">
            <div 
              className="text-sm text-gray-700 truncate"
              title={ag.procedimentos || '-'}
            >
              {ag.procedimentos || '-'}
            </div>
          </td>
          
          {/* Data Cirurgia */}
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 w-32">
            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
          </td>
          
          {/* Médico */}
          <td className="px-4 py-3 w-40">
            <div className="text-sm text-gray-700 truncate" title={ag.medico || '-'}>
              {ag.medico || '-'}
            </div>
          </td>

          {/* COLUNA: Avaliação do Anestesista (3 checkboxes na linha) - REPOSICIONADA */}
          <td className="px-3 py-3 w-56">
            <div className="flex items-center gap-2">
              {/* Checkbox APROVADO */}
              <label 
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all text-xs font-medium ${
                  (estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'aprovado'
                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                    : 'bg-gray-50 text-gray-600 border border-gray-300 hover:border-green-400'
                }`}
                title="Aprovado"
              >
                <input
                  type="radio"
                  name={`avaliacao-linha-${ag.id}`}
                  value="aprovado"
                  checked={(estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'aprovado'}
                  onChange={() => {
                    if (!estaEditando) {
                      handleIniciarAvaliacao(ag);
                      toggleExpandirLinha(ag.id); // Auto-expandir
                    }
                    setAvaliacaoTipo('aprovado');
                  }}
                  className="w-3 h-3"
                />
                <span>✅</span>
              </label>

              {/* Checkbox REPROVADO */}
              <label 
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all text-xs font-medium ${
                  (estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'reprovado'
                    ? 'bg-red-100 text-red-800 border-2 border-red-500'
                    : 'bg-gray-50 text-gray-600 border border-gray-300 hover:border-red-400'
                }`}
                title="Reprovado"
              >
                <input
                  type="radio"
                  name={`avaliacao-linha-${ag.id}`}
                  value="reprovado"
                  checked={(estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'reprovado'}
                  onChange={() => {
                    if (!estaEditando) {
                      handleIniciarAvaliacao(ag);
                      toggleExpandirLinha(ag.id); // Auto-expandir
                    }
                    setAvaliacaoTipo('reprovado');
                  }}
                  className="w-3 h-3"
                />
                <span>❌</span>
              </label>

              {/* Checkbox COMPLEMENTARES */}
              <label 
                className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all text-xs font-medium ${
                  (estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'complementares'
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                    : 'bg-gray-50 text-gray-600 border border-gray-300 hover:border-blue-400'
                }`}
                title="Complementares"
              >
                <input
                  type="radio"
                  name={`avaliacao-linha-${ag.id}`}
                  value="complementares"
                  checked={(estaEditando ? avaliacaoTipo : ag.avaliacao_anestesista) === 'complementares'}
                  onChange={() => {
                    if (!estaEditando) {
                      handleIniciarAvaliacao(ag);
                      toggleExpandirLinha(ag.id); // Auto-expandir
                    }
                    setAvaliacaoTipo('complementares');
                  }}
                  className="w-3 h-3"
                />
                <span>ℹ️</span>
              </label>
            </div>
          </td>
          
          {/* Status Exames */}
          <td className="px-4 py-3 text-center w-32">
            {ag.documentos_ok === true ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Com Exames
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Sem Exames
              </span>
            )}
          </td>
          
          {/* Ação */}
          <td className="px-4 py-3 text-center w-36">
            {/* Se não tem ficha, mostrar botão de anexar. Se tem ficha, mostrar botão de visualizar */}
            {ag.ficha_pre_anestesica_ok !== true ? (
              <button
                onClick={() => handleAbrirModal(ag)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition-colors"
              >
                📋 Anexar Ficha
              </button>
            ) : (
              <button
                onClick={() => handleAbrirModalVisualizacao(ag)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Docs
              </button>
            )}
          </td>
          
          {/* Expandir */}
          <td className="px-2 py-3 whitespace-nowrap text-center w-12">
            <button
              onClick={() => toggleExpandirLinha(ag.id)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
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
        
        {expandida && (
          <tr className="bg-gray-50">
            <td colSpan={8} className="px-4 py-4">
              {/* Dados do Paciente */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Data Consulta</div>
                  <div className="text-sm text-gray-900">{formatarData(ag.data_consulta)}</div>
                </div>
              </div>

              {/* Seção de Avaliação do Anestesista - SIMPLIFICADA */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Observações da Avaliação
                </h4>

                {/* Mostrar avaliação existente (se não estiver em edição) */}
                {ag.avaliacao_anestesista && avaliacaoEmEdicao !== ag.id && (
                  <div className={`p-4 rounded-lg ${
                    ag.avaliacao_anestesista === 'aprovado' ? 'bg-green-50 border-l-4 border-green-500' :
                    ag.avaliacao_anestesista === 'reprovado' ? 'bg-red-50 border-l-4 border-red-500' :
                    'bg-blue-50 border-l-4 border-blue-500'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className={`text-sm font-bold mb-2 ${
                          ag.avaliacao_anestesista === 'aprovado' ? 'text-green-800' :
                          ag.avaliacao_anestesista === 'reprovado' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          {ag.avaliacao_anestesista === 'aprovado' && '✅ APROVADO'}
                          {ag.avaliacao_anestesista === 'reprovado' && '❌ REPROVADO'}
                          {ag.avaliacao_anestesista === 'complementares' && 'ℹ️ OBSERVAÇÕES COMPLEMENTARES'}
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {ag.avaliacao_anestesista === 'aprovado' && ag.avaliacao_anestesista_observacao}
                          {ag.avaliacao_anestesista === 'reprovado' && ag.avaliacao_anestesista_motivo_reprovacao}
                          {ag.avaliacao_anestesista === 'complementares' && ag.avaliacao_anestesista_complementares}
                        </div>
                        {ag.avaliacao_anestesista_data && (
                          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatarData(ag.avaliacao_anestesista_data.split('T')[0])} às {new Date(ag.avaliacao_anestesista_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleIniciarAvaliacao(ag)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário de avaliação (se estiver em edição ou não tiver avaliação) */}
                {(!ag.avaliacao_anestesista || avaliacaoEmEdicao === ag.id) && (
                  <div className="space-y-4">
                    {/* Campos de texto baseados na opção selecionada NA LINHA */}
                    {avaliacaoEmEdicao === ag.id && avaliacaoTipo && (
                      <div className="mt-4">
                        {avaliacaoTipo === 'aprovado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Observações sobre a Aprovação <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={avaliacaoObservacao}
                              onChange={(e) => setAvaliacaoObservacao(e.target.value)}
                              placeholder="Ex: Paciente em boas condições gerais, exames dentro da normalidade..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                            />
                          </div>
                        )}

                        {avaliacaoTipo === 'reprovado' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Motivo da Reprovação <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={avaliacaoMotivoReprovacao}
                              onChange={(e) => setAvaliacaoMotivoReprovacao(e.target.value)}
                              placeholder="Ex: Hipertensão não controlada, exames alterados, necessita avaliação cardiológica..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                            />
                          </div>
                        )}

                        {avaliacaoTipo === 'complementares' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Observações Complementares <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={avaliacaoComplementares}
                              onChange={(e) => setAvaliacaoComplementares(e.target.value)}
                              placeholder="Ex: Solicitar avaliação cardiológica adicional, aguardar resultado de exame pendente..."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            />
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleSalvarAvaliacao(ag.id!)}
                            disabled={salvandoAvaliacao}
                            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {salvandoAvaliacao ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Salvar Avaliação
                              </>
                            )}
                          </button>
                          
                          {/* Botão Limpar: só mostra se já existe avaliação salva */}
                          {ag.avaliacao_anestesista && (
                            <button
                              onClick={() => handleLimparAvaliacao(ag.id!)}
                              disabled={salvandoAvaliacao}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                              title="Remover avaliação completamente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Limpar
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleCancelarAvaliacao(ag.id)}
                            disabled={salvandoAvaliacao}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mensagem inicial se não houver avaliação e não estiver em edição */}
                    {!avaliacaoEmEdicao && !ag.avaliacao_anestesista && (
                      <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="font-medium">Selecione uma das opções na linha acima para avaliar</p>
                        <p className="text-xs text-gray-400 mt-1">(✅ Aprovado / ❌ Reprovado / ℹ️ Complementares)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="p-0">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🩺 Anestesista - Pré-Operatório</h1>
          <p className="text-gray-600">
            Pacientes aguardando ficha pré-anestésica
          </p>
        </div>
        <button
          onClick={carregarAgendamentos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

      {/* Filtros */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro de Status (substituindo abas) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status Ficha Pré-Anestésica</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'pendentes' | 'concluidos')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="todos">🔵 Todos ({totalTodos})</option>
              <option value="pendentes">🟠 Pendentes ({totalPendentes})</option>
              <option value="concluidos">🟢 Concluídos ({totalConcluidos})</option>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Médico</label>
            <input
              type="text"
              value={filtroMedico}
              onChange={(e) => setFiltroMedico(e.target.value)}
              placeholder="Nome do médico..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>
        
        {temFiltrosAtivos && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Mostrando <span className="font-semibold text-gray-800">{agendamentosFiltrados.length}</span> de <span className="font-semibold text-gray-800">{totalTodos}</span> pacientes
              {filtroStatus !== 'todos' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  filtroStatus === 'pendentes' ? 'bg-orange-100 text-orange-800' :
                  filtroStatus === 'concluidos' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {filtroStatus === 'pendentes' && '🟠 Pendentes'}
                  {filtroStatus === 'concluidos' && '🟢 Concluídos'}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Carregando agendamentos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Paginação Superior */}
          {totalRegistros > 0 && (
            <div ref={tabelaRef} className="mb-4 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min(indexInicio + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(indexFim, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes
                    </p>
                    {agendamentosPaginados.length > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
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

                {/* Navegação */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

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
                                ? 'bg-orange-600 text-white'
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
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                      Procedimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Data Cirurgia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Médico
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                      🩺 Avaliação Anestesista
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status Exames
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Ação
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      {/* Expandir */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500 font-medium">
                            {filtroStatus === 'pendentes' && 'Nenhum paciente pendente encontrado'}
                            {filtroStatus === 'concluidos' && 'Nenhum paciente concluído encontrado'}
                            {filtroStatus === 'todos' && 'Nenhum paciente encontrado'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {filtroStatus === 'pendentes' && 'Todos os pacientes já têm ficha pré-anestésica!'}
                            {filtroStatus === 'concluidos' && 'Ainda não há pacientes com exames e pré-operatório completos.'}
                            {filtroStatus === 'todos' && 'Ajuste os filtros ou verifique se há agendamentos cadastrados.'}
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

          {/* Paginação Inferior */}
          {totalRegistros > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-semibold">{Math.min(indexInicio + 1, totalRegistros)}</span> a{' '}
                      <span className="font-semibold">{Math.min(indexFim, totalRegistros)}</span> de{' '}
                      <span className="font-semibold">{totalRegistros}</span> pacientes
                    </p>
                    {agendamentosPaginados.length > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

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
                                ? 'bg-orange-600 text-white'
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
        </>
      )}

      {/* Modal de Upload */}
      <Modal
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setArquivoFichaSelecionado(null);
          setAgendamentoSelecionado(null);
        }}
        title={`📋 Ficha Pré-Anestésica - ${agendamentoSelecionado?.nome_paciente || 'Paciente'}`}
        size="medium"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-lg">
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

          {fichaAnexada ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Ficha já anexada:</h3>
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
              </div>
            </div>
          ) : (
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
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors text-center"
              >
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Clique para selecionar ficha pré-anestésica</p>
                <p className="text-xs text-gray-400 mt-1">PDF</p>
              </button>

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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
      </Modal>

      {/* Modal de Visualização de Documentos */}
      <Modal
        isOpen={modalVisualizacaoAberto}
        onClose={() => {
          setModalVisualizacaoAberto(false);
          setAgendamentoSelecionado(null);
          setDocumentosExames([]);
          setDocumentosComplementares([]);
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

          {/* Seção de Exames */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              🩺 Exames
            </h3>
            {documentosExames.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documentosExames.map((url, index) => {
                  const fileName = url.split('/').pop() || `Exame ${index + 1}`;
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
              <p className="text-sm text-gray-500 italic">Nenhum exame anexado</p>
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
            {documentosComplementares.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documentosComplementares.map((url, index) => {
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
                setDocumentosExames([]);
                setDocumentosComplementares([]);
                setFichaAnexada(null);
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Sistema de Toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removerToast} />
    </div>
  );
};

export default AnestesiaView;

