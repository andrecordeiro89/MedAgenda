# 🗄️ ESTRUTURA DO BANCO DE DADOS - Guia para Criação

## 📋 Visão Geral

Este guia mostra a estrutura das tabelas que você precisará criar no banco de dados quando estiver pronto para migrar do localStorage.

---

## 🏗️ TABELAS PRINCIPAIS

### **1. Tabela: `hospitais`**

```sql
CREATE TABLE hospitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice
CREATE INDEX idx_hospitais_cnpj ON hospitais(cnpj);
```

**Dados de exemplo:**
```sql
INSERT INTO hospitais (id, nome, cidade, cnpj) VALUES
('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'Hospital Municipal Santa Alice', 'Santa Mariana', '14.736.446/0001-93'),
('4111b99d-8b4a-4b51-9561-a2fbd14e776e', 'Hospital Municipal Juarez Barreto de Macedo', 'Faxinal', '14.736.446/0006-06'),
('bbe11a40-2689-48af-9aa8-5c6e7f2e48da', 'Hospital Municipal São José', 'Carlópolis', '14.736.446/0007-89'),
('8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', 'Hospital Municipal 18 de Dezembro', 'Arapoti', '14.736.446/0008-60');
```

---

### **2. Tabela: `especialidades`**

```sql
CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Dados de exemplo:**
```sql
INSERT INTO especialidades (nome) VALUES
('Ortopedia'),
('Cardiologia'),
('Neurologia'),
('Pediatria'),
('Ginecologia'),
('Urologia'),
('Oftalmologia'),
('Dermatologia'),
('Psiquiatria'),
('Anestesiologia');
```

---

### **3. Tabela: `medicos`**

```sql
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    especialidade VARCHAR(255) NOT NULL,
    crm VARCHAR(50) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_medicos_hospital_id ON medicos(hospital_id);
CREATE INDEX idx_medicos_especialidade ON medicos(especialidade);
```

**Relacionamentos:**
- `hospital_id` → `hospitais.id` (FK)

**Campos importantes:**
- `nome`: Nome completo do médico
- `especialidade`: Texto livre (pode virar FK no futuro)
- `crm`: Registro do médico
- `telefone`: Formato livre
- `email`: Email de contato
- `hospital_id`: Hospital onde o médico atende

---

### **4. Tabela: `procedimentos`**

```sql
CREATE TABLE procedimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cirurgico', 'ambulatorial')),
    duracao_estimada_min INTEGER,
    descricao TEXT,
    especialidade VARCHAR(255),
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_procedimentos_hospital_id ON procedimentos(hospital_id);
CREATE INDEX idx_procedimentos_tipo ON procedimentos(tipo);
```

**Relacionamentos:**
- `hospital_id` → `hospitais.id` (FK)

**Campos importantes:**
- `nome`: Nome do procedimento
- `tipo`: 'cirurgico' ou 'ambulatorial'
- `duracao_estimada_min`: Duração em minutos (pode ser NULL)
- `descricao`: Descrição detalhada
- `especialidade`: Especialidade relacionada
- `hospital_id`: Hospital onde o procedimento é realizado

---

### **5. Tabela: `agendamentos`**

```sql
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_paciente VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    cidade_natal VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    data_agendamento DATE NOT NULL,
    status_liberacao VARCHAR(20) NOT NULL DEFAULT 'pendente' 
        CHECK (status_liberacao IN ('pendente', 'liberado')),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    procedimento_id UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Um médico pode ter apenas 1 agendamento por data
    UNIQUE(medico_id, data_agendamento)
);

