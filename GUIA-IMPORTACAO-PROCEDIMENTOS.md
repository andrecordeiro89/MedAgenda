# 📋 Guia de Importação de Procedimentos via Excel

## 🎯 Objetivo

Este guia explica como importar procedimentos em massa para o sistema MedAgenda usando um arquivo Excel.

## 📊 Formato do Excel

O arquivo Excel deve conter a seguinte coluna (exatamente com esse nome):

| Coluna | Descrição | Obrigatório | Exemplo |
|--------|-----------|-------------|---------|
| `procedimentos` | Nome do procedimento | Sim | Consulta Ambulatorial |

### 💡 Dicas Importantes para Preparar o Excel

1. **Nome da Coluna**: Pode ser em MAIÚSCULAS ou minúsculas
   - ✅ Aceito: `procedimentos`, `PROCEDIMENTOS`, `Procedimentos`
   - ✅ Aceito: `procedimento`, `PROCEDIMENTO`, `Procedimento`

2. **Formato das Células**: Use "Geral" ou "Texto"
   - Selecione todas as células → Botão direito → Formatar Células → "Geral"

3. **Primeira Linha**: Deve conter o cabeçalho (nome da coluna)
   - ❌ Não deixe linhas vazias antes do cabeçalho
   - ❌ Não coloque títulos acima do cabeçalho

4. **Vínculo Automático**: Todos os procedimentos serão vinculados ao hospital do usuário logado
   - Não é necessário informar o hospital_id

5. **Campos Padrão**: Os seguintes campos serão preenchidos automaticamente:
   - **Tipo**: `ambulatorial` (pode ser alterado depois para `cirurgico`)
   - **Duração**: `30 minutos` (pode ser alterado depois)
   - **Descrição**: vazio (pode ser preenchido depois)
   - **Especialidade**: vazio (pode ser preenchido depois)

### 📋 Estrutura Correta do Excel

```
LINHA 1 (cabeçalho):  procedimentos
LINHA 2 (dados):      Consulta Ambulatorial
LINHA 3 (dados):      Exame de Sangue
LINHA 4 (dados):      Raio-X de Tórax
```

❌ **Estrutura INCORRETA** (não faça assim):
```
LINHA 1: Lista de Procedimentos    ← Não coloque título
LINHA 2: (vazia)                    ← Não deixe linhas vazias
LINHA 3: procedimentos              ← Cabeçalho deve estar na linha 1
```

## 📝 Exemplo de Excel

```
procedimentos
Consulta Ambulatorial
Exame de Sangue
Raio-X de Tórax
Ultrassonografia Abdominal
Eletrocardiograma
Consulta de Retorno
Curativo Simples
Aplicação de Injeção
```

## 🚀 Como Importar

1. **Acesse a tela de Gerenciamento**
2. **Vá para a aba "Procedimentos"**
3. **Clique no botão "Importar Excel"** (botão verde no canto superior direito)
4. **Selecione seu arquivo Excel** (.xlsx ou .xls)
5. **Revise o preview dos dados** - o sistema mostrará todos os registros que serão importados
6. **Verifique se há erros** - linhas com erro aparecerão em vermelho com a descrição do problema
7. **Clique em "Importar"** para iniciar a importação
8. **Acompanhe o progresso** - cada linha será processada e seu status atualizado em tempo real

## ✅ Validações Realizadas

O sistema verifica automaticamente:

- ✓ Nome do procedimento não pode estar vazio
- ✓ Hospital_id é preenchido automaticamente (do usuário logado)
- ✓ Tipo e duração são definidos como padrão

## 📊 Durante a Importação

- **Status Pendente (⏳)**: Aguardando processamento
- **Status Sucesso (✅)**: Procedimento importado com sucesso
- **Status Erro (❌)**: Houve um problema (passe o mouse sobre para ver detalhes)

## 🎨 Campos que Podem ser Editados Depois

Após a importação, você pode editar os procedimentos para ajustar:

1. **Tipo**: Alterar de "ambulatorial" para "cirurgico"
2. **Duração**: Ajustar o tempo estimado em minutos
3. **Descrição**: Adicionar detalhes sobre o procedimento
4. **Especialidade**: Vincular a uma especialidade médica

**Como editar:**
1. Acesse a lista de procedimentos (na própria aba)
2. Clique no ícone de edição (✏️) do procedimento
3. Ajuste os campos desejados
4. Salve

## ⚡ Dicas

- **Prepare o Excel com cuidado**: Verifique todos os dados antes de importar
- **Teste com poucos registros**: Importe 2-3 procedimentos primeiro para validar o processo
- **Nomes claros**: Use nomes descritivos para os procedimentos
- **Evite duplicatas**: Verifique se o procedimento já existe antes de importar

## 🐛 Problemas Comuns

### "Nome do procedimento é obrigatório"
**Causa**: A célula da coluna `procedimentos` está vazia  
**Solução**: Preencha o nome do procedimento

### "Não foi possível identificar a coluna do Excel"
**Causa**: A coluna não se chama "procedimentos"  
**Solução**: Renomeie o cabeçalho para "procedimentos"

### "permission denied for table procedimentos"
**Causa**: O usuário do Supabase não tem permissão de escrita  
**Solução**: Configure as policies corretas no Supabase (veja seção abaixo)

## 🔐 Configuração de Permissões no Supabase

Execute estas queries no Supabase SQL Editor para permitir a importação:

```sql
-- Permitir INSERT na tabela procedimentos
CREATE POLICY "Permitir insert de procedimentos"
ON procedimentos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT na tabela procedimentos
CREATE POLICY "Permitir leitura de procedimentos"
ON procedimentos FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir UPDATE na tabela procedimentos
CREATE POLICY "Permitir atualização de procedimentos"
ON procedimentos FOR UPDATE
TO anon, authenticated
USING (true);
```

## 📋 Estrutura da Tabela Procedimentos

Após a importação, cada linha do Excel cria um registro assim:

```sql
INSERT INTO procedimentos (
    nome,              -- Vem do Excel (coluna "procedimentos")
    tipo,              -- Padrão: "ambulatorial"
    duracao_estimada_min, -- Padrão: 30
    descricao,         -- Padrão: ""
    especialidade,     -- Padrão: null
    especialidade_id,  -- Padrão: null
    hospital_id        -- Automático: ID do hospital logado
)
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12) para mensagens detalhadas de erro
2. Confirme que as permissões do Supabase estão configuradas
3. Valide que o formato do Excel está correto
4. Use o template fornecido como base

## 🔍 Debug

Para ver detalhes da importação:
1. Pressione F12 no navegador
2. Vá para a aba Console
3. Procure por mensagens começando com 📊, 📝, ✅ ou ❌

---

**Última atualização**: 2024

