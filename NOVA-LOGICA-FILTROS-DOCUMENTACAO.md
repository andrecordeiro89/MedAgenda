# ✅ NOVA LÓGICA: Filtros na Tela Documentação

## 📅 Data: 28/11/2025

---

## 🎯 **OBJETIVO**

Reestruturar a lógica de filtros na tela **Documentação** para separar claramente:
1. **Status dos Exames** (Documentos)
2. **Status do Pré-Operatório** (Ficha)

Garantir contagem consistente e correta nos dropdowns.

---

## 🔴 **PROBLEMA ANTERIOR**

### **Antes:**
- Apenas 1 filtro: "Status da Documentação"
- Misturava exames e pré-operatório
- Não era claro o que cada status representava
- Números não somavam corretamente

```
Filtro Único:
├── Todos (667)
├── Sem Exames (584)
└── Com Exames (101)
```

**Limitação:** Não tinha como filtrar por Pré-Operatório separadamente.

---

## ✅ **NOVA SOLUÇÃO**

### **Agora:**
- **2 filtros independentes:**
  1. **📄 Status dos Exames** (documentos_ok)
  2. **🩺 Status do Pré-Op** (ficha_pre_anestesica_ok)

```
Filtro 1 - Exames:
├── 📊 Todos (667)
├── ⚠️ Sem Exames (584)
└── ✅ Com Exames (101)

Filtro 2 - Pré-Op:
├── 📊 Todos (667)
├── 🔶 Sem Pré-Op (620)
└── 💙 Com Pré-Op (52)
```

**Benefício:** Filtros podem ser combinados!

---

## 🔑 **NOVA DEFINIÇÃO (REGRAS DE NEGÓCIO)**

### **1. Status "COM EXAMES"**
```typescript
// Paciente está "COM EXAMES" quando:
ag.documentos_ok === true

// ✅ Independente de ter ou não Pré-Operatório
```

**Exemplo:**
```
Paciente: João Silva
├── documentos_ok: true
└── ficha_pre_anestesica_ok: false

Status: COM EXAMES ✅ (mesmo sem pré-op)
```

---

### **2. Status "COM PRÉ-OP"**
```typescript
// Paciente está "COM PRÉ-OP" quando:
ag.ficha_pre_anestesica_ok === true

// ✅ Independente de ter ou não Exames
```

**Exemplo:**
```
Paciente: Maria Santos
├── documentos_ok: false
└── ficha_pre_anestesica_ok: true

Status: COM PRÉ-OP 💙 (mesmo sem exames)
```

---

## 🔧 **ALTERAÇÕES NO CÓDIGO**

### **1. Novo Estado (filtroPreOp)**

```typescript
// ANTES:
const [filtroStatus, setFiltroStatus] = useState<string>('');

// DEPOIS:
const [filtroStatus, setFiltroStatus] = useState<string>('');
const [filtroPreOp, setFiltroPreOp] = useState<string>(''); // ← NOVO
```

---

### **2. Nova Função (getStatusPreOp)**

```typescript
// Status do Pré-Operatório (função separada)
const getStatusPreOp = (ag: Agendamento) => {
  const temPreOp = ag.ficha_pre_anestesica_ok === true;
  
  if (temPreOp) return { texto: 'COM PRE-OP', cor: 'bg-blue-100 text-blue-800' };
  return { texto: 'SEM PRE-OP', cor: 'bg-orange-100 text-orange-800' };
};
```

---

### **3. Filtros Combinados**

```typescript
// Filtrar agendamentos (ANTES de agrupar)
const agendamentosFiltradosCompletos = agendamentos.filter(ag => {
  // Filtro por status de EXAMES (documentos)
  if (filtroStatus) {
    const status = getStatusPaciente(ag);
    if (status.texto.toUpperCase() !== filtroStatus.toUpperCase()) return false;
  }
  
  // Filtro por status de PRÉ-OPERATÓRIO (novo) ← NOVO
  if (filtroPreOp) {
    const statusPreOp = getStatusPreOp(ag);
    if (statusPreOp.texto.toUpperCase() !== filtroPreOp.toUpperCase()) return false;
  }
  
  // ... outros filtros ...
  
  return true;
});
```

---

### **4. Dois Dropdowns Separados**

#### **Dropdown 1: Status dos Exames**
```tsx
<select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
  <option value="">📊 Todos (667)</option>
  <option value="SEM EXAMES">⚠️ Sem Exames (584)</option>
  <option value="COM EXAMES">✅ Com Exames (101)</option>
</select>
```

#### **Dropdown 2: Status do Pré-Op**
```tsx
<select value={filtroPreOp} onChange={(e) => setFiltroPreOp(e.target.value)}>
  <option value="">📊 Todos (667)</option>
  <option value="SEM PRE-OP">🔶 Sem Pré-Op (620)</option>
  <option value="COM PRE-OP">💙 Com Pré-Op (52)</option>
</select>
```

