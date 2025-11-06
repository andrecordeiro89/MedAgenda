# ✅ CAMPO POR CAMPO: Botão "+ Especialidade"

## 🎯 **Objetivo:**
Ao clicar em **"+ Especialidade"** na Grade Cirúrgica, buscar as especialidades da tabela `especialidades` (coluna `nome`) e permitir selecionar uma para adicionar.

---

## ✅ **O QUE FOI FEITO:**

### **1️⃣ Interface TypeScript (`types.ts`):**
```typescript
✅ Atualizada interface Especialidade:
   - id: string
   - nome: string (campo real do banco)
```

### **2️⃣ GradeCirurgicaModal (`components/GradeCirurgicaModal.tsx`):**

#### **Props Adicionadas:**
```typescript
interface GradeCirurgicaModalProps {
  ...
  especialidades: Especialidade[]; // NOVA PROP
}
```

#### **Estados Adicionados:**
```typescript
const [addingEspecialidade, setAddingEspecialidade] = useState<number | null>(null);
const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('');
```

#### **Funções Criadas:**

**1. `handleAddEspecialidadeClick(gradeIndex)`**
- Abre o dropdown de seleção
- Limpa seleção anterior
- Ativa o modo "adicionando especialidade"

**2. `handleConfirmAddEspecialidade()`**
- Busca o nome da especialidade selecionada no array
- Cria um novo item do tipo "especialidade"
- Adiciona na grade
- Limpa o estado

**3. `handleCancelAddEspecialidade()`**
- Fecha o dropdown
- Limpa a seleção
- Cancela a operação

#### **UI Adicionado:**

**Dropdown de Seleção** (aparece quando `addingEspecialidade === index`):
```tsx
<div className="p-3 bg-blue-50 border-b-2 border-blue-200">
  <select>
    <option value="">-- Selecione --</option>
    {especialidades.map(esp => (
      <option key={esp.id} value={esp.id}>
        {esp.nome}
      </option>
    ))}
  </select>
  <button onClick={handleConfirmAddEspecialidade}>✓ OK</button>
  <button onClick={handleCancelAddEspecialidade}>✕ Cancelar</button>
</div>
```

### **3️⃣ CalendarView (`components/CalendarView.tsx`):**

#### **Prop Adicionada:**
```tsx
<GradeCirurgicaModal
  ...
  especialidades={especialidades}
/>
```

---

## 🎨 **FLUXO DE FUNCIONAMENTO:**

### **1. Usuário clica em "+ Especialidade"**
```
1. handleAddEspecialidadeClick(index) é chamado
2. setAddingEspecialidade(index) ativa o modo
3. setEspecialidadeSelecionada('') limpa seleção
```

### **2. Dropdown aparece**
```
- Mostra label "Selecione a Especialidade:"
- Select com todas as especialidades do banco
- Botões "OK" e "Cancelar"
```

### **3. Usuário seleciona uma especialidade**
```
onChange={(e) => setEspecialidadeSelecionada(e.target.value)}
- Estado atualizado com o ID da especialidade
- Botão "OK" fica habilitado
```

### **4. Usuário clica em "OK"**
```
1. handleConfirmAddEspecialidade() é chamado
2. Busca a especialidade pelo ID
3. Cria item com tipo: 'especialidade', texto: esp.nome
4. Adiciona na grade (setGrades)
5. Limpa estados (fecha dropdown)
```

### **5. OU usuário clica em "Cancelar"**
```
1. handleCancelAddEspecialidade() é chamado
2. Limpa estados
3. Fecha dropdown sem adicionar
```

---

## 📊 **DADOS QUE FLUEM:**

```
BANCO DE DADOS (especialidades)
├── id: UUID
└── nome: string
          ↓
APP.TSX (carrega especialidades)
          ↓
CALENDARVIEW (passa como prop)
          ↓
GRADECIRURGICAMODAL (recebe e usa)
          ↓
DROPDOWN (mostra opções)
          ↓
SELEÇÃO (especialidade.nome)
          ↓
GRADE (adiciona como item)
```

