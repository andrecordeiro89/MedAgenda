import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

// Middleware para tratar erros de validação
export const handleValidationErrors = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Dados inválidos',
      message: errors.array().map(error => error.msg).join(', ')
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};

// Middleware para tratar erros gerais
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Erro de violação de constraint única (PostgreSQL)
  if (error.code === '23505') {
    let message = 'Registro já existe';
    
    if (error.constraint?.includes('crm')) {
      message = 'CRM já está cadastrado';
    } else if (error.constraint?.includes('email')) {
      message = 'Email já está cadastrado';
    } else if (error.constraint?.includes('nome')) {
      message = 'Nome já está cadastrado';
    } else if (error.constraint?.includes('medico_id')) {
      message = 'Já existe um agendamento para este médico nesta data e horário';
    }

    const response: ApiResponse<null> = {
      success: false,
      error: 'Conflito de dados',
      message
    };
    res.status(409).json(response);
    return;
  }

  // Erro de violação de foreign key (PostgreSQL)
  if (error.code === '23503') {
    let message = 'Referência inválida';
    
    if (error.constraint?.includes('medico_id')) {
      message = 'Médico não encontrado';
    } else if (error.constraint?.includes('procedimento_id')) {
      message = 'Procedimento não encontrado';
    }

    const response: ApiResponse<null> = {
      success: false,
      error: 'Dados relacionados não encontrados',
      message
    };
    res.status(400).json(response);
    return;
  }

  // Erro de violação de check constraint (PostgreSQL)
  if (error.code === '23514') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Dados inválidos',
      message: 'Valores fornecidos não atendem às regras de negócio'
    };
    res.status(400).json(response);
    return;
  }

  // Erro de conexão com banco
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha na conexão com banco de dados'
    };
    res.status(503).json(response);
    return;
  }

  // Erro genérico
  const response: ApiResponse<null> = {
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
  };
  
  res.status(500).json(response);
};

// Middleware para tratar rotas não encontradas
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: 'Rota não encontrada',
    message: `Endpoint ${req.method} ${req.path} não existe`
  };
  
  res.status(404).json(response);
};

// Middleware de logging
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`${method} ${url} - ${status} - ${duration}ms - ${userAgent}`);
  });
  
  next();
};

// Middleware para adicionar headers de segurança básicos
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar proteção XSS no browser
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remover header que identifica o servidor
  res.removeHeader('X-Powered-By');
  
  next();
};

// Middleware para verificar se o recurso existe
export const checkResourceExists = (model: any, idParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params[idParam];
      const resource = await model.findById(id);
      
      if (!resource) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Recurso não encontrado',
          message: 'O recurso solicitado não existe'
        };
        res.status(404).json(response);
        return;
      }
      
      // Adicionar o recurso ao request para uso posterior
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Estender o tipo Request para incluir resource
declare global {
  namespace Express {
    interface Request {
      resource?: any;
    }
  }
}
