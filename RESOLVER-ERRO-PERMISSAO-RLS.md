# 🔒 RESOLVER ERRO DE PERMISSÃO RLS

## ❌ ERRO ATUAL

```
Agendamento não encontrado ou sem permissão para atualizar
❌ Nenhum dado retornado. Possível problema de permissão RLS ou ID inválido.
```

---

## 🎯 CAUSA DO PROBLEMA

O **RLS (Row Level Security)** do Supabase está **bloqueando o UPDATE** na tabela `agendamentos`.

### O que é RLS?
É um sistema de segurança que controla quem pode fazer o quê em cada tabela.

---

## ✅ SOLUÇÃO RÁPIDA

### 1️⃣ Execute o Script de Permissões

**Arquivo**: `SQL-CORRIGIR-PERMISSOES-RLS.sql`

1. Abra o Supabase (https://supabase.com)
2. Vá em **"SQL Editor"**
3. Clique em **"New query"**
4. **Cole o conteúdo** do arquivo `SQL-CORRIGIR-PERMISSOES-RLS.sql`
5. Clique em **"Run"** (▶️)

### 2️⃣ Verifique o Resultado

Você deve ver **2 políticas** criadas:

```
✅ Permitir SELECT em agendamentos... | SELECT | PERMISSIVE
✅ Permitir UPDATE em agendamentos... | UPDATE | PERMISSIVE
```

### 3️⃣ Teste na Aplicação

1. **Recarregue** a aplicação (F5)
2. Vá na tela **Anestesista**
3. Tente **salvar uma avaliação** novamente
4. **Sucesso!** ✅

---

## 🔍 O QUE O SCRIPT FAZ

### Remove Políticas Antigas (que podem estar conflitando):
```sql
DROP POLICY IF EXISTS "Permitir UPDATE em agendamentos"
DROP POLICY IF EXISTS "Allow UPDATE on agendamentos"
DROP POLICY IF EXISTS "Enable update for authenticated users"
```

### Cria Políticas Novas (permitindo UPDATE):
```sql
CREATE POLICY "Permitir UPDATE em agendamentos para usuários autenticados"
  ON agendamentos
  FOR UPDATE
  TO authenticated
  USING (true)      -- Pode ler qualquer linha
  WITH CHECK (true) -- Pode atualizar qualquer linha
```

---

## 📊 DIAGNÓSTICO COMPLETO

Se ainda tiver problemas, execute este SQL para diagnóstico:

```sql
-- Ver todas as políticas
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'agendamentos';

-- Ver se RLS está habilitado
SELECT 
  tablename,
  rowsecurity AS "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'agendamentos';
```

---

## 🚨 CENÁRIOS POSSÍVEIS

### Cenário 1: RLS Desabilitado
```
RLS Ativo: false
```
**Solução**: Nenhuma! Se RLS está desabilitado, o UPDATE deveria funcionar.

### Cenário 2: RLS Habilitado SEM Política de UPDATE ❌
```
RLS Ativo: true
Políticas: SELECT (sim), UPDATE (não)
```
**Solução**: Execute o script `SQL-CORRIGIR-PERMISSOES-RLS.sql`

### Cenário 3: RLS Habilitado COM Política Restritiva ❌
```
RLS Ativo: true
Políticas: UPDATE existe, mas com condição que bloqueia
```
**Solução**: Execute o script para RECRIAR a política

---

## 🔐 SEGURANÇA

### Para Desenvolvimento (ATUAL):
```sql
USING (true)      -- Permite tudo
WITH CHECK (true) -- Permite tudo
```
✅ **Perfeito para testar**

### Para Produção (FUTURO):
```sql
USING (hospital_id = auth.uid())      -- Só seu hospital
WITH CHECK (hospital_id = auth.uid()) -- Só seu hospital
```
⚠️ **Ajuste quando for para produção**

---

## ✅ CHECKLIST DE RESOLUÇÃO

- [ ] Executei o script `SQL-CRIAR-COLUNAS-AVALIACAO-ANESTESISTA.sql`
- [ ] Executei o script `SQL-CORRIGIR-PERMISSOES-RLS.sql`
- [ ] Vi 2 políticas criadas (SELECT e UPDATE)
- [ ] Recarreguei a aplicação (F5)
- [ ] Testei salvar uma avaliação
- [ ] **FUNCIONOU!** ✅

---

## 💡 DICA

Se você vir no console do navegador:

```
📝 Dados que serão enviados ao banco: {...}
📝 ID do agendamento: abc-123-def
✅ Agendamento atualizado com sucesso!
```

Significa que **FUNCIONOU!** 🎉

Se ainda aparecer:

```
❌ Nenhum dado retornado. Possível problema de permissão RLS...
```

Execute o script de permissões novamente e verifique se as políticas foram realmente criadas.

---

## 📞 TROUBLESHOOTING

### Erro: "insufficient privilege"
**Causa**: Você não é admin no Supabase  
**Solução**: Use a conta de administrador

### Erro: "policy already exists"
**Causa**: A política já existe  
**Solução**: Execute o DROP POLICY antes (está no script)

### Erro persiste depois do script
**Causa**: Cache ou políticas conflitantes  
**Solução**: 
1. Desabilite RLS temporariamente:
   ```sql
   ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
   ```
2. Teste se funciona
3. Se funcionar, reabilite e recrie as políticas:
   ```sql
   ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
   -- Execute o script de permissões novamente
   ```

---

## ✅ RESULTADO ESPERADO

Depois de executar o script, você deve conseguir:
- ✅ Clicar em **Aprovado** ✅
- ✅ Escrever uma **observação**
- ✅ Clicar em **"Salvar Avaliação"**
- ✅ Ver o alert **"✅ Avaliação salva com sucesso!"**
- ✅ Ver a linha ficar **VERDE** 🟢

**Pronto!** 🚀

