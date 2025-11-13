import { createClient } from '@supabase/supabase-js'
import { 
  Agendamento, 
  Medico, 
  Procedimento,
  Especialidade,
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
  nome_medico: string // Campo real do banco
  nome?: string // Compatibilidade (fallback)
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
// HELPER: BUSCAR TODOS OS REGISTROS COM PAGINAÇÃO AUTOMÁTICA
// ============================================
// O Supabase limita automaticamente a 1000 registros por query
// Esta função busca todos os registros usando paginação automática
export async function getAllRecordsWithPagination<T>(
  tableName: string,
  options?: {
    filter?: (query: any) => any;
    orderBy?: string;
    ascending?: boolean;
  }
): Promise<T[]> {
  const BATCH_SIZE = 1000; // Tamanho do lote (limite do Supabase)
  const allRecords: T[] = [];
  let from = 0;
  let hasMore = true;

  console.log(`🔄 Buscando TODOS os registros de ${tableName} com paginação automática...`);

  while (hasMore) {
    let query = supabase
      .from(tableName)
      .select('*')
      .range(from, from + BATCH_SIZE - 1);

    // Aplicar filtros se fornecidos
    if (options?.filter) {
      query = options.filter(query);
    }

    // Aplicar ordenação se fornecida
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options?.ascending ?? true });
    } else {
      // Ordenação padrão por id se não especificada
      query = query.order('id', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`❌ Erro ao buscar ${tableName} (lote ${from}-${from + BATCH_SIZE - 1}):`, error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      allRecords.push(...(data as T[]));
      console.log(`📦 Lote ${Math.floor(from / BATCH_SIZE) + 1}: ${data.length} registros (Total: ${allRecords.length})`);

      // Se retornou menos que o tamanho do lote, não há mais registros
      if (data.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        from += BATCH_SIZE;
      }
    } else {
      hasMore = false;
    }

    // Limite de segurança para evitar loops infinitos (máximo 1 milhão de registros)
    if (from > 1000000) {
      console.warn('⚠️ Limite de segurança atingido (1 milhão de registros)');
      hasMore = false;
    }
  }

  console.log(`✅ Total de registros de ${tableName} carregados: ${allRecords.length}`);
  return allRecords;
}

// ============================================
// FUNÇÕES DE CONVERSÃO
// ============================================
export const convertMedicoFromSupabase = (medico: SupabaseMedico): Medico => ({
  id: medico.id,
  nome: medico.nome_medico || medico.nome || '', // Usar nome_medico como principal
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
  hospitalId: medico.hospital_id,
})

