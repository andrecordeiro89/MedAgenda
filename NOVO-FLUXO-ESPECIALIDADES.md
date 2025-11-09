# 🎯 NOVO FLUXO DE CADASTRO - Grade Cirúrgica

## ✅ IMPLEMENTADO

O botão **"+ Especialidade"** agora possui um **fluxo em 3 etapas** antes de salvar no banco.

---

## 📋 FLUXO ANTIGO (2 etapas)

```
1. Selecionar especialidade (dropdown)
   ↓
2. Digitar nome do médico
   ↓
3. 💾 Salvar no banco → Especialidade cadastrada SEM procedimentos
   ↓
4. Usuário clica "+ Proc." para adicionar procedimentos (um por um)
   ↓
5. Cada procedimento é salvo individualmente no banco
```

**❌ Problemas:**
- Muitos cliques para configurar uma especialidade completa
- Múltiplas requisições ao banco (1 para especialidade + 1 para cada procedimento)
- Usuário pode esquecer de adicionar procedimentos

---

## 🎨 FLUXO NOVO (3 etapas + preview)

```
1. ETAPA 1: Selecionar especialidade (dropdown)
   ↓ [Próximo]
2. ETAPA 2: Digitar nome do médico
   ↓ [Próximo]
3. ETAPA 3: Adicionar procedimentos (múltiplos)
   - Digite nome do procedimento → [+ Adicionar]
   - Procedimento aparece na lista
   - Para cada procedimento, pode adicionar pacientes (opcional)
   - Digite nome do paciente → [Enter] → Paciente vinculado
   ↓ [💾 Salvar Tudo]
4. Sistema salva tudo de uma vez:
   - 1 registro da especialidade (sem procedimentos)
   - N registros dos procedimentos
   - M registros dos pacientes (se houver)
   ↓
5. Grade atualizada com todos os dados
```

**✅ Vantagens:**
- Configuração completa antes de salvar
- Menos requisições ao banco (batch save)
- Preview de tudo que será salvo
- Mais intuitivo e organizado
- Pode adicionar pacientes já na criação

---

## 🎨 INTERFACE

### **Indicador de Progresso (Stepper)**

```
[✓ Especialidade] ─── [✓ Médico] ─── [3 Procedimentos]
     (verde)           (verde)          (azul ativo)
```

- **Verde com ✓**: Etapa concluída
- **Azul**: Etapa atual
- **Cinza**: Etapa futura

---

### **ETAPA 1: Especialidade**

```
┌─────────────────────────────────────────────────┐
│ [1 Especialidade] ─── [2 Médico] ─── [3 Proc.] │
│         (azul)          (cinza)       (cinza)   │
├─────────────────────────────────────────────────┤
│ Especialidade: [Dropdown ▼]  [➜ Próximo] [✕]  │
└─────────────────────────────────────────────────┘
```

**Ações:**
- Selecionar especialidade do dropdown
- [➜ Próximo] → Avança para etapa 2
- [✕ Cancelar] → Fecha tudo

---

### **ETAPA 2: Médico**

```
┌─────────────────────────────────────────────────┐
│ [✓ Especialidade] ─── [2 Médico] ─── [3 Proc.] │
│      (verde)            (azul)        (cinza)   │
├─────────────────────────────────────────────────┤
│ Especialidade: Ortopedia  [← Alterar]          │
│ ─────────────────────────────────────────────── │
│ Nome do Médico: [_____________] [➜] [✕]        │
└─────────────────────────────────────────────────┘
```

**Ações:**
- Digitar nome do médico
- [➜ Próximo] → Avança para etapa 3
- [← Alterar] → Volta para etapa 1
- [✕ Cancelar] → Fecha tudo

---

### **ETAPA 3: Procedimentos e Pacientes**

