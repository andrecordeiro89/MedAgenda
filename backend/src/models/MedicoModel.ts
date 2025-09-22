import { query } from '../database/config';
import { Medico, CreateMedicoDTO, UpdateMedicoDTO } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class MedicoModel {
  static async findAll(): Promise<Medico[]> {
    const result = await query(
      'SELECT * FROM medicos ORDER BY nome ASC'
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Medico | null> {
    const result = await query(
      'SELECT * FROM medicos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCrm(crm: string): Promise<Medico | null> {
    const result = await query(
      'SELECT * FROM medicos WHERE crm = $1',
      [crm]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<Medico | null> {
    const result = await query(
      'SELECT * FROM medicos WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async create(medicoData: CreateMedicoDTO): Promise<Medico> {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO medicos (id, nome, especialidade, crm, telefone, email) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [id, medicoData.nome, medicoData.especialidade, medicoData.crm, medicoData.telefone, medicoData.email]
    );
    return result.rows[0];
  }

  static async update(id: string, medicoData: UpdateMedicoDTO): Promise<Medico | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (medicoData.nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(medicoData.nome);
    }
    if (medicoData.especialidade !== undefined) {
      fields.push(`especialidade = $${paramIndex++}`);
      values.push(medicoData.especialidade);
    }
    if (medicoData.crm !== undefined) {
      fields.push(`crm = $${paramIndex++}`);
      values.push(medicoData.crm);
    }
    if (medicoData.telefone !== undefined) {
      fields.push(`telefone = $${paramIndex++}`);
      values.push(medicoData.telefone);
    }
    if (medicoData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(medicoData.email);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE medicos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM medicos WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  static async search(term: string): Promise<Medico[]> {
    const result = await query(
      `SELECT * FROM medicos 
       WHERE LOWER(nome) LIKE LOWER($1) 
       OR LOWER(especialidade) LIKE LOWER($1)
       ORDER BY nome ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  static async hasAgendamentos(id: string): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM agendamentos WHERE medico_id = $1',
      [id]
    );
    return parseInt(result.rows[0].count) > 0;
  }
}
