# 📋 Product Requirements Document (PRD) - MedAgenda

## 1. Visão do Produto

O MedAgenda é um sistema de agendamento hospitalar multi-hospital desenvolvido para otimizar a gestão de rotinas cirúrgicas. A plataforma integra grade cirúrgica, documentação pré-operatória, anestesia e faturamento, proporcionando uma visão unificada e em tempo real do fluxo cirúrgico.

### Objetivos Principais
- **Digitalizar e centralizar** o agendamento cirúrgico em múltiplos hospitais
- **Reduzir erros** na gestão de pacientes e procedimentos
- **Melhorar a comunicação** entre equipes médicas e administrativas
- **Garantir conformidade** com regulamentações do SIGTAP
- **Otimizar tempo** de preparação e execução de cirurgias

### Valor de Mercado
Sistema especializado para hospitais que buscam modernizar sua gestão cirúrgica, com foco em eficiência operacional e qualidade do atendimento.

## 2. Personas

| Persona | Descrição | Principais Necessidades |
|---------|-----------|------------------------|
| **Coordenador Cirúrgico** | Responsável pela grade cirúrgica diária | Visualizar disponibilidade, alocar salas, gerenciar conflitos |
| **Médico Anestesista** | Responsável pela avaliação pré-anestésica | Acessar documentação, registrar avaliações, acompanhar status |
| **Equipe de Faturamento** | Responsável pela AIH e justificativas | Gerar relatórios, exportar dados, controlar status de faturamento |
| **Administrador Hospitalar** | Supervisão geral do sistema | Dashboard com KPIs, gestão de usuários, configurações |
| **Médico Cirurgião** | Realiza procedimentos cirúrgicos | Verificar agenda, acessar documentação do paciente |

## 3. Funcionalidades Principais

### 3.1 Grade Cirúrgica
- Visualização diária por hospital e especialidade
- Alocação dinâmica de pacientes entre datas
- Gerenciamento de salas cirúrgicas
- Preservação de dados ao mover pacientes

### 3.2 Documentação Pré-Operatória
- Anexo de exames médicos (PDF, imagens)
- Documentação pré-operatória e complementar
- Filtros avançados por paciente, data e tipo
- Exportação em múltiplos formatos (XLSX, PDF, ZIP)

### 3.3 Anestesia
- Avaliação pré-anestésica estruturada
- Registro de observações e complementares
- Status de documentação anestésica
- Interface dedicada para anestesistas

### 3.4 Faturamento e AIH
- Controle de status de AIH (Autorização de Internação Hospitalar)
- Justificativas de faturamento
- Relatórios gerenciais exportáveis
- Timeline de status com timestamps

### 3.5 Dashboard e KPIs
- Visão geral de indicadores por hospital
- Métricas de produtividade cirúrgica
- Acompanhamento de metas por especialidade
- Gráficos interativos e filtros dinâmicos

### 3.6 Integração SIGTAP
- Busca de procedimentos na base SIGTAP
- Paginação eficiente para grandes volumes (~100k registros)
- Deduplicação automática de procedimentos
- Atualização periódica de dados

## 4. Arquitetura Multi-Hospital

### Permissões por Hospital
- Cada usuário vinculado a um ou mais hospitais
- Filtros automáticos por `hospital_id`
- Isolamento completo de dados entre hospitais
- Gestão centralizada de múltiplas unidades

### Estrutura de Dados
- **Agendamentos**: paciente, datas, hospital, especialidade, médico, procedimentos
- **Documentação**: exames, pré-operatório, complementares, anexos
- **Anestesia**: avaliações, observações, status de documentação
- **Faturamento**: AIH, justificativas, status, timestamps

## 5. Fluxos de Usuário

### 5.1 Fluxo do Coordenador Cirúrgico
```
Login → Dashboard → Grade Cirúrgica → Selecionar Data/Hospital → 
Alocar Pacientes → Verificar Conflitos → Salvar Alterações
```

### 5.2 Fluxo do Anestesista
```
Login → Dashboard → Anestesia → Filtrar Pacientes → 
Avaliar Pré-Anestésico → Registrar Observações → Atualizar Status
```

### 5.3 Fluxo de Faturamento
```
Login → Dashboard → Faturamento → Selecionar Período → 
Verificar AIHs → Gerar Justificativas → Exportar Relatórios
```

## 6. Integrações e APIs

### 6.1 Supabase (Banco Principal)
- **Autenticação**: JWT com políticas RLS por hospital
- **Realtime**: Atualizações em tempo real entre telas
- **Storage**: Armazenamento de documentos e anexos
- **Canais**: doc-aih-{hospitalId}, fat-just-{hospitalId}, anes-{hospitalId}

