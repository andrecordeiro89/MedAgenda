import { useState, useEffect } from 'react'
import externalDataService from '../services/external-supabase'

// ============================================
// INTERFACE PARA PROCEDIMENTO SIGTAP
// ============================================
export interface SigtapProcedure {
  id?: string
  code: string
  name?: string
  description?: string
  complexity?: string
  value?: number
  created_at?: string
  updated_at?: string
  [key: string]: any // Para campos adicionais que possam existir
}

// ============================================
// INTERFACE PARA DADOS PAGINADOS
// ============================================
export interface PaginatedSigtapData {
  data: SigtapProcedure[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// HOOK PARA GERENCIAR DADOS SIGTAP
// ============================================
export const useSigtapData = () => {
  const [procedures, setProcedures] = useState<SigtapProcedure[]>([])
  const [uniqueCodes, setUniqueCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // Otimizado para 50 registros
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Função para testar conexão
  const testConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Testando conexão SIGTAP via hook...')
      
      // Tentar buscar um registro da tabela SIGTAP para testar
      const data = await externalDataService.getFromTable('sigtap_procedures', {
        select: 'code',
        limit: 1
      })
      
      // Se chegou até aqui sem erro e tem dados, conexão está OK
      const isConnected = Array.isArray(data) && data.length >= 0 // Aceita array vazio também
      setConnected(isConnected)
      
      if (!isConnected) {
        const errorMsg = 'Dados inválidos retornados da tabela SIGTAP'
        setError(errorMsg)
        console.error('❌ Falha na conexão SIGTAP - dados inválidos:', data)
      } else {
        setError(null)
        console.log('✅ Conexão com SIGTAP estabelecida - Dados:', data?.length || 0, 'registros')
      }
      
      return isConnected
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao testar conexão SIGTAP'
      setError(errorMsg)
      setConnected(false)
      console.error('❌ Erro na conexão SIGTAP:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar códigos únicos
  const loadUniqueCodes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Carregando códigos únicos SIGTAP...')
      const codes = await externalDataService.getSigtapUniquesCodes()
      
      setUniqueCodes(codes)
      setConnected(true) // Se chegou até aqui, conexão está OK
      console.log('✅ Códigos únicos SIGTAP carregados:', codes.length)
      
      return codes
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar códigos únicos SIGTAP'
      setError(errorMsg)
      setConnected(false)
      console.error('❌ Erro ao carregar códigos únicos:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar tabela completa com registros únicos (PAGINADA)
  const loadCompleteTable = async (page?: number, search?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const targetPage = page || currentPage
      const targetSearch = search !== undefined ? search : searchTerm
      
      console.log(`🔄 Carregando página ${targetPage} da tabela SIGTAP (busca: "${targetSearch}")`)
      
      const result = await externalDataService.getSigtapCompleteTable({
        page: targetPage,
        pageSize,
        searchTerm: targetSearch
      })
      
      setProcedures(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setCurrentPage(result.page)
      setConnected(true) // Se chegou até aqui, conexão está OK
      
      console.log(`✅ Página ${result.page} carregada:`, result.data.length, 'registros de', result.totalCount, 'total')
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar tabela SIGTAP'
      setError(errorMsg)
      setConnected(false)
      console.error('❌ Erro ao carregar tabela:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar contagem total
  const loadTotalCount = async () => {
    try {
      console.log('🔄 Carregando contagem total...')
      const count = await externalDataService.getSigtapTotalUniqueCount()
      setTotalCount(count)
      console.log('✅ Contagem total carregada:', count)
      return count
    } catch (err) {
      console.error('❌ Erro ao carregar contagem:', err)
      return 0
    }
  }

  // Função para buscar procedimento por código
  const getProcedureByCode = async (code: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 Buscando procedimento SIGTAP: ${code}`)
      const procedure = await externalDataService.getSigtapProcedureByCode(code)
      
      setConnected(true) // Se chegou até aqui, conexão está OK
      console.log(`✅ Procedimento SIGTAP ${code} encontrado`)
      return procedure
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Erro ao buscar procedimento ${code}`
      setError(errorMsg)
      setConnected(false)
      console.error(`❌ Erro ao buscar procedimento ${code}:`, err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Funções de navegação de páginas
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      await loadCompleteTable(page)
    }
  }

  const goToNextPage = async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1)
    }
  }

  const goToPrevPage = async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1)
    }
  }

  const goToFirstPage = async () => {
    await goToPage(1)
  }

  const goToLastPage = async () => {
    await goToPage(totalPages)
  }


  // Função para buscar com filtro
  const searchProcedures = async (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Voltar para primeira página ao buscar
    await loadCompleteTable(1, term)
  }

  // Função para limpar busca
  const clearSearch = async () => {
    setSearchTerm('')
    setCurrentPage(1)
    await loadCompleteTable(1, '')
  }

  // Função para filtrar procedimentos (local, para busca rápida)
  const filterProcedures = (searchTerm: string) => {
    if (!searchTerm.trim()) return procedures
    
    const term = searchTerm.toLowerCase()
    return procedures.filter(procedure => 
      procedure.code?.toLowerCase().includes(term) ||
      procedure.name?.toLowerCase().includes(term) ||
      procedure.description?.toLowerCase().includes(term)
    )
  }

  // Inicializar conexão quando o hook for montado
  useEffect(() => {
    testConnection()
  }, [])

  return {
    // Estados
    procedures,
    uniqueCodes,
    loading,
    error,
    connected,
    
    // Estados de paginação
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    searchTerm,
    
    // Funções
    testConnection,
    loadUniqueCodes,
    loadCompleteTable,
    loadTotalCount,
    getProcedureByCode,
    filterProcedures,
    
    // Funções de paginação
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    searchProcedures,
    clearSearch,
    
    // Estatísticas
    stats: {
      totalProcedures: procedures.length,
      totalUniqueCodes: uniqueCodes.length,
      hasData: procedures.length > 0,
      currentPageData: procedures.length,
      totalCount,
      totalPages,
      currentPage
    }
  }
}

// ============================================
// HOOK SIMPLIFICADO PARA BUSCA RÁPIDA
// ============================================
export const useSigtapQuickSearch = () => {
  const [results, setResults] = useState<SigtapProcedure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchByCode = async (code: string) => {
    if (!code.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const procedure = await externalDataService.getSigtapProcedureByCode(code.trim())
      setResults(procedure ? [procedure] : [])
    } catch (err) {
      setError('Erro na busca')
      setResults([])
      console.error('Erro na busca rápida:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

  return {
    results,
    loading,
    error,
    searchByCode,
    clearResults
  }
}

export default useSigtapData
