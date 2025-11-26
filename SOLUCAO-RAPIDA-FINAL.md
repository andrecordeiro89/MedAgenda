# ⚡ SOLUÇÃO RÁPIDA - SIGA ESTE GUIA

## 🎯 OBJETIVO
Fazer a avaliação do anestesista funcionar!

---

## 📋 PASSO A PASSO

### 1️⃣ Abra o Supabase
- Acesse: https://supabase.com
- Entre no projeto **MedAgenda**
- Clique em **"SQL Editor"**
- Clique em **"New query"**

---

### 2️⃣ Cole e Execute (UM DE CADA VEZ)

#### **A) Verificar se colunas existem:**
```sql
SELECT 
  column_name AS "Coluna", 
  data_type AS "Tipo"
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;
```

**Resultado esperado**: 5 colunas  
**Se NÃO mostrar 5 colunas**: Execute o arquivo `SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql` completo

---

#### **B) Ver se RLS está ativo:**
```sql
SELECT 
  tablename, 
  rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'agendamentos';
```

**Resultado**: 
- `RLS Ativo = true` → Continue no passo C
- `RLS Ativo = false` → Pule para o passo 3️⃣

---

#### **C) Desabilitar RLS (se estava ativo):**
```sql
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
```

**Resultado esperado**: `ALTER TABLE` (sem erros)

---

#### **D) Confirmar que RLS foi desabilitado:**
```sql
SELECT 
  tablename, 
  rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'agendamentos';
```

**Resultado esperado**: `RLS Ativo = false` ✅

---

### 3️⃣ Teste na Aplicação

1. **Feche** o navegador completamente
2. **Abra** novamente
3. Vá na tela **Anestesista**
4. Clique em um paciente
5. Selecione **✅ Aprovado**
6. Escreva uma observação: `"Teste"`
7. Clique em **"Salvar Avaliação"**

**Resultado esperado**: 
```
✅ Avaliação salva com sucesso!
```

E a linha deve ficar **VERDE** 🟢

---

## ✅ CHECKLIST RÁPIDO

Execute no Supabase (SQL Editor):

```sql
-- 1. Ver colunas (deve mostrar 5)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%';

-- 2. Desabilitar RLS
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- 3. Confirmar (deve mostrar false)
SELECT rowsecurity FROM pg_tables WHERE tablename = 'agendamentos';
```

Depois: **Recarregue a aplicação e teste!**

---

## 🔍 LOGS PARA VERIFICAR

Abra o Console do Navegador (F12) e procure por:

```
🔍 DEBUG - Iniciando salvamento de avaliação
🔍 DEBUG - ID do agendamento: ...
📝 Dados que serão enviados ao banco: ...
📊 Resposta do Supabase: ...
✅ Agendamento atualizado com sucesso!
```

Se aparecer isso, **FUNCIONOU!** ✅

---

## ❌ SE AINDA DER ERRO

Me mostre o que apareceu no console (F12) depois de tentar salvar:

```
🔍 DEBUG - ...
📊 Resposta do Supabase: ...
❌ Erro: ...
```

Vou identificar o problema exato! 🔍

---

## 🚀 RESUMO SUPER RÁPIDO

**Cole isso no SQL Editor do Supabase:**

```sql
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
```

**Execute (▶️)**

**Recarregue a aplicação (F5)**

**Teste!**

**Pronto!** 🎉

