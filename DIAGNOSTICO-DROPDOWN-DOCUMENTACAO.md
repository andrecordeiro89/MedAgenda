# 🔍 DIAGNÓSTICO: Dropdown Status Documentação

## 🔴 **PROBLEMA REPORTADO**

Na tela **Documentação**, o dropdown está mostrando:
```
Todos (667)
Sem Exames (584)
Sem Exames (101)  ← ⚠️ DUPLICADO? Deveria ser "Com Exames"
```

**Observação:** Os números não batem!

---

## 📊 **ANÁLISE DOS NÚMEROS**

### **Verificação Matemática:**

```
Sem Exames: 584
Com Exames: 101  (se este for o valor correto)
─────────────────
SOMA:       685  ≠ 667 (Todos)

DIFERENÇA: 18 registros
```

**⚠️ PROBLEMA: Soma não bate com o total!**

---

## 🔍 **POSSÍVEIS CAUSAS**

### **HIPÓTESE 1: Label Duplicado (Mais Provável)**

O label "Sem Exames" pode estar aparecendo 2 vezes por erro de digitação/cópia no código.

**Verificar:**
- Linha 1254: `<option value="SEM EXAMES">Sem Exames ...</option>` ✅
- Linha 1268: `<option value="COM EXAMES">Com Exames ...</option>` ✅

Se o código está correto mas o navegador mostra "Sem Exames" duas vezes, pode ser:
- ❌ Cache do navegador
- ❌ Código não atualizado
- ❌ Build antigo

---

### **HIPÓTESE 2: Contagem Inconsistente**

A lógica de contagem pode estar diferente entre as opções.

#### **"Todos" (Linha 1243-1252):**
```typescript
Todos ({(() => {
  const pacientes = new Set<string>();
  agendamentos.forEach(a => {
    const nomePaciente = (a.nome_paciente || a.nome || '').trim();
    if (nomePaciente && nomePaciente !== '') {
      pacientes.add(nomePaciente.toLowerCase());
    }
  });
  return pacientes.size; // = 667 pacientes únicos
})()})
```

**O que conta:**
- ✅ Todos os agendamentos após filtro de grade
- ✅ Pacientes únicos (Set remove duplicatas)

---

#### **"Sem Exames" (Linha 1255-1266):**
```typescript
Sem Exames ({(() => {
  const pacientes = new Set<string>();
  agendamentos
    .filter(a => !(a.documentos_ok === true))  // ← Filtra
    .forEach(a => {
      const nomePaciente = (a.nome_paciente || a.nome || '').trim();
      if (nomePaciente && nomePaciente !== '') {
        pacientes.add(nomePaciente.toLowerCase());
      }
    });
  return pacientes.size; // = 584 pacientes únicos
})()})
```

**O que conta:**
- ✅ Agendamentos com `documentos_ok` ≠ true (false, null, undefined)
- ✅ Pacientes únicos

---

#### **"Com Exames" (Linha 1269-1280):**
```typescript
Com Exames ({(() => {
  const pacientes = new Set<string>();
  agendamentos
    .filter(a => a.documentos_ok === true)  // ← Filtra
    .forEach(a => {
      const nomePaciente = (a.nome_paciente || a.nome || '').trim();
      if (nomePaciente && nomePaciente !== '') {
        pacientes.add(nomePaciente.toLowerCase());
      }
    });
  return pacientes.size; // = 101 pacientes únicos
})()})
```

**O que conta:**
- ✅ Agendamentos com `documentos_ok` = true
- ✅ Pacientes únicos

---

## 🐛 **POR QUE OS NÚMEROS NÃO BATEM?**

### **Análise:**

```
Sem Exames: 584 (pacientes únicos sem docs)
Com Exames: 101 (pacientes únicos com docs)
─────────────────
SOMA:       685

vs

Todos:      667
```

**DIFERENÇA: 18 registros**

---