### 6.2 SIGTAP (Dados Externos)
- **Consulta de Procedimentos**: Busca paginada e filtrada
- **Deduplicação**: Remoção automática de duplicatas
- **Cache Local**: Otimização de performance
- **Atualização**: Sincronização periódica de dados

### 6.3 Exportações
- **XLSX**: Planilhas Excel com formatação
- **PDF**: Relatórios com jsPDF + autotable
- **ZIP**: Compactação de múltiplos arquivos

## 7. Timeline AIH (Autorização de Internação Hospitalar)

### Status da AIH
1. **Pendente**: Aguardando documentação
2. **Em Análise**: Documentação em revisão
3. **Aprovado**: Liberado para faturamento
4. **Reprovado**: Necessita correções
5. **Faturado**: Processo finalizado

### Controle de Timestamps
- Registro automático de mudanças de status
- Histórico completo para auditoria
- Responsável por cada alteração
- Tempo médio em cada status

## 8. Requisitos Técnicos

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS para estilização
- Context API para estado global
- Componentes reutilizáveis e modulares

### Backend
- Node.js + Express + TypeScript
- Validações robustas e segurança (Helmet, CORS)
- APIs RESTful documentadas
- Tratamento de erros centralizado

### Banco de Dados
- PostgreSQL via Supabase
- Índices otimizados para consultas frequentes
- Particionamento por hospital e data
- Backup automático e recovery

## 9. Segurança e Conformidade

### Autenticação e Autorização
- JWT com refresh tokens
- Políticas RLS no PostgreSQL
- Permissões granulares por papel
- Auditoria de acessos e alterações

### Conformidade LGPD
- Consentimento explícito para tratamento de dados
- Direito ao esquecimento implementado
- Portabilidade de dados do paciente
- Logs de acesso para auditoria

### Segurança de Dados
- Criptografia em repouso e em trânsito
- Sanitização de inputs contra SQL injection
- Rate limiting para prevenir ataques DDoS
- CORS configurado adequadamente

## 10. Critérios de Aceite (Definition of Done)

### Funcionalidade
- [ ] Código revisado e aprovado
- [ ] Testes unitários com cobertura > 80%
- [ ] Testes de integração passando
- [ ] Documentação técnica atualizada

### Performance
- [ ] Carregamento de páginas < 3 segundos
- [ ] Consultas de banco otimizadas (< 100ms)
- [ ] Lazy loading implementado onde aplicável
- [ ] Cache configurado adequadamente

### Segurança
- [ ] Análise de vulnerabilidades realizada
- [ ] Dados sensíveis devidamente protegidos
- [ ] Autenticação e autorização testadas
- [ ] Logs de segurança implementados

### UX/UI
- [ ] Interface responsiva (desktop-first)
- [ ] Acessibilidade WCAG 2.1 nível AA
- [ ] Feedback visual para todas as ações
- [ ] Tratamento de erros amigável

### Deploy
- [ ] Ambiente de staging validado
- [ ] Migrations de banco testadas
- [ ] Rollback planejado e testado
- [ ] Monitoramento configurado

## 11. Métricas de Sucesso (KPIs)

### Eficiência Operacional
- Redução de 30% no tempo de preparação cirúrgica
- Diminuição de 50% em conflitos de agenda
- Aumento de 25% na taxa de ocupação de salas

### Qualidade
- 95% de satisfação dos usuários médicos
- Zero perda de documentação importante
- 99.9% de uptime do sistema

### Financeiro
- ROI positivo em 12 meses
- Redução de 40% em custos operacionais de gestão
- Aumento de 20% na eficiência de faturamento

## 12. Cronograma e Entregas

### Fase 1 - MVP (3 meses)
- Grade cirúrgica básica
- Cadastro de pacientes e médicos
- Documentação pré-operatória
- Dashboard inicial

### Fase 2 - Funcionalidades Completas (2 meses)
- Anestesia e avaliações
- Faturamento e AIH
- Exportações e relatórios
- Integração SIGTAP

### Fase 3 - Multi-Hospital (2 meses)
- Arquitetura multi-tenant
- Gestão de usuários por hospital
- Isolamento de dados
- Realtime entre hospitais

### Fase 4 - Otimização e Escalabilidade (1 mês)
- Performance e caching
- Monitoramento avançado
- Backup e disaster recovery
- Documentação final

---

**Documento elaborado em:** Janeiro/2026  
**Versão:** 1.0  
**Status:** Em desenvolvimento  
**Próxima revisão:** Fevereiro/2026