# 🏥 GRADE CIRÚRGICA - FLUXO SIMPLIFICADO

## ✅ SISTEMA SIMPLES E OBJETIVO

Sistema para montar grades cirúrgicas do SUS de forma rápida e prática.

---

## 🎯 OBJETIVO

Montar grades cirúrgicas com **especialidades** e **procedimentos** para o mês.
**Pacientes serão adicionados posteriormente** após trâmites administrativos do SUS.

---

## 📋 FLUXO EM 3 ETAPAS

```
1. Especialidade  →  2. Médico  →  3. Procedimentos  →  💾 Salvar
```

### **ETAPA 1: Selecionar Especialidade**
- Dropdown com especialidades cadastradas no sistema
- Exemplo: Ortopedia, Cardiologia, etc.

### **ETAPA 2: Digitar Médico**
- Campo de texto livre para nome do médico
- Exemplo: "Dr. João Silva"

### **ETAPA 3: Adicionar Procedimentos**
- Digite o nome do procedimento
- Clique "Adicionar" ou pressione Enter
- Procedimentos aparecem em uma lista
- Pode adicionar quantos quiser
- Pode remover procedimentos (botão ✕)

### **SALVAR:**
- Botão "💾 Salvar Grade (N proc.)"
- Salva tudo de uma vez no banco
- Grade aparece renderizada com todos os procedimentos

---

## 🎨 INTERFACE

### **Indicador de Progresso:**
```
[✓ Especialidade] ─── [✓ Médico] ─── [3 Procedimentos]
```

### **ETAPA 3 - Lista de Procedimentos:**
```
┌─────────────────────────────────────────┐
│ Especialidade: Ortopedia • Médico: Dr. João │
│ ─────────────────────────────────────── │
│ Procedimento: [___________] [+ Adicionar] │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Procedimentos adicionados (3):     │  │
│ │                                    │  │
│ │ 1. LCA                        [✕]  │  │
│ │ 2. MENISCO                    [✕]  │  │
│ │ 3. PTJ                        [✕]  │  │
│ └────────────────────────────────────┘  │
│                                          │
│    [💾 Salvar Grade (3 proc.)] [✕ Cancelar] │
└─────────────────────────────────────────┘
```

---

## 💾 COMO OS DADOS SÃO SALVOS

### **Exemplo:** 
- Especialidade: **Ortopedia**
- Médico: **Dr. João Silva**
- Procedimentos: **LCA, MENISCO, PTJ**

### **Registros no Banco (4 linhas):**

```sql
-- 1. Header da especialidade
INSERT INTO agendamentos (especialidade, medico, procedimentos, nome_paciente)
VALUES ('Ortopedia', 'Dr. João Silva', NULL, '');

-- 2. Procedimento LCA
INSERT INTO agendamentos (especialidade, medico, procedimentos, nome_paciente)
VALUES ('Ortopedia', 'Dr. João Silva', 'LCA', '');

-- 3. Procedimento MENISCO
INSERT INTO agendamentos (especialidade, medico, procedimentos, nome_paciente)
VALUES ('Ortopedia', 'Dr. João Silva', 'MENISCO', '');

-- 4. Procedimento PTJ
INSERT INTO agendamentos (especialidade, medico, procedimentos, nome_paciente)
VALUES ('Ortopedia', 'Dr. João Silva', 'PTJ', '');
```

**Total:** 4 registros salvos na tabela `agendamentos`

---

## 📊 GRADE RENDERIZADA

Após salvar, a grade aparece assim:

```
┌─────────────────────────────────────┐
│ [Ortopedia - Dr. João Silva]       │ ← Card azul (especialidade)
│   LCA                               │ ← Linha branca (procedimento)
│   MENISCO                           │ ← Linha branca (procedimento)
│   PTJ                               │ ← Linha branca (procedimento)
└─────────────────────────────────────┘
```

---

## 🔧 BUG CORRIGIDO: CONTAGEM DE PROCEDIMENTOS

### **Problema:**
- Usuário adicionava 3 procedimentos (LCA, LCA, MENISCO)
- Sistema exibia apenas 2 procedimentos
- **Causa:** Uso de `Set<string>` que remove duplicatas

### **Solução:**
- Trocado `Set<string>` por `string[]` (array)
- Agora permite procedimentos duplicados
- Se adicionar 3× LCA, aparece 3× LCA na grade

### **Código Alterado:**
```typescript
// ANTES (removia duplicatas):
procedimentos: Set<string>
grupo.procedimentos.add(agendamento.procedimentos)

// DEPOIS (mantém duplicatas):
procedimentos: string[]
grupo.procedimentos.push(agendamento.procedimentos)
```