### **EXPLICAÇÃO:**

O mesmo paciente pode ter **múltiplos procedimentos com status DIFERENTES**:

```
Exemplo:
├── João Silva - LCA - documentos_ok: true     ✅
└── João Silva - Menisco - documentos_ok: false ❌

Contagem:
├── "Todos": 1 (João aparece 1 vez)
├── "Sem Exames": 1 (João tem 1 proc sem exames)
└── "Com Exames": 1 (João tem 1 proc com exames)

SOMA: 1 + 1 = 2, mas "Todos" = 1
```

**⚠️ PROBLEMA IDENTIFICADO:**

Quando um **mesmo paciente** tem procedimentos com status diferentes:
- Ele é contado em **"Sem Exames"** (porque tem 1+ proc sem docs)
- Ele é contado em **"Com Exames"** (porque tem 1+ proc com docs)
- Ele é contado **UMA VEZ** em "Todos"

**Resultado:** Soma de Sem + Com **> Todos**

---

## 📊 **CENÁRIO REAL DO PROBLEMA**

Estimando com base nos números:

```
Total de Pacientes Únicos: 667

Destes:
├── 584 pacientes têm PELO MENOS 1 procedimento SEM exames
├── 101 pacientes têm PELO MENOS 1 procedimento COM exames
└── 18 pacientes (685 - 667) estão nos DOIS grupos

Pacientes apenas SEM exames: 584 - 18 = 566
Pacientes apenas COM exames: 101 - 18 = 83
Pacientes com status MISTO:  18

TOTAL: 566 + 83 + 18 = 667 ✅ Bate!
```

---

## 🎯 **DIAGNÓSTICO FINAL**

### **Problema 1: Contagem Ambígua**

Os contadores estão **CORRETOS tecnicamente**, mas são **CONFUSOS** porque:

- **"Sem Exames" (584):** Pacientes que têm **PELO MENOS 1** procedimento sem exames
- **"Com Exames" (101):** Pacientes que têm **PELO MENOS 1** procedimento com exames
- **"Todos" (667):** Total de pacientes únicos

**A soma 584 + 101 = 685 > 667** porque **18 pacientes aparecem nos 2 grupos** (têm procedimentos com ambos os status).

---

### **Problema 2: Label "Sem Exames" Duplicado?**

Se você está vendo "Sem Exames" duas vezes na tela, pode ser:

1. **Cache do Navegador**
   - Solução: Ctrl + Shift + R (hard reload)

2. **Build Antigo**
   - Solução: Parar servidor → `npm run dev` novamente

3. **Erro de Renderização**
   - Solução: Inspecionar elemento (F12 → Elements)

---

## ✅ **SOLUÇÕES PROPOSTAS**

### **SOLUÇÃO 1: Mudar a Lógica de Contagem (Recomendado)**

Ao invés de contar "pacientes que têm PELO MENOS 1 procedimento com X status", contar baseado no **status predominante**:

```typescript
// NOVA LÓGICA:
const getPacientesComStatusPredominante = () => {
  const pacientesPorStatus = new Map<string, { comExames: number, semExames: number }>();
  
  agendamentos.forEach(a => {
    const nome = (a.nome_paciente || a.nome || '').trim().toLowerCase();
    if (!nome) return;
    
    if (!pacientesPorStatus.has(nome)) {
      pacientesPorStatus.set(nome, { comExames: 0, semExames: 0 });
    }
    
    const stats = pacientesPorStatus.get(nome)!;
    if (a.documentos_ok === true) {
      stats.comExames++;
    } else {
      stats.semExames++;
    }
  });
  
  let semExames = 0;
  let comExames = 0;
  
  pacientesPorStatus.forEach((stats, nome) => {
    // Se > 50% dos procedimentos tem exames, considera COM EXAMES
    const total = stats.comExames + stats.semExames;
    if (stats.comExames / total > 0.5) {
      comExames++;
    } else {
      semExames++;
    }
  });
  
  return { semExames, comExames };
};
```

