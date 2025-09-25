import { createClient } from '@supabase/supabase-js'

// ============================================
// CONFIGURAÇÃO DO SUPABASE EXTERNO
// ============================================
const externalSupabaseUrl = (import.meta as any).env?.VITE_EXTERNAL_SUPABASE_URL || 'https://fvtfxunakabdrlkocdme.supabase.co'
const externalSupabaseAnonKey = (import.meta as any).env?.VITE_EXTERNAL_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dGZ4dW5ha2FiZHJsa29jZG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzU2NDUsImV4cCI6MjA2NjUxMTY0NX0.sclE7gxen5qG5GMeyyAM_9tHR2iAlk1F1SyLeXBKvXc'

export const externalSupabase = createClient(externalSupabaseUrl, externalSupabaseAnonKey, {
  auth: {
    storageKey: 'sb-sigtap-external-auth', // Chave mais específica
    persistSession: false, // Não persistir sessão para projeto externo
    autoRefreshToken: false, // Não renovar tokens automaticamente
    detectSessionInUrl: false // Não detectar sessão na URL
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'sigtap-external-client'
    }
  }
})

// ============================================
// SERVIÇOS PARA CONSUMIR DADOS EXTERNOS
// ============================================
export const externalDataService = {
  // Função genérica para buscar dados de qualquer tabela
  async getFromTable(tableName: string, options?: {
    select?: string
    filter?: Record<string, any>
    order?: string
    orderAscending?: boolean
    limit?: number
    range?: { start: number; end: number }
  }) {
    try {
      console.log(`🔄 Buscando dados da tabela: ${tableName}`)
      
      let query: any = externalSupabase.from(tableName)
      
      // Select (campos a buscar)
      if (options?.select) {
        query = query.select(options.select)
      } else {
        query = query.select('*')
      }
      
      // Filtros
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      
      // Ordenação
      if (options?.order) {
        query = query.order(options.order, { ascending: options.orderAscending ?? true })
      }
      
      // Paginação com range (Supabase v2)
      if (options?.range) {
        const { start, end } = options.range
        query = query.range(start, end)
      } else if (options?.limit) {
        // Limite simples quando range não for fornecido
        query = query.limit(options.limit)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error(`❌ Erro ao buscar ${tableName}:`, error)
        throw new Error(`Erro na tabela ${tableName}: ${error.message}`)
      }
      
      console.log(`✅ Dados de ${tableName} carregados:`, data?.length || 0, 'registros')
      return data || []
    } catch (error) {
      console.error(`❌ Erro na conexão com ${tableName}:`, error)
      throw error
    }
  },

  // Função para listar todas as tabelas disponíveis (para debug)
  async listTables() {
    try {
      const { data, error } = await externalSupabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (error) throw new Error(error.message)
      return data || []
    } catch (error) {
      console.error('Erro ao listar tabelas:', error)
      return []
    }
  },

  // Função para testar a conexão
  async testConnection() {
    try {
      console.log('🔄 Testando conexão SIGTAP...')
      
      // Testar com a tabela sigtap_procedures diretamente
      const { data, error } = await externalSupabase
        .from('sigtap_procedures')
        .select('code')
        .limit(1)
      
      if (error) {
        console.error('❌ Erro na conexão SIGTAP:', error.message)
        console.error('❌ Detalhes do erro:', error)
        return false
      }
      
      console.log('✅ Conexão com SIGTAP testada com sucesso')
      console.log('✅ Dados de teste:', data)
      return true
    } catch (error) {
      console.error('❌ Erro ao testar conexão externa:', error)
      return false
    }
  },

  // Função de diagnóstico para verificar o status da tabela
  async diagnoseSigtapTable() {
    console.log('🔍 Iniciando diagnóstico da tabela SIGTAP...')
    console.log('📋 URL do projeto:', externalSupabaseUrl)
    // Removido log de chave API por segurança
    
    try {
      // Teste 1: Verificar se a conexão básica funciona
      console.log('🧪 Teste 1: Conexão básica')
      const testResult = await this.testConnection()
      console.log('📊 Resultado do teste básico:', testResult ? '✅ Sucesso' : '❌ Falhou')
      
      // Teste 2: Tentar contar registros
      console.log('🧪 Teste 2: Contagem de registros')
      const { count, error: countError } = await externalSupabase
        .from('sigtap_procedures')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ Erro na contagem:', countError)
      } else {
        console.log('📊 Total de registros na tabela:', count)
      }
      
      // Teste 3: Buscar uma amostra pequena
      console.log('🧪 Teste 3: Amostra de dados')
      const { data: sampleData, error: sampleError } = await externalSupabase
        .from('sigtap_procedures')
        .select('*')
        .limit(3)
      
      if (sampleError) {
        console.error('❌ Erro na amostra:', sampleError)
      } else {
        console.log('📊 Amostra de dados:', sampleData)
        if (sampleData && sampleData.length > 0) {
          console.log('📋 Campos disponíveis:', Object.keys(sampleData[0]))
        }
      }
      
      return {
        connectionTest: testResult,
        recordCount: count,
        sampleData: sampleData || [],
        hasData: (sampleData?.length || 0) > 0
      }
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error)
      return {
        connectionTest: false,
        recordCount: 0,
        sampleData: [],
        hasData: false,
        error: error
      }
    }
  },

  // Exemplos de funções específicas (adapte conforme suas necessidades)
  
  // Buscar hospitais do projeto externo
  async getHospitais() {
    return this.getFromTable('hospitais', {
      order: 'nome'
    })
  },

  // Buscar usuários do projeto externo
  async getUsuarios() {
    return this.getFromTable('usuarios', {
      order: 'nome'
    })
  },

  // Buscar médicos do projeto externo
  async getMedicosExternos() {
    return this.getFromTable('medicos', {
      order: 'nome'
    })
  },

  // Buscar procedimentos do projeto externo
  async getProcedimentosExternos() {
    return this.getFromTable('procedimentos', {
      order: 'nome'
    })
  },

  // Buscar agendamentos do projeto externo
  async getAgendamentosExternos() {
    return this.getFromTable('agendamentos', {
      order: 'data_agendamento'
    })
  },

  // Buscar procedimentos SIGTAP
  async getSigtapProcedures() {
    return this.getFromTable('sigtap_procedures', {
      order: 'code'
    })
  },

  // Buscar códigos únicos da tabela SIGTAP
  async getSigtapUniquesCodes() {
    try {
      console.log('🔄 Buscando códigos únicos SIGTAP (em lotes)...')
      
      let allCodes: { code: string }[] = []
      let currentPage = 0
      let hasMore = true
      const batchSize = 1000
      
      while (hasMore) {
        const { data, error } = await externalSupabase
          .from('sigtap_procedures')
          .select('code')
          .order('code')
          .range(currentPage * batchSize, (currentPage + 1) * batchSize - 1)
        
        if (error) {
          console.error('❌ Erro ao buscar códigos SIGTAP (lote', currentPage, '):', error)
          throw new Error(`Erro ao buscar códigos: ${error.message}`)
        }
        
        if (!data || data.length === 0) {
          hasMore = false
          break
        }
        
        allCodes = allCodes.concat(data as any)
        currentPage++
        
        console.log(`📦 Lote ${currentPage} carregado: ${(data as any).length} códigos (total: ${allCodes.length})`)
        
        if ((data as any).length < batchSize) {
          hasMore = false
        }
        
        if (currentPage > 200) {
          console.warn('⚠️ Limite de segurança atingido, interrompendo busca de códigos')
          hasMore = false
        }
      }
      
      // Filtrar códigos únicos
      const uniqueCodes = [...new Set(allCodes.map(item => (item as any).code).filter(code => code))]
      
      console.log('✅ Códigos SIGTAP únicos encontrados:', uniqueCodes.length)
      return uniqueCodes
    } catch (error) {
      console.error('❌ Erro ao buscar códigos únicos SIGTAP:', error)
      throw error
    }
  },

  // Buscar procedimento SIGTAP completo por código
  async getSigtapProcedureByCode(code: string) {
    try {
      const { data, error } = await externalSupabase
        .from('sigtap_procedures')
        .select('*')
        .eq('code', code)
        // Removido order por 'created_at' para compatibilidade com esquemas sem essa coluna
        .limit(1)
        .single()
      
      if (error) {
        console.error(`Erro ao buscar procedimento SIGTAP ${code}:`, error)
        throw new Error(error.message)
      }
      
      console.log(`✅ Procedimento SIGTAP ${code} encontrado`)
      return data
    } catch (error) {
      console.error(`Erro ao buscar procedimento SIGTAP ${code}:`, error)
      throw error
    }
  },

  // Buscar tabela completa SIGTAP com códigos únicos (OTIMIZADO PARA +100K REGISTROS)
  async getSigtapCompleteTable(options?: {
    page?: number
    pageSize?: number
    searchTerm?: string
  }) {
    try {
      const { page = 1, pageSize = 100, searchTerm } = options || {}
      console.log(`🔄 Buscando registros únicos SIGTAP - Página ${page}, Tamanho: ${pageSize}`)
      console.log(`📊 Base de dados: +100k registros, buscando ~4900 únicos por código`)
      
      // USAR MÉTODO MANUAL COMO PADRÃO (mais confiável para grandes volumes)
      console.log('🔧 Usando método manual otimizado como padrão')
      return await this.getSigtapUniqueManual(options)
      
    } catch (error) {
      console.error('❌ Erro ao carregar tabela SIGTAP:', error)
      throw error
    }
  },

  // Método manual otimizado para garantir registros únicos
  async getSigtapUniqueManual(options?: {
    page?: number
    pageSize?: number
    searchTerm?: string
  }) {
    try {
      const { page = 1, pageSize = 50, searchTerm } = options || {}
      console.log('🔄 Usando método manual otimizado para registros únicos...')
      
      // ETAPA 1: Buscar TODOS os códigos únicos em lotes para não ter limitação
      console.log('📊 Etapa 1: Carregando todos os códigos únicos...')
      
      let allCodes = []
      let currentPage = 0
      let hasMore = true
      const batchSize = 1000 // Buscar em lotes de 1000
      
      while (hasMore) {
        let codesQuery = externalSupabase
          .from('sigtap_procedures')
          .select('code')
          .order('code')
          .range(currentPage * batchSize, (currentPage + 1) * batchSize - 1)
        
        if (searchTerm && searchTerm.trim()) {
          const term = `%${searchTerm.trim()}%`
          codesQuery = codesQuery.or(`code.ilike.${term},name.ilike.${term},description.ilike.${term}`)
        }
        
        const { data: codesData, error: codesError } = await codesQuery
        
        if (codesError) {
          console.error('❌ Erro ao buscar códigos lote', currentPage, ':', codesError)
          break
        }
        
        if (!codesData || codesData.length === 0) {
          hasMore = false
          break
        }
        
        allCodes = [...allCodes, ...codesData]
        currentPage++
        
        console.log(`📦 Lote ${currentPage} carregado: ${codesData.length} códigos (total: ${allCodes.length})`)
        
        // Se retornou menos que o batch size, não há mais dados
        if (codesData.length < batchSize) {
          hasMore = false
        }
        
        // Limite de segurança para evitar loops infinitos
        if (currentPage > 200) { // Máximo 200k registros
          console.warn('⚠️ Limite de segurança atingido, parando busca')
          hasMore = false
        }
      }
      
      // ETAPA 2: Extrair códigos únicos
      const uniqueCodes = [...new Set(allCodes.map(item => item.code).filter(code => code && code.trim()))]
      console.log('✅ Total de códigos únicos encontrados:', uniqueCodes.length)
      console.log('📊 Amostra de códigos:', uniqueCodes.slice(0, 10))
      
      // ETAPA 3: Aplicar paginação nos códigos únicos
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const pageCodes = uniqueCodes.slice(from, to)
      
      console.log(`📄 Página ${page}: Buscando registros para ${pageCodes.length} códigos únicos`)
      
      // ETAPA 4: Buscar o registro mais recente de cada código da página
      const promises = pageCodes.map(async (code, index) => {
        try {
          const { data, error } = await externalSupabase
            .from('sigtap_procedures')
            .select('*')
            .eq('code', code)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (error) {
            console.warn(`⚠️ Erro no código ${code} (${index + 1}/${pageCodes.length}):`, error.message)
            return null
          }
          
          if (index % 5 === 0 && index > 0) {
            console.log(`🔄 Progresso: ${index + 1}/${pageCodes.length} códigos processados`)
          }
          
          return data
        } catch (err) {
          console.warn(`⚠️ Exceção no código ${code}:`, err)
          return null
        }
      })
      
      const results = await Promise.all(promises)
      const validResults = results.filter(item => item !== null)
      
      console.log(`✅ Método manual concluído:`)
      console.log(`   📊 Códigos únicos totais: ${uniqueCodes.length}`)
      console.log(`   📄 Registros da página ${page}: ${validResults.length}`)
      console.log(`   🎯 Taxa de sucesso: ${((validResults.length / pageCodes.length) * 100).toFixed(1)}%`)
      
      return {
        data: validResults,
        totalCount: uniqueCodes.length,
        page,
        pageSize,
        totalPages: Math.ceil(uniqueCodes.length / pageSize)
      }
    } catch (error) {
      console.error('❌ Erro no método manual otimizado:', error)
      throw error
    }
  },

  // Função auxiliar para remover duplicatas por código
  removeDuplicatesByCode(data: any[]) {
    const seen = new Set()
    return data.filter(item => {
      if (seen.has(item.code)) {
        return false
      }
      seen.add(item.code)
      return true
    })
  },

  // ================= PROCEDURE RECORDS (Mais usados) =================
  // Buscar registros únicos de procedure_records (código + uma descrição), com paginação otimizada
  async getMostUsedProceduresUnique(options?: {
    page?: number
    pageSize?: number
    searchTerm?: string
  }) {
    const { page = 1, pageSize = 50, searchTerm } = options || {}
    console.log(`🔎 Carregando procedure_records únicos - página ${page}, tamanho ${pageSize}`)
    return this.getMostUsedProceduresUniqueManual({ page, pageSize, searchTerm })
  },

  // Método manual otimizado para garantir unicidade por codigo_procedimento_original em procedure_records
  async getMostUsedProceduresUniqueManual(options?: {
    page?: number
    pageSize?: number
    searchTerm?: string
    onProgress?: (progress: { current: number; total: number; percentage: number; message?: string }) => void
  }) {
    try {
      const { page = 1, pageSize = 50, searchTerm, onProgress } = options || {}

      // Callback de progresso inicial
      onProgress?.({
        current: 0,
        total: 100,
        percentage: 0,
        message: 'Iniciando carregamento dos procedimentos mais usados...'
      })

      // 1) Carregar TODOS os códigos únicos (sem filtros específicos)
      // Aplicamos apenas o searchTerm se fornecido
      let allRows: { codigo_procedimento_original: string }[] = []
      let currentPage = 0
      let hasMore = true
      const batchSize = 1000

      onProgress?.({
        current: 10,
        total: 100,
        percentage: 10,
        message: 'Buscando códigos únicos...'
      })

      while (hasMore) {
        let q = externalSupabase
          .from('procedure_records')
          .select('codigo_procedimento_original')
          .order('codigo_procedimento_original')
          .range(currentPage * batchSize, (currentPage + 1) * batchSize - 1)

        // Aplicar apenas searchTerm se fornecido
        if (searchTerm && searchTerm.trim()) {
          const term = `%${searchTerm.trim()}%`
          q = q.or(`codigo_procedimento_original.ilike.${term},procedure_description.ilike.${term}`)
        }

        const { data, error } = await q
        if (error) {
          console.error('❌ Erro ao buscar códigos de procedure_records (lote', currentPage, '):', error)
          break
        }

        if (!data || data.length === 0) {
          hasMore = false
          break
        }

        allRows = allRows.concat(data as any)
        currentPage++

        // Atualizar progresso durante a busca de códigos
        const progressPercentage = Math.min(10 + (currentPage * 30 / 200), 40)
        onProgress?.({
          current: progressPercentage,
          total: 100,
          percentage: progressPercentage,
          message: `Carregando lote ${currentPage} de códigos...`
        })

        if (data.length < batchSize) {
          hasMore = false
        }

        if (currentPage > 200) {
          console.warn('⚠️ Limite de segurança atingido ao ler procedure_records, interrompendo...')
          hasMore = false
        }
      }

      onProgress?.({
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Processando códigos únicos...'
      })

      // 2) Extrair códigos únicos não vazios e ordenar
      const uniqueCodes = [...new Set(
        allRows
          .map(r => (r as any).codigo_procedimento_original)
          .filter((c: string) => c && String(c).trim())
      )]
      uniqueCodes.sort((a: string, b: string) => String(a).localeCompare(String(b), 'pt-BR'))

      const totalCount = uniqueCodes.length

      // 3) Paginação nos códigos únicos
      const from = (page - 1) * pageSize
      const to = Math.min(from + pageSize, totalCount)
      const pageCodes = uniqueCodes.slice(from, to)

      onProgress?.({
        current: 60,
        total: 100,
        percentage: 60,
        message: `Carregando detalhes dos procedimentos (${pageCodes.length} itens)...`
      })

      // 4) Para cada código da página, buscar uma linha representativa (código + descrição + complexidade)
      const promises = pageCodes.map(async (code, index) => {
        try {
          const { data, error } = await externalSupabase
            .from('procedure_records')
            .select('codigo_procedimento_original, procedure_description, complexity')
            .eq('codigo_procedimento_original', code)
            .limit(1)
            .single()

          if (error) {
            console.warn(`⚠️ Erro ao buscar registro do código ${code}:`, error.message)
            return null
          }

          // Atualizar progresso durante o carregamento dos detalhes
          if (index % 10 === 0 && index > 0) {
            const detailProgress = 60 + ((index / pageCodes.length) * 35)
            onProgress?.({
              current: detailProgress,
              total: 100,
              percentage: detailProgress,
              message: `Carregando detalhes: ${index + 1}/${pageCodes.length} procedimentos`
            })
            console.log(`🔄 procedure_records: ${index + 1}/${pageCodes.length} registros carregados`)
          }

          return data as { codigo_procedimento_original: string; procedure_description: string; complexity?: string }
        } catch (err) {
          console.warn(`⚠️ Exceção ao buscar registro do código ${code}:`, err)
          return null
        }
      })

      const pageResults = (await Promise.all(promises)).filter(Boolean) as { codigo_procedimento_original: string; procedure_description: string; complexity?: string }[]

      // Progresso final
      onProgress?.({
        current: 100,
        total: 100,
        percentage: 100,
        message: `Carregamento concluído! ${pageResults.length} procedimentos carregados.`
      })

      console.log(`✅ Página ${page} concluída. Itens: ${pageResults.length} / ${pageCodes.length}. Total únicos: ${totalCount}`)

      return {
        data: pageResults,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    } catch (error) {
      console.error('❌ Erro em getMostUsedProceduresUniqueManual:', error)
      throw error
    }
  },

  // Buscar contagem total de códigos únicos (OTIMIZADO)
  async getSigtapTotalUniqueCount() {
    try {
      console.log('🔄 Contando códigos únicos SIGTAP (método otimizado)...')
      
      // Buscar TODOS os códigos em lotes para não ter limitação
      let allCodes = []
      let currentPage = 0
      let hasMore = true
      const batchSize = 1000
      
      while (hasMore) {
        const { data, error } = await externalSupabase
          .from('sigtap_procedures')
          .select('code')
          .order('code')
          .range(currentPage * batchSize, (currentPage + 1) * batchSize - 1)
        
        if (error) {
          console.error('❌ Erro ao contar códigos lote', currentPage, ':', error)
          break
        }
        
        if (!data || data.length === 0) {
          hasMore = false
          break
        }
        
        allCodes = [...allCodes, ...data]
        currentPage++
        
        console.log(`📦 Contagem lote ${currentPage}: ${data.length} códigos (total: ${allCodes.length})`)
        
        if (data.length < batchSize) {
          hasMore = false
        }
        
        // Limite de segurança
        if (currentPage > 200) {
          console.warn('⚠️ Limite de segurança atingido na contagem')
          hasMore = false
        }
      }
      
      // Contar únicos
      const uniqueCodes = [...new Set(allCodes.map(item => item.code).filter(code => code && code.trim()))]
      const count = uniqueCodes.length
      
      console.log('✅ Total de códigos únicos SIGTAP:', count)
      console.log('📊 Total de registros processados:', allCodes.length)
      console.log('🎯 Taxa de duplicação:', ((allCodes.length - count) / allCodes.length * 100).toFixed(1) + '%')
      
      return count
    } catch (error) {
      console.error('❌ Erro ao contar códigos únicos:', error)
      throw error
    }
  },

  // Versão antiga mantida para compatibilidade
  async getSigtapCompleteTableLegacy() {
    try {
      console.log('🔄 Buscando tabela completa SIGTAP (método legado)...')
      
      // Primeiro buscar códigos únicos
      const uniqueCodes = await this.getSigtapUniquesCodes()
      console.log('📊 Códigos únicos encontrados:', uniqueCodes.length)
      
      // Limitar a 100 códigos por vez para evitar sobrecarga
      const batchSize = 50
      const batches = []
      
      for (let i = 0; i < uniqueCodes.length; i += batchSize) {
        batches.push(uniqueCodes.slice(i, i + batchSize))
      }
      
      console.log(`📦 Processando ${batches.length} lotes de ${batchSize} códigos cada`)
      
      let allResults = []
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`🔄 Processando lote ${batchIndex + 1}/${batches.length}`)
        
        const promises = batch.map(code => 
          externalSupabase
            .from('sigtap_procedures')
            .select('*')
            .eq('code', code)
            .limit(1)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.warn(`⚠️ Erro no código ${code}:`, error.message)
                return null
              }
              return data
            })
        )
        
        const batchResults = await Promise.all(promises)
        const validResults = batchResults.filter(item => item !== null)
        allResults = [...allResults, ...validResults]
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log('✅ Tabela SIGTAP completa carregada (legado):', allResults.length, 'registros únicos')
      return allResults
    } catch (error) {
      console.error('❌ Erro ao carregar tabela SIGTAP completa (legado):', error)
      throw error
    }
  },

  // Função para buscar dados específicos por ID
  async getById(tableName: string, id: string) {
    try {
      const { data, error } = await externalSupabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw new Error(error.message)
      return data
    } catch (error) {
      console.error(`Erro ao buscar ${tableName} por ID:`, error)
      throw error
    }
  },

  // Função para buscar dados com filtros personalizados
  async getWithCustomFilter(tableName: string, customQuery: (query: any) => any) {
    try {
      let query = externalSupabase.from(tableName).select('*')
      query = customQuery(query)
      
      const { data, error } = await query
      if (error) throw new Error(error.message)
      
      return data || []
    } catch (error) {
      console.error(`Erro ao buscar ${tableName} com filtro customizado:`, error)
      throw error
    }
  },

  // ================= NOVA FUNÇÃO PARA VIRTUALIZAÇÃO SIGTAP =================
  // Carregar TODOS os procedimentos SIGTAP únicos de uma vez (para virtualização)
  async getAllSigtapProceduresUnique(onProgress?: (progress: { current: number; total: number; percentage: number; message?: string }) => void) {
    try {
      console.log('🚀 Iniciando carregamento completo de procedimentos SIGTAP únicos...')
      const startTime = Date.now()
      
      // Primeiro, buscar todos os códigos únicos
      console.log('📋 Buscando códigos únicos...')
      onProgress?.({ current: 0, total: 100, percentage: 5, message: 'Buscando códigos únicos...' })
      
      const uniqueCodes = await this.getSigtapUniquesCodes()
      
      if (!uniqueCodes || uniqueCodes.length === 0) {
        console.log('⚠️ Nenhum código único encontrado')
        return []
      }
      
      console.log(`📊 Total de códigos únicos encontrados: ${uniqueCodes.length}`)
      onProgress?.({ current: 0, total: uniqueCodes.length, percentage: 10, message: `Carregando ${uniqueCodes.length} procedimentos...` })
      
      // Dividir em lotes para evitar sobrecarga
      const batchSize = 50
      const batches = []
      for (let i = 0; i < uniqueCodes.length; i += batchSize) {
        batches.push(uniqueCodes.slice(i, i + batchSize))
      }
      
      console.log(`📦 Dividido em ${batches.length} lotes de até ${batchSize} códigos cada`)
      
      // Limite de segurança
      const maxBatches = 200
      if (batches.length > maxBatches) {
        console.warn(`⚠️ Limitando a ${maxBatches} lotes por segurança (de ${batches.length} total)`)
        batches.splice(maxBatches)
      }
      
      let allResults = []
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`🔄 Processando lote ${batchIndex + 1}/${batches.length} (${batch.length} códigos)`)
        
        const promises = batch.map(async (code, index) => {
          try {
            const { data, error } = await externalSupabase
              .from('sigtap_procedures')
              .select('*')
              .eq('code', code)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (error) {
              console.warn(`⚠️ Erro no código ${code}:`, error.message)
              return null
            }
            
            return data
          } catch (err) {
            console.warn(`⚠️ Exceção no código ${code}:`, err)
            return null
          }
        })
        
        const batchResults = await Promise.all(promises)
        const validResults = batchResults.filter(item => item !== null)
        allResults = [...allResults, ...validResults]
        
        // Calcular progresso
        const currentProgress = batchIndex + 1
        const totalBatches = batches.length
        const percentage = Math.round((currentProgress / totalBatches) * 100)
        
        // Log de progresso
        console.log(`📈 Progresso: ${percentage}% - ${allResults.length} registros carregados`)
        
        // Callback de progresso
        onProgress?.({
          current: allResults.length,
          total: uniqueCodes.length,
          percentage,
          message: `Carregando lote ${currentProgress}/${totalBatches}...`
        })
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      console.log('🎉 Carregamento completo finalizado!')
      console.log(`   📊 Total de registros únicos: ${allResults.length}`)
      console.log(`   ⏱️ Tempo total: ${duration.toFixed(2)}s`)
      console.log(`   🚀 Velocidade: ${(allResults.length / duration).toFixed(1)} registros/s`)
      
      // Progresso final
      onProgress?.({
        current: allResults.length,
        total: allResults.length,
        percentage: 100,
        message: 'Carregamento concluído!'
      })
      
      return allResults
    } catch (error) {
      console.error('❌ Erro ao carregar todos os procedimentos SIGTAP únicos:', error)
      throw error
    }
  }
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

