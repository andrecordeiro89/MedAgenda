import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ToastContainer, ToastType } from '../components/Toast'

type ToastItem = { id: string; message: string; type: ToastType }

interface ToastContextValue {
  add: (message: string, type: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const add = (message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, message, type }])
  }

  const value: ToastContextValue = {
    add,
    success: (m: string) => add(m, 'success'),
    error: (m: string) => add(m, 'error'),
    warning: (m: string) => add(m, 'warning'),
    info: (m: string) => add(m, 'info')
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={remove} />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}

