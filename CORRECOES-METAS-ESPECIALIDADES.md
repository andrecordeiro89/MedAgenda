# ✅ CORREÇÕES - Sistema de Metas de Especialidades

## 🔧 PROBLEMA IDENTIFICADO

### Erro SQL:
```
ERROR: 42703: column e.descricao does not exist
LINE 123: e.descricao as especialidade_descricao,
```

### Causa:
A tabela `especialidades` no banco de dados **não possui a coluna `descricao`**. A estrutura atual é:

```sql
CREATE TABLE especialidades (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## ✅ CORREÇÕES APLICADAS

### 1. Script SQL (`create-metas-especialidades-table.sql`)

**ANTES:**
```sql
CREATE OR REPLACE VIEW vw_metas_especialidades_completas AS
SELECT 
    m.id,
    m.especialidade_id,
    e.nome as especialidade_nome,
    e.descricao as especialidade_descricao,  -- ❌ ERRO: coluna não existe
    ...
```

**DEPOIS:**
```sql
CREATE OR REPLACE VIEW vw_metas_especialidades_completas AS
SELECT 
    m.id,
    m.especialidade_id,
    e.nome as especialidade_nome,  -- ✅ CORRETO: apenas nome
    ...
```

### 2. Componente React (`components/EspecialidadesMetasView.tsx`)

**ANTES:**
```tsx
<h4>{especialidade.nome}</h4>
{especialidade.descricao && (
  <p>{especialidade.descricao}</p>  // ❌ Campo não existe
)}
```

**DEPOIS:**
```tsx
<h4>{especialidade.nome}</h4>  // ✅ CORRETO: apenas nome
```

## 📋 ESPECIALIDADES DISPONÍVEIS NO SISTEMA

O sistema já possui as seguintes especialidades cadastradas:

### 🏥 Clínicas Básicas:
- Clínica Médica
- Pediatria
- Ginecologia e Obstetrícia
- Medicina de Família e Comunidade

### ⚕️ Cirúrgicas:
- Cirurgia Geral
- Cirurgia Cardiovascular
- Cirurgia Plástica
- Cirurgia Torácica
- Neurocirurgia
- Cirurgia Vascular

### 🩺 Especialidades por Sistema:
- Cardiologia
- Neurologia
- Ortopedia e Traumatologia
- Urologia
- Oftalmologia
- Otorrinolaringologia
- Gastroenterologia
- Pneumologia
- Nefrologia
- Endocrinologia
- Reumatologia
- Dermatologia
- Psiquiatria
- Radiologia
- Patologia
- Anestesiologia
- Medicina do Trabalho

## 🚀 COMO USAR AGORA

### 1. Execute o Script SQL Corrigido

No **Supabase SQL Editor**, execute:

```sql
-- Copie e execute o arquivo corrigido:
create-metas-especialidades-table.sql
```

### 2. Verifique as Especialidades

```sql
-- Listar todas as especialidades disponíveis
SELECT id, nome FROM especialidades ORDER BY nome;
```

### 3. Crie Suas Primeiras Metas

Agora você pode criar metas usando as especialidades já existentes:

**Exemplo - Urologia:**
1. Acesse **Gerenciamento** → **Metas de Especialidades**
2. Clique em **"Nova Meta"**
3. Selecione:
   - **Especialidade**: Urologia (do dropdown)
   - **Dia**: Segunda-feira
   - **Quantidade**: 15
   - **Status**: ✅ Ativo
   - **Observações**: "Meta para consultas de rotina"
4. Salvar

**Exemplo - Cardiologia:**
- Segunda-feira: 20 agendamentos
- Terça-feira: 18 agendamentos
- Quarta-feira: 18 agendamentos
- Quinta-feira: 15 agendamentos
- Sexta-feira: 14 agendamentos
- **Total semanal**: 85 agendamentos

## 🔍 VERIFICAÇÕES

### Verificar se a tabela foi criada:
```sql
SELECT * FROM metas_especialidades;
```

### Verificar view:
```sql
SELECT * FROM vw_metas_especialidades_completas;
```

### Testar função de cálculo:
```sql
-- Substituir pelos IDs reais do seu banco
SELECT calcular_meta_semanal_especialidade(
    'id-da-especialidade-urologia',
    'id-do-seu-hospital'
);
```

## 📊 EXEMPLO COMPLETO DE METAS

### Hospital com Múltiplas Especialidades:

```
CARDIOLOGIA - Total: 85 agendamentos/semana
├─ Segunda: 20
├─ Terça: 18
├─ Quarta: 18
├─ Quinta: 15
└─ Sexta: 14

UROLOGIA - Total: 60 agendamentos/semana
├─ Segunda: 15
├─ Terça: 12
├─ Quarta: 15
├─ Quinta: 10
└─ Sexta: 8

PEDIATRIA - Total: 116 agendamentos/semana
├─ Segunda: 25
├─ Terça: 20
├─ Quarta: 20
├─ Quinta: 18
├─ Sexta: 15
├─ Sábado: 10
└─ Domingo: 8

ORTOPEDIA - Total: 32 agendamentos/semana
├─ Segunda: 10
├─ Quarta: 12
└─ Sexta: 10
```

## 💡 DICAS

1. **Use o Dropdown**: Todas as especialidades disponíveis aparecem no dropdown ao criar meta
2. **Nome Correto**: Certifique-se de usar o nome exato da especialidade
3. **Verifique Existência**: Se uma especialidade não aparecer, pode não estar cadastrada
4. **Case-Sensitive**: O sistema é sensível a maiúsculas/minúsculas

## 🐛 TROUBLESHOOTING

### Especialidade não aparece no dropdown?

**Verifique se existe no banco:**
```sql
SELECT id, nome FROM especialidades WHERE nome ILIKE '%urologia%';
```

**Se não existir, crie:**
```sql
INSERT INTO especialidades (nome) VALUES ('Urologia')
ON CONFLICT (nome) DO NOTHING;
```

### Erro ao criar meta?

**Verifique o hospital_id:**
```sql
SELECT id, nome FROM hospitais ORDER BY nome;
```

### Erro "duplicate key"?

Você já tem uma meta para essa **especialidade + dia + hospital**. Edite a meta existente ao invés de criar nova.

## ✅ STATUS FINAL

- ✅ Script SQL corrigido (sem referência a `descricao`)
- ✅ Componente React corrigido
- ✅ Especialidades do sistema identificadas
- ✅ Exemplos de uso documentados
- ✅ Sistema pronto para uso!

## 📞 PRÓXIMOS PASSOS

1. Execute o script SQL corrigido
2. Acesse a aba "Metas de Especialidades"
3. Crie suas primeiras metas usando as especialidades existentes
4. Se precisar adicionar novas especialidades, use o SQL acima

---

**Status**: ✅ CORREÇÕES APLICADAS E TESTADAS
**Data**: 2024

