# 🏥 Integração SIGTAP - Procedimentos Médicos

Esta documentação explica a integração com a tabela de procedimentos SIGTAP do projeto SigtapFaturamento.

## 🎯 Objetivo

Consumir dados da tabela `sigtap_procedures` do projeto externo, buscando registros únicos pela coluna `code` para obter a tabela completa do SIGTAP.

## 📁 Arquivos da Integração

### 1. `services/external-supabase.ts` (Atualizado)
**Novas funções adicionadas:**
- `getSigtapProcedures()` - Busca todos os procedimentos SIGTAP
- `getSigtapUniquesCodes()` - Busca códigos únicos da coluna 'code'
- `getSigtapProcedureByCode(code)` - Busca procedimento específico por código
- `getSigtapCompleteTable()` - Busca tabela completa com registros únicos

### 2. `hooks/useSigtapData.ts`
**Hook especializado para gerenciar dados SIGTAP:**
```typescript
const {
  procedures,        // Array de procedimentos únicos
  uniqueCodes,      // Array de códigos únicos
  loading,          // Estado de carregamento
  error,            // Estado de erro
  connected,        // Status da conexão
  loadCompleteTable,// Função para carregar tabela completa
  filterProcedures, // Função para filtrar procedimentos
  stats            // Estatísticas dos dados
} = useSigtapData()
```

### 3. `components/SigtapProceduresView.tsx`
**Interface completa para visualização dos dados SIGTAP:**
- Status da conexão em tempo real
- Botões para carregar dados
- Tabela responsiva com todos os campos
- Sistema de busca e filtros
- Detalhes expandíveis por registro
- Tratamento de estados (loading, erro, vazio)

### 4. `components/ManagementView.tsx` (Atualizado)
**Nova aba adicionada:**
- Aba "Procedimentos SIGTAP" no sistema de gerenciamento
- Integração com o componente `SigtapProceduresView`
- Botão "Novo" ocultado na aba SIGTAP (dados são somente leitura)

## 🚀 Como Usar

### 1. Acessar via Interface
1. Faça login no sistema
2. Vá para "Gerenciamento"
3. Clique na aba "Procedimentos SIGTAP"
4. Teste a conexão com "Testar Conexão"
5. Carregue os dados com "Carregar Tabela Completa"

### 2. Usar Programaticamente

#### Exemplo Básico
```typescript
import { useSigtapData } from '../hooks/useSigtapData'

const MeuComponente = () => {
  const { 
    procedures, 
    loading, 
    error, 
    loadCompleteTable 
  } = useSigtapData()

  useEffect(() => {
    loadCompleteTable()
  }, [])

  return (
    <div>
      {loading && <p>Carregando procedimentos SIGTAP...</p>}
      {error && <p>Erro: {error}</p>}
      <p>Total: {procedures.length} procedimentos únicos</p>
    </div>
  )
}
```

#### Buscar Códigos Únicos
```typescript
const { loadUniqueCodes } = useSigtapData()

const codes = await loadUniqueCodes()
console.log('Códigos únicos encontrados:', codes.length)
```

#### Buscar Procedimento Específico
```typescript
const { getProcedureByCode } = useSigtapData()

const procedure = await getProcedureByCode('03.01.01.001-2')
console.log('Procedimento encontrado:', procedure)
```

#### Filtrar Procedimentos
```typescript
const { filterProcedures } = useSigtapData()

const filtered = filterProcedures('cirurgia')
console.log('Procedimentos filtrados:', filtered.length)
```

## 📊 Estrutura dos Dados

### Interface SigtapProcedure
```typescript
interface SigtapProcedure {
  id?: string
  code: string              // Código único do procedimento
  name?: string            // Nome do procedimento
  description?: string     // Descrição detalhada
  complexity?: string      // Nível de complexidade
  value?: number          // Valor do procedimento
  created_at?: string     // Data de criação
  updated_at?: string     // Data de atualização
  [key: string]: any      // Campos adicionais
}
```

### Campos Esperados na Tabela
- `code` - **Campo principal** para busca de registros únicos
- `name` - Nome do procedimento
- `description` - Descrição completa
- `complexity` - Nível de complexidade (Alta/Média/Baixa)
- `value` - Valor monetário do procedimento
- Outros campos específicos do SIGTAP

