import { query } from '../database/config';
import { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO, Hospital } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class UsuarioModel {
  static async findAll(): Promise<Usuario[]> {
    const result = await query(`
      SELECT 
        u.*,
        h.nome as hospital_nome,
        h.cidade as hospital_cidade,
        h.cnpj as hospital_cnpj
      FROM usuarios u
      JOIN hospitais h ON u.hospital_id = h.id
      ORDER BY u.email ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      hospital_id: row.hospital_id,
      hospital: {
        id: row.hospital_id,
        nome: row.hospital_nome,
        cidade: row.hospital_cidade,
        cnpj: row.hospital_cnpj
      }
    }));
  }

  static async findById(id: string): Promise<Usuario | null> {
    const result = await query(`
      SELECT 
        u.*,
        h.nome as hospital_nome,
        h.cidade as hospital_cidade,
        h.cnpj as hospital_cnpj
      FROM usuarios u
      JOIN hospitais h ON u.hospital_id = h.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      hospital_id: row.hospital_id,
      hospital: {
        id: row.hospital_id,
        nome: row.hospital_nome,
        cidade: row.hospital_cidade,
        cnpj: row.hospital_cnpj
      }
    };
  }

  static async findByEmail(email: string): Promise<Usuario | null> {
    const result = await query(`
      SELECT 
        u.*,
        h.nome as hospital_nome,
        h.cidade as hospital_cidade,
        h.cnpj as hospital_cnpj
      FROM usuarios u
      JOIN hospitais h ON u.hospital_id = h.id
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      hospital_id: row.hospital_id,
      hospital: {
        id: row.hospital_id,
        nome: row.hospital_nome,
        cidade: row.hospital_cidade,
        cnpj: row.hospital_cnpj
      }
    };
  }

  static async findByHospital(hospitalId: string): Promise<Usuario[]> {
    const result = await query(`
      SELECT 
        u.*,
        h.nome as hospital_nome,
        h.cidade as hospital_cidade,
        h.cnpj as hospital_cnpj
      FROM usuarios u
      JOIN hospitais h ON u.hospital_id = h.id
      WHERE u.hospital_id = $1
      ORDER BY u.email ASC
    `, [hospitalId]);
    
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      hospital_id: row.hospital_id,
      hospital: {
        id: row.hospital_id,
        nome: row.hospital_nome,
        cidade: row.hospital_cidade,
        cnpj: row.hospital_cnpj
      }
    }));
  }

  static async search(term: string): Promise<Usuario[]> {
    const result = await query(`
      SELECT 
        u.*,
        h.nome as hospital_nome,
        h.cidade as hospital_cidade,
        h.cnpj as hospital_cnpj
      FROM usuarios u
      JOIN hospitais h ON u.hospital_id = h.id
      WHERE u.email ILIKE $1 OR h.nome ILIKE $1
      ORDER BY u.email ASC
    `, [`%${term}%`]);
    
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      hospital_id: row.hospital_id,
      hospital: {
        id: row.hospital_id,
        nome: row.hospital_nome,
        cidade: row.hospital_cidade,
        cnpj: row.hospital_cnpj
      }
    }));
  }

  static async create(usuarioData: CreateUsuarioDTO): Promise<Usuario> {
    const id = uuidv4();
    
    await query(
      `INSERT INTO usuarios (id, email, hospital_id) 
       VALUES ($1, $2, $3)`,
      [id, usuarioData.email, usuarioData.hospital_id]
    );

    return await this.findById(id) as Usuario;
  }

  static async update(id: string, usuarioData: UpdateUsuarioDTO): Promise<Usuario | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (usuarioData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(usuarioData.email);
    }
    if (usuarioData.hospital_id !== undefined) {
      fields.push(`hospital_id = $${paramIndex++}`);
      values.push(usuarioData.hospital_id);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  // Método para autenticação simples (apenas verifica se email existe)
  static async authenticate(email: string): Promise<Usuario | null> {
    return await this.findByEmail(email);
  }

  // Método para obter hospitais disponíveis para um usuário
  static async getAvailableHospitals(email: string): Promise<Hospital[]> {
    const result = await query(`
      SELECT DISTINCT h.*
      FROM hospitais h
      JOIN usuarios u ON h.id = u.hospital_id
      WHERE u.email = $1
      ORDER BY h.nome ASC
    `, [email]);
    
    return result.rows;
  }
}