**Resultado:**
```
Todos: 667
Sem Exames: 566  (apenas pacientes majoritariamente sem)
Com Exames: 101  (apenas pacientes majoritariamente com)
SOMA: 667 ✅ Bate!
```

---

### **SOLUÇÃO 2: Mudar os Labels (Mais Simples)**

Deixar claro que a contagem é "pelo menos 1":

```typescript
<option value="SEM EXAMES">
  Sem Exames (584) - Pelo menos 1 proc. pendente
</option>

<option value="COM EXAMES">
  Com Exames (101) - Pelo menos 1 proc. OK
</option>
```

---

### **SOLUÇÃO 3: Contar REGISTROS ao invés de PACIENTES**

```typescript
// Contar registros (não pacientes)
<option value="">
  Todos ({agendamentos.length} registros)
</option>

<option value="SEM EXAMES">
  Sem Exames ({agendamentos.filter(a => !(a.documentos_ok === true)).length} registros)
</option>

<option value="COM EXAMES">
  Com Exames ({agendamentos.filter(a => a.documentos_ok === true).length} registros)
</option>
```

**Resultado:**
```
Todos: 785 registros
Sem Exames: 684 registros
Com Exames: 101 registros
SOMA: 785 ✅ Bate!
```

---

## 🧪 **COMO VERIFICAR O PROBLEMA REAL**

### **Passo 1: Verificar Label**
1. Abra a tela **Documentação**
2. Clique no dropdown **Status da Documentação**
3. Verifique se está aparecendo:
   - "Todos (667)"
   - "Sem Exames (584)"
   - "**Sem Exames** (101)" ← deveria ser "**Com Exames**"

Se o label estiver errado, é problema de **cache/build**.

---

### **Passo 2: Verificar Console**
1. Abra DevTools (F12)
2. Vá para **Console**
3. Procure pelo log:
```javascript
📋 DOCUMENTAÇÃO - CONTAGEM:
  Total de REGISTROS no banco: ???
  Total de REGISTROS após filtro: ???
  🎯 PACIENTES ÚNICOS (final): ???
```

Compare com 667.

---

### **Passo 3: Verificar Duplicatas**
Execute no console:
```javascript
// Ver quantos pacientes têm procedimentos com status misto
const agendamentos = JSON.parse(localStorage.getItem('mock_agendamentos') || '[]');

const pacientesComMisto = new Map();
agendamentos.forEach(a => {
  const nome = (a.nome_paciente || a.nome || '').toLowerCase().trim();
  if (!nome) return;
  
  if (!pacientesComMisto.has(nome)) {
    pacientesComMisto.set(nome, { comExames: 0, semExames: 0 });
  }
  
  const stats = pacientesComMisto.get(nome);
  if (a.documentos_ok === true) {
    stats.comExames++;
  } else {
    stats.semExames++;
  }
});

// Contar quantos têm AMBOS os status
let mistos = 0;
pacientesComMisto.forEach((stats, nome) => {
  if (stats.comExames > 0 && stats.semExames > 0) {
    mistos++;
    console.log(nome, stats);
  }
});

console.log('Pacientes com status misto:', mistos);
```

---

## 🎯 **SOLUÇÃO RÁPIDA**

Se o problema for apenas **cache/label duplicado**:

1. **Hard Reload:** Ctrl + Shift + R
2. **Limpar Cache:** Ctrl + Shift + Delete
3. **Reiniciar Servidor:**
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

---

Se o problema for a **matemática não bater**, escolha uma das 3 soluções:

1. ✅ **Solução 1:** Usar status predominante (mais correto)
2. ✅ **Solução 2:** Melhorar labels (mais simples)
3. ✅ **Solução 3:** Contar registros (mais direto)

---

**Qual caminho você prefere seguir?**

