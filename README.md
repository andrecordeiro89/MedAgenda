# 🏥 MedAgenda - Sistema de Agendamento Hospitalar

<div align="center">

![MedAgenda](https://img.shields.io/badge/MedAgenda-Sistema%20Hospitalar-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-Full%20Stack-3178C6?style=for-the-badge&logo=typescript)

</div>

Sistema completo de agendamento hospitalar com interface moderna e responsiva, incluindo calendário interativo e gerenciamento de pacientes, médicos e procedimentos.

## ✨ Funcionalidades

### 📊 Dashboard
- Estatísticas em tempo real de agendamentos
- Visão geral de procedimentos cirúrgicos e ambulatoriais
- Lista dos próximos agendamentos
- Métricas de status (pendentes vs liberados)

### 📅 Calendário Interativo
- Visualização mensal de agendamentos
- Indicadores visuais por tipo e status
- Modal com detalhes ao clicar nas datas
- Navegação intuitiva entre meses

### 🏥 Gerenciamento Completo
- **Médicos**: CRUD completo com especialidades e contatos
- **Procedimentos**: Tipos ambulatoriais e cirúrgicos com duração
- **Agendamentos**: Sistema completo com validação de conflitos

### 🔍 Recursos Avançados
- Busca em tempo real
- Validação de conflitos de horário
- Cálculo automático de idade
- Interface responsiva (desktop/mobile)
- Feedback visual consistente

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Configuração Rápida
```bash
# 1. Configurar backend
cd backend
npm install
cp env.example .env  # Configure suas credenciais do PostgreSQL

# 2. Configurar banco
npm run db:setup

# 3. Iniciar backend
npm run dev  # Porta 3001

# 4. Em nova aba, iniciar frontend
cd ..
npm run dev  # Porta 3000
```

📖 **Guia completo**: Veja [SETUP.md](SETUP.md) para instruções detalhadas

## 🏗️ Arquitetura

### Frontend (React + TypeScript)
- **Framework**: React 19.1.1 com hooks modernos
- **Build**: Vite para desenvolvimento rápido
- **Estilização**: Tailwind CSS responsivo
- **Estado**: Context API com useReducer
- **Tipagem**: TypeScript para segurança

### Backend (Node.js + Express)
- **Runtime**: Node.js com Express.js
- **Banco**: PostgreSQL com queries otimizadas
- **Validação**: express-validator para dados
- **Segurança**: Helmet, CORS, sanitização
- **API**: RESTful com responses padronizadas

### Banco de Dados (PostgreSQL)
```sql
medicos (id, nome, especialidade, crm, telefone, email)
procedimentos (id, nome, tipo, duracao_estimada_min, descricao)  
agendamentos (id, nome_paciente, data_nascimento, data_agendamento, 
              horario, status_liberacao, medico_id, procedimento_id)
```

## 📱 Screenshots

### Dashboard
Visão geral com métricas e próximos agendamentos

### Calendário
Interface interativa com indicadores visuais por status

### Gerenciamento
CRUD completo com formulários validados

## 🛠️ Tecnologias

### Frontend
- React 19.1.1
- TypeScript 5.8.2
- Tailwind CSS
- Vite 6.2.0

### Backend
- Node.js + Express
- PostgreSQL
- express-validator
- Helmet + CORS

### Ferramentas
- Hot reload development
- TypeScript em todo stack
- Migrations e seeds automatizadas
- Validação robusta de dados

## 📚 Documentação

- [Guia de Setup](SETUP.md) - Configuração completa
- [Backend API](backend/README.md) - Documentação da API
- [Análise do Sistema](ANALISE.md) - Análise técnica detalhada

## 🔧 Scripts Disponíveis

### Frontend
```bash
npm run dev     # Desenvolvimento
npm run build   # Build produção
npm run preview # Preview build
```

### Backend
```bash
npm run dev          # Desenvolvimento  
npm run db:setup     # Setup completo
npm run db:reset     # Reset banco
npm run migrate up   # Criar tabelas
npm run seed         # Popular dados
```

## 🌟 Características Técnicas

### Segurança
- Validação completa de inputs
- Sanitização de dados
- Headers de segurança HTTP
- Prevenção de SQL injection

### Performance
- Queries otimizadas com índices
- Loading states e feedback visual
- Componentes React otimizados
- Hot reload para desenvolvimento

### Usabilidade
- Interface responsiva
- Validação em tempo real
- Mensagens de erro claras
- Navegação intuitiva

## 🎯 Casos de Uso

### Hospitais e Clínicas
- Agendamento de consultas
- Controle de procedimentos
- Gestão de médicos
- Relatórios e estatísticas

### Funcionalidades Principais
- Evitar conflitos de horário
- Calcular idade automaticamente
- Filtrar por status e tipo
- Buscar pacientes e médicos

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📖 Documentação completa em [SETUP.md](SETUP.md)
- 🐛 Issues: Use o GitHub Issues para reportar bugs
- 💡 Sugestões: Pull requests são bem-vindos

---

<div align="center">

**Desenvolvido com ❤️ para facilitar o agendamento hospitalar**

[Documentação](SETUP.md) • [API](backend/README.md) • [Análise](ANALISE.md)

</div>
