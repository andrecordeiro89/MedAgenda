# 🔄 FLUXO DAS ESPECIALIDADES - Como Funciona

## ✅ RESPOSTA: SIM!

Quando o usuário clica em "Especialidade" na Grade Cirúrgica, **sim, estamos buscando da tabela `especialidades`**!

---

## 📊 FLUXO COMPLETO

### **1. Carregar Especialidades (App.tsx)**

```typescript
// App.tsx - linha 90-94
const [especialidadesData] = await Promise.all([
    simpleEspecialidadeService.getAll() // ← Busca da tabela especialidades
]);

setEspecialidades(especialidadesData); // ← Guarda no estado
```

**Fonte dos dados:**
- 🔵 **Agora:** `localStorage` (mock) - chave `mock_especialidades`
- 🟢 **Depois:** Tabela `especialidades` do Supabase

---

### **2. Passar para CalendarView**

```typescript
// App.tsx - linha 216
<CalendarView 
    especialidades={especialidades} // ← Passa as especialidades
    ...
/>
```

---

### **3. CalendarView passa para GradeCirurgicaModal**

```typescript
// CalendarView.tsx - linha 304
<GradeCirurgicaModal
    especialidades={especialidades} // ← Repassa para o modal
    ...
/>
```

---

### **4. GradeCirurgicaModal usa para o Dropdown**

```typescript
// GradeCirurgicaModal.tsx
// Quando clica no botão "Especialidade":

<select>
    <option value="">Selecione...</option>
    {especialidades.map(e => (
        <option key={e.id} value={e.id}>
            {e.nome} // ← Exibe: "Ortopedia", "Cardiologia", etc.
        </option>
    ))}
</select>
```

---

## 🎯 FLUXO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BANCO DE DADOS                                           │
├─────────────────────────────────────────────────────────────┤
│ Tabela: especialidades                                      │
│ ├── id: 'esp-1'                                             │
│ ├── nome: 'Ortopedia'                                       │
│ ├── id: 'esp-2'                                             │
│ ├── nome: 'Cardiologia'                                     │
│ └── ...                                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVICE                                                  │
├─────────────────────────────────────────────────────────────┤
│ simpleEspecialidadeService.getAll()                         │
│                                                             │
│ 🔵 AGORA: Lê de localStorage                                │
│ 🟢 DEPOIS: Lê do Supabase                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. APP.TSX (Estado)                                         │
├─────────────────────────────────────────────────────────────┤
│ const [especialidades, setEspecialidades] = useState([]);   │
│                                                             │
│ setEspecialidades(especialidadesData);                      │
│ // Array com todas as especialidades                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CALENDARVIEW (Props)                                     │
├─────────────────────────────────────────────────────────────┤
│ <CalendarView                                               │
│     especialidades={especialidades} // ← Recebe             │
│ />                                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. GRADECIRURGICAMODAL (Props)                              │
├─────────────────────────────────────────────────────────────┤
│ <GradeCirurgicaModal                                        │
│     especialidades={especialidades} // ← Recebe             │
│ />                                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. INTERFACE DO USUÁRIO                                     │
├─────────────────────────────────────────────────────────────┤
│ Usuário clica em: [➕ Especialidade]                        │
│                                                             │
│ Aparece dropdown:                                           │
│ ┌───────────────────────────────┐                           │
│ │ Selecione uma especialidade   │                           │
│ │ ──────────────────────────    │                           │
│ │ ○ Ortopedia               ← Da tabela!                   │
│ │ ○ Cardiologia             ← Da tabela!                   │
│ │ ○ Neurologia              ← Da tabela!                   │
│ │ ○ Pediatria               ← Da tabela!                   │
│ │ ...                           │                           │
│ └───────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 ONDE ESTÃO OS DADOS AGORA?

### **localStorage (Mock Atual):**
```javascript
// Console do navegador (F12)
JSON.parse(localStorage.getItem('mock_especialidades'));

// Retorna:
[
  { id: 'esp-1', nome: 'Ortopedia' },
  { id: 'esp-2', nome: 'Cardiologia' },
  { id: 'esp-3', nome: 'Neurologia' },
  // ... 10 especialidades
]
```

### **Supabase (Quando conectar):**
```sql
-- Tabela: especialidades
SELECT * FROM especialidades;

-- Retorna:
| id     | nome         | created_at | updated_at |
|--------|--------------|------------|------------|
| esp-1  | Ortopedia    | ...        | ...        |
| esp-2  | Cardiologia  | ...        | ...        |
| esp-3  | Neurologia   | ...        | ...        |
```

---

## 🔍 VERIFICAR NO CÓDIGO

### **1. Service que busca (mock atual):**
```typescript
// services/mock-storage.ts - linha 80
export const mockEspecialidadeService = {
  getAll(): Especialidade[] {
    return getFromStorage('mock_especialidades', MOCK_ESPECIALIDADES);
  }
};
```

### **2. App.tsx carrega:**
```typescript
// App.tsx - linha 94
simpleEspecialidadeService.getAll() // ← Busca especialidades
```

### **3. CalendarView recebe:**
```typescript
// CalendarView.tsx - linha 12
interface CalendarViewProps {
  especialidades: Especialidade[]; // ← Tipado
  ...
}
```

### **4. GradeCirurgicaModal usa:**
```typescript
// GradeCirurgicaModal.tsx - linha 46
interface GradeCirurgicaModalProps {
  especialidades: Especialidade[]; // ← Recebe
  ...
}

// Linha 225 - Busca pelo nome
const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
```

---

## ✅ CONFIRMAÇÃO

**Quando o usuário:**
1. Clica em um dia do calendário
2. Modal de Grade Cirúrgica abre
3. Clica em "➕ Especialidade"
4. Dropdown aparece

**As opções no dropdown vêm de:**
- ✅ Tabela `especialidades` (via service)
- ✅ Carregadas no início pelo App.tsx
- ✅ Passadas via props até o modal
- ✅ Exibidas no `<select>`

---

## 🎯 RESUMO

```
Tabela especialidades
        ↓
Service (.getAll())
        ↓
App.tsx (estado)
        ↓
CalendarView (props)
        ↓
GradeCirurgicaModal (props)
        ↓
Dropdown <select> (UI)
        ↓
Usuário seleciona
```

**Tudo conectado! ✨**

---

## 🔄 PRÓXIMO PASSO

Quando conectar ao Supabase:
1. As especialidades virão direto da tabela
2. Qualquer mudança no banco aparece no sistema
3. Mesmo fluxo, fonte de dados diferente

**O sistema já está preparado!** 🚀

