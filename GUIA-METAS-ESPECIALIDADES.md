# 🎯 Guia de Metas de Agendamentos por Especialidade

## 📋 Visão Geral

O sistema de **Metas de Agendamentos por Especialidade** permite que você defina objetivos quantitativos de agendamentos para cada especialidade médica, organizados por dia da semana. Isso facilita o planejamento, monitoramento e gestão da capacidade de atendimento do hospital.

## ✨ Funcionalidades

### 🎯 Definição de Metas
- **Por Especialidade**: Defina metas específicas para cada especialidade médica
- **Por Dia da Semana**: Configure metas diferentes para cada dia (segunda a domingo)
- **Por Hospital**: Cada hospital tem suas próprias metas
- **Flexível**: Ative/desative metas conforme necessário

### 📊 Visualização
- **Cards por Especialidade**: Cada especialidade tem um card visual com:
  - Total de agendamentos meta por semana
  - Quantidade de dias ativos
  - Total de metas cadastradas
- **Metas por Dia**: Lista detalhada de metas para cada dia da semana
- **Indicadores Visuais**: Cores e badges para identificar status

### ⚙️ Gerenciamento
- **CRUD Completo**: Criar, editar, visualizar e excluir metas
- **Observações**: Adicione notas explicativas para cada meta
- **Status Ativo/Inativo**: Controle quais metas estão sendo contabilizadas

## 🚀 Como Usar

### 1️⃣ Acessar a Tela de Metas

1. Faça login no sistema
2. Vá para **Gerenciamento**
3. Clique na aba **"Metas de Especialidades"**

### 2️⃣ Criar Nova Meta

#### Passo a Passo:

1. **Clique no botão "Nova Meta"** (canto superior direito)

2. **Preencha o formulário:**
   - **Especialidade**: Selecione a especialidade médica
   - **Dia da Semana**: Escolha o dia (segunda a domingo)
   - **Quantidade de Agendamentos**: Defina a meta (ex: 15)
   - **Status**: Marque se a meta está ativa
   - **Observações** (opcional): Adicione notas explicativas

3. **Clique em "Criar Meta"**

#### Exemplo Prático:
```
Especialidade: Urologia
Dia da Semana: Segunda-feira
Quantidade: 15 agendamentos
Status: ✅ Ativo
Observações: "Meta para consultas de rotina e follow-up"
```

### 3️⃣ Editar Meta Existente

1. **Localize a especialidade** no card correspondente
2. **Encontre o dia da semana** desejado
3. **Clique no ícone de edição (✏️)**
4. **Modifique os campos** desejados
5. **Clique em "Atualizar Meta"**

### 4️⃣ Excluir Meta

1. **Localize a meta** que deseja remover
2. **Clique no ícone de lixeira (🗑️)**
3. **Confirme a exclusão**

⚠️ **Atenção**: A exclusão é permanente e não pode ser desfeita!

### 5️⃣ Desativar Meta Temporariamente

Ao invés de excluir, você pode **desativar** a meta:

1. **Edite a meta**
2. **Desmarque** "Meta ativa"
3. **Salve**

✅ Metas inativas ficam visíveis mas não são contabilizadas nos relatórios.

## 📊 Exemplos de Uso

### Exemplo 1: Hospital com Alta Demanda

**Cenário**: Hospital precisa organizar atendimentos de Cardiologia

```
Especialidade: Cardiologia

Segunda-feira: 20 agendamentos (urgências pós-fim de semana)
Terça-feira: 15 agendamentos (rotina)
Quarta-feira: 15 agendamentos (rotina)
Quinta-feira: 18 agendamentos (pré-cirúrgicos)
Sexta-feira: 12 agendamentos (fechamento da semana)
Sábado: 5 agendamentos (plantão)
Domingo: 0 (sem meta - dia fechado)

Total Semanal: 85 agendamentos
```

### Exemplo 2: Especialidade com Dias Específicos

