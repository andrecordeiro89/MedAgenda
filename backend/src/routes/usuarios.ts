import { Router, Request, Response } from 'express';
import { UsuarioModel } from '../models/UsuarioModel';
import { HospitalModel } from '../models/HospitalModel';
import { ApiResponse } from '../types';
import { 
  validateCreateUsuario, 
  validateUpdateUsuario, 
  validateUUID, 
  validateSearch,
  validateEmail
} from '../utils/validators';
import { handleValidationErrors, checkResourceExists } from '../middleware';

const router = Router();

// GET /api/usuarios - Listar todos os usuários ou buscar
router.get('/', validateSearch, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { q, hospitalId } = req.query;
    
    let usuarios;
    if (q && typeof q === 'string') {
      usuarios = await UsuarioModel.search(q);
    } else if (hospitalId && typeof hospitalId === 'string') {
      usuarios = await UsuarioModel.findByHospital(hospitalId);
    } else {
      usuarios = await UsuarioModel.findAll();
    }

    const response: ApiResponse<typeof usuarios> = {
      success: true,
      data: usuarios
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar usuários'
    });
  }
});

// POST /api/usuarios/auth - Autenticação simples por email
router.post('/auth', validateEmail, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    const usuario = await UsuarioModel.authenticate(email);
    if (!usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuário não encontrado',
        message: 'Email não cadastrado no sistema'
      };
      res.status(401).json(response);
      return;
    }

    // Buscar hospitais disponíveis para o usuário
    const hospitais = await UsuarioModel.getAvailableHospitals(email);

    const response: ApiResponse<{usuario: typeof usuario, hospitais: typeof hospitais}> = {
      success: true,
      data: {
        usuario,
        hospitais
      },
      message: 'Usuário autenticado com sucesso'
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha na autenticação'
    });
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(UsuarioModel),
  async (req: Request, res: Response) => {
    const response: ApiResponse<typeof req.resource> = {
      success: true,
      data: req.resource
    };

    res.json(response);
  }
);

// POST /api/usuarios - Criar novo usuário
router.post('/', validateCreateUsuario, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Verificar se hospital existe
    const hospital = await HospitalModel.findById(req.body.hospital_id);
    if (!hospital) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Hospital não encontrado',
        message: 'O hospital especificado não existe'
      };
      res.status(400).json(response);
      return;
    }

    // Verificar se email já existe
    const existingUsuario = await UsuarioModel.findByEmail(req.body.email);
    if (existingUsuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Email já cadastrado',
        message: 'Já existe um usuário com este email'
      };
      res.status(409).json(response);
      return;
    }

    const usuario = await UsuarioModel.create(req.body);
    
    const response: ApiResponse<typeof usuario> = {
      success: true,
      data: usuario,
      message: 'Usuário criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar usuário'
    });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', 
  validateUUID,
  validateUpdateUsuario, 
  handleValidationErrors,
  checkResourceExists(UsuarioModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se hospital existe (se fornecido)
      if (req.body.hospital_id) {
        const hospital = await HospitalModel.findById(req.body.hospital_id);
        if (!hospital) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Hospital não encontrado',
            message: 'O hospital especificado não existe'
          };
          res.status(400).json(response);
          return;
        }
      }

      // Verificar se email já existe (se fornecido)
      if (req.body.email) {
        const existingUsuario = await UsuarioModel.findByEmail(req.body.email);
        if (existingUsuario && existingUsuario.id !== id) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Email já cadastrado',
            message: 'Já existe outro usuário com este email'
          };
          res.status(409).json(response);
          return;
        }
      }

      const usuario = await UsuarioModel.update(id, req.body);
      
      const response: ApiResponse<typeof usuario> = {
        success: true,
        data: usuario,
        message: 'Usuário atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar usuário'
      });
    }
  }
);

// DELETE /api/usuarios/:id - Excluir usuário
router.delete('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(UsuarioModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await UsuarioModel.delete(id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Usuário excluído com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir usuário'
      });
    }
  }
);

export default router;
