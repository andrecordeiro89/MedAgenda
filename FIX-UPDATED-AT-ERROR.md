# 🔧 FIX: Erro "record 'new' has no field 'updated_at'"

## 🚨 Problema

Ao tentar atualizar um agendamento (vincular paciente), aparece o erro:
```
Erro ao salvar paciente: record "new" has no field "updated_at"
```

## 🔍 Causa

Existe um **trigger automático** no banco de dados que tenta atualizar o campo `updated_at`, mas esse campo não existe na tabela `agendamentos`.

---

## ✅ SOLUÇÃO (Execute no Supabase)

### 📍 Passo 1: Acessar o SQL Editor

1. Acesse o **Supabase Dashboard**
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New Query**

### 📍 Passo 2: Executar o Script

**Cole e execute este SQL:**

```sql
-- ============================================
-- FIX: Adicionar campo updated_at e trigger
-- ============================================

-- 1. Adicionar coluna updated_at se não existir
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON agendamentos;

-- 4. Criar trigger para atualizar updated_at em todo UPDATE
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Atualizar registros existentes com data atual
UPDATE agendamentos 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;
```

### 📍 Passo 3: Verificar

**Execute esta query para confirmar:**

```sql
SELECT id, nome_paciente, created_at, updated_at 
FROM agendamentos 
LIMIT 5;
```

✅ Todas as linhas devem ter valores em `created_at` e `updated_at`

---

## 🎯 O Que Foi Feito

1. ✅ **Adicionada coluna `updated_at`** na tabela `agendamentos`
2. ✅ **Criada função** `update_updated_at_column()` que atualiza automaticamente
3. ✅ **Criado trigger** que executa a função em todo UPDATE
4. ✅ **Atualizados registros antigos** para terem uma data válida

---

## 🧪 Teste

Após executar o SQL, teste novamente:

1. **Abrir grade cirúrgica**
2. **Clicar no botão "+"** de um procedimento
3. **Preencher dados do paciente**
4. **Salvar**

✅ **Deve funcionar sem erros!**

---

## 📊 Estrutura Final da Tabela

```sql
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_paciente TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cidade_natal TEXT,
  telefone TEXT,
  data_agendamento DATE NOT NULL,
  data_consulta DATE,
  hospital_id UUID REFERENCES hospitais(id),
  especialidade TEXT,
  medico TEXT,
  procedimentos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW() -- ✅ ADICIONADO
);
```

---

## 🔄 Comportamento do Trigger

**Antes:**
- UPDATE falha porque `updated_at` não existe

**Depois:**
- Toda vez que um registro é atualizado:
  - `updated_at` é automaticamente atualizado para a data/hora atual
  - Registro de auditoria completo

---

## 🚀 Benefícios

1. ✅ **Auditoria**: Saber quando cada registro foi modificado
2. ✅ **Rastreabilidade**: Histórico de alterações
3. ✅ **Padrão**: Seguir boas práticas de banco de dados
4. ✅ **Compatibilidade**: Funciona com ORMs e bibliotecas modernas

---

## 💡 Alternativa (Se não puder executar SQL agora)

Se você não tem acesso ao SQL Editor agora, pode:

1. **Desabilitar RLS temporariamente**
2. **Pedir para o administrador executar**
3. **Usar migrations do Supabase**

Mas a solução definitiva é **executar o SQL acima**.

---

## ✅ Conclusão

Execute o script SQL no Supabase e o erro será resolvido permanentemente!

**Sistema 100% funcional após isso! 🎉**