**Cenário**: Ortopedia atende apenas em dias específicos

```
Especialidade: Ortopedia

Segunda-feira: 10 agendamentos
Terça-feira: 0 (sem meta)
Quarta-feira: 12 agendamentos
Quinta-feira: 0 (sem meta)
Sexta-feira: 10 agendamentos
Sábado: 0 (sem meta)
Domingo: 0 (sem meta)

Total Semanal: 32 agendamentos
```

### Exemplo 3: Pediatria com Variação

**Cenário**: Pediatria com demanda variável

```
Especialidade: Pediatria

Segunda-feira: 25 agendamentos (alta demanda pós-fim de semana)
Terça-feira: 20 agendamentos
Quarta-feira: 20 agendamentos
Quinta-feira: 18 agendamentos
Sexta-feira: 15 agendamentos
Sábado: 10 agendamentos
Domingo: 8 agendamentos

Total Semanal: 116 agendamentos
```

## 🎨 Interface Visual

### Cards de Especialidades

Cada especialidade é exibida em um card contendo:

```
┌─────────────────────────────────────┐
│ CARDIOLOGIA                    85   │
│ Especialidade cardiovascular   agend/semana │
│                                      │
│ Dias Ativos: 6    Total Metas: 6   │
├─────────────────────────────────────┤
│ ✅ Segunda-feira         20 agend.  │
│ ✅ Terça-feira           15 agend.  │
│ ✅ Quarta-feira          15 agend.  │
│ ✅ Quinta-feira          18 agend.  │
│ ✅ Sexta-feira           12 agend.  │
│ ✅ Sábado                 5 agend.  │
└─────────────────────────────────────┘
```

### Cores e Status

- **🔵 Azul**: Meta ativa
- **⚫ Cinza**: Meta inativa
- **✏️ Lápis**: Editar meta
- **🗑️ Lixeira**: Excluir meta

## 🗄️ Estrutura no Banco de Dados

### Tabela: `metas_especialidades`

```sql
Campos:
- id (UUID): Identificador único
- especialidade_id (UUID): Referência para especialidades
- dia_semana (ENUM): domingo, segunda, terca, quarta, quinta, sexta, sabado
- quantidade_agendamentos (INTEGER): Meta de agendamentos
- ativo (BOOLEAN): Se a meta está ativa
- hospital_id (UUID): Hospital da meta
- observacoes (TEXT): Notas adicionais
- created_at (TIMESTAMP): Data de criação
- updated_at (TIMESTAMP): Data de atualização
```

### Views Disponíveis

#### `vw_metas_especialidades_completas`
Metas com nomes de especialidades e hospitais (para relatórios)

#### `vw_resumo_metas_por_hospital`
Resumo agregado de metas por hospital

### Funções Úteis

#### `calcular_meta_semanal_especialidade(especialidade_id, hospital_id)`
Retorna o total de agendamentos meta para a semana

```sql
SELECT calcular_meta_semanal_especialidade(
    '123e4567-e89b-12d3-a456-426614174000',
    '550e8400-e29b-41d4-a716-446655440001'
);
-- Retorna: 85
```

#### `obter_meta_dia(especialidade_id, dia_semana, hospital_id)`
Retorna a meta para um dia específico

```sql
SELECT obter_meta_dia(
    '123e4567-e89b-12d3-a456-426614174000',
    'segunda',
    '550e8400-e29b-41d4-a716-446655440001'
);
-- Retorna: 15
```

## 🔧 Instalação

### 1. Executar Script SQL

Execute o script no Supabase SQL Editor:

```sql
-- Copie e execute o arquivo: create-metas-especialidades-table.sql
```

### 2. Configurar Permissões (Opcional)

Se estiver usando Row Level Security (RLS):

