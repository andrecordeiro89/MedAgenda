import { query } from '../database/config';
import { Agendamento, AgendamentoWithDetails, CreateAgendamentoDTO, UpdateAgendamentoDTO } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AgendamentoModel {
  static async findAll(): Promise<AgendamentoWithDetails[]> {
    const result = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      ORDER BY a.data_agendamento ASC, a.horario ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '', // Não necessário para o frontend
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    }));
  }

  static async findById(id: string): Promise<AgendamentoWithDetails | null> {
    const result = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '',
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    };
  }

  static async findByDate(date: string): Promise<AgendamentoWithDetails[]> {
    const result = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.data_agendamento = $1
      ORDER BY a.horario ASC
    `, [date]);
    
    return result.rows.map(row => ({
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '',
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    }));
  }

  static async findByMedico(medicoId: string): Promise<AgendamentoWithDetails[]> {
    const result = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.medico_id = $1
      ORDER BY a.data_agendamento ASC, a.horario ASC
    `, [medicoId]);
    
    return result.rows.map(row => ({
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '',
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    }));
  }

  static async create(agendamentoData: CreateAgendamentoDTO): Promise<AgendamentoWithDetails> {
    const id = uuidv4();
    
    await query(
      `INSERT INTO agendamentos (id, nome_paciente, data_nascimento, cidade_natal, telefone, whatsapp, 
       data_agendamento, horario, status_liberacao, medico_id, procedimento_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id, agendamentoData.nome_paciente, agendamentoData.data_nascimento,
        agendamentoData.cidade_natal, agendamentoData.telefone, agendamentoData.whatsapp,
        agendamentoData.data_agendamento, agendamentoData.horario, agendamentoData.status_liberacao,
        agendamentoData.medico_id, agendamentoData.procedimento_id
      ]
    );

    return await this.findById(id) as AgendamentoWithDetails;
  }

  static async update(id: string, agendamentoData: UpdateAgendamentoDTO): Promise<AgendamentoWithDetails | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (agendamentoData.nome_paciente !== undefined) {
      fields.push(`nome_paciente = $${paramIndex++}`);
      values.push(agendamentoData.nome_paciente);
    }
    if (agendamentoData.data_nascimento !== undefined) {
      fields.push(`data_nascimento = $${paramIndex++}`);
      values.push(agendamentoData.data_nascimento);
    }
    if (agendamentoData.cidade_natal !== undefined) {
      fields.push(`cidade_natal = $${paramIndex++}`);
      values.push(agendamentoData.cidade_natal);
    }
    if (agendamentoData.telefone !== undefined) {
      fields.push(`telefone = $${paramIndex++}`);
      values.push(agendamentoData.telefone);
    }
    if (agendamentoData.whatsapp !== undefined) {
      fields.push(`whatsapp = $${paramIndex++}`);
      values.push(agendamentoData.whatsapp);
    }
    if (agendamentoData.data_agendamento !== undefined) {
      fields.push(`data_agendamento = $${paramIndex++}`);
      values.push(agendamentoData.data_agendamento);
    }
    if (agendamentoData.horario !== undefined) {
      fields.push(`horario = $${paramIndex++}`);
      values.push(agendamentoData.horario);
    }
    if (agendamentoData.status_liberacao !== undefined) {
      fields.push(`status_liberacao = $${paramIndex++}`);
      values.push(agendamentoData.status_liberacao);
    }
    if (agendamentoData.medico_id !== undefined) {
      fields.push(`medico_id = $${paramIndex++}`);
      values.push(agendamentoData.medico_id);
    }
    if (agendamentoData.procedimento_id !== undefined) {
      fields.push(`procedimento_id = $${paramIndex++}`);
      values.push(agendamentoData.procedimento_id);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await query(
      `UPDATE agendamentos SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM agendamentos WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  static async search(term: string): Promise<AgendamentoWithDetails[]> {
    const result = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE LOWER(a.nome_paciente) LIKE LOWER($1) 
      OR LOWER(m.nome) LIKE LOWER($1)
      ORDER BY a.data_agendamento ASC, a.horario ASC
    `, [`%${term}%`]);
    
    return result.rows.map(row => ({
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '',
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    }));
  }

  static async checkConflict(medicoId: string, dataAgendamento: string, horario: string, excludeId?: string): Promise<boolean> {
    let queryText = `
      SELECT COUNT(*) as count 
      FROM agendamentos 
      WHERE medico_id = $1 AND data_agendamento = $2 AND horario = $3
    `;
    const params = [medicoId, dataAgendamento, horario];

    if (excludeId) {
      queryText += ' AND id != $4';
      params.push(excludeId);
    }

    const result = await query(queryText, params);
    return parseInt(result.rows[0].count) > 0;
  }

  static async getStatistics(): Promise<{
    total: number;
    pendentes: number;
    liberados: number;
    cirurgicos: number;
    ambulatoriais: number;
    proximosAgendamentos: AgendamentoWithDetails[];
  }> {
    // Estatísticas gerais
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status_liberacao = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status_liberacao = 'liberado' THEN 1 END) as liberados,
        COUNT(CASE WHEN p.tipo = 'cirurgico' THEN 1 END) as cirurgicos,
        COUNT(CASE WHEN p.tipo = 'ambulatorial' THEN 1 END) as ambulatoriais
      FROM agendamentos a
      JOIN procedimentos p ON a.procedimento_id = p.id
    `);

    // Próximos agendamentos
    const proximosResult = await query(`
      SELECT 
        a.*,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        p.nome as procedimento_nome,
        p.tipo as procedimento_tipo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_nascimento)) as idade
      FROM agendamentos a
      JOIN medicos m ON a.medico_id = m.id
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.data_agendamento >= CURRENT_DATE
      ORDER BY a.data_agendamento ASC, a.horario ASC
      LIMIT 5
    `);

    const stats = statsResult.rows[0];
    const proximos = proximosResult.rows.map(row => ({
      id: row.id,
      nome_paciente: row.nome_paciente,
      data_nascimento: row.data_nascimento,
      cidade_natal: row.cidade_natal,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      data_agendamento: row.data_agendamento,
      horario: row.horario,
      status_liberacao: row.status_liberacao,
      medico_id: row.medico_id,
      procedimento_id: row.procedimento_id,
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.medico_especialidade,
        crm: '',
        telefone: '',
        email: ''
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        tipo: row.procedimento_tipo,
        duracao_estimada_min: 0,
        descricao: ''
      },
      idade: parseInt(row.idade)
    }));

    return {
      total: parseInt(stats.total),
      pendentes: parseInt(stats.pendentes),
      liberados: parseInt(stats.liberados),
      cirurgicos: parseInt(stats.cirurgicos),
      ambulatoriais: parseInt(stats.ambulatoriais),
      proximosAgendamentos: proximos
    };
  }
}
