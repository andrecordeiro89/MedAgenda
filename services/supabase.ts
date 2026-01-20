import { createClient } from '@supabase/supabase-js'
import { 
  Agendamento, 
  Medico, 
  Procedimento,
  Especialidade,
  Cidade,
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
  status_liberacao: string
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
  nome_paciente: agendamento.nome_paciente,
  data_nascimento: agendamento.data_nascimento,
  idade: agendamento.idade || 0,
  procedimentoId: agendamento.procedimento_id,
  medicoId: agendamento.medico_id,
  cidadeNatal: agendamento.cidade_natal || '',
  status_liberacao: agendamento.status_liberacao === 'pendente' ? 'anestesista' : (agendamento.status_liberacao as any),
  telefone: agendamento.telefone || '',
  whatsapp: agendamento.whatsapp || '',
  data_agendamento: agendamento.data_agendamento,
  tipo: agendamento.procedimento_tipo || 'ambulatorial',
  hospitalId: agendamento.hospital_id,
  // Compatibilidade antiga
  nome: agendamento.nome_paciente,
  dataNascimento: agendamento.data_nascimento,
  dataAgendamento: agendamento.data_agendamento,
})

export const convertAgendamentoToSupabase = (agendamento: Omit<Agendamento, 'id' | 'idade' | 'tipo'>): Omit<SupabaseAgendamento, 'id' | 'created_at' | 'updated_at'> => ({
  nome_paciente: agendamento.nome,
  data_nascimento: agendamento.dataNascimento,
  cidade_natal: agendamento.cidadeNatal || null,
  telefone: agendamento.telefone || null,
  whatsapp: agendamento.whatsapp || null,
  data_agendamento: agendamento.dataAgendamento,
  status_liberacao: agendamento.status_liberacao || 'anestesista',
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
      status_aih: item.status_aih ?? null,
      status_de_liberacao: item.status_de_liberacao ?? null,
      confirmacao: item.confirmacao || 'Aguardando',
      tipo_de_exame: item.tipo_de_exame ?? null,
      documentos_meta: item.documentos_meta ?? null,
      observacao_agendamento: item.observacao_agendamento ?? null,
      observacao_faturamento: item.observacao_faturamento ?? null,
      faturamento_observacao: item.faturamento_observacao ?? null,
      justificativa_alteracao_agendamento: item.justificativa_alteracao_agendamento ?? null,
      justificativa_alteracao_agendamento_nome: item.justificativa_alteracao_agendamento_nome ?? null,
      justificativa_alteracao_agendamento_nome_hora: item.justificativa_alteracao_agendamento_nome_hora ?? null,
      n_prontuario: item.n_prontuario ?? null,
      // Alias para compatibilidade em locais que usam 'prontuario'
      prontuario: item.n_prontuario ?? null,
      especialidade: item.especialidade || null,
      procedimentos: item.procedimentos || null,
      procedimento_especificacao: item.procedimento_especificacao || null,
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

  async getByDateHospital(date: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', date)
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data as Agendamento[]
  },

  async getByMonthHospital(year: number, month0: number, hospitalId?: string): Promise<Agendamento[]> {
    const start = new Date(year, month0, 1).toISOString().split('T')[0];
    const end = new Date(year, month0 + 1, 0).toISOString().split('T')[0];
    let query = supabase
      .from('agendamentos')
      .select('*')
      .gte('data_agendamento', start)
      .lte('data_agendamento', end);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },
  
  async getByDateRangeHospital(startIso: string, endIso: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .gte('data_agendamento', startIso)
      .lte('data_agendamento', endIso);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },

  async searchByPacienteHospital(term: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .ilike('nome_paciente', `%${term}%`);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },

  async getByConsultaDateHospital(dateIso: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .eq('data_consulta', dateIso);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },
  async getByCirurgiaDateHospital(dateIso: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', dateIso);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },
  async searchByProntuarioHospital(termDigits: string, hospitalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .ilike('n_prontuario', `%${termDigits}%`);
    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as Agendamento[];
  },

  async create(agendamento: Omit<Agendamento, 'id' | 'created_at' | 'updated_at'>): Promise<Agendamento> {
    console.log('💾 Salvando agendamento no Supabase...', agendamento);
    
    // Garantir que status_liberacao sempre tenha um valor padrão 'anestesista'
    const statusLiberacao = agendamento.status_liberacao || 'anestesista';
    
    const insertData = {
      nome_paciente: agendamento.nome_paciente,
      data_nascimento: agendamento.data_nascimento,
      data_agendamento: agendamento.data_agendamento,
      data_consulta: agendamento.data_consulta || null,
      n_prontuario: agendamento.n_prontuario || null,
      especialidade: agendamento.especialidade || null,
      medico: agendamento.medico || null,
      // REMOVIDO: medico_id não existe no schema do banco
      procedimentos: agendamento.procedimentos || null,
      procedimento_especificacao: agendamento.procedimento_especificacao || null,
      hospital_id: agendamento.hospital_id || null,
      cidade_natal: agendamento.cidade_natal || null,
      telefone: agendamento.telefone || null,
      is_grade_cirurgica: agendamento.is_grade_cirurgica || false,
      status_liberacao: statusLiberacao, // Sempre define um valor (padrão: 'anestesista')
      confirmacao: agendamento.confirmacao || 'Aguardando' // Padrão: 'Aguardando'
    };
    
    console.log('📋 Status liberação definido:', statusLiberacao);
    
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
    
    // REMOVIDO: medicoId e procedimentoId - essas colunas não existem no schema
    
    // Novos campos diretos
    if (agendamento.nome_paciente !== undefined) updateData.nome_paciente = agendamento.nome_paciente
    if (agendamento.data_nascimento !== undefined) updateData.data_nascimento = agendamento.data_nascimento
    if (agendamento.data_agendamento !== undefined) updateData.data_agendamento = agendamento.data_agendamento // ✅ ADICIONADO
    if (agendamento.telefone !== undefined) updateData.telefone = agendamento.telefone
    if (agendamento.cidade_natal !== undefined) updateData.cidade_natal = agendamento.cidade_natal
    if (agendamento.data_consulta !== undefined) updateData.data_consulta = agendamento.data_consulta
    if (agendamento.n_prontuario !== undefined) updateData.n_prontuario = agendamento.n_prontuario
    if (agendamento.status_aih !== undefined) updateData.status_aih = agendamento.status_aih
    if (agendamento.status_de_liberacao !== undefined) updateData.status_de_liberacao = agendamento.status_de_liberacao
    if (agendamento.tipo_de_exame !== undefined) updateData.tipo_de_exame = agendamento.tipo_de_exame
    if (agendamento.documentos_meta !== undefined) updateData.documentos_meta = agendamento.documentos_meta
    if (agendamento.observacao_agendamento !== undefined) updateData.observacao_agendamento = agendamento.observacao_agendamento
    if (agendamento.especialidade !== undefined) updateData.especialidade = agendamento.especialidade
    if (agendamento.medico !== undefined) updateData.medico = agendamento.medico
    // REMOVIDO: medico_id não existe no schema
    if (agendamento.procedimentos !== undefined) updateData.procedimentos = agendamento.procedimentos
    if (agendamento.procedimento_especificacao !== undefined) updateData.procedimento_especificacao = agendamento.procedimento_especificacao
    
    // Campos de documentação
    if (agendamento.documentos_ok !== undefined) updateData.documentos_ok = agendamento.documentos_ok
    if (agendamento.documentos_urls !== undefined) updateData.documentos_urls = agendamento.documentos_urls
    if (agendamento.documentos_data !== undefined) updateData.documentos_data = agendamento.documentos_data
    if (agendamento.ficha_pre_anestesica_ok !== undefined) updateData.ficha_pre_anestesica_ok = agendamento.ficha_pre_anestesica_ok
    if (agendamento.ficha_pre_anestesica_url !== undefined) updateData.ficha_pre_anestesica_url = agendamento.ficha_pre_anestesica_url
    if (agendamento.ficha_pre_anestesica_data !== undefined) updateData.ficha_pre_anestesica_data = agendamento.ficha_pre_anestesica_data
    if (agendamento.observacoes !== undefined) updateData.observacoes = agendamento.observacoes
    
    // Campos de avaliação do anestesista
    if (agendamento.avaliacao_anestesista !== undefined) updateData.avaliacao_anestesista = agendamento.avaliacao_anestesista
    if (agendamento.avaliacao_anestesista_observacao !== undefined) updateData.avaliacao_anestesista_observacao = agendamento.avaliacao_anestesista_observacao
    if (agendamento.avaliacao_anestesista_motivo_reprovacao !== undefined) updateData.avaliacao_anestesista_motivo_reprovacao = agendamento.avaliacao_anestesista_motivo_reprovacao
    if (agendamento.avaliacao_anestesista_complementares !== undefined) updateData.avaliacao_anestesista_complementares = agendamento.avaliacao_anestesista_complementares
    if (agendamento.avaliacao_anestesista_data !== undefined) updateData.avaliacao_anestesista_data = agendamento.avaliacao_anestesista_data
    
    // Status de liberação (campo direto)
    if (agendamento.status_liberacao !== undefined) updateData.status_liberacao = agendamento.status_liberacao
    
    // Confirmação
    if (agendamento.confirmacao !== undefined) updateData.confirmacao = agendamento.confirmacao
    
    // Campo de grade cirúrgica
    if (agendamento.is_grade_cirurgica !== undefined) updateData.is_grade_cirurgica = agendamento.is_grade_cirurgica
    
    // Campos de faturamento G-SUS
    if (agendamento.faturamento_liberado !== undefined) updateData.faturamento_liberado = agendamento.faturamento_liberado
    if (agendamento.faturamento_observacao !== undefined) updateData.faturamento_observacao = agendamento.faturamento_observacao
    if (agendamento.faturamento_data !== undefined) updateData.faturamento_data = agendamento.faturamento_data
    if (agendamento.faturamento_status !== undefined) updateData.faturamento_status = agendamento.faturamento_status
    if (agendamento.observacao_faturamento !== undefined) updateData.observacao_faturamento = agendamento.observacao_faturamento
    
    // Justificativa de alteração no Agendamento (campos de auditoria)
    if (agendamento.justificativa_alteracao_agendamento !== undefined) updateData.justificativa_alteracao_agendamento = agendamento.justificativa_alteracao_agendamento
    if (agendamento.justificativa_alteracao_agendamento_nome !== undefined) updateData.justificativa_alteracao_agendamento_nome = agendamento.justificativa_alteracao_agendamento_nome
    if (agendamento.justificativa_alteracao_agendamento_nome_hora !== undefined) updateData.justificativa_alteracao_agendamento_nome_hora = agendamento.justificativa_alteracao_agendamento_nome_hora

    try {
      console.log('📝 Dados que serão enviados ao banco:', updateData);
      console.log('📝 ID do agendamento:', id);
      console.log('📝 Tipo do ID:', typeof id);
      
      // Log específico dos campos de avaliação
      if (updateData.avaliacao_anestesista !== undefined) {
        console.log('🔍 CAMPOS DE AVALIAÇÃO:', {
          avaliacao_anestesista: updateData.avaliacao_anestesista,
          avaliacao_anestesista_observacao: updateData.avaliacao_anestesista_observacao,
          avaliacao_anestesista_motivo_reprovacao: updateData.avaliacao_anestesista_motivo_reprovacao,
          avaliacao_anestesista_complementares: updateData.avaliacao_anestesista_complementares,
          avaliacao_anestesista_data: updateData.avaliacao_anestesista_data
        });
      }
      
      // Tentar UPDATE sem .select() primeiro (mais compatível com RLS)
      const { error, status, statusText, count } = await supabase
        .from('agendamentos')
        .update(updateData)
        .eq('id', id)
      
      console.log('📊 Resposta do Supabase (UPDATE):', { error, status, statusText, count });
      
      if (error) {
        console.error('❌ Erro ao atualizar agendamento:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }
      
      // Se UPDATE funcionou (status 200-299), buscar os dados atualizados
      if (status >= 200 && status < 300) {
        console.log('✅ UPDATE executado com sucesso! Buscando dados atualizados...');
        
        // Buscar o registro atualizado em uma query separada
        const { data: agendamentoAtualizado, error: selectError } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (selectError) {
          console.warn('⚠️ Erro ao buscar dados atualizados:', selectError);
          // Mesmo com erro no SELECT, o UPDATE funcionou
          // Retornar os dados que tínhamos + o que foi atualizado
          console.log('✅ UPDATE foi bem-sucedido mesmo sem conseguir ler os dados de volta');
          return { id, ...updateData } as Agendamento;
        }
        
        console.log('✅ Agendamento atualizado e recuperado com sucesso!', {
          id: agendamentoAtualizado?.id,
          nome_paciente: agendamentoAtualizado?.nome_paciente
        });
        
        return agendamentoAtualizado as Agendamento;
      }
      
      // Se chegou aqui, algo estranho aconteceu
      throw new Error(`Status inesperado: ${status} - ${statusText}`);
    } catch (error: any) {
      // Fallback: coluna de hora não existe no schema (migrar depois)
      if (error.message?.includes('justificativa_alteracao_agendamento_nome_hora')) {
        console.warn('⚠️ Coluna justificativa_alteracao_agendamento_nome_hora ausente. Tentando UPDATE sem ela...');
        try {
          if (updateData.justificativa_alteracao_agendamento_nome_hora !== undefined) {
            delete updateData.justificativa_alteracao_agendamento_nome_hora;
          }
          const { error: errorRetry, status: statusRetry } = await supabase
            .from('agendamentos')
            .update(updateData)
            .eq('id', id);
          if (errorRetry) throw new Error(errorRetry.message);
          if (statusRetry >= 200 && statusRetry < 300) {
            const { data: agendamentoAtualizado, error: selectError } = await supabase
              .from('agendamentos')
              .select('*')
              .eq('id', id)
              .single();
            if (selectError) {
              return { id, ...updateData } as Agendamento;
            }
            return agendamentoAtualizado as Agendamento;
          }
        } catch (e: any) {
          throw e;
        }
      }
      // Se o erro for sobre updated_at, tentar sem trigger
      if (error.message?.includes('updated_at')) {
        console.warn('⚠️ Tentando UPDATE sem updated_at...');
        
        // Tentar novamente com raw SQL se possível
        const { data, error: error2 } = await supabase
          .from('agendamentos')
          .update(updateData)
          .eq('id', id)
          .select()
        
        if (error2) throw new Error(error2.message);
        if (!data || data.length === 0) throw new Error('Agendamento não encontrado')
        
        return data[0] as Agendamento;
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

export const usuarioService = {
  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id,email,senha')
      .eq('email', email)
      .limit(1)
    if (error) throw new Error(error.message)
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  },
  async updateSenhaByEmail(email: string, novaSenha: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ senha: novaSenha })
      .eq('email', email)
      .select('id')
      .limit(1)
    if (error) throw new Error(error.message)
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  }
}

export const triagemPreAnestesicaService = {
  async create(payload: Record<string, string>): Promise<any> {
    const { data, error } = await supabase
      .from('triagem_pre_anestesica')
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  ,
  async saveOrUpdate(payload: Record<string, string>): Promise<any> {
    const nome = payload['nome_paciente']
    const nascimento = payload['data_nascimento']
    if (!nome || !nascimento) {
      return await this.create(payload)
    }
    const { data: existing, error: selectError } = await supabase
      .from('triagem_pre_anestesica')
      .select('id')
      .eq('nome_paciente', nome)
      .eq('data_nascimento', nascimento)
      .limit(1)
      .maybeSingle()
    if (selectError) throw new Error(selectError.message)
    if (existing?.id) {
      const { data, error } = await supabase
        .from('triagem_pre_anestesica')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    } else {
      return await this.create(payload)
    }
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
// SERVICE: CIDADES
// ============================================
export const cidadeService = {
  // Buscar TODAS as cidades
  async getAll(): Promise<Cidade[]> {
    console.log('🏙️ Buscando cidades do Supabase...');
    
    const { data, error } = await supabase
      .from('cidades')
      .select('id, nome')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar cidades:', error);
      throw new Error(error.message);
    }
    
    console.log(`✅ ${(data || []).length} cidades encontradas`);
    return data as Cidade[] || [];
  },
  
  // Buscar cidades por nome (autocomplete)
  async searchByName(searchTerm: string, limit: number = 20): Promise<Cidade[]> {
    console.log('🔍 Buscando cidades por nome:', searchTerm);
    
    const { data, error } = await supabase
      .from('cidades')
      .select('id, nome')
      .ilike('nome', `%${searchTerm}%`) // Case-insensitive
      .order('nome', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error('❌ Erro ao buscar cidades:', error);
      throw new Error(error.message);
    }
    
    return data as Cidade[] || [];
  },
  
  // Buscar cidade por ID
  async getById(id: string): Promise<Cidade> {
    const { data, error } = await supabase
      .from('cidades')
      .select('id, nome')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Cidade não encontrada');
    
    return data as Cidade;
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
