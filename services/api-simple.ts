// Sistema simples de API que funciona diretamente com Supabase
// Filtra dados por hospital sem autenticação real

import { supabase } from './supabase';
import { Agendamento, Medico, Procedimento, StatusLiberacao, Especialidade, MedicoHospital, Hospital } from '../types';

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
    nome: data.nome,
    descricao: data.descricao || ''
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
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar médicos:', error);
      return [];
    }

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
    const { data, error } = await supabase
      .from('procedimentos')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar procedimentos:', error);
      return [];
    }

    return data?.map(convertSupabaseToProcedimento) || [];
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
        nome: especialidade.nome,
        descricao: especialidade.descricao
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
    if (especialidade.descricao !== undefined) supabaseData.descricao = especialidade.descricao;

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

// Instâncias dos serviços
export const simpleAgendamentoService = new SimpleAgendamentoService();
export const simpleMedicoService = new SimpleMedicoService();
export const simpleProcedimentoService = new SimpleProcedimentoService();
export const simpleEspecialidadeService = new SimpleEspecialidadeService();
export const simpleMedicoHospitalService = new SimpleMedicoHospitalService();
