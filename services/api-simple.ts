// Sistema simples de API que funciona diretamente com Supabase
// Filtra dados por hospital sem autenticação real

import { supabase } from './supabase';
import { Agendamento, Medico, Procedimento, StatusLiberacao, Especialidade, MedicoHospital, Hospital, MetaEspecialidade, DiaSemana } from '../types';

// Mapeamento de hospitais (mesmo que no PremiumLogin)
export const HOSPITAIS = {
  'Hospital São Paulo': '550e8400-e29b-41d4-a716-446655440001',
  'Hospital Rio de Janeiro': '550e8400-e29b-41d4-a716-446655440002',
  'Hospital Brasília': '550e8400-e29b-41d4-a716-446655440003'
};

// Função para converter dados do Supabase para o formato do frontend
function convertSupabaseToAgendamento(data: any): Agendamento {
  return {
    id: data.id,
    nome: data.nome_paciente,
    dataNascimento: data.data_nascimento,
    idade: data.idade || 0,
    cidadeNatal: data.cidade_natal || '',
    telefone: data.telefone || '',
    whatsapp: data.whatsapp || '',
    dataAgendamento: data.data_agendamento,
    statusLiberacao: data.status_liberacao === 'liberado' ? 'v' : 'x',
    medicoId: data.medico_id,
    procedimentoId: data.procedimento_id,
    tipo: data.tipo || 'ambulatorial',
    hospitalId: data.hospital_id
  };
}

function convertSupabaseToMedico(data: any): Medico {
  return {
    id: data.id,
    nome: data.nome,
    especialidade: data.especialidade,
    crm: data.crm,
    telefone: data.telefone,
    email: data.email
    // REMOVIDO: hospitais - volta ao modelo simples
  };
}

function convertSupabaseToProcedimento(data: any): Procedimento {
  return {
    id: data.id,
    nome: data.nome,
    tipo: data.tipo,
    duracaoEstimada: data.duracao_estimada_min,
    descricao: data.descricao || '',
    especialidade: data.especialidade, // Coluna física
    especialidadeId: data.especialidade_id, // Relacionamento
    hospitalId: data.hospital_id
  };
}

function convertSupabaseToEspecialidade(data: any): Especialidade {
  return {
    id: data.id,
    nome: data.nome
  };
}

// Serviços simplificados
export class SimpleAgendamentoService {
  async getAll(hospitalId: string): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('data_agendamento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }

    return data?.map(convertSupabaseToAgendamento) || [];
  }

