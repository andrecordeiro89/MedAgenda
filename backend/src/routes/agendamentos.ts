import { Router, Request, Response } from 'express';
import { AgendamentoModel } from '../models/AgendamentoModel';
import { MedicoModel } from '../models/MedicoModel';
import { ProcedimentoModel } from '../models/ProcedimentoModel';
import { ApiResponse } from '../types';
import { 
  validateCreateAgendamento, 
  validateUpdateAgendamento, 
  validateUUID, 
  validateSearch,
  validateDateRange
} from '../utils/validators';
import { handleValidationErrors, checkResourceExists } from '../middleware';

const router = Router();

// GET /api/agendamentos - Listar todos os agendamentos ou buscar
router.get('/', validateSearch, validateDateRange, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { q, startDate, endDate, medicoId, status } = req.query;
    
    let agendamentos;
    if (q && typeof q === 'string') {
      agendamentos = await AgendamentoModel.search(q);
    } else if (medicoId && typeof medicoId === 'string') {
      agendamentos = await AgendamentoModel.findByMedico(medicoId);
    } else {
      agendamentos = await AgendamentoModel.findAll();
    }

    // Filtrar por data se especificado
    if (startDate || endDate) {
      agendamentos = agendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        
        if (startDate && dataAgendamento < new Date(startDate as string)) {
          return false;
        }
        
        if (endDate && dataAgendamento > new Date(endDate as string)) {
          return false;
        }
        
        return true;
      });
    }

    // Filtrar por status se especificado
    if (status && (status === 'pendente' || status === 'liberado')) {
      agendamentos = agendamentos.filter(agendamento => agendamento.status_liberacao === status);
    }

    const response: ApiResponse<typeof agendamentos> = {
      success: true,
      data: agendamentos
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar agendamentos'
    });
  }
});

// GET /api/agendamentos/statistics - Estatísticas dos agendamentos
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await AgendamentoModel.getStatistics();

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

// GET /api/agendamentos/date/:date - Buscar agendamentos por data específica
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formato de data inválido',
        message: 'Data deve estar no formato YYYY-MM-DD'
      };
      res.status(400).json(response);
      return;
    }

    const agendamentos = await AgendamentoModel.findByDate(date);

    const response: ApiResponse<typeof agendamentos> = {
      success: true,
      data: agendamentos
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao buscar agendamentos da data'
    });
  }
});

// GET /api/agendamentos/:id - Buscar agendamento por ID
router.get('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(AgendamentoModel),
  async (req: Request, res: Response) => {
    const response: ApiResponse<typeof req.resource> = {
      success: true,
      data: req.resource
    };

    res.json(response);
  }
);

// POST /api/agendamentos - Criar novo agendamento
router.post('/', validateCreateAgendamento, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Verificar se médico existe
    const medico = await MedicoModel.findById(req.body.medico_id);
    if (!medico) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Médico não encontrado',
        message: 'O médico especificado não existe'
      };
      res.status(400).json(response);
      return;
    }

    // Verificar se procedimento existe
    const procedimento = await ProcedimentoModel.findById(req.body.procedimento_id);
    if (!procedimento) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Procedimento não encontrado',
        message: 'O procedimento especificado não existe'
      };
      res.status(400).json(response);
      return;
    }

    // Verificar conflito de horário
    const hasConflict = await AgendamentoModel.checkConflict(
      req.body.medico_id,
      req.body.data_agendamento,
      req.body.horario
    );

    if (hasConflict) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Conflito de horário',
        message: 'Já existe um agendamento para este médico nesta data e horário'
      };
      res.status(409).json(response);
      return;
    }

    const agendamento = await AgendamentoModel.create(req.body);
    
    const response: ApiResponse<typeof agendamento> = {
      success: true,
      data: agendamento,
      message: 'Agendamento criado com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao criar agendamento'
    });
  }
});

// PUT /api/agendamentos/:id - Atualizar agendamento
router.put('/:id', 
  validateUUID,
  validateUpdateAgendamento, 
  handleValidationErrors,
  checkResourceExists(AgendamentoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se médico existe (se fornecido)
      if (req.body.medico_id) {
        const medico = await MedicoModel.findById(req.body.medico_id);
        if (!medico) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Médico não encontrado',
            message: 'O médico especificado não existe'
          };
          res.status(400).json(response);
          return;
        }
      }

      // Verificar se procedimento existe (se fornecido)
      if (req.body.procedimento_id) {
        const procedimento = await ProcedimentoModel.findById(req.body.procedimento_id);
        if (!procedimento) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Procedimento não encontrado',
            message: 'O procedimento especificado não existe'
          };
          res.status(400).json(response);
          return;
        }
      }

      // Verificar conflito de horário (se data, horário ou médico foram alterados)
      if (req.body.medico_id || req.body.data_agendamento || req.body.horario) {
        const currentAgendamento = req.resource;
        const medicoId = req.body.medico_id || currentAgendamento.medico_id;
        const dataAgendamento = req.body.data_agendamento || currentAgendamento.data_agendamento;
        const horario = req.body.horario || currentAgendamento.horario;

        const hasConflict = await AgendamentoModel.checkConflict(
          medicoId,
          dataAgendamento,
          horario,
          id
        );

        if (hasConflict) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Conflito de horário',
            message: 'Já existe um agendamento para este médico nesta data e horário'
          };
          res.status(409).json(response);
          return;
        }
      }

      const agendamento = await AgendamentoModel.update(id, req.body);
      
      const response: ApiResponse<typeof agendamento> = {
        success: true,
        data: agendamento,
        message: 'Agendamento atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar agendamento'
      });
    }
  }
);

// DELETE /api/agendamentos/:id - Excluir agendamento
router.delete('/:id', 
  validateUUID, 
  handleValidationErrors,
  checkResourceExists(AgendamentoModel),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await AgendamentoModel.delete(id);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Agendamento excluído com sucesso'
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao excluir agendamento'
      });
    }
  }
);

export default router;
