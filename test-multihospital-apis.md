# 🧪 **Testes das APIs Multi-Hospitalares**

## 🚀 **Como Testar o Backend**

### 1. **Iniciar o Backend**
```bash
cd backend
npm run dev
# Backend deve estar rodando em http://localhost:3001
```

### 2. **Testes com cURL ou Postman**

#### 🏥 **Testar Hospitais**
```bash
# Listar todos os hospitais
curl http://localhost:3001/api/hospitais

# Buscar hospital específico
curl "http://localhost:3001/api/hospitais?q=São Paulo"

# Estatísticas dos hospitais
curl http://localhost:3001/api/hospitais/statistics
```

#### 👤 **Testar Usuários e Autenticação**
```bash
# Fazer login (autenticação simples)
curl -X POST http://localhost:3001/api/usuarios/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hospitalsaopaulo.com"}'

# Listar todos os usuários
curl http://localhost:3001/api/usuarios

# Listar usuários de um hospital específico
curl "http://localhost:3001/api/usuarios?hospitalId=HOSPITAL_ID_AQUI"
```

#### 👨‍⚕️ **Testar Médicos por Hospital**
```bash
# Listar todos os médicos
curl http://localhost:3001/api/medicos

# Listar médicos de um hospital específico
curl "http://localhost:3001/api/medicos?hospitalId=HOSPITAL_ID_AQUI"

# Criar novo médico
curl -X POST http://localhost:3001/api/medicos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dr. Teste",
    "especialidade": "Clínica Geral", 
    "crm": "12345-SP",
    "telefone": "(11) 99999-9999",
    "email": "teste@hospital.com",
    "hospital_id": "HOSPITAL_ID_AQUI"
  }'
```

#### 🏥 **Testar Procedimentos por Hospital**
```bash
# Listar todos os procedimentos
curl http://localhost:3001/api/procedimentos

# Listar procedimentos de um hospital específico
curl "http://localhost:3001/api/procedimentos?hospitalId=HOSPITAL_ID_AQUI"

# Criar novo procedimento
curl -X POST http://localhost:3001/api/procedimentos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Consulta Teste",
    "tipo": "ambulatorial",
    "duracao_estimada_min": 30,
    "descricao": "Consulta de teste",
    "hospital_id": "HOSPITAL_ID_AQUI"
  }'
```

#### 📅 **Testar Agendamentos por Hospital**
```bash
# Listar todos os agendamentos
curl http://localhost:3001/api/agendamentos

# Listar agendamentos de um hospital específico
curl "http://localhost:3001/api/agendamentos?hospitalId=HOSPITAL_ID_AQUI"

# Criar novo agendamento (SEM horario)
curl -X POST http://localhost:3001/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "nome_paciente": "Paciente Teste",
    "data_nascimento": "1990-01-01",
    "cidade_natal": "São Paulo",
    "telefone": "(11) 99999-9999",
    "whatsapp": "(11) 99999-9999",
    "data_agendamento": "2024-01-15",
    "status_liberacao": "pendente",
    "medico_id": "MEDICO_ID_AQUI",
    "procedimento_id": "PROCEDIMENTO_ID_AQUI",
    "hospital_id": "HOSPITAL_ID_AQUI"
  }'
```

### 3. **Respostas Esperadas**

#### ✅ **Login Bem-sucedido**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "...",
      "email": "admin@hospitalsaopaulo.com",
      "hospital_id": "..."
    },
    "hospitais": [
      {
        "id": "...",
        "nome": "Hospital São Paulo",
        "cidade": "São Paulo",
        "cnpj": "11.222.333/0001-44"
      }
    ]
  },
  "message": "Usuário autenticado com sucesso"
}
```

#### ✅ **Lista de Hospitais**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "nome": "Hospital São Paulo",
      "cidade": "São Paulo", 
      "cnpj": "11.222.333/0001-44"
    },
    {
      "id": "...",
      "nome": "Hospital Rio de Janeiro",
      "cidade": "Rio de Janeiro",
      "cnpj": "22.333.444/0001-55"
    }
  ]
}
```

### 4. **Erros Comuns e Soluções**

#### ❌ **Erro 404 - Endpoint não encontrado**
- ✅ Verificar se backend está rodando
- ✅ Verificar URL correta: `http://localhost:3001/api/...`

#### ❌ **Erro 500 - Erro interno**
- ✅ Verificar logs do backend no terminal
- ✅ Verificar se banco de dados está conectado

#### ❌ **Erro 401 - Email não encontrado**
- ✅ Verificar se email existe na tabela usuarios
- ✅ Executar: `SELECT * FROM public.usuarios;`

#### ❌ **Erro 409 - Conflito**
- ✅ Dados duplicados (CRM, email, etc.)
- ✅ Verificar constraints únicas

## 🎯 **Checklist de Testes**

- [ ] Backend iniciado com sucesso
- [ ] Endpoint `/api` retorna informações da API
- [ ] Login com email funciona
- [ ] Lista de hospitais retorna dados
- [ ] Filtro por hospital funciona
- [ ] CRUD de médicos funciona
- [ ] CRUD de procedimentos funciona  
- [ ] CRUD de agendamentos funciona (sem horario)
- [ ] Constraints de hospital estão funcionando

## 📊 **Próximo Passo: Frontend**

Após todos os testes passarem, podemos implementar:
1. Tela de login no frontend
2. Seleção de hospital
3. Context para filtros automáticos
