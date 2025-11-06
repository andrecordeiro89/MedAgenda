# 📋 ADAPTAÇÃO PARA ESTRUTURA REAL DO BANCO

## ✅ **Estrutura Real das Tabelas (Conforme Fornecido)**

### **1. Tabela: `agendamentos`**
```sql
Colunas:
- id (uuid, PK)
- nome_paciente (text)
- data_nascimento (date)
- cidade_natal (text)
- telefone (text)
- whatsapp (text)
- data_agendamento (date)
- status_liberacao (char: 'x' ou 'v')
- medico_id (uuid, FK)
- procedimento_id (uuid, FK)
- hospital_id (uuid, FK)
```

### **2. Tabela: `app_users`**
```sql
Colunas:
- id (uuid, PK)
- login (text)
- senha (text)
```

### **3. Tabela: `especialidades`**
```sql
Colunas:
- id (uuid, PK)
- nome (text)
```

### **4. Tabela: `procedimentos`**
```sql
Colunas:
- id (uuid, PK)
- nome (text)
- prefixo (text) ← ADICIONAR ESTA COLUNA
```

---

## ✅ **Adaptações Realizadas**

### **1. Arquivo: `types.ts`**

#### **Interface `Agendamento` - ATUALIZADA**
```typescript
export interface Agendamento {
  // CAMPOS REAIS DO BANCO (snake_case)
  id: string;
  nome_paciente: string;
  data_nascimento: string;
  cidade_natal: string;
  telefone: string;
  whatsapp: string;
  data_agendamento: string;
  status_liberacao: StatusLiberacao;
  medico_id: string;
  procedimento_id: string;
  hospital_id: string;
  
  // CAMPOS AUXILIARES (calculados)
  idade?: number;
  tipo?: TipoAgendamento;
  
  // ALIASES (compatibilidade com código antigo - camelCase)
  nome?: string;
  dataNascimento?: string;
  dataAgendamento?: string;
  // ... etc
}
```

#### **Interface `Especialidade` - SIMPLIFICADA**
```typescript
export interface Especialidade {
    id: string;
    nome: string; // Único campo real
}
```

#### **Interface `Procedimento` - SIMPLIFICADA**
```typescript
export interface Procedimento {
    id: string;
    nome: string; // Campo real
    prefixo?: string; // Nova coluna a adicionar
    
    // Campos auxiliares (opcional)
    tipo?: TipoAgendamento;
    // ... etc
}
```

#### **Interface `AppUser` - NOVA**
```typescript
export interface AppUser {
    id: string;
    login: string;
    senha: string; // ⚠️ Use hash em produção!
}
```

---

## 🔧 **Scripts SQL Criados**

### **1. `adicionar-coluna-prefixo.sql`**
- Adiciona coluna `prefixo` na tabela `procedimentos`
- Cria índice para busca rápida
- **EXECUTE ESTE SCRIPT NO SUPABASE!**

---

## 📝 **Próximos Passos Necessários**

### **1️⃣ Executar Script SQL**
```bash
# No Supabase SQL Editor, execute:
adicionar-coluna-prefixo.sql
```

### **2️⃣ Adaptar `api-simple.ts`**

#### **Converter função para Agendamentos:**
```typescript
function convertSupabaseToAgendamento(data: any): Agendamento {
  return {
    id: data.id,
    nome_paciente: data.nome_paciente,
    data_nascimento: data.data_nascimento,
    cidade_natal: data.cidade_natal,
    telefone: data.telefone,
    whatsapp: data.whatsapp,
    data_agendamento: data.data_agendamento,
    status_liberacao: data.status_liberacao,
    medico_id: data.medico_id,
    procedimento_id: data.procedimento_id,
    hospital_id: data.hospital_id,
    
    // Calcular idade
    idade: calcularIdade(data.data_nascimento),
    
    // Aliases para compatibilidade
    nome: data.nome_paciente,
    dataNascimento: data.data_nascimento,
    dataAgendamento: data.data_agendamento,
    medicoId: data.medico_id,
    procedimentoId: data.procedimento_id,
    hospitalId: data.hospital_id,
    cidadeNatal: data.cidade_natal,
  };
}
```

#### **Converter função para Especialidades:**
```typescript
function convertSupabaseToEspecialidade(data: any): Especialidade {
  return {
    id: data.id,
    nome: data.nome
  };
}
```

#### **Converter função para Procedimentos:**
```typescript
function convertSupabaseToProcedimento(data: any): Procedimento {
  return {
    id: data.id,
    nome: data.nome,
    prefixo: data.prefixo || ''
  };
}
```

### **3️⃣ Adaptar Componentes React**

#### **CalendarView.tsx:**
```typescript
// ANTES (camelCase):
{a.nome}

// DEPOIS (snake_case):
{a.nome_paciente}
```

#### **Todos os componentes devem usar:**
- `agendamento.nome_paciente` em vez de `agendamento.nome`
- `agendamento.data_agendamento` em vez de `agendamento.dataAgendamento`
- `agendamento.medico_id` em vez de `agendamento.medicoId`
- etc.

### **4️⃣ Função Auxiliar - Calcular Idade**

Adicionar no `utils.ts` ou criar `utils/date.ts`:

```typescript
export function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
}
```

---

## 🎯 **Checklist de Adaptação**

### **SQL:**
- [ ] Executar `adicionar-coluna-prefixo.sql`
- [ ] Verificar que coluna `prefixo` existe em `procedimentos`

### **TypeScript:**
- [x] Atualizar interface `Agendamento`
- [x] Atualizar interface `Especialidade`
- [x] Atualizar interface `Procedimento`
- [x] Criar interface `AppUser`
- [ ] Atualizar funções de conversão em `api-simple.ts`
- [ ] Adicionar função `calcularIdade()`

### **React Components:**
- [ ] Atualizar `CalendarView.tsx` (usar snake_case)
- [ ] Atualizar `DashboardView.tsx` (usar snake_case)
- [ ] Atualizar `ManagementView.tsx` (usar snake_case)
- [ ] Atualizar `AvaliacaoAnestesicaView.tsx` (usar snake_case)
- [ ] Atualizar formulários (inputs devem usar snake_case)

### **Testes:**
- [ ] Testar listagem de agendamentos
- [ ] Testar criação de agendamento
- [ ] Testar edição de agendamento
- [ ] Testar grades cirúrgicas com prefixos

---

## ⚠️ **Observações Importantes**

### **1. Compatibilidade Retroativa:**
Mantemos os aliases (camelCase) como opcionais para não quebrar código existente durante a transição.

### **2. Padrão de Nomenclatura:**
- **Banco de Dados:** `snake_case` (nome_paciente, data_nascimento)
- **Frontend (display):** Pode usar qualquer formato
- **API/Interfaces:** Usar `snake_case` para refletir o banco

### **3. Segurança:**
A coluna `senha` em `app_users` deve usar hash (bcrypt, argon2) em produção. **NUNCA** armazene senhas em texto puro!

### **4. Índices:**
Adicionar índices em:
- `agendamentos.data_agendamento`
- `agendamentos.medico_id`
- `agendamentos.hospital_id`
- `procedimentos.prefixo`

---

## 🚀 **Ordem de Execução:**

1. ✅ **Execute:** `adicionar-coluna-prefixo.sql`
2. ✅ **Atualize:** Funções de conversão em `api-simple.ts`
3. ✅ **Teste:** API retornando dados corretos
4. ✅ **Adapte:** Componentes React um por um
5. ✅ **Teste:** Cada tela após adaptação

---

**Próximo passo: Quer que eu adapte os serviços API (`api-simple.ts`) agora?** 🔧

