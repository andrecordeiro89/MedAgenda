import { useState, useEffect } from 'react'
import externalDataService from '../services/external-supabase'

// ============================================
// HOOK PARA GERENCIAR DADOS EXTERNOS
// ============================================
export const useExternalData = () => {
  const [externalData, setExternalData] = useState<{
    hospitais: any[]
    usuarios: any[]
    medicos: any[]
    procedimentos: any[]
    agendamentos: any[]
  }>({
    hospitais: [],
    usuarios: [],
    medicos: [],
    procedimentos: [],
    agendamentos: []
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // Função para testar conexão
  const testConnection = async () => {
    try {
      setLoading(true)
      const isConnected = await externalDataService.testConnection()
      setConnected(isConnected)
      
      if (!isConnected) {
        setError('Não foi possível conectar ao projeto externo')
      } else {
        setError(null)
        console.log('✅ Conexão com projeto externo estabelecida')
      }
      
      return isConnected
    } catch (err) {
      setError('Erro ao testar conexão')
      setConnected(false)
      console.error('❌ Erro na conexão:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar todos os dados
  const loadAllExternalData = async () => {
    if (!connected) {
      console.warn('⚠️ Não conectado ao projeto externo')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando dados do projeto externo...')

      const [hospitais, usuarios, medicos, procedimentos, agendamentos] = await Promise.all([
        externalDataService.getHospitais().catch(err => {
          console.warn('Erro ao carregar hospitais:', err)
          return []
        }),
        externalDataService.getUsuarios().catch(err => {
          console.warn('Erro ao carregar usuários:', err)
          return []
        }),
        externalDataService.getMedicosExternos().catch(err => {
          console.warn('Erro ao carregar médicos:', err)
          return []
        }),
        externalDataService.getProcedimentosExternos().catch(err => {
          console.warn('Erro ao carregar procedimentos:', err)
          return []
        }),
        externalDataService.getAgendamentosExternos().catch(err => {
          console.warn('Erro ao carregar agendamentos:', err)
          return []
        })
      ])

      setExternalData({
        hospitais,
        usuarios,
        medicos,
        procedimentos,
        agendamentos
      })

      console.log('✅ Dados externos carregados:', {
        hospitais: hospitais.length,
        usuarios: usuarios.length,
        medicos: medicos.length,
        procedimentos: procedimentos.length,
        agendamentos: agendamentos.length
      })

    } catch (err) {
      setError('Erro ao carregar dados externos')
      console.error('❌ Erro ao carregar dados externos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar dados específicos de uma tabela
  const loadFromTable = async (tableName: string, options?: any) => {
    if (!connected) {
      console.warn('⚠️ Não conectado ao projeto externo')
      return []
    }

    try {
      setLoading(true)
      const data = await externalDataService.getFromTable(tableName, options)
      console.log(`✅ Dados de ${tableName} carregados:`, data.length)
      return data
    } catch (err) {
      setError(`Erro ao carregar dados de ${tableName}`)
      console.error(`❌ Erro ao carregar ${tableName}:`, err)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar por ID
  const getExternalById = async (tableName: string, id: string) => {
    if (!connected) {
      console.warn('⚠️ Não conectado ao projeto externo')
      return null
    }

    try {
      setLoading(true)
      const data = await externalDataService.getById(tableName, id)
      console.log(`✅ Registro encontrado em ${tableName}:`, data)
      return data
    } catch (err) {
      setError(`Erro ao buscar registro em ${tableName}`)
      console.error(`❌ Erro ao buscar em ${tableName}:`, err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Inicializar conexão quando o hook for montado
  useEffect(() => {
    testConnection()
  }, [])

  return {
    // Estados
    externalData,
    loading,
    error,
    connected,
    
    // Funções
    testConnection,
    loadAllExternalData,
    loadFromTable,
    getExternalById,
    
    // Funções específicas para facilitar o uso
    loadHospitais: () => loadFromTable('hospitais', { order: 'nome' }),
    loadUsuarios: () => loadFromTable('usuarios', { order: 'nome' }),
    loadMedicosExternos: () => loadFromTable('medicos', { order: 'nome' }),
    loadProcedimentosExternos: () => loadFromTable('procedimentos', { order: 'nome' }),
    loadAgendamentosExternos: () => loadFromTable('agendamentos', { order: 'data_agendamento' })
  }
}

// ============================================
// HOOK PARA DADOS ESPECÍFICOS DE HOSPITAIS
// ============================================
export const useExternalHospitals = () => {
  const [hospitais, setHospitais] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHospitais = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await externalDataService.getHospitais()
      setHospitais(data)
      
      console.log('✅ Hospitais externos carregados:', data.length)
    } catch (err) {
      setError('Erro ao carregar hospitais externos')
      console.error('❌ Erro ao carregar hospitais:', err)
    } finally {
      setLoading(false)
    }
  }

  // Removido carregamento automático para evitar erros
  // useEffect(() => {
  //   loadHospitais()
  // }, [])

  return {
    hospitais,
    loading,
    error,
    reload: loadHospitais
  }
}

export default useExternalData
