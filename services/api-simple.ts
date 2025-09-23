// Sistema simples de API que funciona diretamente com Supabase
// Filtra dados por hospital sem autenticação real

import { supabase } from './supabase';
import { Agendamento, Medico, Procedimento, StatusLiberacao } from '../types';

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
    nomePaciente: data.nome_paciente,
    dataNascimento: data.data_nascimento,
    cidadeNatal: data.cidade_natal || '',
    telefone: data.telefone || '',
    whatsapp: data.whatsapp || '',
    dataAgendamento: data.data_agendamento,
    statusLiberacao: data.status_liberacao as StatusLiberacao,
    medicoId: data.medico_id,
    procedimentoId: data.procedimento_id,
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
    email: data.email,
    hospitalId: data.hospital_id
  };
}

function convertSupabaseToProcedimento(data: any): Procedimento {
  return {
    id: data.id,
    nome: data.nome,
    tipo: data.tipo,
    duracaoEstimadaMin: data.duracao_estimada_min,
    descricao: data.descricao || '',
    hospitalId: data.hospital_id
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
      nome_paciente: agendamento.nomePaciente,
      data_nascimento: agendamento.dataNascimento,
      cidade_natal: agendamento.cidadeNatal,
      telefone: agendamento.telefone,
      whatsapp: agendamento.whatsapp,
      data_agendamento: agendamento.dataAgendamento,
      status_liberacao: agendamento.statusLiberacao,
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
    
    if (agendamento.nomePaciente) supabaseData.nome_paciente = agendamento.nomePaciente;
    if (agendamento.dataNascimento) supabaseData.data_nascimento = agendamento.dataNascimento;
    if (agendamento.cidadeNatal) supabaseData.cidade_natal = agendamento.cidadeNatal;
    if (agendamento.telefone) supabaseData.telefone = agendamento.telefone;
    if (agendamento.whatsapp) supabaseData.whatsapp = agendamento.whatsapp;
    if (agendamento.dataAgendamento) supabaseData.data_agendamento = agendamento.dataAgendamento;
    if (agendamento.statusLiberacao) supabaseData.status_liberacao = agendamento.statusLiberacao;
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

  async create(medico: Omit<Medico, 'id'>): Promise<Medico> {
    const supabaseData = {
      nome: medico.nome,
      especialidade: medico.especialidade,
      crm: medico.crm,
      telefone: medico.telefone,
      email: medico.email,
      hospital_id: medico.hospitalId
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
    
    if (medico.nome) supabaseData.nome = medico.nome;
    if (medico.especialidade) supabaseData.especialidade = medico.especialidade;
    if (medico.crm) supabaseData.crm = medico.crm;
    if (medico.telefone) supabaseData.telefone = medico.telefone;
    if (medico.email) supabaseData.email = medico.email;
    if (medico.hospitalId) supabaseData.hospital_id = medico.hospitalId;

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
      duracao_estimada_min: procedimento.duracaoEstimadaMin,
      descricao: procedimento.descricao,
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
    if (procedimento.duracaoEstimadaMin) supabaseData.duracao_estimada_min = procedimento.duracaoEstimadaMin;
    if (procedimento.descricao) supabaseData.descricao = procedimento.descricao;
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
      throw new Error(`Erro ao excluir procedimento: ${error.message}`);
    }
  }
}

// Instâncias dos serviços
export const simpleAgendamentoService = new SimpleAgendamentoService();
export const simpleMedicoService = new SimpleMedicoService();
export const simpleProcedimentoService = new SimpleProcedimentoService();
