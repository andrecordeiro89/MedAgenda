import { createClient } from '@supabase/supabase-js'
import { 
  Agendamento, 
  Medico, 
  Procedimento,
  StatusLiberacao,
  TipoAgendamento 
} from '../types'

// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================
// SUBSTITUA ESTAS VARIÁVEIS PELAS SUAS CREDENCIAIS DO SUPABASE
const supabaseUrl = 'https://teidsiqsligaksuwmczt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaWRzaXFzbGlnYWtzdXdtY3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTk1MjQsImV4cCI6MjA3NDEzNTUyNH0.BPe-_iLNyNicOx-nrQIqCdi3TFUudYs90Lq5lwhHvzg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS PARA O SUPABASE
// ============================================
interface SupabaseMedico {
  id: string
  nome: string
  especialidade: string
  crm: string
  telefone: string
  email: string
  hospital_id?: string
  created_at?: string
  updated_at?: string
}

interface SupabaseProcedimento {
  id: string
  nome: string
  tipo: 'cirurgico' | 'ambulatorial'
  duracao_estimada_min: number
  descricao?: string
  hospital_id?: string
  created_at?: string
  updated_at?: string
}

interface SupabaseAgendamento {
  id: string
  nome_paciente: string
  data_nascimento: string
  cidade_natal?: string
  telefone?: string
  whatsapp?: string
  data_agendamento: string
  status_liberacao: 'pendente' | 'liberado'
  medico_id: string
  procedimento_id: string
  hospital_id?: string
  created_at?: string
  updated_at?: string
}

interface AgendamentoCompleto extends SupabaseAgendamento {
  idade?: number
  medico_nome?: string
  medico_especialidade?: string
  procedimento_nome?: string
  procedimento_tipo?: 'cirurgico' | 'ambulatorial'
}

// ============================================
// FUNÇÕES DE CONVERSÃO
// ============================================
export const convertMedicoFromSupabase = (medico: SupabaseMedico): Medico => ({
  id: medico.id,
  nome: medico.nome,
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
  hospitalId: medico.hospital_id,
})

export const convertMedicoToSupabase = (medico: Omit<Medico, 'id'>): Omit<SupabaseMedico, 'id' | 'created_at' | 'updated_at'> => ({
  nome: medico.nome,
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
})

export const convertProcedimentoFromSupabase = (procedimento: SupabaseProcedimento): Procedimento => ({
  id: procedimento.id,
  nome: procedimento.nome,
  tipo: procedimento.tipo,
  duracaoEstimada: procedimento.duracao_estimada_min,
  descricao: procedimento.descricao || '',
  hospitalId: procedimento.hospital_id,
})

export const convertProcedimentoToSupabase = (procedimento: Omit<Procedimento, 'id'>): Omit<SupabaseProcedimento, 'id' | 'created_at' | 'updated_at'> => ({
  nome: procedimento.nome,
  tipo: procedimento.tipo,
  duracao_estimada_min: procedimento.duracaoEstimada,
  descricao: procedimento.descricao,
})

export const convertAgendamentoFromSupabase = (agendamento: AgendamentoCompleto): Agendamento => ({
  id: agendamento.id,
  nome: agendamento.nome_paciente,
  dataNascimento: agendamento.data_nascimento,
  idade: agendamento.idade || 0,
  procedimentoId: agendamento.procedimento_id,
  medicoId: agendamento.medico_id,
  cidadeNatal: agendamento.cidade_natal || '',
  statusLiberacao: agendamento.status_liberacao === 'liberado' ? 'v' : 'x',
  telefone: agendamento.telefone || '',
  whatsapp: agendamento.whatsapp || '',
  dataAgendamento: agendamento.data_agendamento,
  tipo: agendamento.procedimento_tipo || 'ambulatorial',
  hospitalId: agendamento.hospital_id,
})

export const convertAgendamentoToSupabase = (agendamento: Omit<Agendamento, 'id' | 'idade' | 'tipo'>): Omit<SupabaseAgendamento, 'id' | 'created_at' | 'updated_at'> => ({
  nome_paciente: agendamento.nome,
  data_nascimento: agendamento.dataNascimento,
  cidade_natal: agendamento.cidadeNatal || null,
  telefone: agendamento.telefone || null,
  whatsapp: agendamento.whatsapp || null,
  data_agendamento: agendamento.dataAgendamento,
  status_liberacao: agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente',
  medico_id: agendamento.medicoId,
  procedimento_id: agendamento.procedimentoId,
})

