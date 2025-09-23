# 🏥 Teste do Sistema Multi-Hospitalar

## 🚀 Como Testar

### 1. Setup do Banco de Dados
```bash
cd backend
npm run db:reset  # Recria todas as tabelas com os novos campos
```

### 2. Dados de Exemplo Criados

#### Hospitais:
- **Hospital São Paulo** (SP) - CNPJ: 11.222.333/0001-44
- **Hospital Rio de Janeiro** (RJ) - CNPJ: 22.333.444/0001-55  
- **Hospital Belo Horizonte** (BH) - CNPJ: 33.444.555/0001-66

#### Usuários de Teste:
- `admin@hospitalsaopaulo.com` → Hospital São Paulo
- `recepcionista@hospitalsaopaulo.com` → Hospital São Paulo
- `admin@hospitalrio.com` → Hospital Rio de Janeiro
- `coordenador@hospitalbh.com` → Hospital Belo Horizonte

### 3. Endpoints da API

#### Autenticação
```bash
# Fazer login com email
POST /api/usuarios/auth
{
  "email": "admin@hospitalsaopaulo.com"
}

# Resposta inclui usuário e hospitais disponíveis
{
  "success": true,
  "data": {
    "usuario": { "id": "...", "email": "...", "hospital_id": "..." },
    "hospitais": [{ "id": "...", "nome": "Hospital São Paulo", ... }]
  }
}
```

#### Listar por Hospital
```bash
# Médicos de um hospital específico
GET /api/medicos?hospitalId=<hospital_id>

# Procedimentos de um hospital específico  
GET /api/procedimentos?hospitalId=<hospital_id>

# Agendamentos de um hospital específico
GET /api/agendamentos?hospitalId=<hospital_id>
```

#### CRUD Hospitais
```bash
# Listar hospitais
GET /api/hospitais

# Criar hospital
POST /api/hospitais
{
  "nome": "Hospital Teste",
  "cidade": "São Paulo", 
  "cnpj": "44.555.666/0001-77"
}

# Estatísticas
GET /api/hospitais/statistics
```

### 4. Fluxo de Uso

1. **Login**: Usuario digita email → Sistema retorna hospitais disponíveis
2. **Seleção**: Usuario escolhe hospital → Sistema filtra dados por hospital_id
3. **Operação**: Todas as operações CRUD respeitam o hospital selecionado

### 5. Regras de Negócio

- ✅ Médicos pertencem a um hospital específico
- ✅ Procedimentos pertencem a um hospital específico  
- ✅ Agendamentos só podem ser criados com médicos/procedimentos do mesmo hospital
- ✅ CRM e Email únicos por hospital (não globalmente únicos)
- ✅ Usuários podem ter acesso a múltiplos hospitais (futuro)

### 6. Próximos Passos

Para implementar no frontend:
1. Tela de login com campo email
2. Modal de seleção de hospital
3. Context para armazenar hospital selecionado
4. Filtros automáticos em todas as requisições

## 🎯 Benefícios Implementados

- **Isolamento de Dados**: Cada hospital vê apenas seus dados
- **Simplicidade**: Sistema sem complicação de permissões
- **Escalabilidade**: Fácil adicionar novos hospitais
- **Flexibilidade**: Usuário pode ter acesso a múltiplos hospitais
- **Segurança**: Dados isolados por hospital_id
