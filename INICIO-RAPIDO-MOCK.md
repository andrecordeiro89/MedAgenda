# 🚀 INÍCIO RÁPIDO - Modo Mock

## ✅ O Sistema Está Pronto!

O frontend está configurado para funcionar 100% com **localStorage**. Você pode trabalhar tranquilamente sem precisar de banco de dados.

---

## 📦 Instalação e Execução

```bash
# Instalar dependências (se ainda não fez)
npm install

# Iniciar o sistema
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🔐 Fazer Login

Use qualquer um destes emails:

```
agendamento.sm@medagenda.com      → Hospital Santa Alice (Santa Mariana)
agendamento.fax@medagenda.com     → Hospital Juarez Barreto (Faxinal)
agendamento.car@medagenda.com     → Hospital São José (Carlópolis)
agendamento.ara@medagenda.com     → Hospital 18 de Dezembro (Arapoti)
```

O sistema vai funcionar **exatamente como antes**, mas salvando tudo no localStorage.

---

## 📊 Dados Iniciais

Ao fazer login pela primeira vez, você terá:
- ✅ Hospital selecionado
- ✅ 10 Especialidades disponíveis
- ❌ Médicos (vazio)
- ❌ Procedimentos (vazio)
- ❌ Agendamentos (vazio)

---

## 🎯 Popular com Dados de Exemplo

### **Opção 1: Automático (recomendado)**

Adicione esta linha no `App.tsx`, dentro do `useEffect`:

```typescript
// Linha 116 aproximadamente, dentro de loadData()
useEffect(() => {
    if (isAuthenticated && hospitalSelecionado) {
        loadData();
        
        // 🔥 ADICIONE ESTA LINHA:
        populateSampleData(hospitalSelecionado.id);
    }
}, [isAuthenticated, hospitalSelecionado]);
```

**Atenção:** Isso vai popular os dados **toda vez** que fizer login. Para popular apenas uma vez, comente a linha depois.

### **Opção 2: Manual (no console)**

Abra o console do navegador (F12) e execute:

```javascript
// Ver o ID do hospital atual
console.log(window.localStorage.getItem('medagenda-auth'));

// Popular dados para o hospital específico
import('./services/mock-storage.js').then(module => {
    module.populateSampleData('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba');
    location.reload();
});
```

### **Dados criados automaticamente:**
- ✅ 3 Médicos (Ortopedia, Cardiologia, Neurologia)
- ✅ 3 Procedimentos (Consulta, Cirurgia de Joelho, ECG)
- ❌ Agendamentos (você cria manualmente)

---

## 🎨 Usar o Sistema

### **1. Dashboard**
- Ver KPIs gerais
- Ver agendamentos do dia

### **2. Agenda (Calendário)**
- Visualizar mês
- Clicar em dias para configurar Grade Cirúrgica
- Ver barras de progresso (quando tiver metas configuradas)

### **3. Gerenciamento**

#### **Aba Agendamentos:**
- Criar novo agendamento
- Editar/excluir agendamentos
- Filtrar por status, tipo, médico, especialidade

#### **Aba Médicos:**
- Criar médico
- Editar/excluir médicos

#### **Aba Procedimentos:**
- Criar procedimento (Cirúrgico ou Ambulatorial)
- Editar/excluir procedimentos

#### **Aba Metas de Especialidades:**
- Definir metas por especialidade + dia da semana
- Ver resumo por especialidade

#### **Aba SIGTAP:**
- Buscar procedimentos externos (ainda conecta com Supabase externo)
- Exportar para Excel

### **4. Avaliação Anestésica**
- Calendário com agendamentos
- Clicar no nome do paciente para ver detalhes

---

## 💾 Gerenciar Dados no localStorage

### **Ver dados no console (F12):**

```javascript
// Ver todos os médicos
JSON.parse(localStorage.getItem('mock_medicos'));

// Ver todos os agendamentos
JSON.parse(localStorage.getItem('mock_agendamentos'));

// Ver todos os procedimentos
JSON.parse(localStorage.getItem('mock_procedimentos'));

// Ver especialidades
JSON.parse(localStorage.getItem('mock_especialidades'));

