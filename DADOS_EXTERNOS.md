# 📊 Integração com Dados Externos - MedAgenda

Este documento explica como consumir dados de outro projeto Supabase no MedAgenda.

## 🔧 Configuração

### Projeto Externo Configurado
- **Projeto ID**: `fvtfxunakabdrlkocdme`
- **URL**: `https://fvtfxunakabdrlkocdme.supabase.co`
- **Chave API**: Configurada no arquivo `services/external-supabase.ts`

## 📁 Arquivos Criados

### 1. `services/external-supabase.ts`
- **Função**: Cliente Supabase para o projeto externo
- **Recursos**:
  - Configuração da conexão externa
  - Funções genéricas para buscar dados
  - Funções específicas por tabela
  - Teste de conectividade

### 2. `hooks/useExternalData.ts`
- **Função**: Hook React para gerenciar dados externos
- **Recursos**:
  - Estado reativo dos dados
  - Controle de loading e erros
  - Funções para carregar dados específicos
  - Hook especializado para hospitais

### 3. `components/ExternalDataView.tsx`
- **Função**: Interface visual para dados externos
- **Recursos**:
  - Status da conexão
  - Resumo dos dados carregados
  - Tabela de hospitais externos
  - Busca customizada em qualquer tabela

## 🚀 Como Usar

### 1. Acessar a Interface
1. Faça login no sistema
2. Clique em "Dados Externos" na navegação
3. Teste a conexão com o botão "Testar Conexão"
4. Carregue os dados com "Carregar Todos os Dados"

### 2. Usar Programaticamente

#### Exemplo Básico
```typescript
import { useExternalData } from '../hooks/useExternalData'

const MeuComponente = () => {
  const { 
    externalData, 
    loading, 
    error, 
    connected,
    loadAllExternalData 
  } = useExternalData()

  useEffect(() => {
    if (connected) {
      loadAllExternalData()
    }
  }, [connected])

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      <p>Hospitais: {externalData.hospitais.length}</p>
    </div>
  )
}
```

#### Buscar Dados Específicos
```typescript
const { loadFromTable } = useExternalData()

// Buscar usuários
const usuarios = await loadFromTable('usuarios', {
  order: 'nome',
  limit: 10
})

// Buscar com filtro
const medicos = await loadFromTable('medicos', {
  filter: { especialidade: 'Cardiologia' },
  order: 'nome'
})
```

#### Buscar por ID
```typescript
const { getExternalById } = useExternalData()

const hospital = await getExternalById('hospitais', 'hospital-id-123')
```

### 3. Funções Disponíveis

#### `externalDataService`
- `getFromTable(tableName, options)` - Busca genérica
- `getById(tableName, id)` - Busca por ID
- `testConnection()` - Testa conectividade
- `getHospitais()` - Busca hospitais
- `getUsuarios()` - Busca usuários
- `getMedicosExternos()` - Busca médicos
- `getProcedimentosExternos()` - Busca procedimentos
- `getAgendamentosExternos()` - Busca agendamentos

#### `useExternalData` Hook
- `externalData` - Estado com todos os dados
- `loading` - Estado de carregamento
- `error` - Estado de erro
- `connected` - Status da conexão
- `loadAllExternalData()` - Carrega todos os dados
- `loadFromTable()` - Carrega tabela específica
- `testConnection()` - Testa conexão

## 🔒 Segurança

### Políticas RLS
- Os dados externos respeitam as políticas de Row Level Security do projeto externo
- Apenas dados públicos ou autorizados serão acessíveis
- Verifique as permissões no projeto externo

### Autenticação
- A chave API utilizada é do tipo `anon` (pública)
- Para dados sensíveis, considere implementar autenticação específica
- Monitore o uso da API para evitar limites

## 📊 Estrutura de Dados

### Tabelas Esperadas
- `hospitais` - Informações dos hospitais
- `usuarios` - Usuários do sistema
- `medicos` - Médicos cadastrados
- `procedimentos` - Procedimentos médicos
- `agendamentos` - Agendamentos realizados

### Campos Comuns
```typescript
// Exemplo de estrutura esperada
interface HospitalExterno {
  id: string
  nome: string
  cidade: string
  estado: string
  cnpj: string
  created_at: string
  updated_at: string
}
```

## 🛠️ Customização

### Adicionar Nova Tabela
1. Edite `services/external-supabase.ts`
2. Adicione função específica:
```typescript
async getMinhaTabela() {
  return this.getFromTable('minha_tabela', {
    order: 'nome'
  })
}
```

### Criar Hook Específico
```typescript
export const useMinhaTabela = () => {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(false)
  
  const loadDados = async () => {
    setLoading(true)
    try {
      const data = await externalDataService.getMinhaTabela()
      setDados(data)
    } finally {
      setLoading(false)
    }
  }
  
  return { dados, loading, loadDados }
}
```

## 🐛 Troubleshooting

### Erro de Conexão
- Verifique se a URL e chave API estão corretas
- Confirme se o projeto externo está ativo
- Verifique as políticas RLS do projeto externo

### Dados Não Aparecem
- Confirme se as tabelas existem no projeto externo
- Verifique se há dados nas tabelas
- Confirme as permissões de leitura

### Performance
- Use filtros para limitar a quantidade de dados
- Implemente paginação para tabelas grandes
- Cache dados quando apropriado

## 📝 Logs

O sistema inclui logs detalhados no console:
- ✅ Sucessos em verde
- ❌ Erros em vermelho  
- ⚠️ Avisos em amarelo
- 🔄 Carregamentos em azul

## 🔄 Sincronização

Para sincronizar dados entre projetos, use:
```typescript
import { syncDataBetweenProjects } from '../services/external-supabase'

const hospitais = await syncDataBetweenProjects.syncHospitais()
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console do navegador
2. Teste a conectividade na interface
3. Confirme as configurações do projeto externo
4. Consulte a documentação do Supabase
