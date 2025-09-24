import { useState, useEffect } from 'react'
import { externalSupabase } from '../services/external-supabase'

export interface SigtapProcedure {
  id?: string
  code: string
  description?: string
  complexity?: string
  value?: number
  [key: string]: any
}

export const useSigtapDataSimple = () => {
  const [procedures, setProcedures] = useState<SigtapProcedure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const pageSize = 50

  // Função para descobrir a estrutura da tabela
  const discoverTableStructure = async () => {
    try {
      console.log('🔍 Descobrindo estrutura da tabela sigtap_procedures...')
      
      const { data, error } = await externalSupabase
        .from('sigtap_procedures')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Erro ao descobrir estrutura:', error)
        return null
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log('✅ Colunas encontradas:', columns)
        return columns
      }
      
      return null
    } catch (err) {
      console.error('❌ Erro ao descobrir estrutura:', err)
      return null
    }
  }

  // Função simples para carregar dados
  const loadData = async (page = 1, search = '') => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔄 Carregando dados SIGTAP - Página ${page}, Busca: "${search}"`)
      
      if (search && search.trim()) {
        // Para busca com filtro, usar abordagem para evitar duplicatas
        const searchTerm = search.trim()
        console.log(`🔍 Aplicando filtro de busca com remoção de duplicatas: "${searchTerm}"`)
        
        // Buscar todos os registros que atendem ao critério
        const { data: allData, error: searchError } = await externalSupabase
          .from('sigtap_procedures')
          .select('*')
          .or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('code', { ascending: true })
        
        if (searchError) {
          throw new Error(`Erro Supabase: ${searchError.message}`)
        }
        
        if (Array.isArray(allData)) {
          // Remover duplicatas baseado no código
          const uniqueData = allData.filter((item, index, array) => 
            array.findIndex(i => i.code === item.code) === index
          )
          
          console.log(`📊 Dados filtrados: ${allData.length} registros → ${uniqueData.length} únicos`)
          
          // Aplicar paginação manual nos dados únicos
          const startIndex = (page - 1) * pageSize
          const endIndex = startIndex + pageSize
          const paginatedData = uniqueData.slice(startIndex, endIndex)
          
          setProcedures(paginatedData)
          setCurrentPage(page)
          setTotalCount(uniqueData.length)
          setTotalPages(Math.ceil(uniqueData.length / pageSize))
          setSearchTerm(search)
          setConnected(true)
          
          console.log(`✅ Página ${page}: ${paginatedData.length} registros únicos de ${uniqueData.length} total`)
        } else {
          throw new Error('Dados inválidos retornados')
        }
      } else {
        // Para carregamento sem busca, usar query normal com paginação
        console.log('📄 Carregando dados sem filtro')
        
        const { data, error } = await externalSupabase
          .from('sigtap_procedures')
          .select('*')
          .order('code', { ascending: true })
          .limit(pageSize)
          .range((page - 1) * pageSize, page * pageSize - 1)
        
        if (error) {
          throw new Error(`Erro Supabase: ${error.message}`)
        }
        
        if (Array.isArray(data)) {
          setProcedures(data)
          setCurrentPage(page)
          setTotalCount(4866) // Valor conhecido para dados sem filtro
          setTotalPages(Math.ceil(4866 / pageSize))
          setSearchTerm('')
          setConnected(true)
          
          console.log(`✅ Carregados ${data.length} registros da página ${page}`)
        } else {
          throw new Error('Dados inválidos retornados')
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(errorMsg)
      setConnected(false)
      setProcedures([])
      console.error('❌ Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  // Navegação simples
  const goToPage = (page: number) => loadData(page, searchTerm)
  const goToNextPage = () => currentPage < totalPages && loadData(currentPage + 1, searchTerm)
  const goToPrevPage = () => currentPage > 1 && loadData(currentPage - 1, searchTerm)
  const goToFirstPage = () => loadData(1, searchTerm)
  const goToLastPage = () => loadData(totalPages, searchTerm)

  // Busca instantânea
  const searchProcedures = (term: string) => {
    loadData(1, term)
  }

  const clearSearch = () => {
    loadData(1, '')
  }

  // Carregar dados iniciais e descobrir estrutura
  useEffect(() => {
    const initialize = async () => {
      await discoverTableStructure()
      await loadData()
    }
    initialize()
  }, [])

  return {
    // Estados
    procedures,
    loading,
    error,
    connected,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    searchTerm,
    
    // Funções
    loadData,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    searchProcedures,
    clearSearch,
    
    // Stats simples
    stats: {
      hasData: procedures.length > 0,
      totalProcedures: procedures.length,
      totalUniqueCodes: procedures.length
    }
  }
}
