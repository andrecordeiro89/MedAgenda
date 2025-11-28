# 🔍 ANÁLISE DETALHADA: KPIs Dashboard vs Outras Telas

## 📊 **PROBLEMA IDENTIFICADO**

Os KPIs do **Dashboard** estão mostrando números **DIFERENTES** das telas **Documentação**, **Anestesista** e **Faturamento**.

---

## 🔴 **CAUSA RAIZ DO PROBLEMA**

### **Dashboard.tsx (Linhas 87-99) - LÓGICA ATUAL (ERRADA):**

```typescript
// ❌ PROBLEMA: Não filtra registros estruturais de grade cirúrgica
const agendamentosSemExames = agendamentos.filter(a => {
    return !(a.documentos_ok === true);
});
const semExames = getPacientesUnicos(agendamentosSemExames).size;

const agendamentosComExames = agendamentos.filter(a => {
    return a.documentos_ok === true;
});
const comExames = getPacientesUnicos(agendamentosComExames).size;
```

**O que está acontecendo:**
- ✅ Conta pacientes únicos (correto)
- ❌ **NÃO filtra** registros estruturais de grade (linhas sem paciente)
- ❌ **NÃO valida** se tem paciente E procedimento
- ❌ Conta registros vazios/incompletos

---

### **DocumentacaoView.tsx (Linhas 69-94) - LÓGICA CORRETA:**

```typescript
// ✅ CORRETO: Filtra antes de contar
const agendamentosFiltrados = dados.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    // CASO 1: Tem paciente E procedimento → INCLUIR
    if (temPaciente && temProcedimento) {
        return true;
    }
    
    // CASO 2: Registro estrutural de grade (sem paciente) → EXCLUIR
    if (ag.is_grade_cirurgica === true && !temPaciente) {
        return false;
    }
    
    // CASO 3: Registro vazio → EXCLUIR
    if (!temProcedimento && !temPaciente) {
        return false;
    }
    
    return true;
});

// Depois calcula os KPIs usando os dados filtrados
```

---

### **AnestesiaView.tsx (Linhas 78-99) - MESMA LÓGICA CORRETA:**

```typescript
// ✅ CORRETO: Mesma filtragem que Documentação
const agendamentosFiltrados = dados.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    if (temPaciente && temProcedimento) {
        return true; // ✅ Incluir
    }
    
    if (ag.is_grade_cirurgica === true && !temPaciente) {
        return false; // ❌ Excluir (estrutura)
    }
    
    if (!temProcedimento && !temPaciente) {
        return false; // ❌ Excluir
    }
    
    return false;
});
```

---

### **FaturamentoView.tsx (Linhas 47-68) - MESMA LÓGICA CORRETA:**

```typescript
// ✅ CORRETO: Mesma filtragem
const semGradeCirurgica = dados.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    if (temPaciente && temProcedimento) {
        return true; // ✅ Incluir
    }
    
    if (ag.is_grade_cirurgica === true && !temPaciente) {
        return false; // ❌ Excluir (estrutura)
    }
    
    if (!temProcedimento && !temPaciente) {
        return false; // ❌ Excluir
    }
    
    return false;
});
```

---

## 📋 **COMPARAÇÃO LADO A LADO**

| Aspecto | Dashboard | Documentação | Anestesia | Faturamento |
|---------|-----------|--------------|-----------|-------------|
| **Filtra registros vazios** | ❌ NÃO | ✅ SIM | ✅ SIM | ✅ SIM |
| **Valida paciente + procedimento** | ❌ NÃO | ✅ SIM | ✅ SIM | ✅ SIM |
| **Exclui estruturas de grade** | ❌ NÃO | ✅ SIM | ✅ SIM | ✅ SIM |
| **Conta pacientes únicos** | ✅ SIM | ✅ SIM | ✅ SIM | ✅ SIM |
| **Debug logs** | ✅ SIM | ✅ SIM | ✅ SIM | ✅ SIM |

---

## 🐛 **EXEMPLO DE INCONSISTÊNCIA**

### **Cenário de Teste:**

Banco de dados contém:
- 10 registros com paciente E procedimento (válidos)
- 5 registros estruturais de grade (sem paciente)
- 3 registros vazios/incompletos

