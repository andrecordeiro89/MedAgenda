# 🔧 Troubleshooting - Importação de Médicos via Excel

## ❌ Problema: "Não foi possível identificar as colunas do Excel"

### Causa
O sistema não conseguiu encontrar as colunas esperadas (`nome`, `cns`, `especialidade`, `id`) no seu arquivo Excel.

### Solução Passo a Passo

#### 1. Verifique o Console do Navegador
- Pressione **F12** no navegador
- Vá para a aba **Console**
- Procure por estas mensagens:
  ```
  🔍 Colunas encontradas no Excel: ["...", "...", "..."]
  ```

#### 2. Compare as Colunas
As colunas que o sistema encontrou devem ser **exatamente**:
- `nome` (ou `NOME`, `Nome`)
- `cns` (ou `CNS`, `Cns`)
- `especialidade` (ou `ESPECIALIDADE`, `Especialidade`)
- `id` (ou `ID`, `Id`)

#### 3. Problemas Comuns e Soluções

##### Problema A: Linhas vazias antes do cabeçalho
❌ **Excel Incorreto:**
```
Linha 1: [vazia]
Linha 2: [vazia]
Linha 3: nome | cns | especialidade | id
Linha 4: João Silva | ...
```

✅ **Excel Correto:**
```
Linha 1: nome | cns | especialidade | id
Linha 2: João Silva | ...
```

**Como corrigir:**
1. Abra o Excel
2. Selecione as linhas vazias acima do cabeçalho
3. Clique com botão direito → "Excluir"
4. Salve o arquivo

##### Problema B: Título acima do cabeçalho
❌ **Excel Incorreto:**
```
Linha 1: PLANILHA DE MÉDICOS - 2024
Linha 2: nome | cns | especialidade | id
Linha 3: João Silva | ...
```

✅ **Excel Correto:**
```
Linha 1: nome | cns | especialidade | id
Linha 2: João Silva | ...
```

**Como corrigir:**
1. Delete a linha do título
2. Certifique-se de que o cabeçalho está na linha 1

##### Problema C: Nomes de colunas diferentes
❌ **Excel Incorreto:**
```
nome_completo | cartao_sus | area_medica | hospital
```

✅ **Excel Correto:**
```
nome | cns | especialidade | id
```

**Como corrigir:**
1. Renomeie as colunas para os nomes esperados
2. Não use underscore (_) ou espaços nos nomes

##### Problema D: Espaços extras nos nomes das colunas
❌ **Excel pode ter:**
```
"  nome  " | " cns " | "especialidade " | " id"
```

✅ **Solução:**
O sistema agora remove espaços automaticamente, mas se ainda assim não funcionar:
1. Clique no cabeçalho da coluna
2. Pressione F2 para editar
3. Delete espaços extras manualmente

##### Problema E: Caracteres especiais invisíveis
**Sintomas:** Os nomes parecem corretos mas não funcionam

**Solução:**
1. Delete os nomes das colunas
2. Digite-os novamente manualmente (não copie/cole)
3. Use apenas letras sem acentos: `especialidade` não `especialidadê`

#### 4. Teste com o Template

Use o arquivo de exemplo fornecido:
- `template-importacao-medicos.csv`

**Como usar:**
1. Abra o template no Excel
2. Adicione seus dados nas linhas abaixo do cabeçalho
3. Salve como `.xlsx`
4. Tente importar novamente

#### 5. Recrie o Excel do Zero

Se nada funcionar, crie um novo arquivo:

1. **Abra o Excel em branco**
2. **Na célula A1**, digite: `nome`
3. **Na célula B1**, digite: `cns`
4. **Na célula C1**, digite: `especialidade`
5. **Na célula D1**, digite: `id`
6. **Na linha 2**, adicione os dados do primeiro médico
7. **Salve como** `.xlsx`

#### 6. Formato das Células

Certifique-se de que todas as células estão no formato correto:

1. Selecione todas as células (Ctrl+A)
2. Clique com botão direito → "Formatar Células"
3. Escolha **"Geral"**
4. Clique OK
5. Salve o arquivo

## ❌ Problema: Colunas encontradas mas dados não aparecem

### Verifique o Console
Procure por mensagens como:
```
📝 Linha 2: { nome: '', cns: '', especialidade: '', id: '' }
```

Se os valores estão vazios, pode ser:

1. **As células estão realmente vazias**
   - Verifique se você preencheu os dados

2. **Formato de número no ID**
   - Se o ID do hospital está como número científico (5.5e+35)
   - Solução: Formate a coluna `id` como "Texto"

3. **Dados em outras abas**
   - O sistema só lê a primeira aba
   - Mova seus dados para a primeira aba

## ❌ Problema: "permission denied for table medicos"

### Causa
Falta de permissão no Supabase

### Solução
Execute no Supabase SQL Editor:

```sql
-- Permitir INSERT
CREATE POLICY "Permitir insert de médicos"
ON medicos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT
CREATE POLICY "Permitir leitura de médicos"
ON medicos FOR SELECT
TO anon, authenticated
USING (true);
```

## 📋 Checklist de Verificação

Antes de importar, confirme:

- [ ] O arquivo é .xlsx ou .xls
- [ ] A primeira linha contém: `nome`, `cns`, `especialidade`, `id`
- [ ] Não há linhas vazias antes do cabeçalho
- [ ] Não há títulos acima do cabeçalho
- [ ] Os dados começam na linha 2
- [ ] Todas as células têm valores
- [ ] A coluna `id` contém UUIDs válidos dos hospitais
- [ ] O formato das células é "Geral" ou "Texto"

## 🆘 Debug Avançado

Se ainda não funcionar:

1. **Abra o Console (F12)**
2. **Faça o upload do arquivo**
3. **Copie TODAS as mensagens do console**
4. **Envie para análise**

Mensagens importantes para copiar:
```
📊 Dados lidos do Excel: [...]
🔍 Colunas encontradas no Excel: [...]
📝 Linha 2: {...}
✅ Dados mapeados: [...]
```

## 📞 Última Alternativa

Se nada funcionar, tente:

1. **Salve o Excel como CSV**
   - Arquivo → Salvar Como → "CSV (separado por vírgulas)"
   
2. **Abra o CSV em um editor de texto**
   - Notepad, VS Code, etc.
   
3. **Verifique se está assim:**
   ```
   nome,cns,especialidade,id
   João Silva,123456789012345,Cardiologia,550e8400-e29b-41d4-a716-446655440001
   ```

4. **Abra novamente no Excel e salve como .xlsx**

---

**Última atualização**: 2024

