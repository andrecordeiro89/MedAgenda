# 📋 Instruções: Implementação de Grades Cirúrgicas com Persistência no Banco

## ✅ Implementação Completa

Todas as funcionalidades foram implementadas com sucesso! Agora as **Grades Cirúrgicas** estão totalmente integradas com o banco de dados PostgreSQL/Supabase.

---

## 🗄️ **1. Estrutura do Banco de Dados**

### **Arquivo:** `create-grades-cirurgicas-table.sql`

Este script SQL cria toda a estrutura necessária:

#### **Tabelas Criadas:**

1. **`procedimentos`** (atualizada)
   - ✅ Coluna `prefixos TEXT[]` adicionada para armazenar prefixos cirúrgicos

2. **`grades_cirurgicas`**
   - Armazena as grades por hospital, dia da semana e mês
   - Campos: `id`, `hospital_id`, `dia_semana`, `mes_referencia`, `ativa`

3. **`grades_cirurgicas_dias`**
   - Armazena cada dia específico da grade (as 3 ocorrências)
   - Campos: `id`, `grade_id`, `data`, `dia_semana`, `ordem`

4. **`grades_cirurgicas_itens`**
   - Armazena especialidades e procedimentos da grade
   - Campos: `id`, `dia_id`, `tipo`, `especialidade_id`, `procedimento_id`, `texto`, `ordem`, `pacientes`
   - **Array `pacientes`**: Nomes dos pacientes vinculados a cada procedimento

#### **Views Criadas:**

- `vw_grades_cirurgicas_completas`: Grade completa com joins
- `vw_grades_pacientes_por_dia`: Resumo de pacientes por dia
- `vw_prefixos_mais_usados`: Prefixos mais utilizados (para autocomplete)

#### **Funções:**

- `fn_obter_grade_cirurgica()`: Buscar grade completa
- `fn_duplicar_grade_cirurgica()`: Duplicar grade para outro mês

#### **Políticas RLS:**

- ✅ Todas as políticas de Row Level Security habilitadas
- Permissões para `SELECT`, `INSERT`, `UPDATE`, `DELETE`

---

## 🚀 **2. Como Executar o Script SQL**

### **Passo 1: Acessar o Supabase Dashboard**

1. Acesse: [supabase.com](https://supabase.com)
2. Faça login no seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)

### **Passo 2: Executar o Script de Metas**

⚠️ **IMPORTANTE:** Execute este PRIMEIRO se ainda não executou!

1. Clique em **"New Query"**
2. Copie todo o conteúdo de `create-metas-especialidades-table.sql`
3. Cole no editor
4. Clique em **"Run"** (ou pressione `Ctrl + Enter`)
5. Aguarde a mensagem de sucesso: ✅ `Success. No rows returned`

### **Passo 3: Executar o Script de Grades Cirúrgicas**

1. Abra outra nova query
2. Copie todo o conteúdo de `create-grades-cirurgicas-table.sql`
3. Cole e execute
4. Aguarde a confirmação

⚠️ **Nota sobre erros de sintaxe:**
- Se você obteve um erro `syntax error at or near "NOT"`, os scripts já foram corrigidos!
- A sintaxe `CREATE POLICY IF NOT EXISTS` não é suportada no PostgreSQL
- Agora usamos `DROP POLICY IF EXISTS` seguido de `CREATE POLICY`
- Recarregue os arquivos e execute novamente

---

## 📦 **3. Alterações no Código**

### **3.1. Interface `Procedimento` (types.ts)**

```typescript
export interface Procedimento {
    id: string;
    nome: string;
    tipo: TipoAgendamento;
    duracaoEstimada: number;
    descricao: string;
    especialidade?: string;
    especialidadeId?: string;
    hospitalId?: string;
    prefixos?: string[]; // ✅ NOVO: Array de prefixos
}
```

### **3.2. Serviço API (services/api-simple.ts)**

**Novo serviço criado:** `SimpleGradeCirurgicaService`

#### **Métodos disponíveis:**