**Total no banco:** 18 registros

### **Resultado Atual:**

| Tela | Total Contado | Por quê? |
|------|---------------|----------|
| **Dashboard** | **18 registros** | ❌ Conta TUDO (incluindo estruturas e vazios) |
| **Documentação** | **10 registros** | ✅ Filtra corretamente |
| **Anestesia** | **10 registros** | ✅ Filtra corretamente |
| **Faturamento** | **10 registros** | ✅ Filtra corretamente |

**Diferença:** Dashboard mostra **8 registros a mais** (erro de +80%)

---

## 🎯 **SOLUÇÃO: Aplicar MESMA Lógica de Filtragem**

### **PASSO 1: Adicionar Filtragem no Dashboard**

Antes de calcular os KPIs, filtrar os agendamentos da mesma forma que as outras telas:

```typescript
// NOVO: Adicionar no Dashboard.tsx (após linha 42)

// Filtrar registros válidos (mesma lógica que Documentação/Anestesia/Faturamento)
const agendamentosValidos = agendamentos.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    // CASO 1: Tem paciente E procedimento → INCLUIR
    if (temPaciente && temProcedimento) {
        return true;
    }
    
    // CASO 2: Registro estrutural de grade (sem paciente) → EXCLUIR
    if (ag.is_grade_cirurgica === true && !temPaciente) {
        return false;
    }
    
    // CASO 3: Registro vazio → EXCLUIR
    if (!temProcedimento && !temPaciente) {
        return false;
    }
    
    return true;
});
```

### **PASSO 2: Usar Agendamentos Filtrados nos KPIs**

```typescript
// Sem exames: usar agendamentosValidos (não mais agendamentos)
const agendamentosSemExames = agendamentosValidos.filter(a => {
    return !(a.documentos_ok === true);
});
const semExames = getPacientesUnicos(agendamentosSemExames).size;

// Com exames: usar agendamentosValidos
const agendamentosComExames = agendamentosValidos.filter(a => {
    return a.documentos_ok === true;
});
const comExames = getPacientesUnicos(agendamentosComExames).size;
```

---

## 📊 **RESULTADO ESPERADO APÓS CORREÇÃO**

### **Com a mesma base de dados:**

| Tela | Total Contado | Status |
|------|---------------|--------|
| **Dashboard** | **10 registros** | ✅ Consistente |
| **Documentação** | **10 registros** | ✅ Consistente |
| **Anestesia** | **10 registros** | ✅ Consistente |
| **Faturamento** | **10 registros** | ✅ Consistente |

**Todas as telas mostrarão os MESMOS números!** 🎉

---

## 🔍 **VALIDAÇÃO DE CONSISTÊNCIA**

### **Logs de Debug (Console):**

Todas as telas já têm logs de debug que mostram:

```javascript
console.log('📊 TELA - CONTAGEM:');
console.log(`  Total de REGISTROS no banco: ${totalOriginal}`);
console.log(`  Total de REGISTROS após filtro: ${totalFiltrado}`);
console.log(`  Total de REGISTROS excluídos: ${totalExcluidos}`);
console.log(`  🎯 PACIENTES ÚNICOS (final): ${pacientesUnicos.size}`);
```

**Verificação:**
1. Abrir DevTools (F12)
2. Navegar por Dashboard → Documentação → Anestesia → Faturamento
3. Comparar os números "PACIENTES ÚNICOS" no console
4. **Devem ser IGUAIS em todas as telas**

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Adicionar filtro de registros válidos no Dashboard
- [ ] Usar `agendamentosValidos` nos cálculos de KPIs
- [ ] Adicionar logs de debug no Dashboard (mesma estrutura)
- [ ] Testar com dados reais
- [ ] Verificar logs no console
- [ ] Comparar números entre as 4 telas
- [ ] Validar com usuários

---

## 🎯 **PRÓXIMO PASSO**

Implementar a correção no arquivo `components/Dashboard.tsx` seguindo a lógica de filtração das outras 3 telas.

---

**Data da Análise:** 28/11/2025
**Status:** 🔴 Problema Identificado - Aguardando Correção

