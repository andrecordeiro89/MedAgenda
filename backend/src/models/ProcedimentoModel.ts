import { query } from '../database/config';
import { Procedimento, CreateProcedimentoDTO, UpdateProcedimentoDTO } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ProcedimentoModel {
  static async findAll(): Promise<Procedimento[]> {
    const result = await query(
      'SELECT * FROM procedimentos ORDER BY nome ASC'
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Procedimento | null> {
    const result = await query(
      'SELECT * FROM procedimentos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByNome(nome: string): Promise<Procedimento | null> {
    const result = await query(
      'SELECT * FROM procedimentos WHERE nome = $1',
      [nome]
    );
    return result.rows[0] || null;
  }

  static async findByTipo(tipo: 'cirurgico' | 'ambulatorial'): Promise<Procedimento[]> {
    const result = await query(
      'SELECT * FROM procedimentos WHERE tipo = $1 ORDER BY nome ASC',
      [tipo]
    );
    return result.rows;
  }

  static async create(procedimentoData: CreateProcedimentoDTO): Promise<Procedimento> {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO procedimentos (id, nome, tipo, duracao_estimada_min, descricao) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        id, 
        procedimentoData.nome, 
        procedimentoData.tipo, 
        procedimentoData.duracao_estimada_min, 
        procedimentoData.descricao || null
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, procedimentoData: UpdateProcedimentoDTO): Promise<Procedimento | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (procedimentoData.nome !== undefined) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(procedimentoData.nome);
    }
    if (procedimentoData.tipo !== undefined) {
      fields.push(`tipo = $${paramIndex++}`);
      values.push(procedimentoData.tipo);
    }
    if (procedimentoData.duracao_estimada_min !== undefined) {
      fields.push(`duracao_estimada_min = $${paramIndex++}`);
      values.push(procedimentoData.duracao_estimada_min);
    }
    if (procedimentoData.descricao !== undefined) {
      fields.push(`descricao = $${paramIndex++}`);
      values.push(procedimentoData.descricao);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE procedimentos SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM procedimentos WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  static async search(term: string): Promise<Procedimento[]> {
    const result = await query(
      `SELECT * FROM procedimentos 
       WHERE LOWER(nome) LIKE LOWER($1) 
       OR LOWER(descricao) LIKE LOWER($1)
       ORDER BY nome ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  static async hasAgendamentos(id: string): Promise<boolean> {
    const result = await query(
      'SELECT COUNT(*) as count FROM agendamentos WHERE procedimento_id = $1',
      [id]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  static async getStatistics(): Promise<{
    total: number;
    cirurgicos: number;
    ambulatoriais: number;
    duracaoMedia: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN tipo = 'cirurgico' THEN 1 END) as cirurgicos,
        COUNT(CASE WHEN tipo = 'ambulatorial' THEN 1 END) as ambulatoriais,
        ROUND(AVG(duracao_estimada_min)) as duracao_media
      FROM procedimentos
    `);
    
    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      cirurgicos: parseInt(row.cirurgicos),
      ambulatoriais: parseInt(row.ambulatoriais),
      duracaoMedia: parseInt(row.duracao_media) || 0
    };
  }
}