-- Índices
CREATE INDEX idx_agendamentos_hospital_id ON agendamentos(hospital_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_agendamento);
CREATE INDEX idx_agendamentos_medico_id ON agendamentos(medico_id);
CREATE INDEX idx_agendamentos_status ON agendamentos(status_liberacao);
```

**Relacionamentos:**
- `medico_id` → `medicos.id` (FK)
- `procedimento_id` → `procedimentos.id` (FK)
- `hospital_id` → `hospitais.id` (FK)

**Campos importantes:**
- `nome_paciente`: Nome completo do paciente
- `data_nascimento`: Data de nascimento (idade calculada no frontend)
- `data_agendamento`: Data do agendamento
- `status_liberacao`: 'pendente' ou 'liberado'
- **Nota:** Campo `horario` foi removido (um médico = uma data)

---

### **6. Tabela: `metas_especialidades`**

```sql
CREATE TABLE metas_especialidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialidade_id UUID NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    dia_semana VARCHAR(10) NOT NULL 
        CHECK (dia_semana IN ('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado')),
    quantidade_agendamentos INTEGER NOT NULL CHECK (quantidade_agendamentos > 0),
    ativo BOOLEAN NOT NULL DEFAULT true,
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Uma especialidade pode ter apenas uma meta por dia por hospital
    UNIQUE(especialidade_id, dia_semana, hospital_id)
);

-- Índices
CREATE INDEX idx_metas_hospital_id ON metas_especialidades(hospital_id);
CREATE INDEX idx_metas_especialidade_id ON metas_especialidades(especialidade_id);
CREATE INDEX idx_metas_ativo ON metas_especialidades(ativo);
```

**Relacionamentos:**
- `especialidade_id` → `especialidades.id` (FK)
- `hospital_id` → `hospitais.id` (FK)

**Campos importantes:**
- `dia_semana`: Dia da semana (domingo, segunda, etc.)
- `quantidade_agendamentos`: Meta de agendamentos para aquele dia
- `ativo`: Se a meta está ativa ou não
- `observacoes`: Notas sobre a meta

---

### **7. Tabelas: Grades Cirúrgicas**

```sql
-- Tabela principal de grades
CREATE TABLE grades_cirurgicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitais(id) ON DELETE CASCADE,
    dia_semana VARCHAR(10) NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(hospital_id, dia_semana, mes_referencia)
);

-- Dias específicos da grade
CREATE TABLE grades_cirurgicas_dias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id UUID NOT NULL REFERENCES grades_cirurgicas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    dia_semana VARCHAR(10) NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itens da grade (especialidades e procedimentos)
CREATE TABLE grades_cirurgicas_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dia_id UUID NOT NULL REFERENCES grades_cirurgicas_dias(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('especialidade', 'procedimento')),
    especialidade_id UUID REFERENCES especialidades(id) ON DELETE SET NULL,
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL,
    texto VARCHAR(255) NOT NULL,
    ordem INTEGER NOT NULL,
    pacientes TEXT[], -- Array de nomes de pacientes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_grades_hospital_id ON grades_cirurgicas(hospital_id);
CREATE INDEX idx_grades_dias_grade_id ON grades_cirurgicas_dias(grade_id);
CREATE INDEX idx_grades_itens_dia_id ON grades_cirurgicas_itens(dia_id);
```

---

## 🔧 TRIGGERS E FUNÇÕES

### **1. Auto-update de `updated_at`**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar em todas as tabelas
CREATE TRIGGER update_hospitais_updated_at 
    BEFORE UPDATE ON hospitais
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at 
    BEFORE UPDATE ON medicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedimentos_updated_at 
    BEFORE UPDATE ON procedimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_updated_at 
    BEFORE UPDATE ON metas_especialidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 VIEWS ÚTEIS

### **1. View de Agendamentos Completos**

```sql
CREATE OR REPLACE VIEW vw_agendamentos_completos AS
SELECT 
    a.id,
    a.nome_paciente,
    a.data_nascimento,
    EXTRACT(YEAR FROM AGE(a.data_nascimento)) AS idade,
    a.cidade_natal,
    a.telefone,
    a.whatsapp,
    a.data_agendamento,
    a.status_liberacao,
    
    -- Dados do médico
    m.id AS medico_id,
    m.nome AS medico_nome,
    m.especialidade AS medico_especialidade,
    m.crm AS medico_crm,
    
    -- Dados do procedimento
    p.id AS procedimento_id,
    p.nome AS procedimento_nome,
    p.tipo AS procedimento_tipo,
    p.duracao_estimada_min,
    
    -- Dados do hospital
    h.id AS hospital_id,
    h.nome AS hospital_nome,
    h.cidade AS hospital_cidade,
    
    a.created_at,
    a.updated_at