---

## 🚫 PACIENTES REMOVIDOS (POR ENQUANTO)

### **Por quê?**
- Sistema do SUS tem trâmites específicos para agendar pacientes
- Grade cirúrgica é montada **primeiro**
- Pacientes são contactados e marcados **depois**
- Funcionalidade de adicionar pacientes será implementada em etapa futura

### **O que foi removido:**
- Campo de adicionar paciente na Etapa 3
- Lógica de salvar pacientes no banco
- Estados relacionados a pacientes (`handleAddPacienteTemp`, etc.)

---

## ✅ VALIDAÇÕES

1. **Especialidade:** Obrigatória (dropdown)
2. **Médico:** Obrigatório (texto livre)
3. **Procedimentos:** Pelo menos 1 obrigatório
4. **Nome do procedimento:** Não pode estar vazio

---

## 🔄 NAVEGAÇÃO

### **Avançar:**
- Etapa 1 → 2: [➜ Próximo]
- Etapa 2 → 3: [➜ Próximo]
- Etapa 3 → Salvar: [💾 Salvar Grade]

### **Voltar:**
- Etapa 2 → 1: [← Alterar]
- Etapa 3 → 2: [← Voltar]

### **Cancelar:**
- Qualquer etapa: [✕ Cancelar] → Fecha tudo e limpa dados

---

## 📝 EXEMPLO COMPLETO DE USO

### **Cenário:** Montar grade de Cirurgia Geral

1. Clique em qualquer dia no calendário
2. Clique [+ Especialidade]
3. **ETAPA 1:** Selecione "Cirurgia Geral" → [Próximo]
4. **ETAPA 2:** Digite "Dr. Diogo" → [Próximo]
5. **ETAPA 3:**
   - Digite "LCA" → [Adicionar] ou [Enter]
   - Digite "MENISCO" → [Adicionar] ou [Enter]
   - Digite "ARTROSCOPIA" → [Adicionar] ou [Enter]
6. Clique [💾 Salvar Grade (3 proc.)]
7. ✅ Grade salva e renderizada!

### **Resultado:**
```
┌─────────────────────────────────────┐
│ [Cirurgia Geral - Dr. Diogo]       │
│   LCA                               │
│   MENISCO                           │
│   ARTROSCOPIA                       │
└─────────────────────────────────────┘
```

---

## 🎯 PRÓXIMOS PASSOS (FUTURO)

### **1. Adicionar Pacientes (em outra tela/funcionalidade):**
- Listar procedimentos da grade
- Para cada procedimento, adicionar paciente
- Vincular paciente ao procedimento específico

### **2. Possível fluxo:**
```
Grade Montada → Trâmites SUS → Contato com Pacientes → Vincular à Grade
```

---

## 💡 SIMPLICIDADE É A CHAVE

### **O que mantém o sistema simples:**
1. ✅ Apenas 3 etapas lineares
2. ✅ Lista de procedimentos clara
3. ✅ Salvamento único (não parcial)
4. ✅ Preview antes de salvar
5. ✅ Interface limpa e objetiva

### **O que evitamos:**
1. ❌ Muitos campos por tela
2. ❌ Lógica complexa de pacientes
3. ❌ Salvamento automático a cada mudança
4. ❌ Interface poluída

---

## 🐛 PROBLEMAS RESOLVIDOS

### **1. Contagem Errada de Procedimentos**
✅ **CORRIGIDO:** Trocado Set por Array

### **2. Procedimentos Duplicados Desapareciam**
✅ **CORRIGIDO:** Array permite duplicatas

### **3. Campo de Paciente Confundia Usuários**
✅ **REMOVIDO:** Funcionalidade adiada para fase posterior

---

## 📄 ARQUIVO MODIFICADO

- **`components/GradeCirurgicaModal.tsx`**
  - Removido: `handleAddPacienteTemp`, `handleRemovePacienteTemp`
  - Simplificado: Tipo de `procedimentosTemp` (sem campo `pacientes`)
  - Corrigido: Uso de Array ao invés de Set
  - Simplificado: UI da Etapa 3 (sem campos de paciente)

---

## ✨ RESUMO

**Sistema agora é:**
- ✅ Simples e direto
- ✅ Foco em montar grades (não em agendar pacientes)
- ✅ Contagem correta de procedimentos
- ✅ Interface limpa e objetiva
- ✅ Alinhado com o processo do SUS

**Próxima fase:**
- 🔜 Implementar funcionalidade de vincular pacientes (após trâmites)

---

**Data:** 09/11/2025  
**Status:** ✅ Simplificado e funcionando  
**Foco:** Grade Cirúrgica (sem pacientes por enquanto)