---

## 🎯 **RESULTADO VISUAL:**

### **Antes de clicar:**
```
┌─────────────────────────────────┐
│  01/12  [+ Especialidade] [Repl] │
├─────────────────────────────────┤
│         Vazio                   │
└─────────────────────────────────┘
```

### **Depois de clicar em "+ Especialidade":**
```
┌─────────────────────────────────┐
│  01/12  [+ Especialidade] [Repl] │
├─────────────────────────────────┤
│ Selecione a Especialidade:       │
│ [-- Selecione ▼] [✓ OK] [✕ Cancel]│
│   - Cardiologia                  │
│   - Ortopedia                    │
│   - Urologia                     │
│   - ...                          │
├─────────────────────────────────┤
│         Vazio                   │
└─────────────────────────────────┘
```

### **Depois de selecionar e confirmar:**
```
┌─────────────────────────────────┐
│  01/12  [+ Especialidade] [Repl] │
├─────────────────────────────────┤
│ ╔═══════════════════════════╗  │
│ ║ Ortopedia        [↑] [↓] [✕] ║  │ ← Azul
│ ║ [+ Proc.]                 5  ║  │
│ ╚═══════════════════════════╝  │
└─────────────────────────────────┘
```

---

## ✅ **TESTES A FAZER:**

1. ✅ **Clicar em "+ Especialidade"**
   - Deve abrir o dropdown
   - Deve mostrar todas as especialidades do banco

2. ✅ **Selecionar uma especialidade**
   - Select deve atualizar
   - Botão "OK" deve habilitar

3. ✅ **Clicar em "OK"**
   - Especialidade deve ser adicionada na grade
   - Dropdown deve fechar
   - Nome deve aparecer no header azul

4. ✅ **Clicar em "Cancelar"**
   - Dropdown deve fechar
   - Nada deve ser adicionado

5. ✅ **Adicionar múltiplas especialidades**
   - Cada uma deve aparecer em seu próprio bloco azul
   - Todas devem vir do banco (não texto livre)

---

## 🚀 **PRÓXIMOS PASSOS:**

Agora que o botão **"+ Especialidade"** está configurado para buscar do banco, vamos configurar os próximos campos:

### **1. Botão "+ Procedimento"** (PRÓXIMO)
- Buscar procedimentos da tabela `procedimentos`
- Coluna `nome` ou `prefixo`
- Adicionar abaixo da especialidade

### **2. Botão "+" para Adicionar Paciente** (DEPOIS)
- Buscar pacientes da tabela `agendamentos`
- Coluna `nome_paciente`
- Adicionar ao procedimento

### **3. Persistência no Banco** (POR ÚLTIMO)
- Salvar no `grades_cirurgicas`
- Relacionar com `especialidades` via FK
- Relacionar com `procedimentos` via FK

---

## 📝 **CHECKLIST:**

- [x] Adicionar prop `especialidades` no `GradeCirurgicaModal`
- [x] Criar estados `addingEspecialidade` e `especialidadeSelecionada`
- [x] Criar função `handleAddEspecialidadeClick`
- [x] Criar função `handleConfirmAddEspecialidade`
- [x] Criar função `handleCancelAddEspecialidade`
- [x] Adicionar dropdown UI
- [x] Passar prop do `CalendarView`
- [x] Verificar linter (sem erros)
- [ ] **Testar no navegador** ⚠️ (AGUARDANDO USUÁRIO)
- [ ] Configurar próximo campo ("+Procedimento")

---

**STATUS: ✅ BOTÃO "+ ESPECIALIDADE" CONFIGURADO E PRONTO PARA TESTE!**

**AGUARDANDO:** Teste do usuário no navegador para confirmar funcionamento antes de continuar para o próximo campo.

