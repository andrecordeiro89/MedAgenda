# 🔍 ANÁLISE DETALHADA: KPIs "SEM EXAMES" e "COM EXAMES" no Dashboard

## 📊 **LOCALIZAÇÃO DOS KPIs**

### **Arquivo:** `components/Dashboard.tsx`
- **Linhas de Cálculo:** 124-150
- **Linhas de Exibição:** 216-238 (SEM EXAMES) e 185-196 (COM EXAMES)

---

## 🎯 **1. FONTE DE DADOS**

### **Origem dos Dados:**

```typescript
// Linha 21-39: Carregamento dos dados
useEffect(() => {
    const carregarAgendamentosComDocs = async () => {
        if (!hospitalSelecionado?.id) return;
        
        setLoadingDocs(true);
        try {
            // 🔥 FONTE: Supabase (agendamentoService)
            const dados = await agendamentoService.getAll(hospitalSelecionado.id);
            setAgendamentosComDocumentacao(dados);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            // Fallback para props se der erro
            setAgendamentosComDocumentacao(agendamentosProps);
        }
    };
    
    carregarAgendamentosComDocs();
}, [hospitalSelecionado?.id, agendamentosProps]);
```

**Observação:**
- ✅ Dados vêm **diretamente do Supabase** via `agendamentoService.getAll()`
- ✅ Carrega **TODOS os campos** incluindo `documentos_ok`, `ficha_pre_anestesica_ok`, `complementares_ok`
- ✅ Filtrado por `hospital_id` no backend

---

## 🔧 **2. PROCESSAMENTO DOS DADOS**

### **ETAPA 1: Filtragem de Registros Válidos (Linhas 44-69)**

```typescript
// Filtrar registros estruturais de grade cirúrgica
const agendamentos = agendamentosBrutos.filter(ag => {
    const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
    const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
    
    // ✅ INCLUIR: Paciente E procedimento
    if (temPaciente && temProcedimento) return true;
    
    // ❌ EXCLUIR: Estrutura de grade sem paciente
    if (ag.is_grade_cirurgica === true && !temPaciente) return false;
    
    // ❌ EXCLUIR: Registro vazio
    if (!temProcedimento && !temPaciente) return false;
    
    return true;
});
```

**O que está sendo filtrado:**
- ❌ Linhas de especialidade (sem paciente)
- ❌ Linhas de procedimento vazias (estrutura de grade)
- ❌ Registros incompletos
- ✅ **Apenas agendamentos REAIS com paciente E procedimento**

---

### **ETAPA 2: Contagem de Pacientes Únicos (Linhas 126-136)**

```typescript
// Função auxiliar para evitar duplicatas
const getPacientesUnicos = (agendamentosList: Agendamento[]): Set<string> => {
    const pacientes = new Set<string>();
    agendamentosList.forEach(a => {
        const nomePaciente = (a.nome_paciente || a.nome || '').trim();
        // Ignorar registros sem paciente
        if (nomePaciente && nomePaciente !== '') {
            // 🔑 CHAVE: Nome em lowercase para evitar duplicatas
            pacientes.add(nomePaciente.toLowerCase());
        }
    });
    return pacientes; // Retorna Set com nomes únicos
};
```

**Por que usar Set?**
- ✅ Evita duplicatas automaticamente
- ✅ Mesmo paciente com múltiplos procedimentos conta como **1**
- ✅ Case-insensitive (João Silva = JOÃO SILVA = joão silva)

---

### **ETAPA 3: Cálculo KPI "SEM EXAMES" (Linhas 138-143)**

```typescript
// Filtrar agendamentos SEM exames
const agendamentosSemExames = agendamentos.filter(a => {
    // 🔍 CRITÉRIO: documentos_ok NÃO é true
    // Inclui: false, null, undefined
    return !(a.documentos_ok === true);
});

// Contar pacientes únicos (não registros)
const semExames = getPacientesUnicos(agendamentosSemExames).size;
```

**Lógica:**
```
Campo documentos_ok:
├── true       → COM EXAMES ✅
├── false      → SEM EXAMES ❌
├── null       → SEM EXAMES ❌
└── undefined  → SEM EXAMES ❌
```

**Exemplo Prático:**
```
Banco de Dados:
├── João Silva (Procedimento 1) - documentos_ok: false
├── João Silva (Procedimento 2) - documentos_ok: false
├── Maria Santos - documentos_ok: null
└── Pedro Costa - documentos_ok: undefined

Resultado: semExames = 3 (João conta 1 vez, Maria 1 vez, Pedro 1 vez)
```

---

### **ETAPA 4: Cálculo KPI "COM EXAMES" (Linhas 145-150)**

