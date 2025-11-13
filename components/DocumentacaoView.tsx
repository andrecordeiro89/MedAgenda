import React, { useState, useEffect, useRef } from 'react';
import { agendamentoService, supabase } from '../services/supabase';
import { Agendamento, StatusLiberacao } from '../types';
import { Button, Modal } from './ui';

export const DocumentacaoView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'liberados'>('todos');
  
  // Estado para controlar linhas expandidas
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());
  
  // Estado para controlar agrupamento por status
  const [agruparPorStatus, setAgruparPorStatus] = useState(false);
  
  // Estados para filtros de busca
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroDataConsulta, setFiltroDataConsulta] = useState<string>('');
  const [filtroDataCirurgia, setFiltroDataCirurgia] = useState<string>('');
  const [filtroMedico, setFiltroMedico] = useState<string>('');
  
  // Estados do modal de upload
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'documentos' | 'ficha'>('documentos');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  
  // Estados para Documentos (Recepção)
  const [arquivosDocumentosSelecionados, setArquivosDocumentosSelecionados] = useState<File[]>([]);
  const [documentosAnexados, setDocumentosAnexados] = useState<string[]>([]);
  const fileInputDocumentosRef = useRef<HTMLInputElement>(null);
  
  // Estados para Ficha Pré-Anestésica (Anestesista)
  const [arquivoFichaSelecionado, setArquivoFichaSelecionado] = useState<File | null>(null);
  const [fichaAnexada, setFichaAnexada] = useState<string | null>(null);
  const fileInputFichaRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);

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
      // Registros de grade: is_grade_cirurgica = true OU (procedimentos IS NULL E nome_paciente = '')
      const agendamentosFiltrados = dados.filter(ag => {
        // Se tem flag is_grade_cirurgica = true, excluir
        if (ag.is_grade_cirurgica === true) {
          return false;
        }
        // Se não tem procedimentos E não tem nome_paciente, é linha de grade (compatibilidade)
        if ((!ag.procedimentos || ag.procedimentos.trim() === '') && 
            (!ag.nome_paciente || ag.nome_paciente.trim() === '')) {
          return false;
        }
        return true;
      });
      
      console.log('📋 Agendamentos após filtrar grade cirúrgica:', agendamentosFiltrados.length);
      setAgendamentos(agendamentosFiltrados);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status do paciente
  const getStatusPaciente = (ag: Agendamento) => {
    const temDocs = ag.documentos_ok === true;
    const temFicha = ag.ficha_pre_anestesica_ok === true;
    
    if (temDocs && temFicha) return { texto: 'LIBERADO', cor: 'bg-green-100 text-green-800', grupo: 'liberado' };
    if (temDocs && !temFicha) return { texto: 'AGUARDANDO FICHA', cor: 'bg-yellow-100 text-yellow-800', grupo: 'aguardando_ficha' };
    if (!temDocs) return { texto: 'AGUARDANDO DOCS', cor: 'bg-red-100 text-red-800', grupo: 'aguardando_docs' };
    return { texto: 'PENDENTE', cor: 'bg-gray-100 text-gray-800', grupo: 'aguardando_docs' };
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

  // Filtrar agendamentos
  const agendamentosFiltrados = agendamentos.filter(ag => {
    // Filtro por status geral (Todos, Pendentes, Liberados)
    if (filtro === 'pendentes') {
      const pendente = !(ag.documentos_ok === true) || !(ag.ficha_pre_anestesica_ok === true);
      if (!pendente) return false;
    }
    if (filtro === 'liberados') {
      const liberado = ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true;
      if (!liberado) return false;
    }
    
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
      return { semGrupo: agendamentosFiltrados };
    }

    const grupos: Record<string, Agendamento[]> = {
      aguardando_docs: [],
      aguardando_ficha: [],
      liberado: []
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

  // Abrir modal de upload
  const handleAbrirModalUpload = async (ag: Agendamento) => {
    setAgendamentoSelecionado(ag);
    setArquivosDocumentosSelecionados([]);
    setArquivoFichaSelecionado(null);
    setAbaAtiva('documentos');
    setModalUploadAberto(true);
    
    // Carregar documentos já anexados
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
    
    // Carregar ficha pré-anestésica já anexada
    setFichaAnexada(ag.ficha_pre_anestesica_url || null);
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
      
      alert('✅ Documentos anexados com sucesso!');
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

    // Verificar se documentos estão OK
    if (!agendamentoSelecionado.documentos_ok) {
      alert('⚠️ É necessário anexar os documentos primeiro!');
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
    
    return (
      <React.Fragment key={ag.id}>
        {/* Linha principal */}
        <tr className="hover:bg-gray-50">
          {/* Status */}
          <td className="px-4 py-4 whitespace-nowrap">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${status.cor}`}>
              {status.texto}
            </span>
          </td>
        
          {/* Paciente */}
          <td className="px-4 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">
              {ag.nome_paciente || ag.nome || '-'}
            </div>
          </td>
          
          {/* Data Consulta */}
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatarData(ag.data_consulta)}
          </td>
          
          {/* Data Cirurgia */}
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
          </td>
          
          {/* Status Liberação */}
          <td className="px-4 py-4 whitespace-nowrap">
            <select
              value={ag.status_liberacao || 'anestesista'}
              onChange={(e) => handleAtualizarStatusLiberacao(ag.id, e.target.value as StatusLiberacao)}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              title="Status de liberação do paciente"
            >
              <option value="anestesista">Anestesista</option>
              <option value="cardio">Cardio</option>
              <option value="exames">Exames</option>
              <option value="liberado">Liberado</option>
            </select>
          </td>
          
          {/* Confirmação */}
          <td className="px-4 py-4 whitespace-nowrap">
            <select
              value={ag.confirmacao || 'Aguardando'}
              onChange={(e) => handleAtualizarConfirmacao(ag.id, e.target.value)}
              className={`text-xs px-2 py-1 border-2 rounded focus:outline-none focus:ring-1 bg-white ${
                (ag.confirmacao || 'Aguardando') === 'Confirmado'
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:ring-red-500'
              }`}
              title="Status de confirmação do paciente"
            >
              <option value="Aguardando">Aguardando</option>
              <option value="Confirmado">Confirmado</option>
            </select>
          </td>
          
          {/* Ações */}
          <td className="px-4 py-4 whitespace-nowrap text-sm">
            <div className="flex flex-col gap-2">
              {/* Documentos Recepção */}
              <div className="flex items-center gap-2">
                {ag.documentos_ok === true ? (
                  <button
                    onClick={() => handleAbrirModalUpload(ag)}
                    className="text-green-600 text-xs flex items-center gap-1 hover:underline cursor-pointer"
                    title="Ver/Adicionar documentos"
                  >
                    ✓ Docs OK
                  </button>
                ) : (
                  <button
                    onClick={() => handleAbrirModalUpload(ag)}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📎 Anexar Docs
                  </button>
                )}
              </div>
              
              {/* Ficha Pré-Anestésica */}
              <div className="flex items-center gap-2">
                {ag.ficha_pre_anestesica_ok === true ? (
                  <button
                    onClick={() => {
                      setAbaAtiva('ficha');
                      handleAbrirModalUpload(ag);
                    }}
                    className="text-green-600 text-xs flex items-center gap-1 hover:underline cursor-pointer"
                    title="Ver ficha pré-anestésica"
                  >
                    ✓ Ficha OK
                  </button>
                ) : ag.documentos_ok === true ? (
                  <button
                    onClick={() => {
                      setAbaAtiva('ficha');
                      handleAbrirModalUpload(ag);
                    }}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    📋 Anexar Ficha
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Aguardando docs</span>
                )}
              </div>
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

  // Remover ficha pré-anestésica
  const handleRemoverFicha = async () => {
    if (!agendamentoSelecionado || !agendamentoSelecionado.id || !fichaAnexada) return;

    if (!confirm('Tem certeza que deseja remover a ficha pré-anestésica?')) return;

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

      alert('✅ Ficha pré-anestésica removida com sucesso!');
    } catch (error: any) {
      console.error('Erro ao remover ficha:', error);
      alert(`❌ Erro ao remover ficha: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Documentação Pré-Cirúrgica</h1>
          <p className="text-gray-600">
            Gerenciamento de documentos e fichas pré-anestésicas dos pacientes
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

      {/* Filtros Rápidos */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({agendamentos.length})
        </button>
        <button
          onClick={() => setFiltro('pendentes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'pendentes'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendentes ({agendamentos.filter(a => !(a.documentos_ok === true) || !(a.ficha_pre_anestesica_ok === true)).length})
        </button>
        <button
          onClick={() => setFiltro('liberados')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtro === 'liberados'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Liberados ({agendamentos.filter(a => a.documentos_ok === true && a.ficha_pre_anestesica_ok === true).length})
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option value="">Todos os status</option>
              <option value="AGUARDANDO DOCS">Aguardando Docs</option>
              <option value="AGUARDANDO FICHA">Aguardando Ficha</option>
              <option value="LIBERADO">Liberado</option>
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
        {temFiltrosAtivos && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Mostrando <span className="font-semibold text-gray-800">{agendamentosFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentos.length}</span> agendamentos
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
          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Consulta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cirurgia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anestesista
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmação
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
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
                            <td colSpan={8} className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 font-medium">Nenhum agendamento encontrado</p>
                                <p className="text-sm text-gray-400">
                                  {filtro === 'todos' 
                                    ? 'Não há pacientes agendados no sistema.' 
                                    : filtro === 'pendentes'
                                    ? 'Não há pacientes pendentes de documentação.'
                                    : 'Não há pacientes liberados para cirurgia.'}
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
                      { chave: 'aguardando_docs', titulo: 'Aguardando Docs', cor: 'bg-red-50 border-red-200' },
                      { chave: 'aguardando_ficha', titulo: 'Aguardando Ficha', cor: 'bg-yellow-50 border-yellow-200' },
                      { chave: 'liberado', titulo: 'Liberado', cor: 'bg-green-50 border-green-200' }
                    ];
                    
                    return gruposOrdenados.map((grupoInfo) => {
                      const agendamentosGrupo = grupos[grupoInfo.chave] || [];
                      if (agendamentosGrupo.length === 0) return null;
                      
                      return (
                        <React.Fragment key={grupoInfo.chave}>
                          {/* Cabeçalho do grupo */}
                          <tr className={`${grupoInfo.cor} border-t-2 border-b-2`}>
                            <td colSpan={8} className="px-4 py-3">
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

          {/* Legenda */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📌 Fluxo de Documentação:</h3>
            <ol className="space-y-1 text-sm text-gray-700">
              <li>1️⃣ <strong>Recepção:</strong> Anexa exames (ECG, laboratoriais, etc.) → Marca "Docs OK"</li>
              <li>2️⃣ <strong>Anestesista:</strong> Vê os exames → Faz ficha pré-anestésica → Anexa → Marca "Ficha OK"</li>
              <li>3️⃣ <strong>Liberado:</strong> Paciente apto para cirurgia! ✅</li>
            </ol>
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
                📄 Documentos {agendamentoSelecionado?.documentos_ok && '✓'}
              </button>
              <button
                onClick={() => {
                  if (agendamentoSelecionado?.documentos_ok) {
                    setAbaAtiva('ficha');
                  } else {
                    alert('⚠️ É necessário anexar os documentos primeiro!');
                  }
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  abaAtiva === 'ficha'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } ${!agendamentoSelecionado?.documentos_ok ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!agendamentoSelecionado?.documentos_ok}
              >
                📋 Ficha Pré-Anestésica {agendamentoSelecionado?.ficha_pre_anestesica_ok && '✓'}
              </button>
            </nav>
          </div>

          {/* Conteúdo da Aba: Documentos */}
          {abaAtiva === 'documentos' && (
            <div className="space-y-4">
              {/* Documentos já anexados */}
              {documentosAnexados.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📄 Documentos já anexados:</h3>
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

              {/* Área de Upload de Documentos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📤 Adicionar novos documentos:</h3>
                
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
                      Anexar Documentos
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
        </div>
      </Modal>
    </div>
  );
};

export default DocumentacaoView;

