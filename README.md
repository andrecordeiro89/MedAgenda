# 🏥 MedAgenda

Sistema de agendamento hospitalar multi‑hospital com foco em rotina cirúrgica. Inclui Grade Cirúrgica, Documentação pré‑operatória, Anestesia, Faturamento e integrações externas (SIGTAP). Construído em React + Vite e Node/Express com PostgreSQL/Supabase.

## ✨ Visão Geral
- Grade Cirúrgica por dia com especialidades, procedimentos e pacientes
- Documentação: anexos de exames, pré‑operatório e complementares
- Anestesia: avaliação, observações e acompanhamento de documentação
- Faturamento: relatórios, exportações XLSX/PDF/ZIP e controles de AIH
- Integração externa SIGTAP via Supabase (procedimentos e estatísticas)
- Atualizações em tempo real entre telas via Supabase Realtime

## 🏗️ Arquitetura
- Frontend: React + TypeScript + Vite, estado por Context e hooks
- Backend: Node/Express (TypeScript), validações e segurança
- Banco: PostgreSQL/Supabase, consultas filtradas por hospital e data
- Serviços: 
  - services/supabase.ts (CRUD e queries filtradas)
  - services/external-supabase.ts (SIGTAP)
  - Integração de médicos e agendamentos por hospital

Documentos úteis:
- SUPABASE: [SUPABASE-SETUP.md](SUPABASE-SETUP.md)
- Dados externos (SIGTAP): [DADOS_EXTERNOS.md](DADOS_EXTERNOS.md), [SIGTAP_INTEGRATION.md](SIGTAP_INTEGRATION.md)
- Multi‑hospital: [GUIA-INTEGRACAO-MULTIHOSPITAL.md](GUIA-INTEGRACAO-MULTIHOSPITAL.md)

## 🔹 Módulos Principais
- Grade Cirúrgica: montar agenda do dia, editar especialidade do grupo, mover pacientes entre datas preservando todos os dados
- Documentação: filtros, anexos (exames/pré‑op/complementares), exportações, realtime
- Anestesia: status, observações, complementares, pré‑operatório e visualizações
- Faturamento: AIH, relatórios, justificativas e exportações
- Dashboard: visão geral e indicadores

## 🚀 Início Rápido
Pré‑requisitos:
- Node.js 18+ e npm
- PostgreSQL/Supabase configurado

Passos:
```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run db:setup
npm run dev   # http://localhost:3001

# Frontend (raiz)
cd ..
npm install
npm run dev   # http://localhost:3000
```

## 🔧 Scripts
Frontend:
```bash
npm run dev
npm run build
npm run preview
```
Backend:
```bash
npm run dev
npm run db:setup
npm run db:reset
npm run migrate up
npm run seed
```

## 🔌 Integrações
- Supabase local: CRUD de agendamentos, médicos, documentação
- Supabase externo (SIGTAP): busca e paginação de ~100k registros, deduplicação
- Exportações: XLSX, PDF (jsPDF + autotable), ZIP (JSZip)

## 🔁 Atualizações em Tempo Real
- Documentação: canal doc‑aih‑{hospitalId}
- Faturamento: canal fat‑just‑{hospitalId}
- Anestesia: canal anes‑{hospitalId}
As telas refletem transferências e edições imediatamente, sem recarga completa.

## ⚙️ Performance
- Carregamento por mês/hospital na Documentação
- Consultas por dia/hospital na Grade Cirúrgica
- Virtualização de listas e ordenações estáveis
- Priorizar paginação server‑side e seleção de colunas mínimas

## 🔒 Segurança
- Helmet, CORS, validações robustas (Express)
- Recomendado: autenticação JWT/sessão e políticas RLS por hospital_id no PostgreSQL/Supabase
- Evitar uso de chaves anon para dados sensíveis diretamente no frontend

## 🧾 Modelo de Dados (principais campos)
- Agendamento: paciente, datas (agendamento/consulta), hospital_id, especialidade, médico, procedimentos, documentação (exames/pré‑op/complementares), AIH, avaliação anestesista, faturamento e justificativas

## 🤝 Contribuição
1. Fork
2. Branch (`feature/nova-feature`)
3. Commits
4. Pull Request

## 📄 Licença
ISC — veja [LICENSE](LICENSE).

## 📚 Referências
- Backend API: [backend/README.md](backend/README.md)
- Setup Supabase: [SUPABASE-SETUP.md](SUPABASE-SETUP.md)
- Integração SIGTAP: [SIGTAP_INTEGRATION.md](SIGTAP_INTEGRATION.md)
- Multi‑hospital: [GUIA-INTEGRACAO-MULTIHOSPITAL.md](GUIA-INTEGRACAO-MULTIHOSPITAL.md)
