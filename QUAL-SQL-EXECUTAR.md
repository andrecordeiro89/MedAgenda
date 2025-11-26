# 🎯 QUAL SQL EXECUTAR? GUIA RÁPIDO

## ❌ SEU ERRO:
```
Agendamento não encontrado ou sem permissão para atualizar
❌ Nenhum dado retornado. Possível problema de permissão RLS
```

---

## ✅ SOLUÇÃO EM 2 PASSOS

### PASSO 1: Criar as Colunas ✅ (VOCÊ JÁ FEZ)
✅ Arquivo: `SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql`

### PASSO 2: Corrigir Permissões ⬅️ **VOCÊ ESTÁ AQUI**

---

## 🚀 ESCOLHA UMA OPÇÃO:

### 🔥 OPÇÃO 1: SUPER RÁPIDA (Recomendada para testar)

**Arquivo**: `SQL-SOLUCAO-RAPIDA-DESABILITAR-RLS.sql`

**O que faz**: Desabilita a segurança RLS (libera tudo)

**Prós**:
- ✅ Mais rápido (1 linha de SQL)
- ✅ Funciona imediatamente
- ✅ Perfeito para desenvolvimento

**Contras**:
- ⚠️ Não deve usar em produção
- ⚠️ Sem controle de permissões

**Quando usar**: Você só quer **testar** se funciona

```sql
-- Cole isso no SQL Editor do Supabase:
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
```

---

### 🔒 OPÇÃO 2: COMPLETA (Recomendada para produção)

**Arquivo**: `SQL-CORRIGIR-PERMISSOES-RLS.sql`

**O que faz**: Cria políticas de segurança corretas

**Prós**:
- ✅ Mantém segurança RLS ativa
- ✅ Controle de permissões
- ✅ Boas práticas

**Contras**:
- ⏱️ Um pouco mais complexo

**Quando usar**: Você quer fazer **do jeito certo**

---

## 📋 MINHA RECOMENDAÇÃO

### 👉 SE VOCÊ ESTÁ TESTANDO:
**Use a OPÇÃO 1** (Desabilitar RLS)
- Mais rápido
- Você testa se funciona
- Pode ativar RLS depois

### 👉 SE JÁ ESTÁ FUNCIONANDO:
**Use a OPÇÃO 2** (Políticas RLS)
- Mantém segurança
- Pronto para produção

---

## 🎬 PASSO A PASSO - OPÇÃO 1 (RÁPIDA)

1. Abra: https://supabase.com
2. Entre no projeto **MedAgenda**
3. Clique em **"SQL Editor"**
4. Clique em **"New query"**
5. Cole:
```sql
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
```
6. Clique em **"Run"** (▶️)
7. **Pronto!** Recarregue a aplicação e teste

---

## 🎬 PASSO A PASSO - OPÇÃO 2 (COMPLETA)

1. Abra: https://supabase.com
2. Entre no projeto **MedAgenda**
3. Clique em **"SQL Editor"**
4. Clique em **"New query"**
5. Abra o arquivo: `SQL-CORRIGIR-PERMISSOES-RLS.sql`
6. Copie TODO o conteúdo (Ctrl + A, Ctrl + C)
7. Cole no SQL Editor (Ctrl + V)
8. Clique em **"Run"** (▶️)
9. Verifique se criou 2 políticas
10. **Pronto!** Recarregue a aplicação e teste

---

## ✅ VERIFICAR SE FUNCIONOU

### No Console do Navegador (F12):
```
✅ Agendamento atualizado com sucesso!
```

### Na Aplicação:
```
✅ Avaliação salva com sucesso!
```

### Na Tabela:
🟢 Linha fica VERDE

---

## 🆘 AINDA NÃO FUNCIONOU?

### 1. Verifique se as colunas existem:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%';
```
**Deve retornar 5 colunas**

### 2. Verifique se RLS está desabilitado (se usou Opção 1):
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'agendamentos';
```
**rowsecurity deve ser FALSE**

### 3. Verifique as políticas (se usou Opção 2):
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'agendamentos';
```
**Deve ter políticas de SELECT e UPDATE**

---

## 📂 ARQUIVOS CRIADOS

```
📁 MedAgenda-4/
├── ✅ SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql (JÁ EXECUTADO)
├── 🔥 SQL-SOLUCAO-RAPIDA-DESABILITAR-RLS.sql (OPÇÃO 1 - RÁPIDA)
├── 🔒 SQL-CORRIGIR-PERMISSOES-RLS.sql (OPÇÃO 2 - COMPLETA)
├── 📖 RESOLVER-ERRO-PERMISSAO-RLS.md (Guia detalhado)
└── 📖 QUAL-SQL-EXECUTAR.md (Este arquivo)
```

---

## 💡 RESUMÃO

1. ✅ Você já criou as colunas
2. ⚠️ Agora precisa corrigir permissões
3. 🔥 **OPÇÃO 1**: 1 linha SQL (desabilita RLS) → Rápido
4. 🔒 **OPÇÃO 2**: Script completo (cria políticas) → Seguro
5. 🎯 **Escolha uma e execute!**

**Vai funcionar!** 🚀

