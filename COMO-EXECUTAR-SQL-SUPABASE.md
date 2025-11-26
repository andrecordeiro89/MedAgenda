# 🚀 COMO EXECUTAR O SQL NO SUPABASE

## 📋 PASSO A PASSO

### 1️⃣ Abra o Supabase
1. Acesse: https://supabase.com
2. Faça login
3. Selecione seu projeto **MedAgenda**

### 2️⃣ Abra o SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone 📝)
2. Clique em **"New query"** (Nova consulta)

### 3️⃣ Cole o Script
1. Abra o arquivo: `SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql`
2. **Copie TODO o conteúdo** (Ctrl + A, depois Ctrl + C)
3. **Cole** no SQL Editor do Supabase (Ctrl + V)

### 4️⃣ Execute o Script
1. Clique no botão **"Run"** (▶️) no canto inferior direito
2. Aguarde a execução (deve levar 1-2 segundos)

### 5️⃣ Verifique o Resultado
Você deve ver uma tabela com **5 linhas** mostrando as colunas criadas:

```
┌──────────────────────────────────────────┬─────────────┬──────────────┐
│ Coluna                                   │ Tipo        │ Aceita NULL  │
├──────────────────────────────────────────┼─────────────┼──────────────┤
│ avaliacao_anestesista                    │ VARCHAR(50) │ YES          │
│ avaliacao_anestesista_observacao         │ TEXT        │ YES          │
│ avaliacao_anestesista_motivo_reprovacao  │ TEXT        │ YES          │
│ avaliacao_anestesista_complementares     │ TEXT        │ YES          │
│ avaliacao_anestesista_data               │ TIMESTAMPTZ │ YES          │
└──────────────────────────────────────────┴─────────────┴──────────────┘
```

---

## ✅ CONFIRMAÇÃO

Se você viu as **5 colunas** listadas, **SUCESSO!** 🎉

Agora você pode:
- ✅ Voltar para a aplicação
- ✅ Testar a funcionalidade de avaliação do anestesista
- ✅ Inserir observações sem erros

---

## ❌ SE DER ERRO

### Erro: "relation agendamentos does not exist"
**Problema**: A tabela `agendamentos` não existe no banco  
**Solução**: Verifique se você está no projeto correto

### Erro: "permission denied"
**Problema**: Seu usuário não tem permissão para alterar a estrutura  
**Solução**: Use o usuário administrador do Supabase

### Erro: "column already exists"
**Problema**: As colunas já foram criadas antes  
**Solução**: Tudo certo! Pode usar normalmente

---

## 🔍 VERIFICAR SE JÁ EXISTE

Se você não tem certeza se as colunas já existem, execute apenas esta parte:

```sql
SELECT 
  column_name AS "Coluna", 
  data_type AS "Tipo"
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name LIKE 'avaliacao_anestesista%'
ORDER BY ordinal_position;
```

- **Se retornar 5 linhas**: Colunas já existem ✅
- **Se retornar vazio**: Execute o script completo

---

## 📸 SCREENSHOTS DO PROCESSO

### Onde fica o SQL Editor:
```
┌──────────────────────────────────────────┐
│ 🏠 Home                                  │
│ 📊 Table Editor                          │
│ 🔍 SQL Editor    ← CLIQUE AQUI          │
│ 🔐 Authentication                        │
│ 💾 Storage                               │
└──────────────────────────────────────────┘
```

### Botão RUN:
```
┌──────────────────────────────────────────┐
│ [SQL query editor]                       │
│                                          │
│ SELECT * FROM ...                        │
│                                          │
│              [Save] [▶️ Run] ← CLIQUE    │
└──────────────────────────────────────────┘
```

---

## ✅ PRONTO!

Após executar o script, **recarregue a aplicação** e teste novamente! 🚀

