# MedAgenda Backend API

Backend da aplicação MedAgenda - Sistema de Agendamento Hospitalar.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **express-validator** - Validação de dados
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Segurança HTTP

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório e navegue para a pasta backend**
```bash
cd backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medagenda
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

4. **Configure o banco de dados**

Crie o banco de dados PostgreSQL:
```sql
CREATE DATABASE medagenda;
```

Execute as migrations e seed:
```bash
npm run db:setup
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3001`

## 📝 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm run start` - Inicia servidor de produção

### Database
- `npm run migrate up` - Cria as tabelas do banco
- `npm run migrate down` - Remove todas as tabelas
- `npm run migrate reset` - Remove e recria todas as tabelas
- `npm run seed` - Popula banco com dados de exemplo
- `npm run db:setup` - Setup completo (migrate + seed)
- `npm run db:reset` - Reset completo (reset + seed)

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── database/
│   │   ├── config.ts          # Configuração do PostgreSQL
│   │   ├── migrations.ts      # Scripts de criação de tabelas
│   │   └── seed.ts           # Dados iniciais
│   ├── middleware/
│   │   └── index.ts          # Middlewares customizados
│   ├── models/
│   │   ├── AgendamentoModel.ts
│   │   ├── MedicoModel.ts
│   │   └── ProcedimentoModel.ts
│   ├── routes/
│   │   ├── agendamentos.ts
│   │   ├── medicos.ts
│   │   └── procedimentos.ts
│   ├── scripts/
│   │   ├── migrate.ts        # CLI para migrations
│   │   └── seed.ts          # CLI para seed
│   ├── types/
│   │   └── index.ts         # Definições de tipos
│   ├── utils/
│   │   └── validators.ts    # Validadores de dados
│   └── server.ts           # Arquivo principal
├── dist/                   # Arquivos compilados
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Banco de Dados

### Tabelas

#### `medicos`
```sql
- id (UUID, PK)
- nome (VARCHAR)
- especialidade (VARCHAR)
- crm (VARCHAR, UNIQUE)
- telefone (VARCHAR)
- email (VARCHAR, UNIQUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `procedimentos`
```sql
- id (UUID, PK)
- nome (VARCHAR, UNIQUE)
- tipo (ENUM: 'cirurgico', 'ambulatorial')
- duracao_estimada_min (INTEGER)
- descricao (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `agendamentos`
```sql
- id (UUID, PK)
- nome_paciente (VARCHAR)
- data_nascimento (DATE)
- cidade_natal (VARCHAR)
- telefone (VARCHAR)
- whatsapp (VARCHAR)
- data_agendamento (DATE)
- horario (TIME)
- status_liberacao (ENUM: 'pendente', 'liberado')
- medico_id (UUID, FK)
- procedimento_id (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Relacionamentos
- `agendamentos.medico_id` → `medicos.id`
- `agendamentos.procedimento_id` → `procedimentos.id`

### Constraints
- Unique constraint: `(medico_id, data_agendamento, horario)` - Evita conflitos de horário

## 🔌 API Endpoints

### Médicos
- `GET /api/medicos` - Listar médicos
- `GET /api/medicos/:id` - Buscar médico por ID
- `POST /api/medicos` - Criar médico
- `PUT /api/medicos/:id` - Atualizar médico
- `DELETE /api/medicos/:id` - Excluir médico

### Procedimentos  
- `GET /api/procedimentos` - Listar procedimentos
- `GET /api/procedimentos/:id` - Buscar procedimento por ID
- `GET /api/procedimentos/statistics` - Estatísticas dos procedimentos
- `POST /api/procedimentos` - Criar procedimento
- `PUT /api/procedimentos/:id` - Atualizar procedimento
- `DELETE /api/procedimentos/:id` - Excluir procedimento

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `GET /api/agendamentos/:id` - Buscar agendamento por ID
- `GET /api/agendamentos/statistics` - Estatísticas dos agendamentos
- `GET /api/agendamentos/date/:date` - Agendamentos por data
- `POST /api/agendamentos` - Criar agendamento
- `PUT /api/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/agendamentos/:id` - Excluir agendamento

### Parâmetros de Query
- `q` - Termo de busca
- `startDate` / `endDate` - Filtro por período
- `medicoId` - Filtro por médico
- `status` - Filtro por status (`pendente`, `liberado`)
- `tipo` - Filtro por tipo (`cirurgico`, `ambulatorial`)

## 🔒 Validações

### Médico
- Nome: 2-255 caracteres
- CRM: Formato XXXXX-UF
- Telefone: Formato (XX) XXXXX-XXXX
- Email: Email válido e único

### Procedimento
- Nome: 2-255 caracteres, único
- Tipo: 'cirurgico' ou 'ambulatorial'
- Duração: 1-600 minutos

### Agendamento
- Nome paciente: 2-255 caracteres
- Data nascimento: Não pode ser futura
- Data agendamento: Não pode ser passada
- Horário: Horários predefinidos (08:00-11:00, 14:00-17:00)
- Verificação de conflitos de horário por médico

## 🛡️ Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Configurado para frontend específico
- **Validação**: express-validator para todos os inputs
- **SQL Injection**: Uso de prepared statements
- **Error Handling**: Tratamento centralizado de erros
- **Rate Limiting**: Implementar em produção

## 📊 Monitoramento

### Health Check
```bash
GET /health
```

### API Info
```bash
GET /api
```

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
DB_HOST=seu_host_producao
DB_NAME=medagenda_prod
DB_USER=usuario_producao
DB_PASSWORD=senha_segura
PORT=3001
FRONTEND_URL=https://seu-frontend.com
```

### Build para Produção
```bash
npm run build
npm start
```

## 🧪 Desenvolvimento

### Dados de Exemplo
O comando `npm run seed` cria:
- 5 médicos com especialidades variadas
- 6 procedimentos (ambulatoriais e cirúrgicos)
- ~25 agendamentos distribuídos em datas futuras

### Hot Reload
O servidor de desenvolvimento usa `nodemon` para reinicializar automaticamente quando arquivos são alterados.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

---

**MedAgenda Backend** - Sistema de Agendamento Hospitalar
