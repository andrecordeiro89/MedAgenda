# 🔧 SOLUÇÃO RÁPIDA: Erro 406 - Not Acceptable

## ❌ **Problema:**
```
GET .../grades_cirurgicas?... 406 (Not Acceptable)
```

## 🔍 **Causa:**
O erro 406 geralmente significa que **as tabelas não existem** no banco de dados do Supabase.

---

## ✅ **SOLUÇÃO PASSO A PASSO:**

### **1️⃣ VERIFICAR SE AS TABELAS EXISTEM**

Execute no **Supabase SQL Editor**:

```sql
-- Verificar tabelas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('metas_especialidades', 'grades_cirurgicas', 'grades_cirurgicas_dias', 'grades_cirurgicas_itens')
ORDER BY tablename;
```

**Resultado esperado:** 4 tabelas  
**Se estiver vazio:** As tabelas não existem! Vá para o passo 2.

---

### **2️⃣ CRIAR AS TABELAS (SE NÃO EXISTEM)**

Execute **NA ORDEM**:

#### **A. Primeiro Script:**
1. Abra `create-metas-especialidades-table.sql`
2. Copie **TODO** o conteúdo
3. Cole no Supabase SQL Editor
4. Execute
5. Aguarde: ✅ `Success`

#### **B. Segundo Script:**
1. Abra `create-grades-cirurgicas-table.sql`
2. Copie **TODO** o conteúdo
3. Cole no Supabase SQL Editor
4. Execute
5. Aguarde: ✅ `Success`

---

### **3️⃣ DESABILITAR RLS TEMPORARIAMENTE (SOLUÇÃO RÁPIDA)**

Se ainda houver problemas de permissão, execute:

```sql
-- Desabilitar RLS temporariamente para testar
ALTER TABLE metas_especialidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_dias DISABLE ROW LEVEL SECURITY;
ALTER TABLE grades_cirurgicas_itens DISABLE ROW LEVEL SECURITY;
```

⚠️ **Nota:** Isso é apenas para desenvolvimento. Em produção, mantenha o RLS habilitado.

---

### **4️⃣ OU CRIAR POLÍTICAS SUPER PERMISSIVAS**

Se quiser manter o RLS habilitado, execute:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir inserção de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir atualização de metas" ON metas_especialidades;
DROP POLICY IF EXISTS "Permitir exclusão de metas" ON metas_especialidades;

DROP POLICY IF EXISTS "Permitir leitura de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir inserção de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir atualização de grades" ON grades_cirurgicas;
DROP POLICY IF EXISTS "Permitir exclusão de grades" ON grades_cirurgicas;

DROP POLICY IF EXISTS "Permitir leitura de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir inserção de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir atualização de dias" ON grades_cirurgicas_dias;
DROP POLICY IF EXISTS "Permitir exclusão de dias" ON grades_cirurgicas_dias;

DROP POLICY IF EXISTS "Permitir leitura de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir inserção de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens" ON grades_cirurgicas_itens;
DROP POLICY IF EXISTS "Permitir exclusão de itens" ON grades_cirurgicas_itens;

-- Criar políticas MUITO permissivas (FOR ALL = tudo)
CREATE POLICY "Permitir tudo metas" ON metas_especialidades
FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir tudo grades" ON grades_cirurgicas
FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir tudo dias" ON grades_cirurgicas_dias
FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir tudo itens" ON grades_cirurgicas_itens
FOR ALL TO public USING (true) WITH CHECK (true);
```

---

### **5️⃣ RECARREGAR A PÁGINA**

Após executar os scripts acima:

1. Pressione `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Isso força o reload completo da página
3. O erro 406 deve desaparecer!

---

## 🎯 **CHECKLIST DE VERIFICAÇÃO:**

Marque cada item após completar:

- [ ] Verifiquei se as tabelas existem (Passo 1)
- [ ] Se não existiam, executei os scripts de criação (Passo 2)
- [ ] Desabilitei RLS OU criei políticas permissivas (Passo 3 ou 4)
- [ ] Recarreguei a página (Passo 5)
- [ ] O erro 406 desapareceu ✅

---

## 🔍 **VERIFICAÇÃO FINAL:**

Execute para confirmar que tudo está OK:

```sql
-- Verificar tabelas criadas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%grade%' OR tablename LIKE '%meta%'
ORDER BY tablename;

-- Verificar políticas criadas
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Resultado esperado:**
- 4 tabelas listadas
- Políticas listadas OU RLS desabilitado (`rowsecurity = false`)

---

## ✅ **Logs Esperados Após Correção:**

```
✅ Médicos encontrados: 18
✅ Procedimentos encontrados: 30
✅ Metas de especialidades: X
✅ Grade carregada (ou "Nenhuma grade encontrada")
```

---

## ❌ **Se Ainda Houver Erro 406:**

1. Verifique o **URL do Supabase** no arquivo `services/supabase.ts`
2. Confirme que você está usando o **projeto correto** no Supabase
3. Tente desabilitar completamente o RLS (Passo 3)
4. Verifique se a **API Key** está correta

---

## 📞 **Sobre a Tabela app_users:**

Você mencionou usar `app_users` com `login` e `senha`. Se quiser integrar autenticação:

```sql
-- Criar tabela app_users (se não existir)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- ⚠️ Use hash em produção!
    nome VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar política para app_users
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir tudo users" ON app_users
FOR ALL TO public USING (true) WITH CHECK (true);
```

---

**Execute o script de verificação `verificar-e-criar-tabelas.sql` primeiro para diagnosticar!** 🚀

