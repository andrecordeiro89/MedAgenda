import { body, param, query } from 'express-validator';

// Validadores para Médico
export const validateCreateMedico = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('especialidade')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Especialidade deve ter entre 2 e 255 caracteres'),
  
  body('crm')
    .trim()
    .matches(/^\d{4,6}-[A-Z]{2}$/)
    .withMessage('CRM deve estar no formato XXXXX-UF'),
  
  body('telefone')
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido')
];

export const validateUpdateMedico = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('especialidade')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Especialidade deve ter entre 2 e 255 caracteres'),
  
  body('crm')
    .optional()
    .trim()
    .matches(/^\d{4,6}-[A-Z]{2}$/)
    .withMessage('CRM deve estar no formato XXXXX-UF'),
  
  body('telefone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido')
];

// Validadores para Procedimento
export const validateCreateProcedimento = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('tipo')
    .isIn(['cirurgico', 'ambulatorial'])
    .withMessage('Tipo deve ser cirurgico ou ambulatorial'),
  
  body('duracao_estimada_min')
    .isInt({ min: 1, max: 600 })
    .withMessage('Duração deve ser um número inteiro entre 1 e 600 minutos'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres')
];

export const validateUpdateProcedimento = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('tipo')
    .optional()
    .isIn(['cirurgico', 'ambulatorial'])
    .withMessage('Tipo deve ser cirurgico ou ambulatorial'),
  
  body('duracao_estimada_min')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duração deve ser um número inteiro entre 1 e 600 minutos'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres')
];

// Validadores para Agendamento
export const validateCreateAgendamento = [
  body('nome_paciente')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome do paciente deve ter entre 2 e 255 caracteres'),
  
  body('data_nascimento')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      if (birthDate >= today) {
        throw new Error('Data de nascimento não pode ser futura');
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        throw new Error('Data de nascimento inválida');
      }
      return true;
    }),
  
  body('cidade_natal')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Cidade natal deve ter no máximo 255 caracteres'),
  
  body('telefone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  body('whatsapp')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('WhatsApp deve estar no formato (XX) XXXXX-XXXX'),
  
  body('data_agendamento')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(value);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Data de agendamento não pode ser no passado');
      }
      return true;
    }),
  
  
  body('status_liberacao')
    .isIn(['pendente', 'liberado'])
    .withMessage('Status deve ser pendente ou liberado'),
  
  body('medico_id')
    .isUUID()
    .withMessage('ID do médico deve ser um UUID válido'),
  
  body('procedimento_id')
    .isUUID()
    .withMessage('ID do procedimento deve ser um UUID válido')
];

export const validateUpdateAgendamento = [
  body('nome_paciente')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome do paciente deve ter entre 2 e 255 caracteres'),
  
  body('data_nascimento')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      const today = new Date();
      const birthDate = new Date(value);
      if (birthDate >= today) {
        throw new Error('Data de nascimento não pode ser futura');
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        throw new Error('Data de nascimento inválida');
      }
      return true;
    }),
  
  body('cidade_natal')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Cidade natal deve ter no máximo 255 caracteres'),
  
  body('telefone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  body('whatsapp')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('WhatsApp deve estar no formato (XX) XXXXX-XXXX'),
  
  body('data_agendamento')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(value);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Data de agendamento não pode ser no passado');
      }
      return true;
    }),
  
  
  body('status_liberacao')
    .optional()
    .isIn(['pendente', 'liberado'])
    .withMessage('Status deve ser pendente ou liberado'),
  
  body('medico_id')
    .optional()
    .isUUID()
    .withMessage('ID do médico deve ser um UUID válido'),
  
  body('procedimento_id')
    .optional()
    .isUUID()
    .withMessage('ID do procedimento deve ser um UUID válido')
];

// Validadores para Hospital
export const validateCreateHospital = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('cidade')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Cidade deve ter entre 2 e 255 caracteres'),
  
  body('cnpj')
    .trim()
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
];

export const validateUpdateHospital = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  
  body('cidade')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Cidade deve ter entre 2 e 255 caracteres'),
  
  body('cnpj')
    .optional()
    .trim()
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
];

// Validadores para Usuario
export const validateCreateUsuario = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  
  body('hospital_id')
    .isUUID()
    .withMessage('ID do hospital deve ser um UUID válido')
];

export const validateUpdateUsuario = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  
  body('hospital_id')
    .optional()
    .isUUID()
    .withMessage('ID do hospital deve ser um UUID válido')
];

export const validateEmail = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido')
];

// Validadores comuns
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID deve ser um UUID válido')
];

export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Termo de busca deve ter entre 1 e 100 caracteres')
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número inteiro entre 1 e 100')
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data inicial deve estar no formato YYYY-MM-DD'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data final deve estar no formato YYYY-MM-DD')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('Data final deve ser posterior à data inicial');
        }
      }
      return true;
    })
];