export const convertMedicoToSupabase = (medico: Omit<Medico, 'id'>): Omit<SupabaseMedico, 'id' | 'created_at' | 'updated_at'> => ({
  nome_medico: medico.nome,
  especialidade: medico.especialidade,
  crm: medico.crm,
  telefone: medico.telefone,
  email: medico.email,
  hospital_id: medico.hospitalId,
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
  async getAll(hospitalId?: string, search?: string): Promise<Medico[]> {
    console.log('🔍 medicoService.getAll chamado com:', { hospitalId, search });
    
    // Usar paginação automática para buscar TODOS os registros
    const allMedicos = await getAllRecordsWithPagination<SupabaseMedico>('medicos', {
      filter: (query) => {
        let filteredQuery = query;
        // Filtrar por hospital_id se fornecido
        if (hospitalId) {
          console.log('🏥 Filtrando por hospital_id:', hospitalId);
          filteredQuery = filteredQuery.eq('hospital_id', hospitalId);
        } else {
          console.warn('⚠️ hospitalId não fornecido, buscando todos os médicos');
        }
        // Buscar por nome_medico se fornecido
        if (search) {
          filteredQuery = filteredQuery.ilike('nome_medico', `%${search}%`);
        }
        return filteredQuery;
      },
      orderBy: 'nome_medico',
      ascending: true
    });
    
    console.log('📊 Médicos retornados do Supabase:', allMedicos.length);
    if (allMedicos.length > 0) {
      console.log('👨‍⚕️ Primeiros médicos:', allMedicos.slice(0, 3).map(m => ({ id: m.id, nome_medico: m.nome_medico, hospital_id: m.hospital_id })));
    }
    
    return allMedicos.map(convertMedicoFromSupabase)
  },
  
  // Função específica para buscar médicos por nome (para autocomplete)
  async searchByName(hospitalId: string, searchTerm: string): Promise<Medico[]> {
    let query = supabase
      .from('medicos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .ilike('nome_medico', `%${searchTerm}%`)
      .order('nome_medico')
      .limit(20) // Limitar resultados para performance
    
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
    if (medico.nome !== undefined) updateData.nome_medico = medico.nome
    if (medico.especialidade !== undefined) updateData.especialidade = medico.especialidade
    if (medico.crm !== undefined) updateData.crm = medico.crm
    if (medico.telefone !== undefined) updateData.telefone = medico.telefone
    if (medico.email !== undefined) updateData.email = medico.email
    if (medico.hospitalId !== undefined) updateData.hospital_id = medico.hospitalId

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
    // Usar paginação automática para buscar TODOS os registros
    const allProcedimentos = await getAllRecordsWithPagination<SupabaseProcedimento>('procedimentos', {
      filter: (query) => {
        let filteredQuery = query;
        if (search) {
          filteredQuery = filteredQuery.ilike('nome', `%${search}%`);
        }
        if (tipo) {
          filteredQuery = filteredQuery.eq('tipo', tipo);
        }
        return filteredQuery;
      },
      orderBy: 'nome',
      ascending: true
    });
    
    return allProcedimentos.map(convertProcedimentoFromSupabase)
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
  async getAll(hospitalId?: string): Promise<Agendamento[]> {
    console.log('🔍 agendamentoService.getAll chamado com hospitalId:', hospitalId);
    
    // Usar paginação automática para buscar TODOS os registros
    const allAgendamentos = await getAllRecordsWithPagination<any>('agendamentos', {
      filter: (query) => {
        let filteredQuery = query;
        if (hospitalId) {
          filteredQuery = filteredQuery.eq('hospital_id', hospitalId);
        }
        return filteredQuery;
      },
      orderBy: 'data_agendamento',
      ascending: true
    });
    
    console.log('✅ agendamentoService.getAll retornou:', allAgendamentos.length, 'agendamentos');
    if (allAgendamentos.length > 0) {
      console.log('📋 Primeiro agendamento:', {
        id: allAgendamentos[0].id,
        data_agendamento: allAgendamentos[0].data_agendamento,
        especialidade: allAgendamentos[0].especialidade,
        procedimentos: allAgendamentos[0].procedimentos,
        nome_paciente: allAgendamentos[0].nome_paciente,
        hospital_id: allAgendamentos[0].hospital_id
      });
    }
    
    // Converter dados do Supabase para o formato esperado pelo frontend
    // Manter ambos os formatos (data_agendamento e dataAgendamento) para compatibilidade
    return allAgendamentos.map((item: any) => ({
      ...item,
      // Manter campos originais do banco
      data_agendamento: item.data_agendamento,
      nome_paciente: item.nome_paciente || '',
      especialidade: item.especialidade || null,
      procedimentos: item.procedimentos || null,
      // Adicionar campos de compatibilidade
      dataAgendamento: item.data_agendamento,
      nome: item.nome_paciente || '',
      hospitalId: item.hospital_id,
      hospital_id: item.hospital_id
    })) as Agendamento[];
  },

  async getById(id: string): Promise<Agendamento> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Agendamento não encontrado')
    
    return data as Agendamento
  },

  async getByDate(date: string): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', date)
    
    if (error) throw new Error(error.message)
    
    return data as Agendamento[]
  },

  async create(agendamento: Omit<Agendamento, 'id' | 'created_at' | 'updated_at'>): Promise<Agendamento> {
    console.log('💾 Salvando agendamento no Supabase...', agendamento);
    
    const insertData = {
      nome_paciente: agendamento.nome_paciente,
      data_nascimento: agendamento.data_nascimento,
      data_agendamento: agendamento.data_agendamento,
      data_consulta: agendamento.data_consulta || null,
      especialidade: agendamento.especialidade || null,
      medico: agendamento.medico || null,
      procedimentos: agendamento.procedimentos || null,
      hospital_id: agendamento.hospital_id || null,
      cidade_natal: agendamento.cidade_natal || null,
      telefone: agendamento.telefone || null,
      is_grade_cirurgica: agendamento.is_grade_cirurgica || false
    };
    
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([insertData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Agendamento salvo com sucesso!', data);
    return data as Agendamento;
  },

  async update(id: string, agendamento: Partial<Omit<Agendamento, 'id' | 'idade' | 'tipo'>>): Promise<Agendamento> {
    console.log('🔄 Atualizando agendamento no Supabase...', { id, agendamento });
    
    const updateData: any = {}
    // Campos antigos (compatibilidade)
    if (agendamento.nome !== undefined) updateData.nome_paciente = agendamento.nome
    if (agendamento.dataNascimento !== undefined) updateData.data_nascimento = agendamento.dataNascimento
    if (agendamento.cidadeNatal !== undefined) updateData.cidade_natal = agendamento.cidadeNatal
    if (agendamento.whatsapp !== undefined) updateData.whatsapp = agendamento.whatsapp
    if (agendamento.dataAgendamento !== undefined) updateData.data_agendamento = agendamento.dataAgendamento
    if (agendamento.statusLiberacao !== undefined) updateData.status_liberacao = agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente'
    if (agendamento.medicoId !== undefined) updateData.medico_id = agendamento.medicoId
    if (agendamento.procedimentoId !== undefined) updateData.procedimento_id = agendamento.procedimentoId
    
    // Novos campos diretos
    if (agendamento.nome_paciente !== undefined) updateData.nome_paciente = agendamento.nome_paciente
    if (agendamento.data_nascimento !== undefined) updateData.data_nascimento = agendamento.data_nascimento
    if (agendamento.telefone !== undefined) updateData.telefone = agendamento.telefone
    if (agendamento.cidade_natal !== undefined) updateData.cidade_natal = agendamento.cidade_natal
    if (agendamento.data_consulta !== undefined) updateData.data_consulta = agendamento.data_consulta
    if (agendamento.especialidade !== undefined) updateData.especialidade = agendamento.especialidade
    if (agendamento.medico !== undefined) updateData.medico = agendamento.medico
    if (agendamento.procedimentos !== undefined) updateData.procedimentos = agendamento.procedimentos
    
    // Campos de documentação
    if (agendamento.documentos_ok !== undefined) updateData.documentos_ok = agendamento.documentos_ok
    if (agendamento.documentos_urls !== undefined) updateData.documentos_urls = agendamento.documentos_urls
    if (agendamento.documentos_data !== undefined) updateData.documentos_data = agendamento.documentos_data
    if (agendamento.ficha_pre_anestesica_ok !== undefined) updateData.ficha_pre_anestesica_ok = agendamento.ficha_pre_anestesica_ok
    if (agendamento.ficha_pre_anestesica_url !== undefined) updateData.ficha_pre_anestesica_url = agendamento.ficha_pre_anestesica_url
    if (agendamento.ficha_pre_anestesica_data !== undefined) updateData.ficha_pre_anestesica_data = agendamento.ficha_pre_anestesica_data
    if (agendamento.observacoes !== undefined) updateData.observacoes = agendamento.observacoes
    
    // Campo de grade cirúrgica
    if (agendamento.is_grade_cirurgica !== undefined) updateData.is_grade_cirurgica = agendamento.is_grade_cirurgica

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        throw new Error(error.message);
      }
      if (!data) throw new Error('Agendamento não encontrado')
      
      console.log('✅ Agendamento atualizado com sucesso!', data);
      return data as Agendamento;
    } catch (error: any) {
      // Se o erro for sobre updated_at, tentar sem trigger
      if (error.message?.includes('updated_at')) {
        console.warn('⚠️ Tentando UPDATE sem updated_at...');
        
        // Tentar novamente com raw SQL se possível
        const { data, error: error2 } = await supabase
          .from('agendamentos')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
        
        if (error2) throw new Error(error2.message);
        if (!data) throw new Error('Agendamento não encontrado')
        
        return data as Agendamento;
      }
      throw error;
    }
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
      .from('agendamentos')
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
      proximosAgendamentos: proximos as Agendamento[] || []
    }
  }
}

// ============================================
// SERVICE: ESPECIALIDADES
// ============================================
export const especialidadeService = {
  // Buscar TODAS as especialidades da tabela
  async getAll(): Promise<Especialidade[]> {
    console.log('🔍 Buscando especialidades do Supabase...');
    
    // Usar paginação automática para buscar TODAS as especialidades
    const allEspecialidades = await getAllRecordsWithPagination<Especialidade>('especialidades', {
      orderBy: 'nome',
      ascending: true
    });
    
    console.log(`✅ ${allEspecialidades.length} especialidades encontradas no banco`);
    
    return allEspecialidades;
  }
};


// ============================================
// FUNÇÃO PARA TESTAR CONEXÃO
// ============================================
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('especialidades').select('count').limit(1)
    return !error
  } catch {
    return false
  }
}