## 🔍 Funcionalidades

### 1. **Busca de Códigos Únicos**
- Extrai todos os códigos únicos da coluna `code`
- Remove duplicatas automaticamente
- Ordenação alfabética dos códigos

### 2. **Tabela Completa**
- Busca o primeiro registro de cada código único
- Garante que não há duplicatas na visualização
- Carregamento em lote para performance

### 3. **Interface Visual**
- **Status da Conexão**: Indicador visual em tempo real
- **Estatísticas**: Total de procedimentos, códigos únicos, filtrados
- **Busca**: Filtro por código, nome ou descrição
- **Detalhes**: Expansão de registros para ver todos os campos
- **Responsividade**: Layout adaptável para mobile e desktop

### 4. **Estados da Interface**
- **Loading**: Indicador de carregamento
- **Erro**: Mensagens de erro específicas
- **Vazio**: Estado quando não há dados
- **Sucesso**: Exibição da tabela completa

## 🛠️ Configuração

### Projeto Externo
- **Nome**: SigtapFaturamento
- **Tabela**: `sigtap_procedures`
- **Campo Principal**: `code`
- **Método**: Registros únicos por código

### Conexão
- Utiliza as mesmas credenciais do `external-supabase.ts`
- Projeto ID: `fvtfxunakabdrlkocdme`
- Chave API configurada no serviço

## 📈 Performance

### Otimizações Implementadas
1. **Busca em Lote**: Carrega múltiplos registros simultaneamente
2. **Filtragem Cliente**: Filtros aplicados no frontend para rapidez
3. **Cache Local**: Dados armazenados no estado do componente
4. **Lazy Loading**: Detalhes carregados sob demanda

### Recomendações
- Use a busca por código específico para consultas rápidas
- Carregue a tabela completa apenas quando necessário
- Implemente paginação se a tabela for muito grande

## 🔒 Segurança

### Políticas RLS
- Dados respeitam as políticas do projeto SigtapFaturamento
- Apenas leitura dos dados SIGTAP
- Sem operações de escrita/modificação

### Validações
- Verificação de conectividade antes das operações
- Tratamento de erros específicos por operação
- Logs detalhados para debugging

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. **Erro de Conexão**
```
Não foi possível conectar ao projeto SIGTAP
```
**Solução**: Verificar se o projeto externo está ativo e as credenciais estão corretas.

#### 2. **Tabela Vazia**
```
Nenhum procedimento encontrado
```
**Solução**: Confirmar se a tabela `sigtap_procedures` existe e tem dados.

#### 3. **Códigos Duplicados**
```
Registros duplicados na visualização
```
**Solução**: A função `getSigtapCompleteTable()` já remove duplicatas automaticamente.

#### 4. **Performance Lenta**
```
Carregamento demorado
```
**Solução**: 
- Verificar a quantidade de registros na tabela
- Implementar paginação se necessário
- Usar filtros para reduzir o dataset

### Logs de Debug
Os logs aparecem no console do navegador:
- ✅ **Sucessos**: Operações bem-sucedidas
- ❌ **Erros**: Problemas na conexão/dados
- ⚠️ **Avisos**: Situações que precisam atenção
- 🔄 **Carregamentos**: Status de operações em andamento

## 📞 Suporte Técnico

### Como Reportar Problemas
1. Abrir o console do navegador (F12)
2. Reproduzir o problema
3. Copiar os logs de erro
4. Verificar a conectividade na aba "Dados Externos"
5. Documentar os passos para reproduzir

### Informações Úteis para Debug
- Status da conexão (conectado/desconectado)
- Quantidade de registros carregados
- Mensagens de erro específicas
- Tempo de resposta das operações

## 🔄 Atualizações Futuras

### Melhorias Planejadas
- [ ] Paginação para tabelas grandes
- [ ] Cache persistente dos dados
- [ ] Exportação para Excel/CSV
- [ ] Filtros avançados por múltiplos campos
- [ ] Sincronização automática de dados
- [ ] API de busca por texto completo

### Integrações Possíveis
- Vincular procedimentos SIGTAP aos procedimentos locais
- Importar códigos para o sistema local
- Relatórios comparativos de valores
- Dashboard de análise de procedimentos