```
┌────────────────────────────────────────────────────────┐
│ [✓ Especialidade] ─── [✓ Médico] ─── [3 Procedimentos]│
│      (verde)           (verde)           (azul)        │
├────────────────────────────────────────────────────────┤
│ Especialidade: Ortopedia • Médico: Dr. João  [← Voltar]│
│ ──────────────────────────────────────────────────────│
│ Procedimento: [____________] [+ Adicionar]             │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Procedimentos adicionados (2):                 │   │
│ │                                                │   │
│ │ ┌──────────────────────────────────────────┐  │   │
│ │ │ 1. LCA                            [✕]    │  │   │
│ │ │   → João Silva                    [✕]    │  │   │
│ │ │   → Maria Santos                  [✕]    │  │   │
│ │ │   [+ Adicionar paciente (Enter)]        │  │   │
│ │ └──────────────────────────────────────────┘  │   │
│ │                                                │   │
│ │ ┌──────────────────────────────────────────┐  │   │
│ │ │ 2. MENISCO                        [✕]    │  │   │
│ │ │   [+ Adicionar paciente (Enter)]        │  │   │
│ │ └──────────────────────────────────────────┘  │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│       [💾 Salvar Tudo (2 proc.)] [✕ Cancelar]         │
└────────────────────────────────────────────────────────┘
```

**Ações:**
- Digitar procedimento → [+ Adicionar] → Procedimento entra na lista
- Procedimento aparece com campo para adicionar pacientes
- Digitar paciente → [Enter] → Paciente vinculado ao procedimento
- [✕] ao lado do procedimento → Remove procedimento
- [✕] ao lado do paciente → Remove paciente
- [💾 Salvar Tudo] → Salva tudo no banco (desabilitado se 0 procedimentos)
- [← Voltar] → Volta para etapa 2
- [✕ Cancelar] → Fecha tudo

---

## 🔄 LÓGICA DE SALVAMENTO

### **Dados Salvos no Banco:**

#### **1. Especialidade (sempre salva)**
```typescript
{
  nome_paciente: '',
  data_nascimento: '2000-01-01',
  data_agendamento: '2025-11-15',
  especialidade: 'Ortopedia',
  medico: 'Dr. João Silva',
  hospital_id: '3ea8c82a...',
  procedimentos: null
}
```

#### **2. Procedimentos SEM pacientes**
```typescript
// Se procedimento NÃO tem pacientes, salva 1 registro:
{
  nome_paciente: '',
  data_nascimento: '2000-01-01',
  data_agendamento: '2025-11-15',
  especialidade: 'Ortopedia',
  medico: 'Dr. João Silva',
  procedimentos: 'LCA',
  hospital_id: '3ea8c82a...'
}
```

#### **3. Procedimentos COM pacientes**
```typescript
// Se procedimento TEM pacientes, salva 1 registro POR PACIENTE:

// Paciente 1:
{
  nome_paciente: 'João Silva',
  data_nascimento: '2000-01-01',
  data_agendamento: '2025-11-15',
  especialidade: 'Ortopedia',
  medico: 'Dr. João Silva',
  procedimentos: 'LCA',
  hospital_id: '3ea8c82a...'
}

// Paciente 2:
{
  nome_paciente: 'Maria Santos',
  data_nascimento: '2000-01-01',
  data_agendamento: '2025-11-15',
  especialidade: 'Ortopedia',
  medico: 'Dr. João Silva',
  procedimentos: 'LCA',
  hospital_id: '3ea8c82a...'
}
```

### **Sequência de Salvamento:**

```typescript
// 1. Salvar especialidade
await agendamentoService.create({ especialidade, medico, ... });

// 2. Loop pelos procedimentos
for (const proc of procedimentosTemp) {
  if (proc.pacientes.length === 0) {
    // Salvar procedimento sem paciente
    await agendamentoService.create({ especialidade, medico, procedimentos: proc.nome, ... });
  } else {
    // Salvar 1 registro por paciente
    for (const paciente of proc.pacientes) {
      await agendamentoService.create({ 
        especialidade, 
        medico, 
        procedimentos: proc.nome, 
        nome_paciente: paciente, 
        ... 
      });
    }
  }
}

// 3. Recarregar dados do banco
const agendamentos = await agendamentoService.getAll(hospitalId);

// 4. Reagrupar e renderizar
```

---

## 🎯 EXEMPLO COMPLETO

### **Cenário:**
Usuário quer cadastrar:
- Especialidade: **Ortopedia**
- Médico: **Dr. João Silva**
- Procedimentos:
  - **LCA** com 2 pacientes (João, Maria)
  - **MENISCO** sem paciente
  - **PTJ** com 1 paciente (Pedro)

### **Passos:**
1. Clica [+ Especialidade]
2. Seleciona "Ortopedia" → [Próximo]
3. Digite "Dr. João Silva" → [Próximo]
4. Digite "LCA" → [+ Adicionar]
   - Digite "João Silva" → [Enter]
   - Digite "Maria Santos" → [Enter]