```sql
-- Permitir leitura
CREATE POLICY "Permitir leitura de metas" ON metas_especialidades
FOR SELECT TO anon, authenticated USING (true);

-- Permitir inserção
CREATE POLICY "Permitir inserção de metas" ON metas_especialidades
FOR INSERT TO authenticated WITH CHECK (true);

-- Permitir atualização
CREATE POLICY "Permitir atualização de metas" ON metas_especialidades
FOR UPDATE TO authenticated USING (true);

-- Permitir exclusão
CREATE POLICY "Permitir exclusão de metas" ON metas_especialidades
FOR DELETE TO authenticated USING (true);
```

### 3. Verificar Instalação

```sql
-- Verificar se a tabela foi criada
SELECT * FROM metas_especialidades LIMIT 1;

-- Verificar views
SELECT * FROM vw_metas_especialidades_completas;
SELECT * FROM vw_resumo_metas_por_hospital;
```

## 🐛 Troubleshooting

### Erro: "relation 'metas_especialidades' does not exist"

**Causa**: Tabela não foi criada no banco

**Solução**: Execute o script `create-metas-especialidades-table.sql` no Supabase SQL Editor

### Erro: "permission denied for table metas_especialidades"

**Causa**: Falta de permissões RLS

**Solução**: Execute as políticas de permissão mencionadas acima

### Metas não aparecem na interface

**Causa**: Dados não foram carregados ou hospital_id incorreto

**Solução**:
1. Verifique se você está logado
2. Verifique o hospital selecionado
3. Recarregue a página (F5)
4. Verifique o console do navegador (F12) para erros

### Não consigo criar meta duplicada

**Causa**: Já existe uma meta para a mesma especialidade + dia + hospital

**Solução**: Edite a meta existente ao invés de criar uma nova

## 📈 Relatórios e Análises

### Query para Acompanhamento de Metas

```sql
-- Metas da semana por especialidade
SELECT 
    e.nome as especialidade,
    m.dia_semana,
    m.quantidade_agendamentos as meta,
    COUNT(a.id) as agendamentos_realizados,
    (m.quantidade_agendamentos - COUNT(a.id)) as diferenca
FROM metas_especialidades m
INNER JOIN especialidades e ON m.especialidade_id = e.id
LEFT JOIN agendamentos a ON 
    a.procedimento_id IN (
        SELECT id FROM procedimentos WHERE especialidade_id = m.especialidade_id
    )
    AND EXTRACT(DOW FROM a.data_agendamento::date) = 
        CASE m.dia_semana
            WHEN 'domingo' THEN 0
            WHEN 'segunda' THEN 1
            WHEN 'terca' THEN 2
            WHEN 'quarta' THEN 3
            WHEN 'quinta' THEN 4
            WHEN 'sexta' THEN 5
            WHEN 'sabado' THEN 6
        END
WHERE m.ativo = true
  AND m.hospital_id = 'SEU-HOSPITAL-ID'
GROUP BY e.nome, m.dia_semana, m.quantidade_agendamentos
ORDER BY e.nome, m.dia_semana;
```

## 💡 Dicas e Boas Práticas

### ✅ Recomendações

1. **Defina metas realistas** baseadas no histórico de agendamentos
2. **Revise metas mensalmente** e ajuste conforme necessário
3. **Use observações** para documentar mudanças e justificativas
4. **Desative ao invés de excluir** para manter histórico
5. **Considere feriados** ao definir metas
6. **Analise capacidade** da equipe antes de definir metas altas

### ❌ Evite

1. **Metas irrealistas** que desmotivam a equipe
2. **Múltiplas metas** para o mesmo dia/especialidade
3. **Excluir metas** sem necessidade (prefira desativar)
4. **Metas sem observações** em casos especiais
5. **Ignorar feedback** da equipe sobre as metas

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no console do navegador (F12)
2. **Confirme a estrutura** do banco de dados
3. **Teste as permissões** RLS se aplicável
4. **Revise este guia** para soluções comuns

---

**Última atualização**: 2024
**Versão**: 1.0.0

