import { Router, Request, Response } from 'express';
import { ProcedimentoModel } from '../models/ProcedimentoModel';
import { ApiResponse } from '../types';
import { 
  validateCreateProcedimento, 
  validateUpdateProcedimento, 
  validateUUID, 
  validateSearch 
} from '../utils/validators';
import { handleValidationErrors, checkResourceExists } from '../middleware';

const router = Router();

// GET /api/procedimentos - Listar todos os procedimentos ou buscar
router.get('/', validateSearch, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { q, tipo } = req.query;
    
    let procedimentos;
    if (q && typeof q === 'string') {
      procedimentos = await ProcedimentoModel.search(q);
    } else if (tipo && (tipo === 'cirurgico' || tipo === 'ambulatorial')) {
      procedimentos = await ProcedimentoModel.findByTipo(tipo);
    } else {
      procedimentos = await ProcedimentoModel.findAll();
    }

    const response: ApiResponse<typeof procedimentos> = {
      success: true,
      data: procedimentos
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar procedimentos'
    });
  }
});

// GET /api/procedimentos/statistics - Estatísticas dos procedimentos
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await ProcedimentoModel.getStatistics();

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

// GET /api/procedimentos/:id - Buscar procedimento por ID
router.get('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(ProcedimentoModel),
  async (req: Request, res: Response) => {
    const response: ApiResponse<typeof req.resource> = {
      success: true,
      data: req.resource
    };

    res.json(response);
  }
);

// POST /api/procedimentos - Criar novo procedimento
router.post('/', validateCreateProcedimento, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Verificar se nome já existe
    const existingByNome = await ProcedimentoModel.findByNome(req.body.nome);
    if (existingByNome) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Conflito de dados',
        message: 'Procedimento com este nome já está cadastrado'
      };
      res.status(409).json(response);
      return;
    }

    const procedimento = await ProcedimentoModel.create(req.body);
    
    const response: ApiResponse<typeof procedimento> = {
      success: true,
      data: procedimento,
      message: 'Procedimento criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar procedimento'
    });
  }
});

// PUT /api/procedimentos/:id - Atualizar procedimento
router.put('/:id', 
  validateUUID,
  validateUpdateProcedimento, 
  handleValidationErrors,
  checkResourceExists(ProcedimentoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se nome já existe (para outro procedimento)
      if (req.body.nome) {
        const existingByNome = await ProcedimentoModel.findByNome(req.body.nome);
        if (existingByNome && existingByNome.id !== id) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Conflito de dados',
            message: 'Procedimento com este nome já está cadastrado'
          };
          res.status(409).json(response);
          return;
        }
      }

      const procedimento = await ProcedimentoModel.update(id, req.body);
      
      const response: ApiResponse<typeof procedimento> = {
        success: true,
        data: procedimento,
        message: 'Procedimento atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar procedimento'
      });
    }
  }
);

// DELETE /api/procedimentos/:id - Excluir procedimento
router.delete('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(ProcedimentoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se o procedimento tem agendamentos
      const hasAgendamentos = await ProcedimentoModel.hasAgendamentos(id);
      if (hasAgendamentos) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Operação não permitida',
          message: 'Não é possível excluir procedimento que possui agendamentos'
        };
        res.status(400).json(response);
        return;
      }

      await ProcedimentoModel.delete(id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Procedimento excluído com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir procedimento'
      });
    }
  }
);

export default router;