```typescript
// Filtrar agendamentos COM exames
const agendamentosComExames = agendamentos.filter(a => {
    // 🔍 CRITÉRIO: documentos_ok É true (estritamente)
    return a.documentos_ok === true;
});

// Contar pacientes únicos
const comExames = getPacientesUnicos(agendamentosComExames).size;
```

**Lógica:**
```
Campo documentos_ok:
├── true       → CONTA ✅
├── false      → NÃO CONTA ❌
├── null       → NÃO CONTA ❌
└── undefined  → NÃO CONTA ❌
```

**Exemplo Prático:**
```
Banco de Dados:
├── Ana Paula (Procedimento 1) - documentos_ok: true
├── Ana Paula (Procedimento 2) - documentos_ok: true
├── Carlos Souza - documentos_ok: true
└── Beatriz Lima - documentos_ok: true

Resultado: comExames = 4 (Ana conta 1 vez, Carlos 1 vez, Beatriz 1 vez)
```

---

## 🖥️ **3. EXIBIÇÃO NA TELA**

### **KPI 1: SEM EXAMES (Linhas 217-182)**

```tsx
{/* KPI 1: Sem Exames (Vermelho) */}
<div className={`text-center p-6 rounded-lg border-2 ${
    semExames > 0 
        ? 'border-red-500 bg-red-50/80 blink-animation shadow-lg shadow-red-200' 
        : 'border-white/40 bg-white/60'
}`}>
    <div className="flex items-center justify-center mb-3">
        {/* Ícone de alerta */}
        <svg className={`w-8 h-8 mr-2 ${semExames > 0 ? 'text-red-600' : 'text-red-500'}`}>
            {/* Triângulo de alerta */}
        </svg>
        {/* NÚMERO DO KPI */}
        <p className={`text-4xl font-bold ${semExames > 0 ? 'text-red-600' : 'text-red-500'}`}>
            {semExames}
        </p>
    </div>
    <p className={`text-base font-bold ${semExames > 0 ? 'text-red-700' : 'text-slate-700'}`}>
        SEM EXAMES
    </p>
    {semExames > 0 && (
        <p className="text-sm text-red-600 mt-2 font-medium blink-animation">
            ⚠️ Aguardando documentação
        </p>
    )}
</div>
```

**Estados Visuais:**

| Valor | Cor | Borda | Animação | Mensagem |
|-------|-----|-------|----------|----------|
| **0** | Branco/Cinza | Branca fina | Sem animação | - |
| **> 0** | Vermelho claro | Vermelha grossa | **Pisca** ⚠️ | "Aguardando documentação" |

---

### **KPI 2: COM EXAMES (Linhas 185-196)**

```tsx
{/* KPI 2: Com Exames (Verde) */}
<div className="text-center p-6 bg-green-50/80 rounded-lg border-2 border-green-500">
    <div className="flex items-center justify-center mb-3">
        {/* Ícone de check */}
        <svg className="w-8 h-8 text-green-600 mr-2">
            {/* Círculo com check */}
        </svg>
        {/* NÚMERO DO KPI */}
        <p className="text-4xl font-bold text-green-600">
            {comExames}
        </p>
    </div>
    <p className="text-base text-green-700 font-bold">
        COM EXAMES
    </p>
    {comExames > 0 && (
        <p className="text-sm text-green-600 mt-2 font-medium">
            ✅ Em processamento
        </p>
    )}
</div>
```

**Estados Visuais:**

| Valor | Cor | Ícone | Mensagem |
|-------|-----|-------|----------|
| **0** | Verde claro | ✓ | - |
| **> 0** | Verde claro | ✓ | "✅ Em processamento" |

---

## 📊 **4. FLUXO COMPLETO DE DADOS**

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                             │
│  Tabela: agendamentos                                   │
│  └── Campos: nome_paciente, procedimentos,             │
│      documentos_ok, ficha_pre_anestesica_ok            │
└─────────────────────────────────────────────────────────┘
                         ↓
         agendamentoService.getAll(hospital_id)
                         ↓
┌─────────────────────────────────────────────────────────┐
│          COMPONENTE DASHBOARD                           │
│                                                         │
│  1. Carrega dados do Supabase ✅                       │
│     └── agendamentosComDocumentacao                    │
│                                                         │
│  2. Filtra registros válidos ✅                        │
│     └── Remove estruturas de grade                     │
│     └── Remove registros vazios                        │
│     └── agendamentos (filtrado)                        │
│                                                         │
│  3. Separa por status de exames                        │
│     ├── documentos_ok = true  → agendamentosComExames  │
│     └── documentos_ok ≠ true  → agendamentosSemExames  │
│                                                         │
│  4. Conta pacientes únicos                             │
│     ├── getPacientesUnicos(agendamentosComExames)      │
│     │   └── comExames = Set.size                       │
│     │                                                   │
│     └── getPacientesUnicos(agendamentosSemExames)      │
│         └── semExames = Set.size                       │
│                                                         │
│  5. Renderiza na tela                                  │
│     ├── KPI Vermelho: {semExames} ⚠️                   │
│     └── KPI Verde: {comExames} ✅                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 **5. CAMPO-CHAVE: `documentos_ok`**