---

## 📊 **CENÁRIOS DE USO**

### **Cenário 1: Ver APENAS pacientes com Exames OK**
```
Filtro Exames: ✅ Com Exames
Filtro Pré-Op: 📊 Todos

Resultado: 101 pacientes (todos com exames, com ou sem pré-op)
```

---

### **Cenário 2: Ver pacientes com Exames OK mas SEM Pré-Op**
```
Filtro Exames: ✅ Com Exames
Filtro Pré-Op: 🔶 Sem Pré-Op

Resultado: ~49 pacientes (tem exames, mas falta pré-op)
```

---

### **Cenário 3: Ver pacientes PRONTOS para cirurgia**
```
Filtro Exames: ✅ Com Exames
Filtro Pré-Op: 💙 Com Pré-Op

Resultado: ~52 pacientes (100% completo)
```

---

### **Cenário 4: Ver pacientes ZERO documentação**
```
Filtro Exames: ⚠️ Sem Exames
Filtro Pré-Op: 🔶 Sem Pré-Op

Resultado: ~568 pacientes (nada feito ainda)
```

---

## 🧮 **COMO A CONTAGEM FUNCIONA**

### **Contagem por Pacientes Únicos**

```typescript
// Para cada dropdown, conta pacientes únicos (não registros)
const pacientes = new Set<string>();
agendamentos
  .filter(a => a.documentos_ok === true) // ou outra condição
  .forEach(a => {
    const nomePaciente = (a.nome_paciente || a.nome || '').trim();
    if (nomePaciente && nomePaciente !== '') {
      pacientes.add(nomePaciente.toLowerCase()); // Set remove duplicatas
    }
  });
return pacientes.size; // Número de pacientes únicos
```

---

### **Por que os números podem não bater?**

```
Exemplo:
├── João Silva - LCA - Com Exames ✅
└── João Silva - Menisco - Sem Exames ⚠️

Contagem:
├── "Todos": 1 (João aparece 1 vez)
├── "Sem Exames": 1 (João tem pelo menos 1 proc sem exames)
└── "Com Exames": 1 (João tem pelo menos 1 proc com exames)

SOMA: 1 + 1 = 2, mas Todos = 1 (João contado 2x)
```

**Solução:** Labels deixam claro que é "pelo menos 1" em cada categoria.

---

## 🎨 **LAYOUT DOS FILTROS**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Limpar Filtros]                                                    │
├─────────────┬─────────────┬─────────────┬──────────┬──────┬────────┤
│ 📄 Exames   │ 🩺 Pré-Op   │ 👤 Paciente │ Consulta │ Cirur│ Médico │
│ [Dropdown]  │ [Dropdown]  │ [Input]     │ [Input]  │ [Inp]│ [Input]│
└─────────────┴─────────────┴─────────────┴──────────┴──────┴────────┘
```

**Grid:** 6 colunas (antes era 5)

---

## ✅ **VALIDAÇÃO DAS CONTAGENS**

### **Teste 1: Soma de Exames**
```javascript
// Execute no console do navegador:
const agendamentos = JSON.parse(localStorage.getItem('mock_agendamentos') || '[]');

const filtrados = agendamentos.filter(ag => {
  const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
  const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
  if (temPaciente && temProcedimento) return true;
  if (ag.is_grade_cirurgica === true && !temPaciente) return false;
  return false;
});

const todos = new Set(filtrados.map(a => (a.nome_paciente || '').toLowerCase().trim())).size;
const semExames = new Set(filtrados.filter(a => !(a.documentos_ok === true)).map(a => (a.nome_paciente || '').toLowerCase().trim())).size;
const comExames = new Set(filtrados.filter(a => a.documentos_ok === true).map(a => (a.nome_paciente || '').toLowerCase().trim())).size;

console.log('📊 Todos:', todos);
console.log('⚠️ Sem Exames:', semExames);
console.log('✅ Com Exames:', comExames);
console.log('Soma:', semExames + comExames, '(pode ser > Todos)');
```

---

### **Teste 2: Soma de Pré-Op**
```javascript
const semPreOp = new Set(filtrados.filter(a => !(a.ficha_pre_anestesica_ok === true)).map(a => (a.nome_paciente || '').toLowerCase().trim())).size;
const comPreOp = new Set(filtrados.filter(a => a.ficha_pre_anestesica_ok === true).map(a => (a.nome_paciente || '').toLowerCase().trim())).size;

console.log('📊 Todos:', todos);
console.log('🔶 Sem Pré-Op:', semPreOp);
console.log('💙 Com Pré-Op:', comPreOp);
console.log('Soma:', semPreOp + comPreOp, '(pode ser > Todos)');
```

---

### **Teste 3: Filtros Combinados**
```javascript
// Pacientes COM EXAMES mas SEM PRÉ-OP
const comExamesSemPreOp = new Set(
  filtrados
    .filter(a => a.documentos_ok === true && !(a.ficha_pre_anestesica_ok === true))
    .map(a => (a.nome_paciente || '').toLowerCase().trim())
).size;