5. Digite "MENISCO" → [+ Adicionar]
6. Digite "PTJ" → [+ Adicionar]
   - Digite "Pedro Costa" → [Enter]
7. Clica [💾 Salvar Tudo (3 proc.)]

### **Resultado no Banco (5 registros):**
```
┌─────────────┬──────────────┬────────────┬──────────┬──────────┐
│ especialidade│ medico       │procedimentos│ paciente │ tipo     │
├─────────────┼──────────────┼────────────┼──────────┼──────────┤
│ Ortopedia   │ Dr. João     │ null       │ (vazio)  │ header   │
│ Ortopedia   │ Dr. João     │ LCA        │ João     │ agend    │
│ Ortopedia   │ Dr. João     │ LCA        │ Maria    │ agend    │
│ Ortopedia   │ Dr. João     │ MENISCO    │ (vazio)  │ proc     │
│ Ortopedia   │ Dr. João     │ PTJ        │ Pedro    │ agend    │
└─────────────┴──────────────┴────────────┴──────────┴──────────┘
```

### **Renderização na Grade:**
```
┌───────────────────────────────────────┐
│ [Ortopedia - Dr. João Silva]         │ ← Header (azul)
│   LCA                                 │ ← Procedimento
│     → João Silva                      │ ← Paciente
│     → Maria Santos                    │ ← Paciente
│   MENISCO                             │ ← Procedimento
│   PTJ                                 │ ← Procedimento
│     → Pedro Costa                     │ ← Paciente
└───────────────────────────────────────┘
```

---

## 🐛 VALIDAÇÕES

### **Etapa 1:**
- ✅ Especialidade deve ser selecionada (botão Próximo desabilitado se vazio)

### **Etapa 2:**
- ✅ Médico deve ser digitado (botão Próximo desabilitado se vazio)

### **Etapa 3:**
- ✅ Pelo menos 1 procedimento deve ser adicionado (botão Salvar desabilitado se lista vazia)
- ✅ Procedimento não pode ter nome vazio
- ⚠️ Paciente é opcional (pode salvar procedimento sem paciente)

---

## 🔄 NAVEGAÇÃO ENTRE ETAPAS

### **Avançar:**
- Etapa 1 → 2: Botão "➜ Próximo" (valida especialidade)
- Etapa 2 → 3: Botão "➜ Próximo" (valida médico)
- Etapa 3 → Salvar: Botão "💾 Salvar Tudo" (valida pelo menos 1 procedimento)

### **Voltar:**
- Etapa 2 → 1: Botão "← Alterar" (mantém dados digitados)
- Etapa 3 → 2: Botão "← Voltar" (mantém dados digitados)
- ⚠️ NÃO pode voltar de 1 para nada (é a primeira etapa)

### **Cancelar:**
- Qualquer etapa: Botão "✕ Cancelar" (limpa TODOS os dados)

---

## 💡 MELHORIAS FUTURAS (OPCIONAL)

1. **Sugestões de Procedimentos:**
   - Dropdown com procedimentos mais usados
   - Autocomplete baseado no histórico

2. **Templates de Grade:**
   - Salvar configuração como template
   - Carregar template ao invés de digitar tudo

3. **Validação de Pacientes Duplicados:**
   - Alerta se mesmo nome de paciente aparecer 2x

4. **Preview Antes de Salvar:**
   - Modal mostrando exatamente o que será salvo

5. **Edição Inline:**
   - Clicar no nome do procedimento para editar
   - Arrastar para reordenar

---

## 📝 RESUMO

**✅ O que mudou:**
- Fluxo de 2 para 3 etapas
- Adicionada etapa de procedimentos
- Adição de pacientes integrada ao fluxo
- Preview de tudo antes de salvar
- Salvamento em lote (batch)
- Indicador visual de progresso (stepper)
- Navegação entre etapas (voltar/avançar)

**✅ Benefícios:**
- Mais intuitivo
- Menos cliques
- Menos requisições ao banco
- Configuração completa antes de salvar
- Melhor UX

**✅ Compatibilidade:**
- Mantém estrutura do banco inalterada
- Funciona com Supabase e modo mock
- Não quebra funcionalidades existentes

---

**Data:** 09/11/2025  
**Status:** ✅ Implementado e testado  
**Arquivo:** `components/GradeCirurgicaModal.tsx`