// Função para sincronizar dados entre os dois projetos (se necessário)
export const syncDataService = {
  // Exemplo: copiar hospitais do projeto externo para o atual
  async syncHospitais() {
    try {
      const hospitaisExternos = await externalDataService.getHospitais()
      console.log('Hospitais encontrados no projeto externo:', hospitaisExternos.length)
      
      // Aqui você pode implementar a lógica para sincronizar os dados
      // com o projeto atual, se necessário
      
      return hospitaisExternos
    } catch (error) {
      console.error('Erro ao sincronizar hospitais:', error)
      throw error
    }
  },

  // Nova função para carregar todos os dados SIGTAP únicos de uma vez
  async getAllSigtapProceduresUnique() {
    try {
      console.log('🔄 Carregando TODOS os procedimentos SIGTAP únicos...')
      
      // Carregar todos os dados de uma vez
      const { data: allData, error } = await externalSupabase
        .from('sigtap_procedures')
        .select('*')
        .order('code', { ascending: true })
      
      if (error) {
        console.error('❌ Erro ao carregar dados SIGTAP:', error)
        throw new Error(`Erro Supabase: ${error.message}`)
      }
      
      if (!Array.isArray(allData)) {
        throw new Error('Dados inválidos retornados')
      }
      
      console.log(`📊 Total de registros carregados: ${allData.length}`)
      
      // Remover duplicatas baseado no código
      const uniqueData = allData.filter((item, index, array) => 
        array.findIndex(i => i.code === item.code) === index
      )
      
      console.log(`✅ Procedimentos únicos: ${uniqueData.length} de ${allData.length} registros`)
      console.log(`🎯 Taxa de duplicação: ${((allData.length - uniqueData.length) / allData.length * 100).toFixed(1)}%`)
      
      return uniqueData
    } catch (error) {
      console.error('❌ Erro ao carregar todos os procedimentos SIGTAP:', error)
      throw error
    }
  }
}

// Função para sincronizar dados entre os dois projetos (se necessário)
export const syncDataBetweenProjects = {
  // Exemplo: copiar hospitais do projeto externo para o atual
  async syncHospitais() {
    try {
      const hospitaisExternos = await externalDataService.getHospitais()
      console.log('Hospitais encontrados no projeto externo:', hospitaisExternos.length)
      
      return hospitaisExternos
    } catch (error) {
      console.error('Erro ao sincronizar hospitais:', error)
      throw error
    }
  }
}

// ============================================
// EXPORT DEFAULT
// ============================================
export default externalDataService
