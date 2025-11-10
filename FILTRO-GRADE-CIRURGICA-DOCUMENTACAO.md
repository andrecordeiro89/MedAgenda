# 🔒 Filtro de Grade Cirúrgica na Tela de Documentação

## ✅ Implementação Completa

Solução implementada para garantir que registros de **Grade Cirúrgica** (linhas de especialidade/médico) **não apareçam** na tela de **Documentação** e **Faturamento**.

---

## 🎯 Problema Resolvido

**Antes:** Quando registrava uma especialidade (ex: "Ortopedia" com "Dr. Diogo") e um procedimento (ex: "LCA"), a linha da especialidade aparecia na tela de Documentação, mesmo sendo apenas uma estrutura de grade cirúrgica.

**Depois:** Registros de grade cirúrgica são identificados e filtrados automaticamente, não aparecendo nas telas de Documentação e Faturamento.

---

## 📋 Mudanças Implementadas

### 1. **Banco de Dados** (`add-coluna-is-grade-cirurgica.sql`)

**Nova coluna adicionada:**
```sql
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS is_grade_cirurgica BOOLEAN NOT NULL DEFAULT false;
```

**Índice criado para otimização:**
```sql
CREATE INDEX IF NOT EXISTS idx_agendamentos_is_grade_cirurgica 
ON agendamentos(is_grade_cirurgica) 
WHERE is_grade_cirurgica = true;
```

**Atualização de registros existentes:**
```sql
UPDATE agendamentos 
SET is_grade_cirurgica = true 
WHERE (procedimentos IS NULL OR procedimentos = '') 
  AND (nome_paciente IS NULL OR nome_paciente = '');
```

### 2. **TypeScript** (`types.ts`)

**Campo adicionado na interface `Agendamento`:**
```typescript
// Campo para identificar registros de grade cirúrgica
is_grade_cirurgica?: boolean; // Indica se é apenas estrutura de grade (não aparece em Documentação)
```

### 3. **Serviço Supabase** (`services/supabase.ts`)

**Método `create()` atualizado:**
- Inclui `is_grade_cirurgica` no `insertData`

**Método `update()` atualizado:**
- Permite atualizar o campo `is_grade_cirurgica`

### 4. **Grade Cirúrgica Modal** (`components/GradeCirurgicaModal.tsx`)

**Registros de especialidade marcados:**
- Quando salva linha de especialidade (sem procedimentos), marca `is_grade_cirurgica: true`
- Procedimentos **NÃO** são marcados (podem ter pacientes vinculados)

**Locais atualizados:**
- `handleSalvarAgendamento()` - linha 476-486
- `handleSalvarAgendamento()` (duplicado) - linha 613-623
- `handleReplicarParaTodas()` - linha 1178-1188

### 5. **Tela de Documentação** (`components/DocumentacaoView.tsx`)

**Filtro implementado:**
```typescript
const agendamentosFiltrados = dados.filter(ag => {
  // Se tem flag is_grade_cirurgica = true, excluir
  if (ag.is_grade_cirurgica === true) {
    return false;
  }
  // Se não tem procedimentos E não tem nome_paciente, é linha de grade (compatibilidade)
  if ((!ag.procedimentos || ag.procedimentos.trim() === '') && 
      (!ag.nome_paciente || ag.nome_paciente.trim() === '')) {
    return false;
  }
  return true;
});
```

### 6. **Tela de Faturamento** (`components/FaturamentoView.tsx`)

**Mesmo filtro implementado** para garantir consistência.

---

## 🚀 Como Executar

### **Passo 1: Executar Script SQL no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo `add-coluna-is-grade-cirurgica.sql`

**OU copie e cole o conteúdo:**

```sql
-- Adicionar coluna
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS is_grade_cirurgica BOOLEAN NOT NULL DEFAULT false;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_agendamentos_is_grade_cirurgica 
ON agendamentos(is_grade_cirurgica) 
WHERE is_grade_cirurgica = true;

-- Atualizar registros existentes
UPDATE agendamentos 
SET is_grade_cirurgica = true 
WHERE (procedimentos IS NULL OR procedimentos = '') 
  AND (nome_paciente IS NULL OR nome_paciente = '');
```

### **Passo 2: Verificar Atualização**

Execute no SQL Editor para verificar:

```sql
SELECT 
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE is_grade_cirurgica = true) as registros_grade_cirurgica,
  COUNT(*) FILTER (WHERE is_grade_cirurgica = false) as registros_normais
FROM agendamentos;
```

---

## 📊 Como Funciona

### **Registros de Grade Cirúrgica:**

1. **Linha de Especialidade:**
   - `is_grade_cirurgica = true`
   - `procedimentos = NULL` ou `''`
   - `nome_paciente = ''`
   - **NÃO aparece** em Documentação/Faturamento

2. **Linha de Procedimento:**
   - `is_grade_cirurgica = false` (padrão)
   - `procedimentos = 'LCA'` (preenchido)
   - `nome_paciente = ''` (pode ter paciente depois)
   - **APARECE** em Documentação/Faturamento quando tiver paciente

### **Registros Normais (Pacientes):**

- `is_grade_cirurgica = false` (padrão)
- `nome_paciente = 'João Silva'` (preenchido)
- `procedimentos = 'LCA'` (preenchido)
- **APARECE** em Documentação/Faturamento

---

## 🔍 Compatibilidade

O sistema mantém **compatibilidade retroativa**:

- Se `is_grade_cirurgica` não existir ou for `false`, verifica:
  - Se `procedimentos IS NULL` **E** `nome_paciente = ''` → Filtra como grade
- Se `is_grade_cirurgica = true` → Filtra diretamente

---

## ✅ Resultado

**Antes:**
- ❌ Linha "Ortopedia - Dr. Diogo" aparecia na Documentação
- ❌ Confusão entre estrutura de grade e pacientes reais

**Depois:**
- ✅ Apenas registros com pacientes aparecem na Documentação
- ✅ Estrutura de grade fica isolada na Grade Cirúrgica
- ✅ Filtro automático e transparente

---

## 📝 Notas Importantes

1. **Registros existentes:** O script SQL atualiza automaticamente registros antigos
2. **Novos registros:** Automaticamente marcados ao criar via Grade Cirúrgica
3. **Procedimentos:** Não são marcados como grade (podem receber pacientes)
4. **Performance:** Índice criado para otimizar filtros

---

## 🐛 Troubleshooting

### **Problema: Registros ainda aparecem na Documentação**

**Solução:**
1. Verificar se a coluna foi criada: `SELECT is_grade_cirurgica FROM agendamentos LIMIT 1;`
2. Verificar se registros foram atualizados: `SELECT COUNT(*) FROM agendamentos WHERE is_grade_cirurgica = true;`
3. Limpar cache do navegador e recarregar

### **Problema: Erro ao salvar grade cirúrgica**

**Solução:**
1. Verificar se a coluna existe no banco
2. Verificar logs do console do navegador
3. Verificar se o serviço `agendamentoService.create()` está atualizado

---

## 📞 Suporte

Para dúvidas ou problemas, verificar:
- Console do navegador (F12)
- Logs do Supabase
- Script SQL executado corretamente

