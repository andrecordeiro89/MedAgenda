import { query } from '../database/config';
import { Hospital, CreateHospitalDTO, UpdateHospitalDTO } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class HospitalModel {
  static async findAll(): Promise<Hospital[]> {
    const result = await query(
      'SELECT * FROM hospitais ORDER BY nome ASC'
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Hospital | null> {
    const result = await query(
      'SELECT * FROM hospitais WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCnpj(cnpj: string): Promise<Hospital | null> {
    const result = await query(
      'SELECT * FROM hospitais WHERE cnpj = $1',
      [cnpj]
    );
    return result.rows[0] || null;
  }

  static async search(term: string): Promise<Hospital[]> {
    const result = await query(
      `SELECT * FROM hospitais 
       WHERE nome ILIKE $1 OR cidade ILIKE $1 OR cnpj ILIKE $1
       ORDER BY nome ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  static async create(hospitalData: CreateHospitalDTO): Promise<Hospital> {
    const id = uuidv4();
    
    await query(
      `INSERT INTO hospitais (id, nome, cidade, cnpj) 
       VALUES ($1, $2, $3, $4)`,
      [id, hospitalData.nome, hospitalData.cidade, hospitalData.cnpj]
    );

    return await this.findById(id) as Hospital;
  }

  static async update(id: string, hospitalData: UpdateHospitalDTO): Promise<Hospital | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (hospitalData.nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(hospitalData.nome);
    }
    if (hospitalData.cidade !== undefined) {
      fields.push(`cidade = $${paramIndex++}`);
      values.push(hospitalData.cidade);
    }
    if (hospitalData.cnpj !== undefined) {
      fields.push(`cnpj = $${paramIndex++}`);
      values.push(hospitalData.cnpj);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE hospitais SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM hospitais WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  static async hasUsers(id: string): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM usuarios WHERE hospital_id = $1',
      [id]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  static async getStatistics(): Promise<{
    total: number;
    totalMedicos: number;
    totalProcedimentos: number;
    totalAgendamentos: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT h.id) as total,
        COUNT(DISTINCT m.id) as total_medicos,
        COUNT(DISTINCT p.id) as total_procedimentos,
        COUNT(DISTINCT a.id) as total_agendamentos
      FROM hospitais h
      LEFT JOIN medicos m ON h.id = m.hospital_id
      LEFT JOIN procedimentos p ON h.id = p.hospital_id
      LEFT JOIN agendamentos a ON h.id = a.hospital_id
    `);
    
    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      totalMedicos: parseInt(row.total_medicos),
      totalProcedimentos: parseInt(row.total_procedimentos),
      totalAgendamentos: parseInt(row.total_agendamentos)
    };
  }
}
