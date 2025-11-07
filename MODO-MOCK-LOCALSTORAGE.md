# 🔧 MODO MOCK - Usando localStorage

## 📋 Visão Geral

O sistema foi configurado para funcionar **100% com localStorage**, permitindo que você trabalhe no frontend sem precisar do banco de dados. Todos os dados são salvos no navegador.

---

## ✅ O que foi feito

### **1. Criado arquivo `services/mock-storage.ts`**
- Simula todos os serviços do Supabase
- Usa localStorage para persistir dados
- Mantém todas as interfaces e tipos
- Compatível com código existente

### **2. Modificados os arquivos:**
- ✅ `App.tsx` - Usando serviços mock
- ✅ `components/ManagementView.tsx` - Usando serviços mock
- ✅ `components/EspecialidadesMetasView.tsx` - Usando serviços mock
- ✅ `components/GradeCirurgicaModal.tsx` - Usando serviços mock

---

## 🚀 Como Usar

### **Iniciar o Sistema:**

```bash
npm run dev
```

O sistema vai funcionar **exatamente como antes**, mas salvando tudo no localStorage.

### **Dados Iniciais:**

Ao abrir pela primeira vez, o sistema já vem com:
- ✅ 4 Hospitais pré-configurados
- ✅ 10 Especialidades médicas
- ✅ Dados vazios (médicos, procedimentos, agendamentos)

### **Popular com Dados de Exemplo:**

No console do navegador (F12), execute:

```javascript
// Importar função (já está disponível globalmente)
import { populateSampleData } from './services/mock-storage';

// Popular dados para um hospital específico
populateSampleData('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba');
```

Ou adicione esta linha no `App.tsx` para popular automaticamente:

```typescript
// No useEffect após login
useEffect(() => {
    if (isAuthenticated && hospitalSelecionado) {
        loadData();
        
        // ADICIONE ESTA LINHA PARA POPULAR DADOS DE EXEMPLO (apenas uma vez)
        // populateSampleData(hospitalSelecionado.id);
    }
}, [isAuthenticated, hospitalSelecionado]);
```

---

## 📊 Estrutura dos Dados no localStorage

### **Chaves usadas:**

```javascript
mock_hospitais          // Lista de hospitais
mock_especialidades     // Lista de especialidades
mock_medicos            // Lista de médicos
mock_procedimentos      // Lista de procedimentos
mock_agendamentos       // Lista de agendamentos
mock_metas              // Metas de especialidades
grade_{hospitalId}_{diaSemana}_{mesReferencia}  // Grades cirúrgicas
```

### **Ver dados no console:**

```javascript
// Ver todos os médicos
JSON.parse(localStorage.getItem('mock_medicos'));

// Ver todos os agendamentos
JSON.parse(localStorage.getItem('mock_agendamentos'));

// Ver todas as especialidades
JSON.parse(localStorage.getItem('mock_especialidades'));
```

---

## 🔄 Funcionalidades Disponíveis

### **✅ Totalmente Funcionais:**

1. **Login** - Sistema de autenticação mock
2. **Dashboard** - KPIs e visualizações
3. **Calendário** - Visualização mensal
4. **CRUD Completo:**
   - Criar/editar/excluir médicos
   - Criar/editar/excluir procedimentos
   - Criar/editar/excluir agendamentos
   - Criar/editar/excluir metas
5. **Grades Cirúrgicas** - Salvas no localStorage
6. **Filtros** - Todos os filtros funcionam
7. **Validações** - Todas as validações funcionam

### **⚠️ Limitações:**

1. **Dados por navegador** - Cada navegador tem seus próprios dados
2. **Sem sincronização** - Não há sincronização entre dispositivos
3. **Tamanho limitado** - localStorage tem limite ~5-10MB
4. **Pode ser limpo** - Usuário pode limpar cache do navegador

---

## 🗑️ Limpar Todos os Dados

### **No Console do Navegador (F12):**

```javascript
// Limpar TODOS os dados mock
localStorage.clear();

// Ou usar a função específica (importar primeiro)
import { clearAllMockData } from './services/mock-storage';
clearAllMockData();
```

### **Recarregar a página:**
Os dados iniciais (hospitais e especialidades) serão recriados automaticamente.

---

## 🔄 Voltar para Supabase (Quando o Banco Estiver Pronto)

### **Passo 1: Modificar `App.tsx`**

