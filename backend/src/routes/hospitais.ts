import { Router, Request, Response } from 'express';
import { HospitalModel } from '../models/HospitalModel';
import { ApiResponse } from '../types';
import { 
  validateCreateHospital, 
  validateUpdateHospital, 
  validateUUID, 
  validateSearch
} from '../utils/validators';
import { handleValidationErrors, checkResourceExists } from '../middleware';

const router = Router();

// GET /api/hospitais - Listar todos os hospitais ou buscar
router.get('/', validateSearch, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    let hospitais;
    if (q && typeof q === 'string') {
      hospitais = await HospitalModel.search(q);
    } else {
      hospitais = await HospitalModel.findAll();
    }

    const response: ApiResponse<typeof hospitais> = {
      success: true,
      data: hospitais
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar hospitais'
    });
  }
});

// GET /api/hospitais/statistics - Estatísticas dos hospitais
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await HospitalModel.getStatistics();

    const response: ApiResponse<typeof statistics> = {
      success: true,
      data: statistics
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar estatísticas'
    });
  }
});

// GET /api/hospitais/:id - Buscar hospital por ID
router.get('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(HospitalModel),
  async (req: Request, res: Response) => {
    const response: ApiResponse<typeof req.resource> = {
      success: true,
      data: req.resource
    };

    res.json(response);
  }
);

// POST /api/hospitais - Criar novo hospital
router.post('/', validateCreateHospital, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Verificar se CNPJ já existe
    const existingHospital = await HospitalModel.findByCnpj(req.body.cnpj);
    if (existingHospital) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'CNPJ já cadastrado',
        message: 'Já existe um hospital com este CNPJ'
      };
      res.status(409).json(response);
      return;
    }

    const hospital = await HospitalModel.create(req.body);
    
    const response: ApiResponse<typeof hospital> = {
      success: true,
      data: hospital,
      message: 'Hospital criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar hospital'
    });
  }
});

// PUT /api/hospitais/:id - Atualizar hospital
router.put('/:id', 
  validateUUID,
  validateUpdateHospital, 
  handleValidationErrors,
  checkResourceExists(HospitalModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se CNPJ já existe (se fornecido)
      if (req.body.cnpj) {
        const existingHospital = await HospitalModel.findByCnpj(req.body.cnpj);
        if (existingHospital && existingHospital.id !== id) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'CNPJ já cadastrado',
            message: 'Já existe outro hospital com este CNPJ'
          };
          res.status(409).json(response);
          return;
        }
      }

      const hospital = await HospitalModel.update(id, req.body);
      
      const response: ApiResponse<typeof hospital> = {
        success: true,
        data: hospital,
        message: 'Hospital atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar hospital'
      });
    }
  }
);

// DELETE /api/hospitais/:id - Excluir hospital
router.delete('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(HospitalModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se hospital tem usuários
      const hasUsers = await HospitalModel.hasUsers(id);
      if (hasUsers) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Hospital possui usuários',
          message: 'Não é possível excluir um hospital que possui usuários cadastrados'
        };
        res.status(409).json(response);
        return;
      }

      await HospitalModel.delete(id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Hospital excluído com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir hospital'
      });
    }
  }
);

export default router;
