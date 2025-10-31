# 📋 Guia de Importação de Médicos via Excel

## 🎯 Objetivo

Este guia explica como importar médicos em massa para o sistema MedAgenda usando um arquivo Excel.

## 📊 Formato do Excel

O arquivo Excel deve conter as seguintes colunas (exatamente com esses nomes):

| Coluna | Descrição | Obrigatório | Exemplo |
|--------|-----------|-------------|---------|
| `nome` | Nome completo do médico | Sim | João Silva |
| `cns` | CNS do médico (será usado no campo CRM) | Sim | 123456789012345 |
| `especialidade` | Especialidade médica | Sim | Cardiologia |
| `id` | ID do hospital (UUID do banco de dados) | Sim | 550e8400-e29b-41d4-a716-446655440001 |

### 💡 Dicas Importantes para Preparar o Excel

1. **Nomes das Colunas**: Podem ser em MAIÚSCULAS ou minúsculas
   - ✅ Aceito: `nome`, `NOME`, `Nome`
   - ✅ Aceito: `especialidade`, `ESPECIALIDADE`, `Especialidade`

2. **Formato das Células**: Use "Geral" ou "Texto"
   - Selecione todas as células → Botão direito → Formatar Células → "Geral"

3. **Primeira Linha**: Deve conter os cabeçalhos (nomes das colunas)
   - ❌ Não deixe linhas vazias antes do cabeçalho
   - ❌ Não coloque títulos acima do cabeçalho

4. **Espaços**: Espaços extras são removidos automaticamente
   - `"  nome  "` será lido como `"nome"`

5. **Acentos**: São normalizados automaticamente
   - `especialidade` e `especialidadé` são tratados como iguais

### ⚠️ Observações Importantes

1. **Médicos Duplicados**: O sistema permite médicos com mesmo nome e CNS para diferentes hospitais
2. **Um registro por hospital**: Se um médico trabalha em 2 hospitais, crie 2 linhas no Excel (uma para cada hospital)
3. **IDs dos Hospitais**: Os IDs devem ser obtidos do banco de dados antes de criar o Excel

### 📋 Estrutura Correta do Excel

```
LINHA 1 (cabeçalho):  nome | cns | especialidade | id
LINHA 2 (dados):      João Silva | 123456789012345 | Cardiologia | 550e8400...
LINHA 3 (dados):      Maria Santos | 234567890123456 | Pediatria | 550e8400...
```

❌ **Estrutura INCORRETA** (não faça assim):
```
LINHA 1: Planilha de Médicos       ← Não coloque título
LINHA 2: (vazia)                    ← Não deixe linhas vazias
LINHA 3: nome | cns | especialidade ← Cabeçalho deve estar na linha 1
```

## 📝 Exemplo de Excel

```
nome                        | cns             | especialidade  | id
----------------------------|-----------------|----------------|--------------------------------------
João Silva                  | 123456789012345 | Cardiologia    | 550e8400-e29b-41d4-a716-446655440001
Maria Santos                | 234567890123456 | Pediatria      | 550e8400-e29b-41d4-a716-446655440001
João Silva                  | 123456789012345 | Cardiologia    | 550e8400-e29b-41d4-a716-446655440002
```

No exemplo acima, "João Silva" trabalha em 2 hospitais diferentes, por isso aparece 2 vezes.

## 🔍 Como Obter os IDs dos Hospitais

Execute esta query no banco de dados Supabase:

```sql
SELECT id, nome FROM hospitais ORDER BY nome;
```

Resultado exemplo:
```
550e8400-e29b-41d4-a716-446655440001 | Hospital São Paulo
550e8400-e29b-41d4-a716-446655440002 | Hospital Rio de Janeiro
550e8400-e29b-41d4-a716-446655440003 | Hospital Brasília
```

## 🚀 Como Importar

1. **Acesse a tela de Gerenciamento**
2. **Vá para a aba "Médicos"**
3. **Clique no botão "Importar Excel"** (botão verde no canto superior direito)
4. **Selecione seu arquivo Excel** (.xlsx ou .xls)
5. **Revise o preview dos dados** - o sistema mostrará todos os registros que serão importados
6. **Verifique se há erros** - linhas com erro aparecerão em vermelho com a descrição do problema
7. **Clique em "Importar"** para iniciar a importação
8. **Acompanhe o progresso** - cada linha será processada e seu status atualizado em tempo real

## ✅ Validações Realizadas

O sistema verifica automaticamente:

- ✓ Nome não pode estar vazio
- ✓ CNS não pode estar vazio
- ✓ Especialidade não pode estar vazia
- ✓ ID do hospital não pode estar vazio

## 📊 Durante a Importação

- **Status Pendente (⏳)**: Aguardando processamento
- **Status Sucesso (✅)**: Médico importado com sucesso
- **Status Erro (❌)**: Houve um problema (passe o mouse sobre para ver detalhes)

## 🎨 Campos Opcionais

Os campos `telefone` e `email` são criados vazios na importação. Você pode editá-los depois:

1. Acesse a lista de médicos
2. Clique no ícone de edição (✏️) do médico
3. Preencha telefone e email
4. Salve

## ⚡ Dicas

- **Prepare o Excel com cuidado**: Verifique todos os dados antes de importar
- **Faça backup**: Se tiver dados importantes, faça backup antes da importação
- **Teste com poucos registros**: Importe 2-3 médicos primeiro para validar o processo
- **IDs corretos**: Certifique-se de usar os IDs corretos dos hospitais

## 🐛 Problemas Comuns

### "Nome é obrigatório"
**Causa**: A célula da coluna `nome` está vazia  
**Solução**: Preencha o nome do médico

### "ID do hospital é obrigatório"
**Causa**: A célula da coluna `id` está vazia  
**Solução**: Preencha com o UUID correto do hospital

### "permission denied for table medicos"
**Causa**: O usuário do Supabase não tem permissão de escrita  
**Solução**: Configure as policies corretas no Supabase (veja seção abaixo)

## 🔐 Configuração de Permissões no Supabase

Execute estas queries no Supabase SQL Editor para permitir a importação:

```sql
-- Permitir INSERT na tabela medicos
CREATE POLICY "Permitir insert de médicos"
ON medicos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir SELECT na tabela medicos
CREATE POLICY "Permitir leitura de médicos"
ON medicos FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir UPDATE na tabela medicos
CREATE POLICY "Permitir atualização de médicos"
ON medicos FOR UPDATE
TO anon, authenticated
USING (true);
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12) para mensagens detalhadas de erro
2. Confirme que as permissões do Supabase estão configuradas
3. Valide que o formato do Excel está correto

---

**Última atualização**: 2024

