# 📦 GUIA COMPLETO: Criar Bucket no Supabase

## 🎯 Objetivo
Criar o bucket `documentos-medicos` no Supabase Storage para armazenar documentos médicos.

---

## 📋 PASSO A PASSO DETALHADO

### **PASSO 1: Acessar o Supabase Dashboard**

1. Abra seu navegador e acesse: **https://supabase.com/dashboard**
2. Faça login com sua conta Supabase
3. Na lista de projetos, encontre e clique no projeto:
   - **Nome/ID:** `teidsiqsligaksuwmczt`
   - Ou procure pelo projeto que você está usando

---

### **PASSO 2: Navegar para Storage**

1. No menu lateral esquerdo, procure por **"Storage"**
   - Ícone: 📁 (pasta)
   - Ou procure na lista de opções
2. Clique em **"Storage"**

---

### **PASSO 3: Criar Novo Bucket**

1. Na página de Storage, você verá:
   - Lista de buckets existentes (se houver)
   - Botão **"+ New bucket"** ou **"Create bucket"** (geralmente no topo direito)

2. Clique no botão **"+ New bucket"** ou **"Create bucket"**

---

### **PASSO 4: Preencher Dados do Bucket**

Um modal/formulário aparecerá. Preencha EXATAMENTE assim:

#### **Nome do Bucket:**
```
documentos-medicos
```
⚠️ **IMPORTANTE:** O nome DEVE ser exatamente `documentos-medicos` (minúsculas, com hífen)

#### **Public bucket:**
✅ **MARQUE COMO PÚBLICO** (checkbox)
- Isso permite que os arquivos sejam acessados via URL pública
- Necessário para o sistema funcionar

#### **File size limit (opcional):**
- Deixe o padrão ou defina: `50` MB
- Isso limita o tamanho máximo de cada arquivo

