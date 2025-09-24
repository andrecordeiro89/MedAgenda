# 📄 Paginação SIGTAP - Sistema Otimizado para Grandes Volumes

Este documento detalha o sistema de paginação implementado para lidar com os ~4900 procedimentos únicos do SIGTAP.

## 🎯 **Problema Resolvido**

**Antes:** Apenas 39 registros eram exibidos devido a limitações na abordagem de busca individual por código.  
**Depois:** Sistema paginado capaz de exibir todos os ~4900 procedimentos únicos com performance otimizada.

## 🔧 **Arquitetura da Solução**

### 1. **Serviço Otimizado (`external-supabase.ts`)**

#### Função Principal: `getSigtapCompleteTable(options)`
```typescript
// Nova abordagem otimizada
async getSigtapCompleteTable(options?: {
  page?: number          // Página atual (padrão: 1)
  pageSize?: number      // Registros por página (padrão: 100)
  searchTerm?: string    // Termo de busca (opcional)
})
```

**Melhorias implementadas:**
- ✅ **Query única** em vez de múltiplas requisições por código
- ✅ **Paginação nativa** do Supabase com `range(from, to)`
- ✅ **Busca integrada** com `or()` em múltiplos campos
- ✅ **Remoção de duplicatas** no lado cliente para garantir unicidade
- ✅ **Contagem total** com `count: 'exact'`

#### Funções Auxiliares:
- `removeDuplicatesByCode()` - Remove duplicatas por código
- `getSigtapTotalUniqueCount()` - Conta códigos únicos totais
- `getSigtapCompleteTableLegacy()` - Método antigo (mantido para compatibilidade)

### 2. **Hook Avançado (`useSigtapData.ts`)**

#### Estados de Paginação:
```typescript
const [currentPage, setCurrentPage] = useState(1)
const [pageSize, setPageSize] = useState(100)
const [totalCount, setTotalCount] = useState(0)
const [totalPages, setTotalPages] = useState(0)
const [searchTerm, setSearchTerm] = useState('')
```

#### Funções de Navegação:
- `goToPage(page)` - Vai para página específica
- `goToNextPage()` - Próxima página
- `goToPrevPage()` - Página anterior
- `goToFirstPage()` - Primeira página
- `goToLastPage()` - Última página
- `changePageSize(size)` - Altera itens por página
- `searchProcedures(term)` - Busca com filtro
- `clearSearch()` - Limpa busca

### 3. **Interface Completa (`SigtapProceduresView.tsx`)**

#### Controles de Paginação:
- **Seletor de itens por página:** 50, 100, 200, 500
- **Navegação:** Primeiro, Anterior, Próxima, Última
- **Indicador visual:** "Página X de Y"
- **Busca integrada:** Enter para buscar
- **Estatísticas em tempo real**

## 📊 **Métricas e Performance**

### Estatísticas Exibidas:
1. **Total no Sistema** - Contagem total de registros únicos
2. **Página Atual** - Registros carregados na página atual
3. **Página** - Página atual de total de páginas
4. **Por Página** - Configuração atual de itens por página
5. **Códigos Únicos** - Total de códigos únicos carregados

### Performance Otimizada:
- **Carregamento sob demanda:** Apenas dados da página atual
- **Busca no servidor:** Filtros aplicados no banco de dados
- **Cache local:** Dados da página atual mantidos em memória
- **Navegação rápida:** Transições suaves entre páginas

## 🚀 **Como Usar**

### 1. **Navegação Básica**
```typescript
// Ir para página específica
await goToPage(5)

// Navegar sequencialmente
await goToNextPage()
await goToPrevPage()

// Ir para extremos
await goToFirstPage()
await goToLastPage()
```

### 2. **Alterar Tamanho da Página**
```typescript
// Alterar para 200 itens por página
await changePageSize(200)
```

### 3. **Buscar Procedimentos**
```typescript
// Buscar por termo
await searchProcedures('cirurgia')

// Limpar busca
await clearSearch()
```