  async getByDate(date: string, hospitalId: string): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('data_agendamento', date)
      .order('data_agendamento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos por data:', error);
      return [];
    }

    return data?.map(convertSupabaseToAgendamento) || [];
  }

  async create(agendamento: Omit<Agendamento, 'id'>): Promise<Agendamento> {
    const supabaseData = {
      nome_paciente: agendamento.nome,
      data_nascimento: agendamento.dataNascimento,
      cidade_natal: agendamento.cidadeNatal,
      telefone: agendamento.telefone,
      whatsapp: agendamento.whatsapp,
      data_agendamento: agendamento.dataAgendamento,
      status_liberacao: agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente',
      medico_id: agendamento.medicoId,
      procedimento_id: agendamento.procedimentoId,
      hospital_id: agendamento.hospitalId
    };

    const { data, error } = await supabase
      .from('agendamentos')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }

    return convertSupabaseToAgendamento(data);
  }

  async update(id: string, agendamento: Partial<Agendamento>): Promise<Agendamento> {
    const supabaseData: any = {};
    
    if (agendamento.nome) supabaseData.nome_paciente = agendamento.nome;
    if (agendamento.dataNascimento) supabaseData.data_nascimento = agendamento.dataNascimento;
    if (agendamento.cidadeNatal) supabaseData.cidade_natal = agendamento.cidadeNatal;
    if (agendamento.telefone) supabaseData.telefone = agendamento.telefone;
    if (agendamento.whatsapp) supabaseData.whatsapp = agendamento.whatsapp;
    if (agendamento.dataAgendamento) supabaseData.data_agendamento = agendamento.dataAgendamento;
    if (agendamento.statusLiberacao) supabaseData.status_liberacao = agendamento.statusLiberacao === 'v' ? 'liberado' : 'pendente';
    if (agendamento.medicoId) supabaseData.medico_id = agendamento.medicoId;
    if (agendamento.procedimentoId) supabaseData.procedimento_id = agendamento.procedimentoId;
    if (agendamento.hospitalId) supabaseData.hospital_id = agendamento.hospitalId;

    const { data, error } = await supabase
      .from('agendamentos')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
    }

    return convertSupabaseToAgendamento(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir agendamento: ${error.message}`);
    }
  }
}

export class SimpleMedicoService {
  async getAll(hospitalId: string): Promise<Medico[]> {
    // VOLTA AO MODELO SIMPLES ORIGINAL - buscar médicos direto da tabela medicos
    console.log('🏥 Buscando médicos para hospital_id:', hospitalId);
    
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar médicos:', error);
      return [];
    }

    console.log('✅ Médicos encontrados:', data?.length || 0);
    console.log('📋 Médicos:', data?.map(m => ({ nome: m.nome, hospital_id: m.hospital_id })));

    return data?.map(convertSupabaseToMedico) || [];
  }

  async create(medico: Omit<Medico, 'id'>, hospitalId: string): Promise<Medico> {
    // VOLTA AO MODELO SIMPLES ORIGINAL - incluir hospital_id direto
    const supabaseData = {
      nome: medico.nome,
      especialidade: medico.especialidade,
      crm: medico.crm,
      telefone: medico.telefone,
      email: medico.email,
      hospital_id: hospitalId
    };

    const { data, error } = await supabase
      .from('medicos')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar médico: ${error.message}`);
    }

    return convertSupabaseToMedico(data);
  }

  async update(id: string, medico: Partial<Medico>): Promise<Medico> {
    const supabaseData: any = {};
    
    // VOLTA AO MODELO SIMPLES ORIGINAL
    if (medico.nome) supabaseData.nome = medico.nome;
    if (medico.especialidade) supabaseData.especialidade = medico.especialidade;
    if (medico.crm) supabaseData.crm = medico.crm;
    if (medico.telefone) supabaseData.telefone = medico.telefone;
    if (medico.email) supabaseData.email = medico.email;

    const { data, error } = await supabase
      .from('medicos')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar médico: ${error.message}`);
    }

    return convertSupabaseToMedico(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id', id);

    if (error) {
      // Tratar erro de constraint de foreign key de forma mais amigável
      if (error.code === '23503' || error.message.includes('foreign key') || error.message.includes('constraint')) {
        throw new Error('Não é possível excluir este médico pois existem agendamentos que o utilizam. Exclua os agendamentos relacionados primeiro.');
      }
      throw new Error(`Erro ao excluir médico: ${error.message}`);
    }
  }
}

export class SimpleProcedimentoService {
  async getAll(hospitalId: string): Promise<Procedimento[]> {
    console.log('🔍 Buscando procedimentos para hospital_id:', hospitalId);
    
    const { data, error } = await supabase
      .from('procedimentos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar procedimentos:', error);
      return [];
    }

    console.log('✅ Procedimentos encontrados:', data?.length || 0);
    console.log('📋 Dados brutos do Supabase:', data);
    
    const procedimentos = data?.map(convertSupabaseToProcedimento) || [];
    console.log('📦 Procedimentos convertidos:', procedimentos);
    
    return procedimentos;
  }

  async create(procedimento: Omit<Procedimento, 'id'>): Promise<Procedimento> {
    const supabaseData = {
      nome: procedimento.nome,
      tipo: procedimento.tipo,
      duracao_estimada_min: procedimento.duracaoEstimada,
      descricao: procedimento.descricao,
      especialidade: procedimento.especialidade, // Coluna física
      especialidade_id: procedimento.especialidadeId, // Relacionamento
      hospital_id: procedimento.hospitalId
    };

    const { data, error } = await supabase
      .from('procedimentos')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar procedimento: ${error.message}`);
    }

    return convertSupabaseToProcedimento(data);
  }

  async update(id: string, procedimento: Partial<Procedimento>): Promise<Procedimento> {
    const supabaseData: any = {};
    
    if (procedimento.nome) supabaseData.nome = procedimento.nome;
    if (procedimento.tipo) supabaseData.tipo = procedimento.tipo;
    if (procedimento.duracaoEstimada) supabaseData.duracao_estimada_min = procedimento.duracaoEstimada;
    if (procedimento.descricao) supabaseData.descricao = procedimento.descricao;
    if (procedimento.especialidade !== undefined) supabaseData.especialidade = procedimento.especialidade;
    if (procedimento.especialidadeId !== undefined) supabaseData.especialidade_id = procedimento.especialidadeId;
    if (procedimento.hospitalId) supabaseData.hospital_id = procedimento.hospitalId;

    const { data, error } = await supabase
      .from('procedimentos')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar procedimento: ${error.message}`);
    }

    return convertSupabaseToProcedimento(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('procedimentos')
      .delete()
      .eq('id', id);

    if (error) {
      // Tratar erro de constraint de foreign key de forma mais amigável
      if (error.code === '23503' || error.message.includes('foreign key') || error.message.includes('constraint')) {
        throw new Error('Não é possível excluir este procedimento pois existem agendamentos que o utilizam. Exclua os agendamentos relacionados primeiro ou desative o procedimento.');
      }
      throw new Error(`Erro ao excluir procedimento: ${error.message}`);
    }
  }
}

// Serviço de Especialidades
export class SimpleEspecialidadeService {
  async getAll(): Promise<Especialidade[]> {
    const { data, error } = await supabase
      .from('especialidades')
      .select('*')
      .order('nome');

    if (error) {
      throw new Error(`Erro ao buscar especialidades: ${error.message}`);
    }

    return data.map(convertSupabaseToEspecialidade);
  }

  async create(especialidade: Omit<Especialidade, 'id'>): Promise<Especialidade> {
    const { data, error } = await supabase
      .from('especialidades')
      .insert([{
        nome: especialidade.nome
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar especialidade: ${error.message}`);
    }

    return convertSupabaseToEspecialidade(data);
  }

  async update(id: string, especialidade: Partial<Especialidade>): Promise<Especialidade> {
    const supabaseData: any = {};
    
    if (especialidade.nome) supabaseData.nome = especialidade.nome;

    const { data, error } = await supabase
      .from('especialidades')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar especialidade: ${error.message}`);
    }

    return convertSupabaseToEspecialidade(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('especialidades')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir especialidade: ${error.message}`);
    }
  }
}

