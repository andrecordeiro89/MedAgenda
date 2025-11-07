# 🗄️ ESTRUTURA DO BANCO DE DADOS - Simples e Objetivo

## 📋 APENAS 4 TABELAS

Sistema simplificado para uso interno - sem complicações!

---

## 1. TABELA: hospitais

```sql
CREATE TABLE hospitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR NOT NULL,
    cidade VARCHAR NOT NULL,
    cnpj VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
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

## 2. TABELA: usuarios

```sql
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitais(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Dados de exemplo:**
```sql
INSERT INTO usuarios (email, hospital_id) VALUES
('agendamento.sm@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'),
('agendamento.fax@medagenda.com', '4111b99d-8b4a-4b51-9561-a2fbd14e776e'),
('agendamento.car@medagenda.com', 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'),
('agendamento.ara@medagenda.com', '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a');
```

---

## 3. TABELA: especialidades

```sql
CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    nome VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
('Cirurgia Geral'),
('Anestesiologia');
```

---

## 4. TABELA: agendamentos

```sql
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_paciente VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    cidade_natal VARCHAR,
    telefone VARCHAR,
    data_agendamento DATE NOT NULL,
    hospital_id UUID REFERENCES hospitais(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Observações:**
- Campos opcionais: `cidade_natal`, `telefone`, `hospital_id`
- Campos obrigatórios: `nome_paciente`, `data_nascimento`, `data_agendamento`

---

## 📊 RELACIONAMENTOS

```
hospitais (1) ←→ (N) usuarios
hospitais (1) ←→ (N) agendamentos
especialidades (standalone - sem FK)
```

---

## 🎯 SQL COMPLETO PARA CRIAR TUDO

```sql
-- Criar extensão UUID (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Hospitais
CREATE TABLE hospitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR NOT NULL,
    cidade VARCHAR NOT NULL,
    cnpj VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitais(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Especialidades
CREATE TABLE especialidades (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    nome VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Agendamentos
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_paciente VARCHAR NOT NULL,
    data_nascimento DATE NOT NULL,
    cidade_natal VARCHAR,
    telefone VARCHAR,
    data_agendamento DATE NOT NULL,
    hospital_id UUID REFERENCES hospitais(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Popular dados iniciais
INSERT INTO hospitais (id, nome, cidade, cnpj) VALUES
('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba', 'Hospital Municipal Santa Alice', 'Santa Mariana', '14.736.446/0001-93'),
('4111b99d-8b4a-4b51-9561-a2fbd14e776e', 'Hospital Municipal Juarez Barreto de Macedo', 'Faxinal', '14.736.446/0006-06'),
('bbe11a40-2689-48af-9aa8-5c6e7f2e48da', 'Hospital Municipal São José', 'Carlópolis', '14.736.446/0007-89'),
('8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a', 'Hospital Municipal 18 de Dezembro', 'Arapoti', '14.736.446/0008-60');

INSERT INTO usuarios (email, hospital_id) VALUES
('agendamento.sm@medagenda.com', '3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'),
('agendamento.fax@medagenda.com', '4111b99d-8b4a-4b51-9561-a2fbd14e776e'),
('agendamento.car@medagenda.com', 'bbe11a40-2689-48af-9aa8-5c6e7f2e48da'),
('agendamento.ara@medagenda.com', '8c4ddaaf-33cf-47e4-8c42-9ca31b244d4a');

INSERT INTO especialidades (nome) VALUES
('Ortopedia'),
('Cardiologia'),
('Neurologia'),
('Pediatria'),
('Ginecologia'),
('Urologia'),
('Oftalmologia'),
('Dermatologia'),
('Cirurgia Geral'),
('Anestesiologia');
```

---

## ✅ PRONTO PARA USAR!

**Simples, objetivo e sem complicação.**

Sistema completo com apenas 4 tabelas para uso interno.

