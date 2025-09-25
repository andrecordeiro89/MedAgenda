import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input, Badge, ProgressBar } from './ui'
import { VirtualizedTable } from './VirtualizedTable'
import externalDataService from '../services/external-supabase'
import { useDataCache } from '../contexts/DataCacheContext'

// ============================================
// TIPOS E INTERFACES
// ============================================
interface SigtapProcedure {
  id?: string
  code: string
  description?: string
  name?: string
  valor_hospitalar?: number
  valor_profissional?: number
  value_hosp?: number
  value_prof?: number
  hosp_value?: number
  prof_value?: number
  created_at?: string
  updated_at?: string
  [key: string]: any
}

// ============================================
// COMPONENTE PARA VISUALIZAR PROCEDIMENTOS SIGTAP COM VIRTUALIZAÇÃO
// ============================================
const SigtapProceduresView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Hook do cache
  const {
    sigtapProcedures,
    setSigtapProcedures,
    setSigtapLoading,
    setSigtapError,
    setSigtapProgress,
    isCacheValid
  } = useDataCache()

  // Função para formatar valores monetários
  const formatCurrency = (value: number | string): string => {
    const numericValue = parseFloat(String(value))
    if (isNaN(numericValue)) return 'R$ 0,00'
    
    // Valores do SIGTAP estão em centavos, dividir por 100
    const realValue = numericValue / 100
    return `R$ ${realValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`
  }

  // Função para carregar todos os dados SIGTAP com cache
  const loadAllSigtapData = async (forceReload: boolean = false) => {
    // Verificar se o cache é válido e não é um reload forçado
    if (!forceReload && isCacheValid('sigtap', 30)) {
      console.log('📦 Usando dados SIGTAP do cache')
      return
    }

    try {
      setSigtapLoading(true)
      setSigtapError(null)
      setSigtapProcedures([]) // Reset procedures before loading new data
      console.log('🚀 Carregando todos os procedimentos SIGTAP para virtualização...')
      
      // Callback de progresso para atualizar o estado
      const onProgress = (progress: { current: number; total: number; percentage: number; message?: string }) => {
        setSigtapProgress(progress)
      }
      
      const data = await externalDataService.getAllSigtapProceduresUnique(onProgress)
      console.log('✅ Dados SIGTAP carregados:', data.length)
      
      setSigtapProcedures(data || [])
      
      // Progresso final
      setSigtapProgress({
        current: data?.length || 0,
        total: data?.length || 0,
        percentage: 100,
        message: `Carregamento concluído! ${data?.length || 0} procedimentos carregados.`
      })
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados SIGTAP:', err)
      setSigtapError(err?.message || 'Erro ao carregar procedimentos SIGTAP')
      setSigtapProgress(undefined) // Limpar progresso em caso de erro
    } finally {
      setSigtapLoading(false)
    }
  }

  // Carregar dados na inicialização
  useEffect(() => {
    loadAllSigtapData()
  }, [])

  // Filtrar dados baseado na busca
  const filteredProcedures = useMemo(() => {
    // Garantir que sigtapProcedures.data é sempre um array
    const safeData = Array.isArray(sigtapProcedures.data) ? sigtapProcedures.data : []
    
    if (!searchTerm.trim()) return safeData

    const term = searchTerm.toLowerCase()
    return safeData.filter(procedure => {
      const code = procedure.code?.toLowerCase() || ''
      const description = procedure.description?.toLowerCase() || ''
      const name = procedure.name?.toLowerCase() || ''
      
      return code.includes(term) || description.includes(term) || name.includes(term)
    })
  }, [sigtapProcedures.data, searchTerm])

  // Função para alternar detalhes
  const toggleDetails = (procedureId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(procedureId)) {
      newExpandedRows.delete(procedureId)
    } else {
      newExpandedRows.add(procedureId)
    }
    setExpandedRows(newExpandedRows)
  }

  // Configuração das colunas para a tabela virtualizada
  const columns = [
    {
      key: 'code',
      header: 'Código',
      width: '150px',
      render: (value: string) => (
        <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
          {value || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'description',
      header: 'Descrição',
      width: '1fr',
      render: (value: string, row: SigtapProcedure) => (
        <div className="truncate" title={value || row.name}>
          {value || row.name || 'Sem descrição'}
        </div>
      )
    },
    {
      key: 'valor_hospitalar',
      header: 'Valor Hosp',
      width: '120px',
      render: (value: number, row: SigtapProcedure) => (
        <div className="text-right">
          <span className="text-slate-600 font-medium">
            {formatCurrency(value || row.value_hosp || row.hosp_value || 0)}
          </span>
        </div>
      )
    },
    {
      key: 'valor_profissional',
      header: 'Valor Prof',
      width: '120px',
      render: (value: number, row: SigtapProcedure) => (
        <div className="text-right">
          <span className="text-slate-600 font-medium">
            {formatCurrency(value || row.value_prof || row.prof_value || 0)}
          </span>
        </div>
      )
    },
    {
      key: 'total',
      header: 'Valor Total',
      width: '120px',
      render: (value: any, row: SigtapProcedure) => {
        const hospValue = row.valor_hospitalar || row.value_hosp || row.hosp_value || 0
        const profValue = row.valor_profissional || row.value_prof || row.prof_value || 0
        const total = hospValue + profValue
        
        return (
          <div className="text-right">
            <span className="text-slate-700 font-semibold">
              {formatCurrency(total)}
            </span>
          </div>
        )
      }
    },
    {
      key: 'details',
      header: 'Detalhes',
      width: '80px',
      render: (value: any, row: SigtapProcedure) => (
        <div className="text-center">
          <button
            onClick={() => toggleDetails(row.id || row.code || '')}
            className="p-1 hover:bg-slate-100 rounded transition-colors duration-200"
          >
            <svg 
              className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                expandedRows.has(row.id || row.code || '') ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )
    }
  ]

  // Função para renderizar conteúdo expandido
  const renderExpandedContent = (procedure: SigtapProcedure) => {
    return (
      <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
        <div className="mb-4 pb-3 border-b border-slate-200">
          <h4 className="text-base font-medium text-slate-700">
            Detalhes do Procedimento - {procedure.code}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(procedure)
            .filter(([key]) => key !== 'id' && key !== 'version_id')
            .map(([key, value]) => {
              const getPortugueseLabel = (key: string) => {
                const translations: { [key: string]: string } = {
                  'code': 'Código',
                  'description': 'Descrição',
                  'name': 'Nome',
                  'complexity': 'Complexidade',
                  'value': 'Valor',
                  'created_at': 'Data de Criação',
                  'updated_at': 'Última Atualização',
                  'category': 'Categoria',
                  'subcategory': 'Subcategoria',
                  'type': 'Tipo',
                  'status': 'Status',
                  'active': 'Ativo',
                  'specialty': 'Especialidade',
                  'procedure_type': 'Tipo de Procedimento',
                  'authorization': 'Autorização',
                  'classification': 'Classificação',
                  'valor_hospitalar': 'Valor Hospitalar',
                  'valor_profissional': 'Valor Profissional',
                  'value_hosp': 'Valor Hospitalar',
                  'value_prof': 'Valor Profissional',
                  'hosp_value': 'Valor Hospitalar',
                  'prof_value': 'Valor Profissional'
                }
                return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }

              const formatValue = (key: string, value: any) => {
                if (value === null || value === undefined || value === '') return 'Não informado'
                
                if (key.toLowerCase().includes('value') || key.toLowerCase().includes('valor')) {
                  const numericValue = parseFloat(value)
                  if (!isNaN(numericValue)) {
                    return formatCurrency(numericValue)
                  }
                }
                
                if (key === 'created_at' || key === 'updated_at') {
                  try {
                    return new Date(value).toLocaleString('pt-BR')
                  } catch {
                    return String(value)
                  }
                }
                
                if (typeof value === 'boolean') {
                  return value ? 'Sim' : 'Não'
                }
                
                return String(value)
              }

              return (
                <div key={key} className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {getPortugueseLabel(key)}
                  </span>
                  <span className="text-sm text-slate-800 break-words leading-relaxed">
                    {formatValue(key, value)}
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">
                Procedimentos SIGTAP
              </h2>
              {sigtapProcedures.loading && (
                <ProgressBar 
                  progressInfo={sigtapProcedures.progress}
                  indeterminate={!sigtapProcedures.progress}
                  className="w-48"
                  label={sigtapProcedures.progress?.message || "Carregando..."}
                  showPercentage={!!sigtapProcedures.progress}
                />
              )}
            </div>
            <p className="text-sm text-slate-600">
              Tabela completa de procedimentos do Sistema SIGTAP com virtualização
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${!sigtapProcedures.error ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600">
              {!sigtapProcedures.error ? 'Conectado' : 'Erro'}
            </span>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {sigtapProcedures.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">Erro de Conexão</p>
                <p className="text-red-600 text-sm">{sigtapProcedures.error}</p>
                <Button
                  onClick={() => loadAllSigtapData(true)}
                  size="sm"
                  className="mt-2 bg-red-600 hover:bg-red-700"
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </div>
        )}


      </Card>

      {/* Busca */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Digite para buscar por código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              disabled={sigtapProcedures.loading}
            />
          </div>
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm('')}
              size="sm"
              className="bg-gray-500 hover:bg-gray-600"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Info da busca */}
        {searchTerm && (
          <div className="mt-2 text-sm text-slate-600">
            Buscando por "{searchTerm}" • {filteredProcedures.length} de {sigtapProcedures.data.length} procedimentos
          </div>
        )}
      </Card>

      {/* Tabela Virtualizada */}
      {!sigtapProcedures.loading && sigtapProcedures.data.length > 0 && (
        <Card className="p-4">
          <div className="mb-2 text-xs text-slate-600">
            Exibindo {filteredProcedures.length} de {Array.isArray(sigtapProcedures.data) ? sigtapProcedures.data.length : 0} procedimentos únicos
          </div>
          <VirtualizedTable
            data={filteredProcedures}
            columns={columns}
            height={600}
            itemHeight={50}
            className="border-0"
            expandedRows={expandedRows}
            onRowExpand={toggleDetails}
            renderExpandedContent={renderExpandedContent}
            expandedRowHeight={250}
          />
        </Card>
      )}

      {/* Estado Vazio - Substituído por barra de progresso */}
      {!sigtapProcedures.loading && sigtapProcedures.data.length === 0 && !sigtapProcedures.error && (
        <Card className="p-8 text-center">
          <div className="mb-6">
            <ProgressBar 
              progressInfo={sigtapProcedures.progress}
              indeterminate={!sigtapProcedures.progress}
              label={sigtapProcedures.progress?.message || "Carregando dados SIGTAP..."}
              className="max-w-md mx-auto"
              showPercentage={!!sigtapProcedures.progress}
            />
          </div>
          <p className="text-slate-500 text-sm">
            Aguarde enquanto os procedimentos são carregados...
          </p>
        </Card>
      )}

      {/* Estado de Loading */}
      {sigtapProcedures.loading && (
        <Card className="p-8 text-center">
          <div className="mb-6">
            <ProgressBar 
              indeterminate={true}
              label="Carregando procedimentos SIGTAP..."
              className="max-w-md mx-auto"
            />
          </div>
          <p className="text-slate-500 text-sm">
            Isso pode levar alguns segundos na primeira vez...
          </p>
        </Card>
      )}
    </div>
  )
}

export default SigtapProceduresView
