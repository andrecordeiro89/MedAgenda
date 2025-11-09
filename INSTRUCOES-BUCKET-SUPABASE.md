# 📦 Instruções para Criar o Bucket no Supabase

## 🎯 Objetivo
Criar um bucket no Supabase Storage para armazenar os documentos médicos (exames, fichas pré-anestésicas, etc.) de forma organizada por paciente.

---

## 📋 Passo a Passo

### **1. Acessar o Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `teidsiqsligaksuwmczt`

---

### **2. Criar o Bucket**

1. No menu lateral, clique em **"Storage"** (ícone de pasta)
2. Clique no botão **"+ New bucket"** ou **"Create bucket"**
3. Preencha os dados:
   - **Name:** `documentos-medicos`
   - **Public bucket:** ✅ **MARQUE COMO PÚBLICO** (para permitir acesso aos arquivos)
   - **File size limit:** `50 MB` (ou o tamanho máximo desejado)
   - **Allowed MIME types:** Deixe vazio (aceita todos) ou adicione:
     ```
     application/pdf,image/jpeg,image/png,image/jpg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```
4. Clique em **"Create bucket"**

---

### **3. Configurar Políticas de Acesso (RLS)**

Para permitir que a aplicação faça upload e leia os arquivos:

1. No bucket criado, vá em **"Policies"** (ou "RLS Policies")
2. Clique em **"+ New Policy"**
3. Selecione **"For full customization"**
4. Crie as seguintes políticas:

#### **Política 1: Permitir Upload (INSERT)**
```sql
-- Nome: Allow authenticated uploads
-- Operation: INSERT
-- Policy definition:
(
  bucket_id = 'documentos-medicos'::text
)
```

#### **Política 2: Permitir Leitura (SELECT)**
```sql
-- Nome: Allow public read
-- Operation: SELECT
-- Policy definition:
(
  bucket_id = 'documentos-medicos'::text
)
```

#### **Política 3: Permitir Atualização (UPDATE)**
```sql
-- Nome: Allow authenticated update
-- Operation: UPDATE
-- Policy definition:
(
  bucket_id = 'documentos-medicos'::text
)
```

#### **Política 4: Permitir Exclusão (DELETE)**
```sql
-- Nome: Allow authenticated delete
-- Operation: DELETE
-- Policy definition:
(
  bucket_id = 'documentos-medicos'::text
)
```

**OU** (mais simples, mas menos seguro):

1. Vá em **"Settings"** do bucket
2. Marque **"Public bucket"** como `true`
3. Isso permite acesso público aos arquivos (adequado para documentos médicos com controle de acesso na aplicação)

---

### **4. Estrutura de Pastas**

O sistema criará automaticamente a seguinte estrutura:

```
documentos-medicos/
  ├── documentos/
  │   ├── {agendamento_id_1}/
  │   │   ├── arquivo1.pdf
  │   │   ├── arquivo2.jpg
  │   │   └── ...
  │   ├── {agendamento_id_2}/
  │   │   ├── arquivo1.pdf
  │   │   └── ...
  │   └── ...
```

**Cada paciente (agendamento) terá sua própria pasta**, facilitando a organização e o acesso.

---

### **5. Verificar Configuração**

1. No Supabase Dashboard, vá em **Storage** → **documentos-medicos**
2. Verifique se o bucket está **público**
3. Teste fazendo upload de um arquivo manualmente (opcional)

---

## ✅ Checklist

- [ ] Bucket `documentos-medicos` criado
- [ ] Bucket configurado como **público**
- [ ] Políticas de acesso configuradas (ou bucket público)
- [ ] Tamanho máximo de arquivo definido (recomendado: 50 MB)
- [ ] Tipos de arquivo permitidos configurados (opcional)

---

## 🔒 Segurança

**Importante:** Como os documentos médicos são sensíveis:

1. **Recomendação:** Mantenha o bucket **privado** e use **Service Role Key** para uploads
2. **Alternativa:** Use bucket público, mas implemente autenticação na aplicação
3. **URLs:** As URLs geradas são públicas, então considere:
   - Usar URLs assinadas (com expiração)
   - Implementar autenticação na aplicação
   - Usar Row Level Security (RLS) no Supabase

---

## 🧪 Teste

Após criar o bucket, teste na aplicação:

1. Acesse a tela **"Documentação"**
2. Clique em **"📎 Anexar Docs"** em qualquer paciente
3. Selecione um arquivo
4. Clique em **"Anexar Documentos"**
5. Verifique se o upload funciona e o arquivo aparece na lista

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase Dashboard → Logs
3. Confirme que o nome do bucket está correto: `documentos-medicos`
4. Verifique as políticas de acesso do bucket

---

**Pronto! O bucket está configurado e pronto para uso! 🎉**

