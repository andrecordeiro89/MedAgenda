# 🎯 COMECE AQUI - Sistema Mock Pronto!

## ✅ TUDO PRONTO PARA USAR!

Seu sistema foi **migrado para usar localStorage** e está **100% funcional**.

---

## 🚀 PASSO A PASSO (5 MINUTOS)

### **1. Iniciar o Sistema (1 min)**

```bash
npm install
npm run dev
```

Aguarde abrir no navegador: `http://localhost:5173`

---

### **2. Fazer Login (30 seg)**

Use qualquer um destes emails (sem senha):

```
agendamento.sm@medagenda.com
```

ou:

```
agendamento.fax@medagenda.com
agendamento.car@medagenda.com
agendamento.ara@medagenda.com
```

Clique em "Entrar no Sistema"

---

### **3. Popular Dados de Exemplo (1 min)**

**Opção A - Automático (Recomendado):**

Abra o console do navegador (pressione **F12**) e cole:

```javascript
import('./services/mock-storage.js').then(m => {
    m.populateSampleData('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba');
    location.reload();
});
```

Pressione **Enter**. A página vai recarregar com dados de exemplo.

**Opção B - Manual:**

Vá em **Gerenciamento** e crie:
- Médicos
- Procedimentos
- Agendamentos

---

### **4. Testar Funcionalidades (2 min)**

✅ **Dashboard** - Ver KPIs e estatísticas

✅ **Agenda** - Visualizar calendário
   - Clique em qualquer dia para configurar Grade Cirúrgica

✅ **Gerenciamento** 
   - Criar/Editar Médicos
   - Criar/Editar Procedimentos
   - Criar/Editar Agendamentos
   - Configurar Metas de Especialidades

✅ **Avaliação Anestésica** - Ver agendamentos por data

---

### **5. Testar Grade Cirúrgica (1 min)**

1. Vá em **Agenda**
2. Clique em qualquer dia
3. Modal abre mostrando 3 dias do próximo mês
4. Clique em **"+ Especialidade"**
5. Digite "Ortopedia" e pressione Enter
6. Clique em **"+ Proc."** na linha azul
7. Digite "LCA" e pressione Enter
8. Clique no **"+"** ao lado de LCA
9. Digite nome de um paciente
10. Clique em **"💾 Salvar Grade"**

Pronto! A grade está salva no navegador.

---

## 📊 VERIFICAR SE ESTÁ FUNCIONANDO

### **No Console (F12), cole e execute:**

```javascript
// Ver se tem dados
console.log('Hospitais:', JSON.parse(localStorage.getItem('mock_hospitais')).length);
console.log('Especialidades:', JSON.parse(localStorage.getItem('mock_especialidades')).length);
console.log('Médicos:', JSON.parse(localStorage.getItem('mock_medicos') || '[]').length);
console.log('Procedimentos:', JSON.parse(localStorage.getItem('mock_procedimentos') || '[]').length);
console.log('Agendamentos:', JSON.parse(localStorage.getItem('mock_agendamentos') || '[]').length);
```

Deve mostrar números > 0 para hospitais e especialidades.

---

## 🎨 O QUE VOCÊ PODE FAZER AGORA

### ✅ **Trabalhar no Frontend:**
- Modificar componentes
- Adicionar novas telas
- Testar fluxos
- Ajustar layouts

### ✅ **Apresentar Protótipo:**
- Sistema 100% funcional
- Dados persistem no navegador
- Funciona offline
- Rápido e responsivo

### ✅ **Planejar Banco de Dados:**
- Use `ESTRUTURA-BANCO-FUTURA.md`
- Veja os tipos em `types.ts`
- Exporte dados do localStorage quando precisar

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

| Arquivo | Para quê? |
|---------|-----------|
| **`README-MODO-MOCK.md`** | 📖 Visão geral completa |
| **`INICIO-RAPIDO-MOCK.md`** | 🚀 Guia rápido de uso |
| **`MODO-MOCK-LOCALSTORAGE.md`** | 🔧 Guia técnico detalhado |
| **`ESTRUTURA-BANCO-FUTURA.md`** | 🗄️ SQL das tabelas |
| **`test-mock-system.js`** | 🧪 Script de teste |

---

## 🆘 COMANDOS ÚTEIS

### **Ver todos os dados:**
```javascript
Object.keys(localStorage)
    .filter(k => k.startsWith('mock_'))
    .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))));
```

### **Limpar tudo e começar do zero:**
```javascript
localStorage.clear();
location.reload();
```

### **Backup de dados:**
```javascript
const backup = {};
Object.keys(localStorage).forEach(k => {
    backup[k] = localStorage.getItem(k);
});
console.log(JSON.stringify(backup, null, 2));
// Copie o resultado e salve em um arquivo
```

### **Restaurar backup:**
```javascript
const backup = { /* cole o JSON aqui */ };
Object.keys(backup).forEach(k => {
    localStorage.setItem(k, backup[k]);
});
location.reload();
```

---

## 🐛 PROBLEMAS COMUNS

### **"Nenhum médico disponível"**
→ Popular dados de exemplo (passo 3)

### **"Email não cadastrado"**
→ Use um dos emails listados no passo 2

### **Dados sumiram**
→ Navegador pode ter limpado cache
→ Fazer backup regularmente

### **Sistema não carrega**
→ Verificar console (F12) para erros
→ Executar `npm install` novamente

---

## 🔄 QUANDO CRIAR O BANCO

### **No futuro, quando estiver pronto:**

1. Use `ESTRUTURA-BANCO-FUTURA.md` para criar tabelas
2. Modifique 4 arquivos (trocar imports mock por Supabase):
   - `App.tsx`
   - `components/ManagementView.tsx`
   - `components/EspecialidadesMetasView.tsx`
   - `components/GradeCirurgicaModal.tsx`
3. Configure credenciais em `services/supabase.ts`
4. Exporte dados do localStorage (se quiser manter)
5. Teste a conexão

**Detalhes completos em `MODO-MOCK-LOCALSTORAGE.md`**

---

## ✨ FUNCIONALIDADES TESTADAS

- ✅ Login com múltiplos hospitais
- ✅ Dashboard com KPIs em tempo real
- ✅ Calendário com barras de progresso
- ✅ CRUD completo (Médicos, Procedimentos, Agendamentos)
- ✅ Metas de especialidades por dia da semana
- ✅ Grades cirúrgicas com persistência
- ✅ Filtros e buscas
- ✅ Validações (conflito de horário, datas, etc.)
- ✅ Responsividade mobile

---

## 🎉 PRONTO!

Você está pronto para:
- ✅ Trabalhar no frontend
- ✅ Apresentar o protótipo
- ✅ Testar funcionalidades
- ✅ Planejar o banco de dados

**Qualquer dúvida, consulte os arquivos de documentação!**

---

## 📞 TESTE RÁPIDO

Cole no console (F12):

```javascript
// Executar script de teste completo
fetch('./test-mock-system.js')
    .then(r => r.text())
    .then(code => eval(code));
```

ou simplesmente copie o conteúdo de `test-mock-system.js` e cole no console.

---

**Última atualização:** 07/11/2025  
**Status:** ✅ Sistema 100% Funcional em Modo Mock

**Boa codificação!** 🚀

