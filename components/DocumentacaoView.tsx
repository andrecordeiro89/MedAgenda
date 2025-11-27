import React, { useState, useEffect, useRef } from 'react';
import { agendamentoService, supabase } from '../services/supabase';
import { Agendamento, StatusLiberacao } from '../types';
import { Button, Modal } from './ui';

export const DocumentacaoView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar linhas expandidas
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());
  
  // Estado para controlar agrupamento por status
  const [agruparPorStatus, setAgruparPorStatus] = useState(false);
  
  // Estado para controlar ordenação por anestesista
  const [ordenarPorAnestesista, setOrdenarPorAnestesista] = useState(false);
  
  // ⚠️ NOVO: Estado para controlar agrupamento por paciente único
  const [agruparPorPaciente, setAgruparPorPaciente] = useState(false);
  
  // Estados para filtros de busca
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroDataConsulta, setFiltroDataConsulta] = useState<string>('');
  const [filtroDataCirurgia, setFiltroDataCirurgia] = useState<string>('');
  const [filtroMedico, setFiltroMedico] = useState<string>('');
  
  // Estados do modal
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [modalVisualizacaoAberto, setModalVisualizacaoAberto] = useState(false);
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
      
      // ⚠️ DEBUG: Análise detalhada do filtro
      const totalOriginal = dados.length;
      const totalFiltrado = agendamentosFiltrados.length;
      const totalExcluidos = totalOriginal - totalFiltrado;
      
      console.log('📋 FILTRO DE GRADE CIRÚRGICA:');
      console.log(`  Total original: ${totalOriginal}`);
      console.log(`  Total após filtro: ${totalFiltrado}`);
      console.log(`  Total excluídos: ${totalExcluidos}`);
      
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
      
      setAgendamentos(agendamentosFiltrados);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status do paciente - SIMPLIFICADO (2 status apenas)
  const getStatusPaciente = (ag: Agendamento) => {
    const temExames = ag.documentos_ok === true;
    
    if (temExames) return { texto: 'COM EXAMES', cor: 'bg-green-100 text-green-800', grupo: 'com_exames' };
    return { texto: 'SEM EXAMES', cor: 'bg-red-100 text-red-800', grupo: 'sem_exames' };
  };
  
  // Função para obter status dos checkboxes (semáforo)
  const getCheckboxesStatus = (ag: Agendamento) => {
    return {
      exames: ag.documentos_ok === true,
      preOperatorio: ag.ficha_pre_anestesica_ok === true,
      complementares: ag.complementares_ok === true // Novo campo
    };
  };

  // Formatar data
  const formatarData = (data: string | null | undefined) => {
    if (!data || data === '2000-01-01') return '-';
    const dataStr = String(data).trim();
    if (dataStr === '' || dataStr === 'null' || dataStr === 'undefined') return '-';
    try {
      // Se já está no formato brasileiro, retornar como está
      if (dataStr.includes('/')) return dataStr;
      // Converter de YYYY-MM-DD para DD/MM/YYYY
      const date = new Date(dataStr + 'T00:00:00');
      if (isNaN(date.getTime())) return dataStr;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dataStr || '-';
    }
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
    // Filtro por status específico
    if (filtroStatus) {
      const status = getStatusPaciente(ag);
      // Comparação exata (case-insensitive)
      if (status.texto.toUpperCase() !== filtroStatus.toUpperCase()) return false;
    }
    
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
    
    return true;
  });
  
  // AGRUPAR POR PACIENTE ÚNICO (mostrar apenas 1 linha por paciente)
  // ⚠️ MODIFICADO: Agora é opcional (controlado por toggle)
  let agendamentosFiltrados = agruparPorPaciente 
    ? agruparPorPacienteUnico(agendamentosFiltradosCompletos)
    : agendamentosFiltradosCompletos;
  
  // ORDENAR POR DATA DE CIRURGIA (cirurgias mais próximas primeiro)
  agendamentosFiltrados = [...agendamentosFiltrados].sort((a, b) => {
    const dataA = a.data_agendamento || a.dataAgendamento || '9999-12-31';
    const dataB = b.data_agendamento || b.dataAgendamento || '9999-12-31';
    
    // Se ordenar por anestesista está ativo, usar essa ordenação como secundária
    if (ordenarPorAnestesista) {
      const statusA = a.status_liberacao || 'anestesista';
      const statusB = b.status_liberacao || 'anestesista';
      
      const prioridade: Record<string, number> = {
        'liberado': 1,
        'exames': 2,
        'cardio': 3,
        'anestesista': 4
      };
      
      const prioridadeA = prioridade[statusA] || 999;
      const prioridadeB = prioridade[statusB] || 999;
      
      // Se prioridades diferentes, ordenar por prioridade
      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }
    }
    
    // Ordenar por data (mais próxima primeiro)
    return dataA.localeCompare(dataB);
  });
  
  // Total de registros (antes da paginação)
  const totalRegistros = agendamentosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);
  
  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, filtroPaciente, filtroDataConsulta, filtroDataCirurgia, filtroMedico]);
  
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
    setFiltroDataConsulta('');
    setFiltroDataCirurgia('');
    setFiltroMedico('');
  };
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroStatus || filtroPaciente || filtroDataConsulta || filtroDataCirurgia || filtroMedico;

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

    setUploading(true);
    const urlsUploaded: string[] = [];

    try {
      // Upload de cada arquivo
      for (const arquivo of arquivosDocumentosSelecionados) {
        // Criar caminho: documentos/{agendamento_id}/{nome_arquivo}
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `documentos/${agendamentoSelecionado.id}/${fileName}`;

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

      // Atualizar banco de dados
      const updateData: Partial<Agendamento> = {
        documentos_urls: JSON.stringify(todasUrls),
        documentos_ok: todasUrls.length > 0,
        documentos_data: new Date().toISOString()
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
      
      alert('✅ Exames anexados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`❌ Erro ao anexar documentos: ${error.message}`);
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
      alert('⚠️ É necessário anexar os exames primeiro!');
      setAbaAtiva('documentos');
      return;
    }

    setUploading(true);

    try {
      // Criar caminho: fichas/{agendamento_id}/{nome_arquivo}
      const fileExt = arquivoFichaSelecionado.name.split('.').pop();
      const fileName = `ficha-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `fichas/${agendamentoSelecionado.id}/${fileName}`;

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
      
      alert('✅ Ficha pré-anestésica anexada com sucesso! Paciente liberado para cirurgia!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`❌ Erro ao anexar ficha: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Remover documento anexado
  const handleRemoverDocumentoAnexado = async (url: string) => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id) return;

    if (!confirm('Tem certeza que deseja remover este documento?')) return;

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
      const updateData: Partial<Agendamento> = {
        documentos_urls: novasUrls.length > 0 ? JSON.stringify(novasUrls) : null,
        documentos_ok: novasUrls.length > 0,
        documentos_data: novasUrls.length > 0 ? new Date().toISOString() : null
      };

      await agendamentoService.update(agendamentoSelecionado.id, updateData);

      // Atualizar estado
      setDocumentosAnexados(novasUrls);
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoSelecionado.id
          ? { ...ag, ...updateData }
          : ag
      ));

      alert('✅ Documento removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover documento:', error);
      alert(`❌ Erro ao remover documento: ${error.message}`);
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
        <tr className={`transition-colors ${
          temExamesEPreOp 
            ? 'bg-green-50/50 hover:bg-green-100/50 border-l-4 border-green-500' 
            : 'hover:bg-gray-50'
        }`}>
          {/* Paciente */}
          <td className="px-4 py-3 w-48">
            <div className="flex items-center gap-2">
              <div 
                className="text-sm font-medium text-gray-900 truncate flex-1"
                title={ag.nome_paciente || ag.nome || '-'}
              >
                {ag.nome_paciente || ag.nome || '-'}
              </div>
              {/* ⚠️ NOVO: Indicador de registros agrupados */}
              {agruparPorPaciente && (() => {
                const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
                const totalRegistros = agendamentosFiltradosCompletos.filter(a => 
                  (a.nome_paciente || a.nome || '').trim().toLowerCase() === nomePaciente
                ).length;
                
                if (totalRegistros > 1) {
                  return (
                    <span 
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-300"
                      title={`Este paciente tem ${totalRegistros} registros no total. Apenas o mais recente está sendo exibido.`}
                    >
                      +{totalRegistros - 1}
                    </span>
                  );
                }
                return null;
              })()}
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
          
          {/* Data Consulta */}
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 w-32">
            {formatarData(ag.data_consulta)}
          </td>
          
          {/* Data Cirurgia */}
          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 w-32">
            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
          </td>
          
          {/* Status */}
          <td className="px-6 py-3 whitespace-nowrap w-36">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${status.cor}`}>
              {status.texto}
            </span>
          </td>
          
          {/* Documentação - SEMÁFORO COM CHECKBOXES */}
          <td className="px-6 py-3 w-64">
            <div className="flex items-center gap-2 justify-start flex-nowrap overflow-hidden">
              {/* Checkbox 1: EXAMES */}
              <div className="flex items-center gap-1">
                <div 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    ag.documentos_ok === true 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {ag.documentos_ok === true && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAbaAtiva('documentos');
                    handleAbrirModalUpload(ag);
                  }}
                  className={`text-[11px] font-semibold cursor-pointer hover:underline transition-colors ${
                    ag.documentos_ok === true ? 'text-green-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Clique para anexar/ver exames"
                >
                  🩺 Exames
                </button>
              </div>
              
              {/* Separador */}
              <div className="h-3 w-px bg-gray-300"></div>
              
              {/* Checkbox 2: PRÉ-OPERATÓRIO */}
              <div className="flex items-center gap-1">
                <div 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    ag.ficha_pre_anestesica_ok === true 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {ag.ficha_pre_anestesica_ok === true && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAbaAtiva('ficha');
                    handleAbrirModalUpload(ag);
                  }}
                  className={`text-[11px] font-semibold cursor-pointer hover:underline transition-colors ${
                    ag.ficha_pre_anestesica_ok === true ? 'text-green-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Clique para anexar/ver pré-operatório"
                >
                  📋 Pré-op
                </button>
              </div>
              
              {/* Separador */}
              <div className="h-3 w-px bg-gray-300"></div>
              
              {/* Checkbox 3: COMPLEMENTARES */}
              <div className="flex items-center gap-1">
                <div 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    ag.complementares_ok === true 
                      ? 'bg-green-500 border-green-600' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {ag.complementares_ok === true && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAbaAtiva('complementares');
                    handleAbrirModalUpload(ag);
                  }}
                  className={`text-[11px] font-semibold cursor-pointer hover:underline transition-colors ${
                    ag.complementares_ok === true ? 'text-green-700' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  title="Clique para anexar/ver complementares"
                >
                  📁 Comp.
                </button>
              </div>
              
              {/* Separador */}
              <div className="h-3 w-px bg-gray-300"></div>
              
              {/* Botão Ver Documentos */}
              {(() => {
                // Verificar se há algum documento anexado
                const temExames = ag.documentos_ok === true;
                const temFicha = ag.ficha_pre_anestesica_ok === true;
                const temComplementares = ag.complementares_ok === true;
                const temAlgumDocumento = temExames || temFicha || temComplementares;
                
                return (
                  <button
                    onClick={() => temAlgumDocumento && handleAbrirModalVisualizacao(ag)}
                    disabled={!temAlgumDocumento}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                      temAlgumDocumento
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer'
                        : 'bg-transparent text-gray-300 cursor-default opacity-50 italic'
                    }`}
                    title={temAlgumDocumento ? 'Ver todos os documentos' : 'Nenhum documento anexado'}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver
                  </button>
                );
              })()}
            </div>
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
           <tr className={temExamesEPreOp ? 'bg-green-50/50' : 'bg-gray-50'}>
             <td colSpan={7} className="px-4 py-4">
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
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Atualizar status de liberação
  const handleAtualizarStatusLiberacao = async (agendamentoId: string | undefined, novoStatus: StatusLiberacao) => {
    if (!agendamentoId) return;
    
    try {
      await agendamentoService.update(agendamentoId, {
        status_liberacao: novoStatus
      });
      
      // Atualizar estado local
      setAgendamentos(prev => prev.map(ag => 
        ag.id === agendamentoId
          ? { ...ag, status_liberacao: novoStatus }
          : ag
      ));
    } catch (error: any) {
      console.error('Erro ao atualizar status de liberação:', error);
      alert(`❌ Erro ao atualizar status: ${error.message}`);
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
      alert(`❌ Erro ao atualizar confirmação: ${error.message}`);
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
      // Upload de cada arquivo
      for (const arquivo of arquivosComplementaresSelecionados) {
        // Criar caminho: complementares/{agendamento_id}/{nome_arquivo}
        const fileExt = arquivo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `complementares/${agendamentoSelecionado.id}/${fileName}`;

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
      
      alert('✅ Complementares anexados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`❌ Erro ao anexar complementares: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Remover complementar anexado (NOVO)
  const handleRemoverComplementarAnexado = async (url: string) => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id) return;

    if (!confirm('Tem certeza que deseja remover este documento complementar?')) return;

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

      alert('✅ Documento complementar removido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover complementar:', error);
      alert(`❌ Erro ao remover complementar: ${error.message}`);
    }
  };
  
  // Remover ficha pré-anestésica
  const handleRemoverFicha = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || !fichaAnexada) return;

    if (!confirm('Tem certeza que deseja remover a ficha pré-operatória?')) return;

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

      alert('✅ Ficha pré-operatória removida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover ficha:', error);
      alert(`❌ Erro ao remover ficha: ${error.message}`);
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
          <div className="flex items-center gap-3">
            {/* ⚠️ NOVO: Toggle para agrupar por paciente */}
            <button
              onClick={() => setAgruparPorPaciente(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                agruparPorPaciente
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
              title={agruparPorPaciente ? 'Mostrando 1 linha por paciente (clique para ver todos os registros)' : 'Mostrando todos os registros (clique para agrupar por paciente)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {agruparPorPaciente ? 'Paciente Único' : 'Todos Registros'}
              {agruparPorPaciente && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded text-[10px] font-bold">
                  ON
                </span>
              )}
            </button>
            
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filtro Status - DESTACADO */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              📊 Status da Documentação
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
              <option value="">
                Todos ({(() => {
                  const pacientes = new Set<string>();
                  agendamentos.forEach(a => {
                    const nomePaciente = (a.nome_paciente || a.nome || '').trim();
                    if (nomePaciente && nomePaciente !== '') {
                      pacientes.add(nomePaciente.toLowerCase());
                    }
                  });
                  return pacientes.size;
                })()})
              </option>
              <option value="SEM EXAMES">
                Sem Exames ({(() => {
                  const pacientes = new Set<string>();
                  agendamentos
                    .filter(a => !(a.documentos_ok === true))
                    .forEach(a => {
                      const nomePaciente = (a.nome_paciente || a.nome || '').trim();
                      if (nomePaciente && nomePaciente !== '') {
                        pacientes.add(nomePaciente.toLowerCase());
                      }
                    });
                  return pacientes.size;
                })()})
              </option>
              <option value="COM EXAMES">
                Com Exames ({(() => {
                  const pacientes = new Set<string>();
                  agendamentos
                    .filter(a => a.documentos_ok === true)
                    .forEach(a => {
                      const nomePaciente = (a.nome_paciente || a.nome || '').trim();
                      if (nomePaciente && nomePaciente !== '') {
                        pacientes.add(nomePaciente.toLowerCase());
                      }
                    });
                  return pacientes.size;
                })()})
              </option>
            </select>
          </div>
          
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
        </div>
        
        {/* Indicador de resultados filtrados */}
        {(temFiltrosAtivos || agruparPorPaciente) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {agruparPorPaciente && (
              <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  ⚠️ Modo "Paciente Único" ativo: Mostrando apenas 1 linha por paciente. Pacientes com múltiplos procedimentos terão outros registros ocultos.
                  <button
                    onClick={() => setAgruparPorPaciente(false)}
                    className="ml-2 px-2 py-0.5 bg-yellow-600 text-white text-[10px] font-bold rounded hover:bg-yellow-700"
                  >
                    Ver Todos
                  </button>
                </p>
              </div>
            )}
            <p className="text-xs text-gray-600">
              Mostrando <span className="font-semibold text-gray-800">{agendamentosFiltrados.length}</span> {agruparPorPaciente ? 'paciente(s)' : 'registro(s)'} de <span className="font-semibold text-gray-800">{agendamentosFiltradosCompletos.length}</span> total
              {agruparPorPaciente && agendamentosFiltrados.length !== agendamentosFiltradosCompletos.length && (
                <span className="ml-1 text-red-600 font-bold">
                  ({agendamentosFiltradosCompletos.length - agendamentosFiltrados.length} registros ocultos pelo agrupamento)
                </span>
              )}
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
          {!agruparPorStatus && totalRegistros > 0 && (
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
              <table className="w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                      Procedimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Data Consulta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Data Cirurgia
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-36"
                      onClick={toggleAgruparPorStatus}
                      title={agruparPorStatus ? 'Clique para desagrupar' : 'Clique para agrupar por status'}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {agruparPorStatus && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-xs">📋 DOCUMENTAÇÃO</span>
                        <span className="text-[9px] text-gray-500 font-normal normal-case">(Clique nos itens)</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      {/* Botão expandir */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const grupos = agendamentosAgrupados();
                    
                    // Se não está agrupado
                    if (!agruparPorStatus) {
                      const lista = grupos.semGrupo || [];
                      if (lista.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 font-medium">Nenhum agendamento encontrado</p>
                                <p className="text-sm text-gray-400">
                                  {filtroStatus 
                                    ? `Não há pacientes com status "${filtroStatus}".` 
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
                            <td colSpan={7} className="px-4 py-3">
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
        }}
        title={`📎 Documentação - ${agendamentoSelecionado?.nome_paciente || 'Paciente'}`}
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
                🩺 Exames {agendamentoSelecionado?.documentos_ok && '✓'}
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
              <button
                onClick={() => setAbaAtiva('complementares')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'complementares'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📎 Complementares {agendamentoSelecionado?.complementares_ok && '✓'}
              </button>
            </nav>
          </div>

          {/* Conteúdo da Aba: Exames */}
          {abaAtiva === 'documentos' && (
            <div className="space-y-4">
              {/* Exames já anexados */}
              {documentosAnexados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">🩺 Exames já anexados:</h3>
                  <div className="space-y-2">
                    {documentosAnexados.map((url, index) => {
                      const fileName = url.split('/').pop() || `Documento ${index + 1}`;
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
                          <button
                            onClick={() => handleRemoverDocumentoAnexado(url)}
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

              {/* Área de Upload de Exames */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Adicionar novos exames:</h3>
                
                <input
                  ref={fileInputDocumentosRef}
                  type="file"
                  multiple
                  onChange={handleSelecionarDocumentos}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                <button
                  onClick={() => fileInputDocumentosRef.current?.click()}
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
                  </div>
                )}
              </div>

              {/* Botões de ação - Documentos */}
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
                  disabled={uploading || arquivosDocumentosSelecionados.length === 0}
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
                      Anexar Exames
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
                      onClick={handleRemoverFicha}
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
          
          {/* Conteúdo da Aba: Complementares (NOVO) */}
          {abaAtiva === 'complementares' && (
            <div className="space-y-4">
              {/* Complementares já anexados */}
              {complementaresAnexados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📎 Complementares já anexados:</h3>
                  <div className="space-y-2">
                    {complementaresAnexados.map((url, index) => {
                      const fileName = url.split('/').pop() || `Documento ${index + 1}`;
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
                          <button
                            onClick={() => handleRemoverComplementarAnexado(url)}
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

              {/* Área de Upload de Complementares */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Adicionar documentos complementares:</h3>
                
                <input
                  ref={fileInputComplementaresRef}
                  type="file"
                  multiple
                  onChange={handleSelecionarComplementares}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />

                <button
                  onClick={() => fileInputComplementaresRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors text-center"
                >
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Clique para selecionar arquivos complementares</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX</p>
                </button>

                {/* Lista de arquivos selecionados */}
                {arquivosComplementaresSelecionados.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                    {arquivosComplementaresSelecionados.map((arquivo, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 flex-1">{arquivo.name}</span>
                        <span className="text-xs text-gray-500 mr-2">
                          {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          onClick={() => handleRemoverComplementar(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de ação - Complementares */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setModalUploadAberto(false);
                    setArquivosComplementaresSelecionados([]);
                    setAgendamentoSelecionado(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadComplementares}
                  disabled={uploading || arquivosComplementaresSelecionados.length === 0}
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
                      Anexar Complementares
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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

          {/* Seção de Exames */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              🩺 Exames
            </h3>
            {documentosAnexados.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documentosAnexados.map((url, index) => {
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
    </div>
  );
};

export default DocumentacaoView;