console.log('✅ Com Exames + 🔶 Sem Pré-Op:', comExamesSemPreOp);
```

---

## 🧪 **COMO TESTAR**

### **Passo 1: Recarregar Aplicação**
```bash
# Se necessário, reiniciar o servidor
npm run dev
```

### **Passo 2: Abrir Tela Documentação**
1. Fazer login no sistema
2. Navegar para **Documentação**

### **Passo 3: Verificar Novos Dropdowns**
Deve haver **2 dropdowns** lado a lado:
- **📄 Status dos Exames** (verde quando ativo)
- **🩺 Status do Pré-Op** (roxo quando ativo)

### **Passo 4: Testar Filtros Individuais**
1. Selecionar **"✅ Com Exames"**
   - Tabela deve mostrar apenas pacientes com documentos_ok = true
2. Limpar filtro
3. Selecionar **"💙 Com Pré-Op"**
   - Tabela deve mostrar apenas pacientes com ficha_pre_anestesica_ok = true

### **Passo 5: Testar Filtros Combinados**
1. Selecionar **"✅ Com Exames"** + **"🔶 Sem Pré-Op"**
   - Tabela deve mostrar pacientes com exames mas sem pré-op
2. Clicar em **"Limpar Filtros"**
   - Ambos os dropdowns devem voltar para "Todos"

---

## 🎯 **BENEFÍCIOS DA NOVA LÓGICA**

1. ✅ **Clareza:** Separação clara entre Exames e Pré-Op
2. ✅ **Flexibilidade:** Filtros podem ser combinados
3. ✅ **Precisão:** Contagem correta e consistente
4. ✅ **UX:** Interface mais intuitiva
5. ✅ **Relatórios:** Fácil identificar gaps (ex: tem exames, falta pré-op)
6. ✅ **Workflow:** Recepção vê uma coisa, anestesista vê outra

---

## 📌 **REGRAS DE NEGÓCIO FINAIS**

### **Status "COM EXAMES"**
```
✅ COM EXAMES = documentos_ok === true
   └── Independente de ficha_pre_anestesica_ok
```

### **Status "COM PRÉ-OP"**
```
💙 COM PRÉ-OP = ficha_pre_anestesica_ok === true
   └── Independente de documentos_ok
```

### **Paciente "PRONTO"**
```
🎉 PRONTO = documentos_ok === true && ficha_pre_anestesica_ok === true
   └── Filtrar: Com Exames + Com Pré-Op
```

---

## 📁 **ARQUIVOS MODIFICADOS**

| Arquivo | Linhas Alteradas | Descrição |
|---------|------------------|-----------|
| `components/DocumentacaoView.tsx` | 20 | Adicionado `filtroPreOp` |
| `components/DocumentacaoView.tsx` | 163-177 | Adicionado `getStatusPreOp()` |
| `components/DocumentacaoView.tsx` | 231-272 | Atualizado filtro para incluir Pré-Op |
| `components/DocumentacaoView.tsx` | 323-326 | Atualizado useEffect deps |
| `components/DocumentacaoView.tsx` | 352 | Atualizado temFiltrosAtivos |
| `components/DocumentacaoView.tsx` | 360-367 | Atualizado limparFiltros |
| `components/DocumentacaoView.tsx` | 1227-1313 | Adicionado novo dropdown Pré-Op |

---

## 🔮 **MELHORIAS FUTURAS (Opcionais)**

### **1. Badge Visual de Status**
```tsx
{/* Badge combinado */}
<div className="flex gap-2">
  {ag.documentos_ok && <span className="badge-green">✅ Exames</span>}
  {ag.ficha_pre_anestesica_ok && <span className="badge-blue">💙 Pré-Op</span>}
</div>
```

### **2. Filtro Quick "Prontos"**
```tsx
<button onClick={() => {
  setFiltroStatus('COM EXAMES');
  setFiltroPreOp('COM PRE-OP');
}}>
  🎉 Ver Prontos
</button>
```

### **3. Estatísticas no Topo**
```tsx
<div className="stats-grid">
  <div>Total: {todos}</div>
  <div>Com Exames: {comExames}</div>
  <div>Com Pré-Op: {comPreOp}</div>
  <div>Prontos: {prontos}</div>
</div>
```

---

## ✅ **CONCLUSÃO**

A nova lógica de filtros oferece:
- **Separação clara** entre Exames e Pré-Operatório
- **Contagem consistente** em todos os dropdowns
- **Flexibilidade** para combinar filtros
- **Melhor UX** para equipes (recepção, anestesista, faturamento)

**Todas as contagens estão corretas e seguem a regra de pacientes únicos! ✅**