#### **Allowed MIME types (opcional):**
- Deixe vazio para aceitar todos os tipos
- OU adicione (separados por vírgula):
```
application/pdf,image/jpeg,image/png,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

---

### **PASSO 5: Criar o Bucket**

1. Revise os dados:
   - ✅ Nome: `documentos-medicos`
   - ✅ Public bucket: **marcado**
   - ✅ File size limit: definido (opcional)

2. Clique no botão **"Create bucket"** ou **"Save"**

3. Aguarde alguns segundos enquanto o bucket é criado

---

### **PASSO 6: Verificar se o Bucket foi Criado**

1. Você deve ver o bucket `documentos-medicos` na lista de buckets
2. Clique no bucket para abrir
3. Verifique se está marcado como **"Public"**

---

### **PASSO 7: Configurar Políticas (OPCIONAL - se necessário)**

Se o bucket não estiver funcionando, configure as políticas:

1. No bucket `documentos-medicos`, vá em **"Policies"** ou **"RLS Policies"**
2. Clique em **"+ New Policy"**
3. Selecione **"For full customization"**

#### **Criar Política para Upload (INSERT):**
- **Policy name:** `Allow uploads`
- **Allowed operation:** `INSERT`
- **Policy definition:**
```sql
bucket_id = 'documentos-medicos'
```

#### **Criar Política para Leitura (SELECT):**
- **Policy name:** `Allow public read`
- **Allowed operation:** `SELECT`
- **Policy definition:**
```sql
bucket_id = 'documentos-medicos'
```

#### **Criar Política para Deletar (DELETE):**
- **Policy name:** `Allow deletes`
- **Allowed operation:** `DELETE`
- **Policy definition:**
```sql
bucket_id = 'documentos-medicos'
```

---

## ✅ CHECKLIST FINAL

Antes de testar, verifique:

- [ ] Bucket `documentos-medicos` criado
- [ ] Bucket está marcado como **"Public"**
- [ ] Nome está correto: `documentos-medicos` (exatamente assim)
- [ ] Bucket aparece na lista de Storage

---

## 🧪 TESTAR O BUCKET

### **Teste 1: Upload Manual (Opcional)**

1. No Supabase Dashboard → Storage → `documentos-medicos`
2. Clique em **"Upload file"** ou **"Upload"**
3. Selecione um arquivo de teste (PDF, JPG, etc.)
4. Clique em **"Upload"**
5. Se o arquivo aparecer na lista, o bucket está funcionando! ✅

### **Teste 2: Testar na Aplicação**

1. Abra a aplicação MedAgenda
2. Vá para a tela **"Documentação"**
3. Clique em **"📎 Anexar Docs"** em qualquer paciente
4. Selecione um arquivo
5. Clique em **"Anexar Documentos"**
6. Se não aparecer erro, está funcionando! ✅

---

## ❌ RESOLVER PROBLEMAS COMUNS

### **Erro: "Bucket not found"**

**Causa:** O bucket não existe ou o nome está errado.

**Solução:**
1. Verifique se o bucket foi criado
2. Verifique se o nome está exatamente: `documentos-medicos`
3. Verifique se está no projeto correto do Supabase

### **Erro: "Permission denied" ou "Access denied"**

**Causa:** O bucket não está público ou as políticas não estão configuradas.

**Solução:**
1. Vá em Storage → `documentos-medicos` → Settings
2. Marque **"Public bucket"** como `true`
3. Salve as alterações

### **Erro: "File too large"**

**Causa:** O arquivo excede o limite configurado.

**Solução:**
1. Vá em Storage → `documentos-medicos` → Settings
2. Aumente o **"File size limit"**
3. Salve as alterações

---

## 📸 VISUALIZAÇÃO DO PROCESSO

### **Tela 1: Menu Storage**
```
┌─────────────────────────────────────┐
│  Supabase Dashboard                │
├─────────────────────────────────────┤
│  [Storage] ← Clique aqui           │
│  [Database]                         │
│  [Authentication]                   │
│  ...                                │
└─────────────────────────────────────┘
```

### **Tela 2: Lista de Buckets**
```
┌─────────────────────────────────────┐
│  Storage                            │
├─────────────────────────────────────┤
│  [+ New bucket] ← Clique aqui       │
│                                     │
│  (Lista de buckets vazia ou        │
│   com buckets existentes)           │
└─────────────────────────────────────┘
```

### **Tela 3: Formulário de Criação**
```
┌─────────────────────────────────────┐
│  Create new bucket                  │
├─────────────────────────────────────┤
│  Name: [documentos-medicos]         │
│                                     │
│  ☑ Public bucket                    │
│                                     │
│  File size limit: [50] MB           │
│                                     │
│  [Cancel]  [Create bucket] ← Clique │
└─────────────────────────────────────┘
```

### **Tela 4: Bucket Criado**
```
┌─────────────────────────────────────┐
│  Storage                            │
├─────────────────────────────────────┤
│  documentos-medicos  [Public] ✓    │
│                                     │
│  (Bucket criado com sucesso!)       │
└─────────────────────────────────────┘
```

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentação Storage:** https://supabase.com/docs/guides/storage
- **Projeto:** `teidsiqsligaksuwmczt`

---

## 📞 PRECISA DE AJUDA?

Se ainda tiver problemas:

1. **Verifique o console do navegador (F12):**
   - Abra o DevTools (F12)
   - Vá na aba "Console"
   - Procure por erros relacionados a "bucket" ou "storage"

2. **Verifique os logs do Supabase:**
   - Dashboard → Logs
   - Procure por erros relacionados ao Storage

3. **Confirme as credenciais:**
   - Verifique se está usando o projeto correto
   - Verifique se as credenciais em `services/supabase.ts` estão corretas

---

## ✅ PRONTO!

Após seguir todos os passos, o bucket estará criado e funcionando!

**Próximo passo:** Teste na aplicação fazendo upload de um documento.

---

**🎉 Sucesso! O bucket está configurado!**