### **Definição:**
- **Tipo:** `boolean | null | undefined`
- **Localização Banco:** `agendamentos.documentos_ok`
- **Gerenciado por:** Tela de **Documentação** (recepção/triagem)

### **Quando é marcado como TRUE:**

```typescript
// Tela DocumentacaoView.tsx
// Quando a recepção anexa documentos:

const handleUploadDocumentos = async () => {
    // Upload dos arquivos
    const urls = await uploadMultiplosArquivos(arquivos);
    
    // 🔥 ATUALIZA O CAMPO documentos_ok
    await agendamentoService.update(agendamentoId, {
        documentos_ok: true,
        documentos_urls: JSON.stringify(urls),
        documentos_data: new Date().toISOString()
    });
};
```

### **Lifecycle do Campo:**

```
┌─────────────────────────────────────────────────────────┐
│  FLUXO DO CAMPO documentos_ok                           │
└─────────────────────────────────────────────────────────┘

1. Paciente cadastrado na Grade Cirúrgica
   └── documentos_ok: undefined (ou null)
   └── Aparece em: SEM EXAMES ❌

2. Recepção acessa tela Documentação
   └── Ve o paciente na lista (vermelho)

3. Recepção faz upload de exames (ECG, Lab, etc)
   └── documentos_ok: true ✅
   └── documentos_urls: ["url1", "url2", ...]
   └── documentos_data: "2025-11-28T10:30:00"

4. Dashboard atualiza automaticamente
   └── Move de: SEM EXAMES → COM EXAMES
   └── semExames: -1
   └── comExames: +1

5. Anestesista vê paciente pronto para avaliação
   └── Com exames + pode fazer avaliação pré-op
```

---

## 🧮 **6. LÓGICA DE CONTAGEM**

### **Cenário 1: Paciente com 1 Procedimento**

```
Banco:
├── João Silva - LCA - documentos_ok: false

Dashboard:
├── SEM EXAMES: 1
└── COM EXAMES: 0
```

---

### **Cenário 2: Paciente com 3 Procedimentos (MESMA PESSOA)**

```
Banco:
├── João Silva - LCA - documentos_ok: false
├── João Silva - Menisco - documentos_ok: false
└── João Silva - Labrum - documentos_ok: false

Dashboard (CONTA COMO 1):
├── SEM EXAMES: 1  ← João conta 1 vez (paciente único)
└── COM EXAMES: 0
```

**Por quê?**
```typescript
// Set automaticamente remove duplicatas
const pacientes = new Set<string>();
pacientes.add('joão silva'); // Adiciona
pacientes.add('joão silva'); // Ignora (já existe)
pacientes.add('joão silva'); // Ignora (já existe)

pacientes.size; // = 1
```

---

### **Cenário 3: Mesma Pessoa, Status Misto**

```
Banco:
├── João Silva - LCA - documentos_ok: true  ✅
├── João Silva - Menisco - documentos_ok: false ❌
└── João Silva - Labrum - documentos_ok: false ❌

Dashboard:
├── SEM EXAMES: 1  ← João aparece aqui (tem 2 procedimentos sem exames)
└── COM EXAMES: 1  ← João TAMBÉM aparece aqui (tem 1 procedimento com exames)

TOTAL: 2 (mas é a mesma pessoa!)
```

⚠️ **ATENÇÃO:** Este cenário pode causar **inconsistência**!
- O mesmo paciente pode ser contado **nos 2 KPIs** se tiver procedimentos com status diferentes

---

### **Cenário 4: 10 Pacientes Diferentes**

```
Banco:
├── João Silva - documentos_ok: false
├── Maria Santos - documentos_ok: false
├── Pedro Costa - documentos_ok: false
├── Ana Paula - documentos_ok: true
├── Carlos Souza - documentos_ok: true
├── Beatriz Lima - documentos_ok: true
├── Fernando Dias - documentos_ok: null
├── Gabriela Rocha - documentos_ok: undefined
├── Rafael Alves - documentos_ok: false
└── Juliana Mendes - documentos_ok: true

Dashboard:
├── SEM EXAMES: 6  (João, Maria, Pedro, Fernando, Gabriela, Rafael)
└── COM EXAMES: 4  (Ana, Carlos, Beatriz, Juliana)
```

