# 🎯 SISTEMA SIMPLIFICADO - MedAgenda

## ✅ O QUE FOI FEITO

Sistema completamente simplificado para uso interno:
- ✅ **Apenas 4 tabelas** no banco de dados
- ✅ **Apenas 2 telas** no frontend (Dashboard + Agenda)
- ✅ **Sem complicações** - foco no essencial
- ✅ **Preparado para o banco** - estrutura pronta

---

## 📊 ESTRUTURA DO SISTEMA

### **4 TABELAS**

```
1. hospitais          → Dados dos 4 hospitais
2. usuarios           → Emails de acesso
3. especialidades     → Lista de especialidades médicas
4. agendamentos       → Agendamentos dos pacientes
```

### **2 TELAS**

```
1. Dashboard          → Visão geral
2. Agenda (Calendário) → Grades cirúrgicas
```

---

## 🗄️ BANCO DE DADOS

### **Estrutura Completa:**

Ver arquivo: `ESTRUTURA-BANCO-SIMPLES.md`

### **Criar todas as tabelas:**

```sql
-- Execute o SQL completo em ESTRUTURA-BANCO-SIMPLES.md
-- Ele já inclui:
-- ✅ Criar 4 tabelas
-- ✅ Popular hospitais
-- ✅ Popular usuários
-- ✅ Popular especialidades
```

---

## 📁 ARQUIVOS CRIADOS

### **Novos arquivos:**
```
✅ ESTRUTURA-BANCO-SIMPLES.md     → SQL das tabelas
✅ types-simples.ts                → Tipos TypeScript das 4 tabelas
✅ services/mock-storage-simples.ts → Mock para as 4 tabelas
✅ SISTEMA-SIMPLIFICADO.md         → Este arquivo
```

### **Arquivos para usar:**
```
✅ App.tsx                         → Sistema principal
✅ components/Dashboard.tsx        → Dashboard
✅ components/CalendarView.tsx     → Calendário
✅ components/Layout.tsx           → Menu de navegação
```

### **Arquivos obsoletos (podem deletar):**
```
❌ types.ts (antigo)
❌ services/mock-storage.ts (antigo)
❌ components/ManagementView.tsx
❌ components/AvaliacaoAnestesicaView.tsx
❌ components/forms.tsx
❌ components/EspecialidadesMetasView.tsx
❌ Todos os arquivos de análise e documentação antiga
```

---

## 🚀 COMO USAR AGORA

### **1. Frontend (Protótipo com localStorage):**

```bash
npm run dev
```

Login com:
```
agendamento.sm@medagenda.com
agendamento.fax@medagenda.com
agendamento.car@medagenda.com
agendamento.ara@medagenda.com
```

### **2. Preparar Banco de Dados:**

#### **Passo 1: Criar tabelas no Supabase**
```sql
-- Copie e execute o SQL de: ESTRUTURA-BANCO-SIMPLES.md
```

#### **Passo 2: Configurar credenciais**
```typescript
// services/supabase.ts
export const supabase = createClient(
  'SUA_URL_AQUI',
  'SUA_CHAVE_AQUI'
);
```

#### **Passo 3: Trocar mock por Supabase**
```typescript
// Nos arquivos que usam mock, trocar:
import { mockServicesSimples } from './services/mock-storage-simples';

// Por:
import { supabaseServices } from './services/supabase-simples';
```

---

## 📦 PRÓXIMOS PASSOS

### **Agora:**
- ✅ Sistema funciona com localStorage
- ✅ 2 telas disponíveis
- ✅ Estrutura do banco documentada

### **Quando criar o banco:**
1. Executar SQL de `ESTRUTURA-BANCO-SIMPLES.md`
2. Configurar credenciais Supabase
3. Trocar imports mock por Supabase
4. Testar

---

## 🎯 ESTRUTURA FINAL

```
MedAgenda/
├── Login
│   └── Email → Hospital
│
├── Dashboard
│   ├── KPIs básicos
│   └── Lista de agendamentos
│
└── Agenda (Calendário)
    ├── Visualização mensal
    ├── Grades cirúrgicas
    │   ├── Especialidades
    │   ├── Procedimentos
    │   └── Pacientes
    └── Indicadores visuais
```

---

## 💾 DADOS NO LOCALSTORAGE

### **Chaves usadas:**
```
mock_hospitais        → 4 hospitais
mock_especialidades   → 10 especialidades
mock_agendamentos     → Agendamentos criados
grade_*               → Grades cirúrgicas
medagenda-auth        → Login do usuário
```

### **Limpar dados antigos:**
```javascript
// No console do navegador (F12)
import('./services/mock-storage-simples.js').then(m => {
    m.limparDadosAntigos();
    location.reload();
});
```

---

## 🎨 INTERFACE

### **Menu de Navegação:**
```
[MedAgenda]  [Dashboard]  [Agenda]     Usuario • Hospital • Sair
```

### **Dashboard:**
```
┌─────────────────────────────────────────┐
│ Bem-vindo ao Hospital X                 │
├─────────────────────────────────────────┤
│ 📊 Estatísticas Básicas                 │
│                                         │
│ Total: 45  |  Hoje: 8                   │
└─────────────────────────────────────────┘
```

### **Agenda (Calendário):**
```
┌─────────────────────────────────────────┐
│           Novembro 2025                 │
├─────┬─────┬─────┬─────┬─────┬─────┬────┤
│     │  3🟢│  4  │  5  │  6  │  7  │  8 │
│     │Ort  │     │     │     │     │    │
│     │████ │     │     │     │     │    │
│     │2proc│     │     │     │     │    │
└─────┴─────┴─────┴─────┴─────┴─────┴────┘

🟢 = Tem grade configurada
████ = Barra de progresso
2proc = 2 procedimentos cadastrados
```

---

## ✨ BENEFÍCIOS

1. **Simples** - Apenas o essencial
2. **Rápido** - Sem complicações
3. **Focado** - Grades cirúrgicas
4. **Pronto** - Estrutura do banco definida
5. **Flexível** - Fácil adicionar recursos depois

---

## 🔄 FLUXO DE TRABALHO

### **Desenvolvimento (Agora):**
```
1. npm run dev
2. Trabalhar no frontend
3. Dados em localStorage
4. Protótipo funcionando
```

### **Produção (Depois):**
```
1. Criar tabelas no Supabase
2. Trocar mock por Supabase
3. Testar
4. Deploy
```

---

## 📞 COMANDOS ÚTEIS

### **Ver dados:**
```javascript
// Console (F12)
JSON.parse(localStorage.getItem('mock_agendamentos'));
JSON.parse(localStorage.getItem('mock_hospitais'));
```

### **Limpar tudo:**
```javascript
localStorage.clear();
location.reload();
```

### **Backup:**
```javascript
const backup = {};
Object.keys(localStorage).forEach(k => {
    backup[k] = localStorage.getItem(k);
});
console.log(JSON.stringify(backup, null, 2));
```

---

## 🎉 PRONTO!

Sistema **simplificado**, **limpo** e **pronto para popular o banco**!

**Próximo passo:** Executar SQL no Supabase e começar a usar! 🚀

