import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Importar configurações e middleware
import { testConnection, closePool } from './database/config';
import { 
  errorHandler, 
  notFoundHandler, 
  requestLogger, 
  securityHeaders 
} from './middleware';

// Importar rotas
import medicosRoutes from './routes/medicos';
import procedimentosRoutes from './routes/procedimentos';
import agendamentosRoutes from './routes/agendamentos';

// Configurar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware globais
app.use(helmet()); // Segurança básica
app.use(cors(corsOptions)); // CORS
app.use(securityHeaders); // Headers de segurança customizados
app.use(requestLogger); // Log de requisições
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parser URL encoded

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MedAgenda API',
    version: '1.0.0',
    description: 'API para o sistema de agendamento hospitalar MedAgenda',
    endpoints: {
      medicos: '/api/medicos',
      procedimentos: '/api/procedimentos',
      agendamentos: '/api/agendamentos'
    },
    documentation: 'https://github.com/medagenda/api-docs'
  });
});

// Rotas da API
app.use('/api/medicos', medicosRoutes);
app.use('/api/procedimentos', procedimentosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

// Middleware de tratamento de erros (deve vir por último)
app.use(notFoundHandler);
app.use(errorHandler);

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Falha na conexão com banco de dados');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API disponível em: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check em: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await closePool();
          console.log('✅ Database connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during database shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Capturar sinais de encerramento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Capturar erros não tratados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export default app;