---

## 🐛 **7. POSSÍVEIS PROBLEMAS IDENTIFICADOS**

### **PROBLEMA 1: Contagem Duplicada (Cenário 3)**

**Situação:**
```
Paciente: João Silva
├── Procedimento 1: LCA - documentos_ok: true
└── Procedimento 2: Menisco - documentos_ok: false

Resultado:
├── SEM EXAMES: 1 (João)
└── COM EXAMES: 1 (João também)
TOTAL: 2 (mas deveria ser 1 paciente)
```

**Impacto:**
- ❌ Soma dos KPIs pode ser **MAIOR** que total de pacientes
- ❌ Usuário pode ficar confuso

**Solução Sugerida:**
```typescript
// Opção 1: Mostrar total de pacientes separadamente
const totalPacientesUnicos = getPacientesUnicos(agendamentos).size;

// Opção 2: Considerar apenas o status predominante
const getPacientesComStatusPredominante = (agendamentos) => {
    // Agrupar por paciente
    // Se > 50% dos procedimentos tem exames = COM EXAMES
    // Senão = SEM EXAMES
};
```

---

### **PROBLEMA 2: Null vs Undefined vs False**

**Situação:**
```
Todos estes são contados como "SEM EXAMES":
├── documentos_ok: false  (explicitamente sem)
├── documentos_ok: null   (não marcado ainda)
└── documentos_ok: undefined (campo não existe)
```

**Impacto:**
- ✅ Faz sentido: todos precisam de documentação
- ⚠️ Mas pode inflar números no início (muitos undefined)

---

### **PROBLEMA 3: Atualização em Tempo Real**

**Situação:**
```typescript
// Dados só atualizam quando:
useEffect(() => {
    carregarAgendamentosComDocs();
}, [hospitalSelecionado?.id, agendamentosProps]);
```

**Impacto:**
- ❌ Se recepção anexa documentos, Dashboard **NÃO atualiza** automaticamente
- ❌ Usuário precisa recarregar a página (F5)

**Solução Sugerida:**
```typescript
// Adicionar polling ou websocket
useEffect(() => {
    const interval = setInterval(() => {
        carregarAgendamentosComDocs();
    }, 30000); // Atualizar a cada 30 segundos
    
    return () => clearInterval(interval);
}, [hospitalSelecionado?.id]);
```

---

## ✅ **8. PONTOS FORTES DA IMPLEMENTAÇÃO**

### **1. Consistência com Outras Telas**
✅ Mesma lógica de filtragem que Documentação/Anestesia/Faturamento

### **2. Contagem de Pacientes Únicos**
✅ Evita inflar números com procedimentos duplicados

### **3. Feedback Visual Claro**
✅ Vermelho piscante quando há pendências
✅ Verde fixo quando há progresso

### **4. Logs de Debug**
✅ Console mostra detalhes para diagnóstico
✅ Facilita identificar problemas

### **5. Performance**
✅ Set para contagem de únicos (O(1))
✅ Filtros eficientes

---

## 📊 **9. RESUMO TÉCNICO**

| Aspecto | Descrição |
|---------|-----------|
| **Fonte de Dados** | Supabase (`agendamentos` table) |
| **Campo Principal** | `documentos_ok` (boolean) |
| **Método de Contagem** | Set (pacientes únicos) |
| **Filtro Principal** | Remove estruturas de grade |
| **Atualização** | Manual (F5) ou mudança de hospital |
| **Lógica SEM EXAMES** | `!(documentos_ok === true)` |
| **Lógica COM EXAMES** | `documentos_ok === true` |
| **Visual SEM EXAMES** | Vermelho, pisca se > 0 |
| **Visual COM EXAMES** | Verde fixo |

---

## 🎯 **10. RECOMENDAÇÕES**

### **Curto Prazo:**
1. ✅ Adicionar tooltip explicando que pacientes podem aparecer nos 2 KPIs
2. ✅ Mostrar "Total de Pacientes Únicos" como referência
3. ✅ Melhorar logs de debug

### **Médio Prazo:**
1. ⏱️ Implementar atualização automática (polling 30s)
2. 📊 Adicionar KPI "Parcialmente Documentado"
3. 🔔 Notificações quando novos documentos são anexados

### **Longo Prazo:**
1. 🔄 WebSocket para atualização em tempo real
2. 📈 Histórico de evolução dos KPIs
3. 📊 Dashboard com gráficos de tendência

---

**Data da Análise:** 28/11/2025  
**Status:** ✅ Análise Completa  
**Próximos Passos:** Implementar melhorias sugeridas

