import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input, Badge } from './ui'
import { useSigtapDataSimple, SigtapProcedure } from '../hooks/useSigtapDataSimple'

// ============================================
// COMPONENTE PARA VISUALIZAR PROCEDIMENTOS SIGTAP
// ============================================
const SigtapProceduresView: React.FC = () => {
  // Estado para controlar erros críticos que podem quebrar a interface
  const [criticalError, setCriticalError] = useState<string | null>(null)

  let sigtapData
  try {
    sigtapData = useSigtapDataSimple()
  } catch (error) {
    console.error('❌ Erro crítico ao inicializar useSigtapDataSimple:', error)
    setCriticalError('Erro ao inicializar dados SIGTAP')
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-red-800 font-bold mb-2">Erro Crítico</h2>
          <p className="text-red-600">Não foi possível inicializar o sistema SIGTAP. Tente recarregar a página.</p>
        </Card>
      </div>
    )
  }

  const {
    procedures,
    loading,
    error,
    connected,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    searchTerm: hookSearchTerm,
    loadData,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    searchProcedures,
    clearSearch,
    stats
  } = sigtapData

  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Busca instantânea com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchTerm !== hookSearchTerm) {
        searchProcedures(localSearchTerm)
      }
    }, 500) // 500ms de delay para evitar muitas requisições

    return () => clearTimeout(timeoutId)
  }, [localSearchTerm]) // Executa quando localSearchTerm muda

  const toggleDetails = (procedureId: string) => {
    setShowDetails(showDetails === procedureId ? null : procedureId)
  }

  return (
    <div className="space-y-6">
      {/* Header com Status da Conexão */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                Procedimentos SIGTAP
              </h2>
              {loading && !connected && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs text-blue-600 font-medium">Carregando...</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600">
              Tabela completa de procedimentos do Sistema SIGTAP
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>


        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">Erro de Conexão</p>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-2">
                  Verifique se a tabela 'sigtap_procedures' existe no projeto externo e se as permissões estão corretas.
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total no Sistema</p>
            <p className="text-2xl font-bold text-blue-700">
              {loading && totalCount === 0 ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Carregando...
                </span>
              ) : (
                totalCount.toLocaleString()
              )}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Página Atual</p>
            <p className="text-2xl font-bold text-purple-700">{currentPage} de {totalPages}</p>
          </div>
        </div>

      </Card>

      {/* Busca e Controles */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Busca Instantânea */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Digite para buscar por código ou descrição..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pr-10"
                disabled={!connected}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
            {hookSearchTerm && (
              <Button
                onClick={() => {
                  setLocalSearchTerm('')
                  clearSearch()
                }}
                size="sm"
                className="bg-gray-500 hover:bg-gray-600"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Controles de Paginação e Info */}
          {stats.hasData && (
            <>
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  {hookSearchTerm ? (
                    <span>
                      Buscando por "{hookSearchTerm}" • Mostrando {procedures.length} de {totalCount.toLocaleString()} registros
                    </span>
                  ) : (
                    <span>
                      Mostrando {procedures.length} de {totalCount.toLocaleString()} procedimentos únicos
                    </span>
                  )}
                </div>
                
                {/* Controles de Paginação Minimalistas */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={goToFirstPage}
                    disabled={loading || currentPage === 1}
                    className="text-black hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    Primeiro
                  </button>
                  
                  <button
                    onClick={goToPrevPage}
                    disabled={loading || currentPage === 1}
                    className="text-black hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    Anterior
                  </button>
                  
                  <span className="text-sm font-medium text-gray-700 px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={loading || currentPage === totalPages}
                    className="text-black hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    Próxima
                  </button>
                  
                  <button
                    onClick={goToLastPage}
                    disabled={loading || currentPage === totalPages}
                    className="text-black hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    Última
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Tabela de Procedimentos */}
      {stats.hasData && (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-medium text-slate-700 w-32">Código</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-700">Descrição</th>
                  <th className="text-center py-3 px-2 font-medium text-slate-700 w-20">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((procedure, index) => (
                  <React.Fragment key={procedure.id || procedure.code || index}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 w-32">
                        <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
                          {procedure.code || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="truncate" title={procedure.description}>
                          {procedure.description || 'Sem descrição'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center w-20">
                        <button
                          onClick={() => toggleDetails(procedure.id || procedure.code || index.toString())}
                          className="p-1 hover:bg-slate-100 rounded transition-colors duration-200"
                        >
                          <svg 
                            className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                              showDetails === (procedure.id || procedure.code || index.toString()) ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Linha de Detalhes Expandida */}
                    {showDetails === (procedure.id || procedure.code || index.toString()) && (
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="py-4 px-2">
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <h4 className="font-medium text-slate-800 mb-3">Detalhes Completos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {Object.entries(procedure).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                  <span className="font-medium text-slate-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="text-slate-800 mt-1">
                                    {value !== null && value !== undefined ? String(value) : 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            {procedures.length === 0 && !loading && connected && (
              <div className="text-center py-8 text-slate-500">
                {hookSearchTerm ? 
                  `Nenhum procedimento encontrado para "${hookSearchTerm}"` :
                  'Nenhum procedimento encontrado nesta página'
                }
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Estado Vazio */}
      {!stats.hasData && !loading && connected && (
        <Card className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-slate-500">
            Os dados serão carregados automaticamente quando disponíveis
          </p>
        </Card>
      )}

      {/* Estado de Loading */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="text-blue-500 mb-4">
            <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-slate-600">Carregando procedimentos SIGTAP...</p>
        </Card>
      )}
    </div>
  )
}

export default SigtapProceduresView