```typescript
// Buscar grade por hospital, dia da semana e mês
await simpleGradeCirurgicaService.getGrade(hospitalId, diaSemana, mesReferencia);

// Salvar grade completa (criar ou atualizar)
await simpleGradeCirurgicaService.saveGrade(gradeData);

// Listar todas as grades de um hospital
await simpleGradeCirurgicaService.getGradesByHospital(hospitalId);

// Deletar grade
await simpleGradeCirurgicaService.deleteGrade(gradeId);

// Obter prefixos mais usados (para autocomplete)
await simpleGradeCirurgicaService.getPrefixosMaisUsados(20);
```

### **3.3. Modal de Grade Cirúrgica (components/GradeCirurgicaModal.tsx)**

#### **Mudanças:**

✅ **Removido:** `localStorage` (dados temporários)  
✅ **Adicionado:** Integração com banco de dados via API  
✅ **Adicionado:** Estados de `loading` e `saving`  
✅ **Adicionado:** Botão "💾 Salvar Grade"  
✅ **Adicionado:** Indicador de loading ao carregar

#### **Fluxo:**

1. **Ao abrir o modal:** Carrega grade do banco (se existir)
2. **Ao editar:** Alterações ficam em memória (não salva automaticamente)
3. **Ao clicar em "Salvar":** Persiste no banco de dados
4. **Ao fechar:** Alterações não salvas são perdidas

---

## 🎨 **4. Como Usar a Funcionalidade**

### **Passo 1: Acessar o Calendário**

1. Navegue até **"Agenda"** (antes "Calendário")
2. Clique em qualquer dia do mês

### **Passo 2: Abrir a Grade Cirúrgica**

- O modal **"Grade Cirúrgica"** abre automaticamente
- Mostra as **3 próximas ocorrências** do mesmo dia da semana no **próximo mês**
- Exemplo: Clicou em uma segunda (3/11) → Mostra segundas do próximo mês (1/12, 8/12, 15/12)

### **Passo 3: Preencher a Grade**

#### **Adicionar Especialidade:**

1. Clique no botão **"+ Especialidade"** na linha verde (data)
2. Digite o nome (ex: "Ortopedia - Joelho")
3. A especialidade aparece em **azul** com destaque

#### **Adicionar Procedimentos:**

1. Clique no botão **"+ Proc."** na linha azul da especialidade
2. Digite o prefixo do procedimento (ex: "LCA", "MENISCO", "PTJ")
3. O procedimento aparece abaixo da especialidade

#### **Adicionar Pacientes:**

1. Clique no botão **"+"** ao lado do procedimento
2. Digite o nome do paciente
3. O paciente aparece na mesma linha: `LCA - João Silva`
4. Repita para adicionar mais pacientes ao mesmo procedimento

### **Passo 4: Organizar a Grade**

- **Reordenar:** Use os botões ↑ ↓ que aparecem ao passar o mouse
- **Remover item:** Clique no ícone 🗑️ (lixeira)
- **Expandir/Recolher:** Se houver mais de 5 procedimentos, clique em "Ver mais/Ver menos"

### **Passo 5: Replicar para Outros Dias**

1. Configure a grade do **primeiro dia** (ex: 1/12)
2. Clique no botão **"Replicar"** na linha verde
3. A grade é copiada automaticamente para os outros dias (8/12, 15/12)

### **Passo 6: Salvar no Banco**

1. Clique no botão **"💾 Salvar Grade"** (canto inferior esquerdo)
2. Aguarde a mensagem: "Grade salva com sucesso!"
3. A grade agora está persistida no banco de dados

---

## 🔄 **5. Barras de Progresso no Calendário**

### **Como Funciona:**

Após salvar as grades e configurar as metas:

1. O calendário mostra **barras de progresso** em cada dia
2. **Por médico:** Nome + Barra visual
3. **Cores:**
   - 🟢 **Verde:** Meta atingida ou superada
   - 🔴 **Vermelho:** Meta não atingida
4. **Contador:** Ex: `12/10` (12 agendamentos de meta 10)

### **Exemplo Visual:**

```
┌─────────────┐
│      6      │ ← Dia
├─────────────┤
│ Dr. João    │ ← Nome
│ ████████░░  │ ← Verde (12/10) ✓
│   12/10     │
├─────────────┤
│ Dr. Maria   │
│ ███░░░░░░░  │ ← Vermelho (6/15) ✗
│    6/15     │
└─────────────┘
```

---

## 📊 **6. Dados Salvos no Banco**

### **Estrutura JSON (exemplo):**

