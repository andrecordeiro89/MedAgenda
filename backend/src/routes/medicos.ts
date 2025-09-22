import { Router, Request, Response } from 'express';
import { MedicoModel } from '../models/MedicoModel';
import { ApiResponse } from '../types';
import { 
  validateCreateMedico, 
  validateUpdateMedico, 
  validateUUID, 
  validateSearch 
} from '../utils/validators';
import { handleValidationErrors, checkResourceExists } from '../middleware';

const router = Router();

// GET /api/medicos - Listar todos os médicos ou buscar
router.get('/', validateSearch, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    let medicos;
    if (q && typeof q === 'string') {
      medicos = await MedicoModel.search(q);
    } else {
      medicos = await MedicoModel.findAll();
    }

    const response: ApiResponse<typeof medicos> = {
      success: true,
      data: medicos
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar médicos'
    });
  }
});

// GET /api/medicos/:id - Buscar médico por ID
router.get('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(MedicoModel),
  async (req: Request, res: Response) => {
    const response: ApiResponse<typeof req.resource> = {
      success: true,
      data: req.resource
    };

    res.json(response);
  }
);

// POST /api/medicos - Criar novo médico
router.post('/', validateCreateMedico, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Verificar se CRM já existe
    const existingByCrm = await MedicoModel.findByCrm(req.body.crm);
    if (existingByCrm) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Conflito de dados',
        message: 'CRM já está cadastrado'
      };
      res.status(409).json(response);
      return;
    }

    // Verificar se email já existe
    const existingByEmail = await MedicoModel.findByEmail(req.body.email);
    if (existingByEmail) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Conflito de dados',
        message: 'Email já está cadastrado'
      };
      res.status(409).json(response);
      return;
    }

    const medico = await MedicoModel.create(req.body);
    
    const response: ApiResponse<typeof medico> = {
      success: true,
      data: medico,
      message: 'Médico criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar médico'
    });
  }
});

// PUT /api/medicos/:id - Atualizar médico
router.put('/:id', 
  validateUUID,
  validateUpdateMedico, 
  handleValidationErrors,
  checkResourceExists(MedicoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se CRM já existe (para outro médico)
      if (req.body.crm) {
        const existingByCrm = await MedicoModel.findByCrm(req.body.crm);
        if (existingByCrm && existingByCrm.id !== id) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Conflito de dados',
            message: 'CRM já está cadastrado para outro médico'
          };
          res.status(409).json(response);
          return;
        }
      }

      // Verificar se email já existe (para outro médico)
      if (req.body.email) {
        const existingByEmail = await MedicoModel.findByEmail(req.body.email);
        if (existingByEmail && existingByEmail.id !== id) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Conflito de dados',
            message: 'Email já está cadastrado para outro médico'
          };
          res.status(409).json(response);
          return;
        }
      }

      const medico = await MedicoModel.update(id, req.body);
      
      const response: ApiResponse<typeof medico> = {
        success: true,
        data: medico,
        message: 'Médico atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar médico'
      });
    }
  }
);

// DELETE /api/medicos/:id - Excluir médico
router.delete('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(MedicoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se o médico tem agendamentos
      const hasAgendamentos = await MedicoModel.hasAgendamentos(id);
      if (hasAgendamentos) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Operação não permitida',
          message: 'Não é possível excluir médico que possui agendamentos'
        };
        res.status(400).json(response);
        return;
      }

      await MedicoModel.delete(id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Médico excluído com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir médico'
      });
    }
  }
);

export default router;
