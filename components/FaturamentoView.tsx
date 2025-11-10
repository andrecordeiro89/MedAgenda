import React, { useState, useEffect } from 'react';
import { agendamentoService } from '../services/supabase';
import { Agendamento } from '../types';
import JSZip from 'jszip';

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

  // Carregar agendamentos
  useEffect(() => {
    carregarAgendamentos();
  }, [hospitalId]);

  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const dados = await agendamentoService.getAll(hospitalId);
      console.log('💰 Agendamentos carregados para faturamento:', dados);
      
      // Filtrar registros de grade cirúrgica (não devem aparecer na tela de Faturamento)
      const semGradeCirurgica = dados.filter(ag => {
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
      
      // Filtrar liberados e aguardando ficha (documentos OK)
      const paraFaturamento = semGradeCirurgica.filter(ag => 
        ag.documentos_ok === true // Tem documentos OK (pode estar liberado ou aguardando ficha)
      );
      
      const liberados = paraFaturamento.filter(ag => ag.ficha_pre_anestesica_ok === true).length;
      const aguardandoFicha = paraFaturamento.filter(ag => !(ag.ficha_pre_anestesica_ok === true)).length;
      
      console.log('✅ Total para faturamento:', paraFaturamento.length);
      console.log('   - Liberados:', liberados);
      console.log('   - Aguardando Ficha:', aguardandoFicha);
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
    try {
      if (dataStr.includes('/')) return dataStr;
      const date = new Date(dataStr + 'T00:00:00');
      if (isNaN(date.getTime())) return dataStr;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dataStr || '-';
    }
  };

  // Filtrar agendamentos
  const agendamentosFiltrados = agendamentos.filter(ag => {
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
    setFiltroPaciente('');
    setFiltroDataConsulta('');
    setFiltroDataCirurgia('');
    setFiltroMedico('');
  };
  
  // Verificar se há filtros ativos
  const temFiltrosAtivos = filtroPaciente || filtroDataConsulta || filtroDataCirurgia || filtroMedico;

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
        alert('⚠️ Nenhum documento disponível para download');
        setDownloading(null);
        return;
      }
      
      // Se não tem ficha, avisar mas permitir download dos documentos
      if (!temFicha) {
        const continuar = confirm('⚠️ Ficha pré-anestésica ainda não foi anexada. Deseja baixar apenas os documentos disponíveis?');
        if (!continuar) {
          setDownloading(null);
          return;
        }
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
      alert('❌ Erro ao criar arquivo ZIP. Por favor, tente novamente.');
    } finally {
      setDownloading(null);
    }
  };

  // Status do paciente (mesma lógica da tela Documentação)
  const getStatusPaciente = (ag: Agendamento) => {
    const temDocs = ag.documentos_ok === true;
    const temFicha = ag.ficha_pre_anestesica_ok === true;
    
    if (temDocs && temFicha) return { texto: 'LIBERADO', cor: 'bg-green-100 text-green-800' };
    if (temDocs && !temFicha) return { texto: 'AGUARDANDO FICHA', cor: 'bg-yellow-100 text-yellow-800' };
    return { texto: 'AGUARDANDO DOCS', cor: 'bg-red-100 text-red-800' };
  };

  // Renderizar linha de agendamento
  const renderizarLinhaAgendamento = (ag: Agendamento) => {
    const expandida = isLinhaExpandida(ag.id);
    const status = getStatusPaciente(ag);
    
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
            <td colSpan={6} className="px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
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
            Download de documentos para entrada no sistema G-SUS (Liberados e Aguardando Ficha)
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Mostrando <span className="font-semibold text-gray-800">{agendamentosFiltrados.length}</span> de <span className="font-semibold text-gray-800">{agendamentos.length}</span> agendamentos liberados
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
          {/* Tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                      Ações
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      {/* Botão expandir */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 font-medium">Nenhum agendamento encontrado</p>
                          <p className="text-sm text-gray-400">
                            Não há pacientes com documentos OK para faturamento no momento.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    agendamentosFiltrados.map((ag) => renderizarLinhaAgendamento(ag))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📌 Informações sobre Faturamento:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Esta tela exibe pacientes <strong>liberados</strong> e <strong>aguardando ficha</strong> (com documentos OK)</li>
              <li>• Use o botão <strong>"Download G-SUS"</strong> para baixar todos os documentos necessários</li>
              <li>• Os documentos serão baixados automaticamente em formato ZIP para dar entrada no sistema G-SUS</li>
              <li>• Pacientes <strong>aguardando ficha</strong> podem ter apenas os documentos baixados (ficha será adicionada depois)</li>
              <li>• Você pode expandir a linha para ver detalhes e acessar documentos individuais</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default FaturamentoView;

