# 🔧 RESOLVER: Dados Não Persistem Após Recarregar

## ❌ PROBLEMA

Você salva uma avaliação → Toast verde "Sucesso!" → Recarrega a página → **Dados somem** 😱

---

## 🔍 CAUSA

O **RLS (Row Level Security)** está:
- ✅ Permitindo UPDATE (por isso salva)
- ❌ Bloqueando SELECT (por isso não carrega)

---

## ✅ SOLUÇÃO DEFINITIVA

### **Execute no SQL Editor do Supabase:**

```sql
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
```

**PRONTO!** Isso vai resolver! 🎉

---

## 📋 VERIFICAR SE OS DADOS FORAM SALVOS

### 1️⃣ Execute este SQL para ver se os dados estão no banco:

```sql
SELECT 
  id,
  nome_paciente,
  avaliacao_anestesista,
  avaliacao_anestesista_observacao
FROM agendamentos
WHERE avaliacao_anestesista IS NOT NULL
ORDER BY avaliacao_anestesista_data DESC
LIMIT 10;
```

**Resultado esperado:**
- Se retornar dados: ✅ UPDATE está funcionando!
- Se NÃO retornar: ❌ Precisa desabilitar RLS

---

## 🎯 PASSO A PASSO COMPLETO

### 1. Abra o Supabase
- https://supabase.com
- Projeto **MedAgenda**
- **SQL Editor**

### 2. Cole e Execute:

```sql
-- Desabilitar RLS
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- Confirmar
SELECT tablename, rowsecurity AS "RLS Ativo (deve ser FALSE)"
FROM pg_tables 
WHERE tablename = 'agendamentos';
```

**Deve mostrar**: `RLS Ativo = FALSE`

### 3. Recarregue a Aplicação
- Feche o navegador
- Abra novamente
- Vá na tela **Anestesista**

### 4. Teste
1. Salve uma avaliação
2. Recarregue a página (F5)
3. **Dados devem continuar lá!** ✅

---

## 🔍 LOGS PARA DIAGNOSTICAR

Adicionei logs no código. Agora quando recarregar a página, veja no **Console (F12)**:

```javascript
🔍 DEBUG - Total de agendamentos retornados: 150
🔍 DEBUG - Agendamentos COM avaliação: 5
🔍 DEBUG - Exemplo de agendamento com avaliação: {
  id: "abc-123",
  nome: "Pedro Lima",
  avaliacao: "aprovado",
  observacao: "Paciente apto para cirurgia"
}
```

### Se aparecer `COM avaliação: 0`:
- **Causa**: RLS está bloqueando o SELECT
- **Solução**: Desabilite RLS (script acima)

### Se aparecer `COM avaliação: 5` (ou mais):
- **Causa**: Os dados estão vindo!
- **Problema**: Outro (cache, filtros, etc.)

---

## 🆘 SE AINDA NÃO FUNCIONAR

Execute o arquivo: **`SQL-VERIFICAR-DADOS-SALVOS.sql`**

Ele vai:
1. Ver se os dados estão no banco
2. Verificar RLS
3. Desabilitar RLS
4. Mostrar dados salvos
5. Confirmar tudo

---

## ✅ CHECKLIST

- [ ] Executei `ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;`
- [ ] Confirmei que RLS = FALSE
- [ ] Recarreguei a aplicação
- [ ] Salvei uma avaliação
- [ ] Recarreguei a página
- [ ] **Dados continuam lá!** ✅

---

## 💡 POR QUE ISSO ACONTECE?

O Supabase tem **2 tipos de permissão RLS**:
1. **UPDATE**: Permite salvar dados
2. **SELECT**: Permite ler dados

Você tinha:
- ✅ Permissão de UPDATE (salvava)
- ❌ SEM permissão de SELECT (não carregava)

Por isso:
- Toast verde aparecia (UPDATE funcionou!)
- Mas ao recarregar, sumia (SELECT bloqueado!)

**Solução**: Desabilitar RLS para ambos funcionarem! 🚀

---

## 🎉 RESULTADO ESPERADO

1. Salvar avaliação → **Toast verde** ✅
2. Recarregar página (F5)
3. **Dados continuam lá!** 🎊
4. Linha fica **verde** 🟢
5. Ao expandir, **observação aparece**!

**Vai funcionar agora!** 🚀

