import React, { useState, useEffect } from 'react';
import { agendamentoService } from '../services/supabase';
import { Agendamento } from '../types';
import { Button } from './ui';

export const DocumentacaoView: React.FC<{ hospitalId: string }> = ({ hospitalId }) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'liberados'>('todos');

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
      
      // Mostrar TODOS os agendamentos, mesmo com campos faltando
      setAgendamentos(dados);
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar agendamentos
  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (filtro === 'todos') return true;
    if (filtro === 'pendentes') {
      // Pendente se NÃO tem docs OU não tem ficha
      return !(ag.documentos_ok === true) || !(ag.ficha_pre_anestesica_ok === true);
    }
    if (filtro === 'liberados') {
      // Liberado se tem docs E ficha
      return ag.documentos_ok === true && ag.ficha_pre_anestesica_ok === true;
    }
    return true;
  });

  // Status do paciente
  const getStatusPaciente = (ag: Agendamento) => {
    const temDocs = ag.documentos_ok === true;
    const temFicha = ag.ficha_pre_anestesica_ok === true;
    
    if (temDocs && temFicha) return { texto: 'LIBERADO', cor: 'bg-green-100 text-green-800' };
    if (temDocs && !temFicha) return { texto: 'AGUARDANDO FICHA', cor: 'bg-yellow-100 text-yellow-800' };
    if (!temDocs) return { texto: 'AGUARDANDO DOCS', cor: 'bg-red-100 text-red-800' };
    return { texto: 'PENDENTE', cor: 'bg-gray-100 text-gray-800' };
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

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nascimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cirurgia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Médico
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Consulta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
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
                  ) : (
                    agendamentosFiltrados.map((ag) => {
                      const status = getStatusPaciente(ag);
                      return (
                        <tr key={ag.id} className="hover:bg-gray-50">
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
                          
                          {/* Nascimento */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatarData(ag.data_nascimento || ag.dataNascimento)}
                          </td>
                          
                          {/* Cidade */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ag.cidade_natal || ag.cidadeNatal || '-'}
                          </td>
                          
                          {/* Telefone */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ag.telefone || '-'}
                          </td>
                          
                          {/* Data Cirurgia */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatarData(ag.data_agendamento || ag.dataAgendamento)}
                          </td>
                          
                          {/* Médico */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ag.medico || '-'}
                          </td>
                          
                          {/* Procedimento */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ag.procedimentos || '-'}
                          </td>
                          
                          {/* Data Consulta */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatarData(ag.data_consulta)}
                          </td>
                          
                          {/* Ações */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col gap-2">
                              {/* Documentos Recepção */}
                              <div className="flex items-center gap-2">
                                {ag.documentos_ok === true ? (
                                  <span className="text-green-600 text-xs flex items-center gap-1">
                                    ✓ Docs OK
                                  </span>
                                ) : (
                                  <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    📎 Anexar Docs
                                  </button>
                                )}
                              </div>
                              
                              {/* Ficha Pré-Anestésica */}
                              <div className="flex items-center gap-2">
                                {ag.ficha_pre_anestesica_ok === true ? (
                                  <span className="text-green-600 text-xs flex items-center gap-1">
                                    ✓ Ficha OK
                                  </span>
                                ) : ag.documentos_ok === true ? (
                                  <button className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
                                    📋 Anexar Ficha
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">Aguardando docs</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
    </div>
  );
};

export default DocumentacaoView;