FROM agendamentos a
JOIN medicos m ON a.medico_id = m.id
JOIN procedimentos p ON a.procedimento_id = p.id
JOIN hospitais h ON a.hospital_id = h.id;
```

### **2. View de Metas Completas**

```sql
CREATE OR REPLACE VIEW vw_metas_completas AS
SELECT 
    m.id,
    m.especialidade_id,
    e.nome AS especialidade_nome,
    m.dia_semana,
    m.quantidade_agendamentos,
    m.ativo,
    m.hospital_id,
    h.nome AS hospital_nome,
    m.observacoes,
    m.created_at,
    m.updated_at
FROM metas_especialidades m
JOIN especialidades e ON m.especialidade_id = e.id
JOIN hospitais h ON m.hospital_id = h.id;
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### **Habilitar RLS:**

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_especialidades ENABLE ROW LEVEL SECURITY;
```

### **Políticas básicas (permitir tudo - ajustar conforme necessário):**

```sql
-- Permitir SELECT para todos (anon + authenticated)
CREATE POLICY "Permitir leitura" ON hospitais FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura" ON especialidades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura" ON medicos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura" ON procedimentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura" ON agendamentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir leitura" ON metas_especialidades FOR SELECT TO anon, authenticated USING (true);

-- Permitir INSERT/UPDATE/DELETE para authenticated
CREATE POLICY "Permitir inserção" ON medicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização" ON medicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir exclusão" ON medicos FOR DELETE TO authenticated USING (true);

-- Repetir para outras tabelas...
```

---

## 📝 MAPEAMENTO: localStorage → Banco

| localStorage Key | Tabela no Banco |
|-----------------|----------------|
| `mock_hospitais` | `hospitais` |
| `mock_especialidades` | `especialidades` |
| `mock_medicos` | `medicos` |
| `mock_procedimentos` | `procedimentos` |
| `mock_agendamentos` | `agendamentos` |
| `mock_metas` | `metas_especialidades` |
| `grade_*` | `grades_cirurgicas` + `grades_cirurgicas_dias` + `grades_cirurgicas_itens` |

---

## 🚀 SCRIPT COMPLETO DE SETUP

Salve isso como `setup-database.sql`:

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar todas as tabelas na ordem correta
-- (copie as definições acima na ordem)

-- 1. hospitais
-- 2. especialidades
-- 3. medicos
-- 4. procedimentos
-- 5. agendamentos
-- 6. metas_especialidades
-- 7. grades_cirurgicas
-- 8. grades_cirurgicas_dias
-- 9. grades_cirurgicas_itens

-- Criar triggers
-- Criar views
-- Configurar RLS (se necessário)

-- Inserir dados iniciais
-- (hospitais e especialidades)
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

Quando for migrar do mock para o banco real:

- [ ] Criar todas as tabelas no Supabase
- [ ] Executar triggers e funções
- [ ] Criar views
- [ ] Configurar RLS (se necessário)
- [ ] Inserir dados iniciais (hospitais, especialidades)
- [ ] Exportar dados do localStorage (se quiser manter)
- [ ] Modificar imports nos arquivos do frontend
- [ ] Testar conexão com Supabase
- [ ] Testar CRUD de cada entidade
- [ ] Verificar filtros e validações
- [ ] Fazer backup do localStorage antes de limpar

---

## 💡 DICAS IMPORTANTES

1. **Use UUIDs** - Manter os IDs gerados pelo mock facilita migração
2. **Mantenha os nomes** - Use exatamente os mesmos nomes de campos
3. **Foreign Keys** - Configure ON DELETE CASCADE onde apropriado
4. **Índices** - Adicione índices nas colunas de filtro
5. **Validações** - Adicione CHECKs para garantir integridade
6. **Timestamps** - Use triggers para auto-update
7. **Views** - Crie views para consultas complexas
8. **RLS** - Configure depois de testar tudo funcionando

---

**Pronto! Use este guia quando for criar o banco de dados real.** 🎉

