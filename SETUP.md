# 🏥 MedAgenda - Guia de Configuração Completa

Sistema completo de agendamento hospitalar com frontend React e backend Node.js + PostgreSQL.

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** ou **yarn**
- **Git** (opcional)

## 🚀 Configuração Rápida

### 1. Configurar Backend

```bash
# Navegar para pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
```

Edite o arquivo `.env` com suas configurações do PostgreSQL:
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

### 2. Configurar Banco de Dados

```bash
# Conectar ao PostgreSQL e criar banco
psql -U postgres
CREATE DATABASE medagenda;
\q

# Executar migrations e seed
npm run db:setup
```

### 3. Iniciar Backend

```bash
# Modo desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 4. Configurar Frontend

```bash
# Em uma nova aba do terminal, voltar para raiz
cd ..

# Instalar dependências (se necessário)
npm install

# Iniciar frontend
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## ✅ Verificação

1. **Backend**: Acesse `http://localhost:3001/health` - deve retornar status OK
2. **API**: Acesse `http://localhost:3001/api` - deve retornar informações da API
3. **Frontend**: Acesse `http://localhost:3000` - deve carregar a aplicação
4. **Dados**: A aplicação deve mostrar médicos, procedimentos e agendamentos de exemplo

## 🛠️ Scripts Disponíveis

### Backend (`cd backend`)
```bash
npm run dev          # Servidor desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor produção
npm run migrate up   # Criar tabelas
npm run migrate down # Remover tabelas
npm run seed         # Popular com dados de exemplo
npm run db:setup     # Setup completo (migrate + seed)
npm run db:reset     # Reset completo
```

### Frontend (raiz do projeto)
```bash
npm run dev     # Servidor desenvolvimento
npm run build   # Build para produção
npm run preview # Preview da build
```

## 🔧 Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list | grep postgres # macOS

# Testar conexão
psql -U postgres -d medagenda -c "SELECT NOW();"
```

### Erro de CORS
- Verificar se `FRONTEND_URL` no `.env` está correto
- Certificar que backend está rodando na porta 3001

### Erro "API não disponível"
- Verificar se backend está rodando
- Testar: `curl http://localhost:3001/health`

### Dados não carregam
```bash
# Recriar banco e dados
cd backend
npm run db:reset
```

## 📊 Dados de Exemplo

O sistema vem com dados pré-configurados:
- **5 médicos** com diferentes especialidades
- **6 procedimentos** (ambulatoriais e cirúrgicos)
- **~25 agendamentos** distribuídos em datas futuras

## 🔄 Fluxo de Desenvolvimento

1. **Backend primeiro**: Sempre certifique que o backend está rodando
2. **Migrations**: Use `npm run migrate up` para criar novas tabelas
3. **Seed**: Use `npm run seed` para popular com dados de teste
4. **Reset**: Use `npm run db:reset` quando precisar limpar tudo

## 🌐 URLs Importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Documentação API**: Veja `backend/README.md`

## 📁 Estrutura do Projeto

```
MedAgenda/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── database/       # Configuração, migrations, seed
│   │   ├── models/         # Modelos de dados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares customizados
│   │   └── server.ts       # Servidor principal
│   └── README.md
├── services/
│   └── api.ts              # Cliente da API para frontend
├── components/             # Componentes React
├── App.tsx                 # Componente principal
└── SETUP.md               # Este arquivo
```

## 🎯 Próximos Passos

1. **Teste todas as funcionalidades**:
   - Dashboard com estatísticas
   - Calendário interativo
   - CRUD de médicos, procedimentos e agendamentos

2. **Personalize os dados**:
   - Edite `backend/src/database/seed.ts` para seus dados
   - Execute `npm run db:reset` para aplicar

3. **Deploy** (opcional):
   - Configure variáveis de produção
   - Use serviços como Heroku, Vercel, Railway

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do backend e frontend
2. Confirme que PostgreSQL está rodando
3. Teste as URLs de saúde da API
4. Recrie o banco se necessário

---

**MedAgenda** - Sistema de Agendamento Hospitalar  
Desenvolvido com ❤️ usando React, Node.js e PostgreSQL