// Serviço para gerenciar relacionamentos médico-hospital
export class SimpleMedicoHospitalService {
  // Adicionar médico a um hospital
  async adicionarMedicoAoHospital(medicoId: string, hospitalId: string, observacoes?: string): Promise<MedicoHospital> {
    const { data, error } = await supabase
      .from('medico_hospital')
      .insert({
        medico_id: medicoId,
        hospital_id: hospitalId,
        ativo: true,
        data_inicio: new Date().toISOString().split('T')[0],
        observacoes
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao adicionar médico ao hospital: ${error.message}`);
    }

    return {
      id: data.id,
      medicoId: data.medico_id,
      hospitalId: data.hospital_id,
      ativo: data.ativo,
      dataInicio: data.data_inicio,
      dataFim: data.data_fim,
      observacoes: data.observacoes
    };
  }

  // Remover médico de um hospital (desativar)
  async removerMedicoDoHospital(medicoId: string, hospitalId: string, observacoes?: string): Promise<void> {
    const { error } = await supabase
      .from('medico_hospital')
      .update({
        ativo: false,
        data_fim: new Date().toISOString().split('T')[0],
        observacoes
      })
      .eq('medico_id', medicoId)
      .eq('hospital_id', hospitalId)
      .eq('ativo', true);

    if (error) {
      throw new Error(`Erro ao remover médico do hospital: ${error.message}`);
    }
  }

  // Buscar hospitais de um médico
  async getHospitaisDoMedico(medicoId: string): Promise<MedicoHospital[]> {
    const { data, error } = await supabase
      .from('medico_hospital')
      .select('*')
      .eq('medico_id', medicoId)
      .eq('ativo', true);

    if (error) {
      throw new Error(`Erro ao buscar hospitais do médico: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      medicoId: item.medico_id,
      hospitalId: item.hospital_id,
      ativo: item.ativo,
      dataInicio: item.data_inicio,
      dataFim: item.data_fim,
      observacoes: item.observacoes
    })) || [];
  }

  // Buscar médicos de um hospital
  async getMedicosDoHospital(hospitalId: string): Promise<MedicoHospital[]> {
    const { data, error } = await supabase
      .from('medico_hospital')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('ativo', true);

    if (error) {
      throw new Error(`Erro ao buscar médicos do hospital: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      medicoId: item.medico_id,
      hospitalId: item.hospital_id,
      ativo: item.ativo,
      dataInicio: item.data_inicio,
      dataFim: item.data_fim,
      observacoes: item.observacoes
    })) || [];
  }
}

// Serviço para Metas de Especialidades
export class SimpleMetaEspecialidadeService {
  async getAll(hospitalId: string): Promise<MetaEspecialidade[]> {
    console.log('🎯 Buscando metas de especialidades para hospital_id:', hospitalId);
    
    const { data, error } = await supabase
      .from('metas_especialidades')
      .select(`
        *,
        especialidades:especialidade_id (
          id,
          nome
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('especialidade_id', { ascending: true })
      .order('dia_semana', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar metas de especialidades:', error);
      return [];
    }

    console.log('✅ Metas de especialidades encontradas:', data?.length || 0);

    return data?.map((item: any) => ({
      id: item.id,
      especialidadeId: item.especialidade_id,
      especialidadeNome: item.especialidades?.nome || 'N/A',
      diaSemana: item.dia_semana as DiaSemana,
      quantidadeAgendamentos: item.quantidade_agendamentos,
      ativo: item.ativo,
      hospitalId: item.hospital_id,
      observacoes: item.observacoes,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
  }

  async create(meta: Omit<MetaEspecialidade, 'id' | 'created_at' | 'updated_at' | 'especialidadeNome'>): Promise<MetaEspecialidade> {
    console.log('🎯 Criando nova meta de especialidade:', meta);

    const supabaseData = {
      especialidade_id: meta.especialidadeId,
      dia_semana: meta.diaSemana,
      quantidade_agendamentos: meta.quantidadeAgendamentos,
      ativo: meta.ativo,
      hospital_id: meta.hospitalId,
      observacoes: meta.observacoes || null
    };

    const { data, error } = await supabase
      .from('metas_especialidades')
      .insert(supabaseData)
      .select(`
        *,
        especialidades:especialidade_id (
          id,
          nome
        )
      `)
      .single();

    if (error) {
      console.error('❌ Erro ao criar meta de especialidade:', error);
      throw new Error(`Erro ao criar meta de especialidade: ${error.message}`);
    }

    console.log('✅ Meta de especialidade criada com sucesso:', data.id);

    return {
      id: data.id,
      especialidadeId: data.especialidade_id,
      especialidadeNome: data.especialidades?.nome || 'N/A',
      diaSemana: data.dia_semana as DiaSemana,
      quantidadeAgendamentos: data.quantidade_agendamentos,
      ativo: data.ativo,
      hospitalId: data.hospital_id,
      observacoes: data.observacoes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async update(id: string, meta: Partial<Omit<MetaEspecialidade, 'id' | 'created_at' | 'updated_at' | 'especialidadeNome'>>): Promise<MetaEspecialidade> {
    console.log('🎯 Atualizando meta de especialidade:', id, meta);

    const supabaseData: any = {};
    
    if (meta.especialidadeId !== undefined) supabaseData.especialidade_id = meta.especialidadeId;
    if (meta.diaSemana !== undefined) supabaseData.dia_semana = meta.diaSemana;
    if (meta.quantidadeAgendamentos !== undefined) supabaseData.quantidade_agendamentos = meta.quantidadeAgendamentos;
    if (meta.ativo !== undefined) supabaseData.ativo = meta.ativo;
    if (meta.observacoes !== undefined) supabaseData.observacoes = meta.observacoes;

    const { data, error } = await supabase
      .from('metas_especialidades')
      .update(supabaseData)
      .eq('id', id)
      .select(`
        *,
        especialidades:especialidade_id (
          id,
          nome
        )
      `)
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar meta de especialidade:', error);
      throw new Error(`Erro ao atualizar meta de especialidade: ${error.message}`);
    }

    console.log('✅ Meta de especialidade atualizada com sucesso');

    return {
      id: data.id,
      especialidadeId: data.especialidade_id,
      especialidadeNome: data.especialidades?.nome || 'N/A',
      diaSemana: data.dia_semana as DiaSemana,
      quantidadeAgendamentos: data.quantidade_agendamentos,
      ativo: data.ativo,
      hospitalId: data.hospital_id,
      observacoes: data.observacoes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async delete(id: string): Promise<void> {
    console.log('🎯 Excluindo meta de especialidade:', id);

    const { error } = await supabase
      .from('metas_especialidades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao excluir meta de especialidade:', error);
      throw new Error(`Erro ao excluir meta de especialidade: ${error.message}`);
    }

    console.log('✅ Meta de especialidade excluída com sucesso');
  }

  // Buscar metas por especialidade
  async getByEspecialidade(especialidadeId: string, hospitalId: string): Promise<MetaEspecialidade[]> {
    const { data, error } = await supabase
      .from('metas_especialidades')
      .select(`
        *,
        especialidades:especialidade_id (
          id,
          nome
        )
      `)
      .eq('especialidade_id', especialidadeId)
      .eq('hospital_id', hospitalId)
      .eq('ativo', true)
      .order('dia_semana', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar metas por especialidade:', error);
      return [];
    }

    return data?.map((item: any) => ({
      id: item.id,
      especialidadeId: item.especialidade_id,
      especialidadeNome: item.especialidades?.nome || 'N/A',
      diaSemana: item.dia_semana as DiaSemana,
      quantidadeAgendamentos: item.quantidade_agendamentos,
      ativo: item.ativo,
      hospitalId: item.hospital_id,
      observacoes: item.observacoes,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
  }
}

// Instâncias dos serviços
// ============================================================================
// SERVICE: GradeCirurgica - Gerenciamento de Grades Cirúrgicas
// ============================================================================

interface GradeCirurgicaDB {
  id: string;
  hospital_id: string;
  dia_semana: string;
  mes_referencia: string;
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
}

interface GradeCirurgicaDiaDB {
  id: string;
  grade_id: string;
  data: string;
  dia_semana: string;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

interface GradeCirurgicaItemDB {
  id: string;
  dia_id: string;
  tipo: 'especialidade' | 'procedimento';
  especialidade_id?: string;
  procedimento_id?: string;
  texto: string;
  ordem: number;
  pacientes: string[];
  created_at?: string;
  updated_at?: string;
}

export class SimpleGradeCirurgicaService {
  // Buscar grade completa por hospital, dia da semana e mês
  async getGrade(hospitalId: string, diaSemana: string, mesReferencia: string): Promise<any> {
    console.log('🏥 Buscando grade cirúrgica:', { hospitalId, diaSemana, mesReferencia });
    
    // Buscar grade
    const { data: gradeData, error: gradeError } = await supabase
      .from('grades_cirurgicas')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('dia_semana', diaSemana)
      .eq('mes_referencia', mesReferencia)
      .eq('ativa', true)
      .single();

    if (gradeError) {
      if (gradeError.code === 'PGRST116') {
        console.log('ℹ️ Nenhuma grade encontrada');
        return null;
      }
      console.error('❌ Erro ao buscar grade:', gradeError);
      throw gradeError;
    }

    // Buscar dias da grade
    const { data: diasData, error: diasError } = await supabase
      .from('grades_cirurgicas_dias')
      .select('*')
      .eq('grade_id', gradeData.id)
      .order('data', { ascending: true });

    if (diasError) {
      console.error('❌ Erro ao buscar dias:', diasError);
      throw diasError;
    }

    // Buscar itens de cada dia
    const diasComItens = await Promise.all(
      (diasData || []).map(async (dia) => {
        const { data: itensData, error: itensError } = await supabase
          .from('grades_cirurgicas_itens')
          .select('*')
          .eq('dia_id', dia.id)
          .order('ordem', { ascending: true });

        if (itensError) {
          console.error('❌ Erro ao buscar itens do dia:', itensError);
          return { ...dia, itens: [] };
        }

        return {
          id: dia.id,
          data: dia.data,
          diaSemana: dia.dia_semana,
          ordem: dia.ordem,
          itens: (itensData || []).map(item => ({
            id: item.id,
            tipo: item.tipo,
            texto: item.texto,
            ordem: item.ordem,
            pacientes: item.pacientes || [],
            especialidadeId: item.especialidade_id,
            procedimentoId: item.procedimento_id
          }))
        };
      })
    );

    console.log('✅ Grade carregada:', { gradeId: gradeData.id, totalDias: diasComItens.length });

    return {
      id: gradeData.id,
      hospitalId: gradeData.hospital_id,
      diaSemana: gradeData.dia_semana,
      mesReferencia: gradeData.mes_referencia,
      ativa: gradeData.ativa,
      dias: diasComItens
    };
  }

  // Salvar grade completa (criar ou atualizar)
  async saveGrade(grade: any): Promise<void> {
    console.log('💾 Salvando grade cirúrgica:', grade);

    try {
      // 1. Verificar se já existe uma grade
      const { data: existingGrade, error: checkError } = await supabase
        .from('grades_cirurgicas')
        .select('id')
        .eq('hospital_id', grade.hospitalId)
        .eq('dia_semana', grade.diaSemana)
        .eq('mes_referencia', grade.mesReferencia)
        .eq('ativa', true)
        .single();

      let gradeId: string;

      if (existingGrade) {
        // Atualizar grade existente
        gradeId = existingGrade.id;
        console.log('🔄 Atualizando grade existente:', gradeId);

        // Deletar dias antigos (cascade vai deletar os itens)
        await supabase
          .from('grades_cirurgicas_dias')
          .delete()
          .eq('grade_id', gradeId);
      } else {
        // Criar nova grade
        const { data: newGrade, error: createError } = await supabase
          .from('grades_cirurgicas')
          .insert([{
            hospital_id: grade.hospitalId,
            dia_semana: grade.diaSemana,
            mes_referencia: grade.mesReferencia,
            ativa: true
          }])
          .select()
          .single();

        if (createError) throw createError;
        gradeId = newGrade.id;
        console.log('✨ Nova grade criada:', gradeId);
      }

      // 2. Inserir dias e itens
      for (const dia of grade.dias) {
        const { data: diaData, error: diaError } = await supabase
          .from('grades_cirurgicas_dias')
          .insert([{
            grade_id: gradeId,
            data: dia.data,
            dia_semana: dia.diaSemana,
            ordem: dia.ordem
          }])
          .select()
          .single();

        if (diaError) {
          console.error('❌ Erro ao criar dia:', diaError);
          throw diaError;
        }

        // 3. Inserir itens do dia
        if (dia.itens && dia.itens.length > 0) {
          const itensToInsert = dia.itens.map((item: any) => ({
            dia_id: diaData.id,
            tipo: item.tipo,
            especialidade_id: item.especialidadeId || null,
            procedimento_id: item.procedimentoId || null,
            texto: item.texto,
            ordem: item.ordem,
            pacientes: item.pacientes || []
          }));

          const { error: itensError } = await supabase
            .from('grades_cirurgicas_itens')
            .insert(itensToInsert);

          if (itensError) {
            console.error('❌ Erro ao criar itens:', itensError);
            throw itensError;
          }
        }
      }

      console.log('✅ Grade salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar grade:', error);
      throw error;
    }
  }

  // Listar todas as grades de um hospital
  async getGradesByHospital(hospitalId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('grades_cirurgicas')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('ativa', true)
      .order('dia_semana', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar grades:', error);
      return [];
    }

    return data || [];
  }

  // Deletar grade
  async deleteGrade(gradeId: string): Promise<void> {
    const { error } = await supabase
      .from('grades_cirurgicas')
      .delete()
      .eq('id', gradeId);

    if (error) {
      console.error('❌ Erro ao deletar grade:', error);
      throw error;
    }

    console.log('✅ Grade deletada:', gradeId);
  }

  // Obter prefixos mais usados (para autocomplete)
  async getPrefixosMaisUsados(limit: number = 20): Promise<string[]> {
    const { data, error } = await supabase
      .from('grades_cirurgicas_itens')
      .select('texto')
      .eq('tipo', 'procedimento')
      .limit(1000);

    if (error) {
      console.error('❌ Erro ao buscar prefixos:', error);
      return [];
    }

    // Contar frequência de cada prefixo
    const frequencia: Record<string, number> = {};
    data.forEach(item => {
      frequencia[item.texto] = (frequencia[item.texto] || 0) + 1;
    });

    // Ordenar por frequência e retornar os top N
    return Object.keys(frequencia)
      .sort((a, b) => frequencia[b] - frequencia[a])
      .slice(0, limit);
  }
}

export const simpleAgendamentoService = new SimpleAgendamentoService();
export const simpleMedicoService = new SimpleMedicoService();
export const simpleProcedimentoService = new SimpleProcedimentoService();
export const simpleEspecialidadeService = new SimpleEspecialidadeService();
export const simpleMedicoHospitalService = new SimpleMedicoHospitalService();
export const simpleMetaEspecialidadeService = new SimpleMetaEspecialidadeService();
export const simpleGradeCirurgicaService = new SimpleGradeCirurgicaService();
