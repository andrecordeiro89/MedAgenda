import React, { createContext, useContext, useState, ReactNode } from 'react'

// Tipos para os dados em cache
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

interface ExternalProcedureRecord {
  codigo_procedimento_original: string
  procedure_description: string
  complexity?: string
}

// Estado do cache
interface CacheState {
  sigtapProcedures: {
    data: SigtapProcedure[]
    loading: boolean
    error: string | null
    lastLoaded: number | null
    progress?: {
      current: number
      total: number
      percentage: number
      message?: string
    }
  }
  mostUsedProcedures: {
    data: ExternalProcedureRecord[]
    loading: boolean
    error: string | null
    lastLoaded: number | null
    progress?: {
      current: number
      total: number
      percentage: number
      message?: string
    }
  }
}

// Ações do cache
interface CacheActions {
  // SIGTAP Procedures
  setSigtapProcedures: (data: SigtapProcedure[]) => void
  setSigtapLoading: (loading: boolean) => void
  setSigtapError: (error: string | null) => void
  setSigtapProgress: (progress: { current: number; total: number; percentage: number; message?: string } | undefined) => void
  clearSigtapCache: () => void
  
  // Most Used Procedures
  setMostUsedProcedures: (data: ExternalProcedureRecord[]) => void
  setMostUsedLoading: (loading: boolean) => void
  setMostUsedError: (error: string | null) => void
  setMostUsedProgress: (progress: { current: number; total: number; percentage: number; message?: string } | undefined) => void
  clearMostUsedCache: () => void
  
  // Geral
  clearAllCache: () => void
  isCacheValid: (cacheKey: 'sigtap' | 'mostUsed', maxAgeMinutes?: number) => boolean
}

type DataCacheContextType = CacheState & CacheActions

// Estado inicial
const initialState: CacheState = {
  sigtapProcedures: {
    data: [],
    loading: false,
    error: null,
    lastLoaded: null
  },
  mostUsedProcedures: {
    data: [],
    loading: false,
    error: null,
    lastLoaded: null
  }
}

// Context
const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

// Provider
interface DataCacheProviderProps {
  children: ReactNode
}

export const DataCacheProvider: React.FC<DataCacheProviderProps> = ({ children }) => {
  const [state, setState] = useState<CacheState>(initialState)

  // SIGTAP Procedures Actions
  const setSigtapProcedures = (data: SigtapProcedure[]) => {
    setState(prev => ({
      ...prev,
      sigtapProcedures: {
        ...prev.sigtapProcedures,
        data,
        lastLoaded: Date.now(),
        error: null
      }
    }))
  }

  const setSigtapLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      sigtapProcedures: {
        ...prev.sigtapProcedures,
        loading
      }
    }))
  }

  const setSigtapError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      sigtapProcedures: {
        ...prev.sigtapProcedures,
        error,
        loading: false
      }
    }))
  }

  const setSigtapProgress = (progress: { current: number; total: number; percentage: number; message?: string } | undefined) => {
    setState(prev => ({
      ...prev,
      sigtapProcedures: {
        ...prev.sigtapProcedures,
        progress
      }
    }))
  }

  const clearSigtapCache = () => {
    setState(prev => ({
      ...prev,
      sigtapProcedures: {
        data: [],
        loading: false,
        error: null,
        lastLoaded: null,
        progress: undefined
      }
    }))
  }

  // Most Used Procedures Actions
  const setMostUsedProcedures = (data: ExternalProcedureRecord[]) => {
    setState(prev => ({
      ...prev,
      mostUsedProcedures: {
        ...prev.mostUsedProcedures,
        data,
        lastLoaded: Date.now(),
        error: null
      }
    }))
  }

  const setMostUsedLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      mostUsedProcedures: {
        ...prev.mostUsedProcedures,
        loading
      }
    }))
  }

  const setMostUsedError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      mostUsedProcedures: {
        ...prev.mostUsedProcedures,
        error,
        loading: false
      }
    }))
  }

  const setMostUsedProgress = (progress: { current: number; total: number; percentage: number; message?: string } | undefined) => {
    setState(prev => ({
      ...prev,
      mostUsedProcedures: {
        ...prev.mostUsedProcedures,
        progress
      }
    }))
  }

  const clearMostUsedCache = () => {
    setState(prev => ({
      ...prev,
      mostUsedProcedures: {
        data: [],
        loading: false,
        error: null,
        lastLoaded: null,
        progress: undefined
      }
    }))
  }

  // Ações gerais
  const clearAllCache = () => {
    setState(initialState)
  }

  const isCacheValid = (cacheKey: 'sigtap' | 'mostUsed', maxAgeMinutes: number = 30): boolean => {
    const cache = cacheKey === 'sigtap' ? state.sigtapProcedures : state.mostUsedProcedures
    
    if (!cache.lastLoaded || cache.data.length === 0) {
      return false
    }

    const now = Date.now()
    const maxAge = maxAgeMinutes * 60 * 1000 // Converter para millisegundos
    
    return (now - cache.lastLoaded) < maxAge
  }

  const value: DataCacheContextType = {
    ...state,
    setSigtapProcedures,
    setSigtapLoading,
    setSigtapError,
    setSigtapProgress,
    clearSigtapCache,
    setMostUsedProcedures,
    setMostUsedLoading,
    setMostUsedError,
    setMostUsedProgress,
    clearMostUsedCache,
    clearAllCache,
    isCacheValid
  }

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  )
}

// Hook para usar o cache
export const useDataCache = (): DataCacheContextType => {
  const context = useContext(DataCacheContext)
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider')
  }
  return context
}

export default DataCacheContext