### 4. **Monitorar Estados**
```typescript
const {
  currentPage,    // Página atual
  totalPages,     // Total de páginas
  totalCount,     // Total de registros
  pageSize,       // Itens por página
  searchTerm,     // Termo de busca atual
  loading,        // Estado de carregamento
  procedures      // Dados da página atual
} = useSigtapData()
```

## 🔍 **Funcionalidades Avançadas**

### 1. **Busca Integrada**
- Busca simultânea em: `code`, `name`, `description`
- Suporte a termos parciais
- Busca no servidor (não local)
- Reset automático para página 1

### 2. **Navegação Inteligente**
- Botões desabilitados quando não aplicáveis
- Indicadores visuais de estado
- Navegação por teclado (Enter na busca)

### 3. **Estatísticas em Tempo Real**
- Contadores atualizados automaticamente
- Formatação numérica (1.000, 2.500, etc.)
- Indicadores coloridos por categoria

### 4. **Controles de Performance**
- Seletor de tamanho de página
- Botão "Contar Total" para atualizar estatísticas
- Diagnóstico completo para debug

## 📈 **Configurações Recomendadas**

### Para Uso Geral:
- **Página inicial:** 100 itens
- **Busca:** Usar termos específicos
- **Navegação:** Usar controles de página

### Para Performance Máxima:
- **Página pequena:** 50 itens para carregamento rápido
- **Página grande:** 500 itens para menos requisições

### Para Busca Específica:
- Use códigos específicos (ex: "03.01")
- Use nomes parciais (ex: "cirurgia")
- Use descrições (ex: "cardiovascular")

## 🛠️ **Configurações Técnicas**

### Limites do Supabase:
- **Timeout:** 30 segundos por query
- **Registros por página:** Máximo recomendado 1000
- **Busca:** Suporte completo a ILIKE e OR

### Otimizações Implementadas:
```typescript
// Query otimizada
let query = externalSupabase
  .from('sigtap_procedures')
  .select('*')
  .order('code')

// Busca eficiente
if (searchTerm) {
  const term = `%${searchTerm.trim()}%`
  query = query.or(`code.ilike.${term},name.ilike.${term},description.ilike.${term}`)
}

// Paginação nativa
const from = (page - 1) * pageSize
const to = from + pageSize - 1
query = query.range(from, to)
```

## 🐛 **Troubleshooting**

### Problema: "Carregamento lento"
**Solução:** Reduzir tamanho da página ou usar busca específica

### Problema: "Muitos registros duplicados"
**Solução:** A função `removeDuplicatesByCode()` remove automaticamente

### Problema: "Busca não encontra resultados"
**Solução:** Verificar se o termo existe na base e usar busca parcial

### Problema: "Paginação não funciona"
**Solução:** Verificar conexão e usar botão "Diagnóstico"

## 📊 **Métricas de Sucesso**

### Antes da Otimização:
- ❌ **39 registros** exibidos
- ❌ **Múltiplas requisições** por código
- ❌ **Sem paginação**
- ❌ **Performance lenta**

### Depois da Otimização:
- ✅ **~4900 registros** acessíveis
- ✅ **Query única** otimizada
- ✅ **Paginação completa**
- ✅ **Performance rápida**
- ✅ **Busca integrada**
- ✅ **Estatísticas em tempo real**

## 🔄 **Próximas Melhorias**

### Planejadas:
- [ ] Cache de páginas visitadas
- [ ] Pré-carregamento da próxima página
- [ ] Exportação de dados filtrados
- [ ] Filtros avançados (complexidade, valor)
- [ ] Ordenação por diferentes campos

### Possíveis:
- [ ] Busca com autocomplete
- [ ] Favoritos de procedimentos
- [ ] Histórico de buscas
- [ ] Comparação de procedimentos
- [ ] Integração com procedimentos locais

O sistema agora está completamente otimizado para lidar com grandes volumes de dados do SIGTAP de forma eficiente e user-friendly! 🚀