```json
{
  "hospitalId": "uuid-do-hospital",
  "diaSemana": "segunda",
  "mesReferencia": "2025-12",
  "ativa": true,
  "dias": [
    {
      "data": "2025-12-01",
      "diaSemana": "segunda",
      "ordem": 1,
      "itens": [
        {
          "tipo": "especialidade",
          "texto": "Ortopedia - Joelho",
          "ordem": 0,
          "pacientes": []
        },
        {
          "tipo": "procedimento",
          "texto": "LCA",
          "ordem": 1,
          "pacientes": ["João Silva", "Maria Santos"]
        },
        {
          "tipo": "procedimento",
          "texto": "MENISCO",
          "ordem": 2,
          "pacientes": ["Pedro Costa"]
        }
      ]
    }
  ]
}
```

---

## 🔍 **7. Consultas Úteis (SQL)**

### **Ver todas as grades:**

```sql
SELECT * FROM vw_grades_cirurgicas_completas;
```

### **Ver resumo de pacientes por dia:**

```sql
SELECT * FROM vw_grades_pacientes_por_dia;
```

### **Ver prefixos mais usados:**

```sql
SELECT * FROM vw_prefixos_mais_usados;
```

### **Buscar grade específica:**

```sql
SELECT * FROM fn_obter_grade_cirurgica(
  'uuid-do-hospital',
  'segunda',
  '2025-12'
);
```

---

## ⚠️ **8. Troubleshooting**

### **Erro 401 ao salvar:**

✅ **Solução:** Execute o script SQL para habilitar as políticas RLS

### **Grade não aparece ao abrir o modal:**

1. Abra o console do navegador (F12)
2. Verifique se há erros de API
3. Confirme que o script SQL foi executado corretamente

### **Dados não estão persistindo:**

1. Certifique-se de clicar em **"💾 Salvar Grade"**
2. Verifique se apareceu a mensagem de sucesso
3. Recarregue a página e abra o modal novamente

### **Limpar localStorage antigo:**

Se havia dados no localStorage, limpe:

```javascript
// Abra o console (F12) e execute:
localStorage.clear();
location.reload();
```

---

## 🎯 **9. Próximos Passos (Opcionais)**

### **Melhorias Futuras:**

1. **Autocomplete de Prefixos:**
   - Usar `getPrefixosMaisUsados()` para sugerir prefixos já utilizados

2. **Vincular Procedimentos:**
   - Permitir selecionar procedimentos da tabela `procedimentos`
   - Preencher automaticamente `procedimento_id` e `prefixos`

3. **Relatórios:**
   - Dashboard com estatísticas de grades
   - Gráficos de utilização por especialidade

4. **Duplicação entre Meses:**
   - Botão para duplicar grade de um mês para outro
   - Usar função `fn_duplicar_grade_cirurgica()`

5. **Histórico:**
   - Manter grades antigas (campo `ativa = false`)
   - Permitir visualizar grades passadas

---

## ✨ **10. Resumo da Implementação**

### **Arquivos Criados/Modificados:**

✅ **Criado:** `create-grades-cirurgicas-table.sql` (334 linhas)  
✅ **Modificado:** `types.ts` (adicionado campo `prefixos`)  
✅ **Modificado:** `services/api-simple.ts` (adicionado `SimpleGradeCirurgicaService`)  
✅ **Modificado:** `components/GradeCirurgicaModal.tsx` (integração com banco)  
✅ **Modificado:** `components/CalendarView.tsx` (barras de progresso)  
✅ **Modificado:** `App.tsx` (passar metas para o calendário)  

### **Funcionalidades Implementadas:**

✅ Persistência completa no banco de dados  
✅ Carregamento automático ao abrir o modal  
✅ Salvamento manual com feedback visual  
✅ Estados de loading e saving  
✅ Integração com especialidades  
✅ Array de pacientes por procedimento  
✅ Barras de progresso no calendário  
✅ Views e funções SQL otimizadas  
✅ Políticas RLS configuradas  

---

## 🎉 **Implementação Concluída!**

**Agora você pode:**
- ✅ Configurar grades cirúrgicas
- ✅ Salvar no banco de dados
- ✅ Visualizar barras de progresso
- ✅ Gerenciar especialidades e procedimentos
- ✅ Vincular pacientes aos procedimentos

**Execute o script SQL e teste a funcionalidade!** 🚀