// ============================================
// SERVIÇOS PARA MÉDICOS
// ============================================
export const medicoService = {
  async getAll(search?: string): Promise<Medico[]> {
    let query = supabase.from('medicos').select('*').order('nome')
    
    if (search) {
      query = query.or(`nome.ilike.%${search}%,especialidade.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    return (data || []).map(convertMedicoFromSupabase)
  },

  async getById(id: string): Promise<Medico> {
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Médico não encontrado')
    
    return convertMedicoFromSupabase(data)
  },

  async create(medico: Omit<Medico, 'id'>): Promise<Medico> {
    const { data, error } = await supabase
      .from('medicos')
      .insert(convertMedicoToSupabase(medico))
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Erro ao criar médico')
    
    return convertMedicoFromSupabase(data)
  },

  async update(id: string, medico: Partial<Omit<Medico, 'id'>>): Promise<Medico> {
    const updateData: any = {}
    if (medico.nome !== undefined) updateData.nome = medico.nome
    if (medico.especialidade !== undefined) updateData.especialidade = medico.especialidade
    if (medico.crm !== undefined) updateData.crm = medico.crm
    if (medico.telefone !== undefined) updateData.telefone = medico.telefone
    if (medico.email !== undefined) updateData.email = medico.email

    const { data, error } = await supabase
      .from('medicos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Médico não encontrado')
    
    return convertMedicoFromSupabase(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  }
}

// ============================================
// SERVIÇOS PARA PROCEDIMENTOS
// ============================================
export const procedimentoService = {
  async getAll(search?: string, tipo?: TipoAgendamento): Promise<Procedimento[]> {
    let query = supabase.from('procedimentos').select('*').order('nome')
    
    if (search) {
      query = query.ilike('nome', `%${search}%`)
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo)
    }
    
    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    return (data || []).map(convertProcedimentoFromSupabase)
  },

  async getById(id: string): Promise<Procedimento> {
    const { data, error } = await supabase
      .from('procedimentos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Procedimento não encontrado')
    
    return convertProcedimentoFromSupabase(data)
  },

  async create(procedimento: Omit<Procedimento, 'id'>): Promise<Procedimento> {
    const { data, error } = await supabase
      .from('procedimentos')
      .insert(convertProcedimentoToSupabase(procedimento))
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Erro ao criar procedimento')
    
    return convertProcedimentoFromSupabase(data)
  },

  async update(id: string, procedimento: Partial<Omit<Procedimento, 'id'>>): Promise<Procedimento> {
    const updateData: any = {}
    if (procedimento.nome !== undefined) updateData.nome = procedimento.nome
    if (procedimento.tipo !== undefined) updateData.tipo = procedimento.tipo
    if (procedimento.duracaoEstimada !== undefined) updateData.duracao_estimada_min = procedimento.duracaoEstimada
    if (procedimento.descricao !== undefined) updateData.descricao = procedimento.descricao

    const { data, error } = await supabase
      .from('procedimentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Procedimento não encontrado')
    
    return convertProcedimentoFromSupabase(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('procedimentos')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  }
}

// ============================================
// SERVIÇOS PARA AGENDAMENTOS
// ============================================
export const agendamentoService = {
  async getAll(params?: {
    search?: string
    startDate?: string
    endDate?: string
    medicoId?: string
    status?: StatusLiberacao
  }): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos_completos')
      .select('*')
      .order('data_agendamento')
    
    if (error) throw new Error(error.message)
    
    let filteredData = data || []
    
    // Aplicar filtros
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      filteredData = filteredData.filter(item => 
        item.nome_paciente.toLowerCase().includes(searchLower) ||
        item.medico_nome?.toLowerCase().includes(searchLower)
      )
    }
    
    if (params?.startDate) {
      filteredData = filteredData.filter(item => item.data_agendamento >= params.startDate!)
    }
    
    if (params?.endDate) {
      filteredData = filteredData.filter(item => item.data_agendamento <= params.endDate!)
    }
    
    if (params?.medicoId) {
      filteredData = filteredData.filter(item => item.medico_id === params.medicoId)
    }
    
    if (params?.status) {
      const statusSupabase = params.status === 'v' ? 'liberado' : 'pendente'
      filteredData = filteredData.filter(item => item.status_liberacao === statusSupabase)
    }
    
    return filteredData.map(convertAgendamentoFromSupabase)
  },

  async getById(id: string): Promise<Agendamento> {
    const { data, error } = await supabase
      .from('agendamentos_completos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Agendamento não encontrado')
    
    return convertAgendamentoFromSupabase(data)
  },

  async getByDate(date: string): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos_completos')
      .select('*')
      .eq('data_agendamento', date)
    
    if (error) throw new Error(error.message)
    
    return (data || []).map(convertAgendamentoFromSupabase)
  },

  async create(agendamento: Omit<Agendamento, 'id' | 'idade' | 'tipo'>): Promise<Agendamento> {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert(convertAgendamentoToSupabase(agendamento))
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Erro ao criar agendamento')
    
    // Buscar o agendamento completo
    return this.getById(data.id)
  },

  async update(id: string, agendamento: Partial<Omit<Agendamento, 'id' | 'idade' | 'tipo'>>): Promise<Agendamento> {
    const updateData: any = {}
    if (agendamento.nome !== undefined) updateData.nome_paciente = agendamento.nome
    if (agendamento.dataNascimento !== undefined) updateData.data_nascimento = agendamento.dataNascimento
    if (agendamento.cidadeNatal !== undefined) updateData.cidade_natal = agendamento.cidadeNatal
    if (agendamento.telefone !== undefined) updateData.telefone = agendamento.telefone
    if (agendamento.whatsapp !== undefined) updateData.whatsapp = agendamento.whatsapp
    if (agendamento.dataAgendamento !== undefined) updateData.data_agendamento = agendamento.dataAgendamento
    if (agendamento.statusLiberacao !== undefined) updateData.status_liberacao = agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente'
    if (agendamento.medicoId !== undefined) updateData.medico_id = agendamento.medicoId
    if (agendamento.procedimentoId !== undefined) updateData.procedimento_id = agendamento.procedimentoId

    const { data, error } = await supabase
      .from('agendamentos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Agendamento não encontrado')
    
    // Buscar o agendamento completo
    return this.getById(data.id)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  },

  async checkConflict(medicoId: string, dataAgendamento: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('agendamentos')
      .select('id')
      .eq('medico_id', medicoId)
      .eq('data_agendamento', dataAgendamento)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }
    
    const { data, error } = await query
    if (error) throw new Error(error.message)
    
    return (data || []).length > 0
  }
}

// ============================================
// SERVIÇOS DE ESTATÍSTICAS
// ============================================
export const estatisticasService = {
  async getDashboard(): Promise<{
    total: number
    pendentes: number
    liberados: number
    cirurgicos: number
    ambulatoriais: number
    proximosAgendamentos: Agendamento[]
  }> {
    // Buscar estatísticas da view
    const { data: stats, error: statsError } = await supabase
      .from('estatisticas_dashboard')
      .select('*')
      .single()
    
    if (statsError) throw new Error(statsError.message)
    
    // Buscar próximos agendamentos
    const { data: proximos, error: proximosError } = await supabase
      .from('agendamentos_completos')
      .select('*')
      .gte('data_agendamento', new Date().toISOString().split('T')[0])
      .order('data_agendamento')
      .limit(5)
    
    if (proximosError) throw new Error(proximosError.message)
    
    return {
      total: stats?.total_agendamentos || 0,
      pendentes: stats?.pendentes || 0,
      liberados: stats?.liberados || 0,
      cirurgicos: stats?.cirurgicos || 0,
      ambulatoriais: stats?.ambulatoriais || 0,
      proximosAgendamentos: (proximos || []).map(convertAgendamentoFromSupabase)
    }
  }
}

// ============================================
// FUNÇÃO PARA TESTAR CONEXÃO
// ============================================
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('medicos').select('count').limit(1)
    return !error
  } catch {
    return false
  }
}