// Ver hospitais
JSON.parse(localStorage.getItem('mock_hospitais'));
```

### **Limpar dados:**

```javascript
// Limpar tudo
localStorage.clear();
location.reload();

// Limpar apenas um tipo
localStorage.removeItem('mock_medicos');
localStorage.removeItem('mock_agendamentos');
```

### **Backup de dados:**

```javascript
// Exportar todos os dados
const backup = {
    medicos: localStorage.getItem('mock_medicos'),
    procedimentos: localStorage.getItem('mock_procedimentos'),
    agendamentos: localStorage.getItem('mock_agendamentos'),
    metas: localStorage.getItem('mock_metas')
};

// Copiar JSON
console.log(JSON.stringify(backup, null, 2));

// Para restaurar depois:
Object.keys(backup).forEach(key => {
    localStorage.setItem(`mock_${key}`, backup[key]);
});
```

---

## 🎭 Testar Funcionalidades

### **Criar Agendamento:**
1. Gerenciamento > Agendamentos
2. Botão "Novo Agendamento"
3. Preencher dados
4. Salvar

### **Configurar Grade Cirúrgica:**
1. Agenda
2. Clicar em qualquer dia
3. Modal abre com 3 dias do próximo mês
4. Adicionar especialidades
5. Adicionar procedimentos
6. Adicionar pacientes
7. Clicar "Replicar" para copiar para outros dias
8. Salvar

### **Definir Metas:**
1. Gerenciamento > Metas de Especialidades
2. Botão "Nova Meta"
3. Selecionar especialidade + dia da semana
4. Definir quantidade
5. Salvar
6. Ver barra de progresso no calendário

---

## 🐛 Problemas Comuns

### **"Nenhum médico disponível"**
→ Popular dados de exemplo ou criar médico manualmente

### **"Nenhum procedimento disponível"**
→ Popular dados de exemplo ou criar procedimento manualmente

### **Dados sumiram após fechar navegador**
→ localStorage persiste, mas pode ser limpo por configurações do navegador
→ Fazer backup dos dados importantes

### **Erro ao salvar**
→ Abrir console (F12) e verificar erros
→ Verificar se os campos obrigatórios estão preenchidos

---

## 📚 Documentação Completa

- `MODO-MOCK-LOCALSTORAGE.md` - Guia completo do modo mock
- `ESTRUTURA-BANCO-FUTURA.md` - Estrutura das tabelas para criar no banco
- `services/mock-storage.ts` - Código dos serviços mock

---

## 🔄 Próximos Passos

1. ✅ **Trabalhar no frontend** - Tudo funcionando
2. ✅ **Apresentar protótipo** - Dados persistem no navegador
3. ✅ **Modelar banco** - Use `ESTRUTURA-BANCO-FUTURA.md` como guia
4. ✅ **Criar tabelas** - No Supabase quando estiver pronto
5. ✅ **Migrar para Supabase** - Descomentar imports originais
6. ✅ **Importar dados** - Exportar do localStorage e importar no banco

---

## ⚡ Comandos Úteis

```javascript
// 1. POPULAR DADOS DE EXEMPLO
import('./services/mock-storage.js').then(m => {
    m.populateSampleData('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba');
    location.reload();
});

// 2. VER TODOS OS DADOS
Object.keys(localStorage)
    .filter(k => k.startsWith('mock_'))
    .forEach(k => {
        console.log(k + ':', JSON.parse(localStorage.getItem(k)));
    });

// 3. LIMPAR TUDO
localStorage.clear();
location.reload();

// 4. BACKUP COMPLETO
const backup = {};
Object.keys(localStorage).forEach(k => {
    backup[k] = localStorage.getItem(k);
});
console.log(JSON.stringify(backup, null, 2));

// 5. RESTAURAR BACKUP
const backup = { /* cole o JSON aqui */ };
Object.keys(backup).forEach(k => {
    localStorage.setItem(k, backup[k]);
});
location.reload();
```

---

## 🎉 Pronto para Começar!

Agora você pode:
- ✅ Trabalhar no frontend livremente
- ✅ Testar todas as funcionalidades
- ✅ Apresentar o protótipo
- ✅ Planejar o banco de dados
- ✅ Migrar quando estiver pronto

**Boa codificação!** 🚀