```typescript
// COMENTAR estas linhas:
// import { mockServices, populateSampleData } from './services/mock-storage';
// const simpleMedicoService = mockServices.medico;
// ...

// DESCOMENTAR estas linhas:
import { 
    simpleMedicoService, 
    simpleProcedimentoService,
    simpleAgendamentoService,
    simpleEspecialidadeService,
    simpleMetaEspecialidadeService
} from './services/api-simple';
import { testSupabaseConnection } from './services/supabase';
```

### **Passo 2: Modificar `components/ManagementView.tsx`**

```typescript
// DESCOMENTAR:
import { 
    simpleMedicoService,
    simpleProcedimentoService,
    simpleAgendamentoService
} from '../services/api-simple';

// COMENTAR:
// import { mockServices } from '../services/mock-storage';
```

### **Passo 3: Fazer o mesmo para:**
- `components/EspecialidadesMetasView.tsx`
- `components/GradeCirurgicaModal.tsx`

### **Passo 4: Configurar Supabase**
1. Criar tabelas no banco de dados
2. Configurar credenciais em `services/supabase.ts`
3. Testar conexão

---

## 📝 Exportar Dados do localStorage para SQL

### **Script para gerar INSERT statements:**

```javascript
// No console do navegador
function exportToSQL() {
    const medicos = JSON.parse(localStorage.getItem('mock_medicos') || '[]');
    const procedimentos = JSON.parse(localStorage.getItem('mock_procedimentos') || '[]');
    const agendamentos = JSON.parse(localStorage.getItem('mock_agendamentos') || '[]');
    
    let sql = '-- MÉDICOS\n';
    medicos.forEach(m => {
        sql += `INSERT INTO medicos (id, nome, especialidade, crm, telefone, email, hospital_id) VALUES ('${m.id}', '${m.nome}', '${m.especialidade}', '${m.crm}', '${m.telefone}', '${m.email}', '${m.hospitalId}');\n`;
    });
    
    sql += '\n-- PROCEDIMENTOS\n';
    procedimentos.forEach(p => {
        sql += `INSERT INTO procedimentos (id, nome, tipo, duracao_estimada_min, descricao, hospital_id) VALUES ('${p.id}', '${p.nome}', '${p.tipo}', ${p.duracaoEstimada}, '${p.descricao}', '${p.hospitalId}');\n`;
    });
    
    sql += '\n-- AGENDAMENTOS\n';
    agendamentos.forEach(a => {
        sql += `INSERT INTO agendamentos (id, nome_paciente, data_nascimento, cidade_natal, telefone, whatsapp, data_agendamento, status_liberacao, medico_id, procedimento_id, hospital_id) VALUES ('${a.id}', '${a.nome}', '${a.dataNascimento}', '${a.cidadeNatal}', '${a.telefone}', '${a.whatsapp}', '${a.dataAgendamento}', '${a.statusLiberacao === 'v' ? 'liberado' : 'pendente'}', '${a.medicoId}', '${a.procedimentoId}', '${a.hospitalId}');\n`;
    });
    
    console.log(sql);
    return sql;
}

// Executar e copiar o resultado
const sql = exportToSQL();
```

---

## 🎯 Dicas de Uso

### **1. Desenvolver novas telas:**
- Todas as novas telas podem usar os mesmos serviços mock
- Basta importar `mockServices` e usar

### **2. Testar validações:**
- Todas as validações funcionam normalmente
- Você pode testar conflitos de horário, etc.

### **3. Demonstração/Protótipo:**
- Perfeito para apresentar o sistema
- Dados persistem entre reloads da página
- Funciona offline

### **4. Popular dados rapidamente:**
- Use `populateSampleData()` para criar dados de teste
- Ou crie seus próprios scripts de população

### **5. Backup de dados:**
- Exporte os dados do localStorage periodicamente
- Use JSON.stringify para fazer backup

---

## ⚠️ Importante

### **Não esqueça de:**

1. ✅ Fazer backup dos dados importantes do localStorage
2. ✅ Exportar dados antes de limpar o cache do navegador
3. ✅ Documentar mudanças na estrutura de dados
4. ✅ Planejar a estrutura do banco antes de criar

### **Quando criar o banco:**

1. Use os tipos em `types.ts` como referência
2. Mantenha os nomes das propriedades
3. Adicione índices nas foreign keys
4. Configure Row Level Security (RLS)

---

## 🎉 Pronto!

Agora você pode:
- ✅ Trabalhar 100% no frontend
- ✅ Apresentar o protótipo funcionando
- ✅ Testar todas as funcionalidades
- ✅ Planejar a estrutura do banco com calma
- ✅ Migrar para Supabase quando estiver pronto

**Qualquer dúvida, consulte os comentários no código!** 🚀

