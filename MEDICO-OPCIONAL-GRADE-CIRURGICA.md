# 👥 Médico Opcional na Grade Cirúrgica

## ✅ Implementação Completa

Solução implementada para permitir cadastrar **apenas a especialidade** na Grade Cirúrgica, **sem obrigar** a seleção de um médico específico. Isso atende casos de **equipes médicas** que trabalham juntas.

---

## 🎯 Problema Resolvido

**Antes:** Era obrigatório selecionar um médico ao cadastrar uma especialidade na Grade Cirúrgica.

**Depois:** Médico é **opcional**. Pode cadastrar apenas a especialidade para casos de equipes médicas.

---

## 📋 Mudanças Implementadas

### 1. **Novo Botão "Pular Médico"** (Etapa 1)

**Localização:** `components/GradeCirurgicaModal.tsx` - linha 1766-1773

**Funcionalidade:**
- Botão roxo "⏭ Pular Médico" na etapa de seleção de especialidade
- Permite ir direto para a etapa de procedimentos
- Pula completamente a etapa de seleção de médico

```tsx
<button
  onClick={handlePularMedico}
  disabled={!especialidadeSelecionada}
  className="px-3 py-1 bg-purple-600 hover:bg-purple-700..."
  title="Pular Médico: Ir direto para Procedimentos (para equipes médicas)"
>
  ⏭ Pular Médico
</button>
```

### 2. **Médico Opcional na Etapa 2**

**Mudanças:**
- Botão "Próximo" agora funciona **mesmo sem selecionar médico**
- Texto do botão muda: "Continuar sem Médico" quando não há médico selecionado
- Validação removida: não exige mais médico para avançar

**Antes:**
```tsx
disabled={!medicoSelecionado || carregandoMedicos}
```

**Depois:**
```tsx
disabled={carregandoMedicos} // Médico não é mais obrigatório
```

### 3. **Validação Atualizada**

**Função:** `handleSalvarAgendamento()` - linha 470

**Antes:**
```typescript
if (!especialidadeNome || !medicoSelecionado || addingEspecialidade === null) {
  mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade e selecione um médico', 'aviso');
  return;
}
```

**Depois:**
```typescript
if (!especialidadeNome || addingEspecialidade === null) {
  mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade', 'aviso');
  return;
}

// Médico é opcional - pode ser vazio para equipes médicas
const nomeMedico = getNomeMedicoSelecionado() || null;
```

### 4. **Salvamento no Banco**

**Mudanças:**
- Campo `medico` agora pode ser `null` no banco
- Linha de especialidade salva com `medico: null` quando não há médico
- Procedimentos também salvos com `medico: null` quando aplicável

**Exemplo:**
```typescript
await agendamentoService.create({
  nome_paciente: '',
  data_nascimento: '2000-01-01',
  data_agendamento: dataFormatada,
  especialidade: especialidadeNome,
  medico: nomeMedico || null, // Médico opcional (null para equipes)
  hospital_id: hospitalId || null,
  is_grade_cirurgica: true
});
```

### 5. **Exibição na Grade**

**Mudanças:**
- Quando há médico: `"Ortopedia - Dr. Diogo"`
- Quando **não há médico**: `"Ortopedia"` (apenas especialidade)

**Código:**
```typescript
const textoEspecialidade = grupo.medico 
  ? `${grupo.especialidade} - ${grupo.medico}`
  : grupo.especialidade;
```

### 6. **Resumo na Etapa 3**

**Mudanças:**
- Mostra "Equipe Médica (sem médico específico)" quando não há médico
- Estilo roxo para indicar que é equipe médica

```tsx
{!getNomeMedicoSelecionado() && (
  <>
    <span className="text-xs text-blue-900">•</span>
    <span className="text-xs text-purple-600 italic">
      <strong>Equipe Médica</strong> (sem médico específico)
    </span>
  </>
)}
```

### 7. **Reagrupamento de Dados**

**Mudanças:**
- Agrupa por especialidade mesmo sem médico
- Chave de agrupamento: `"Ortopedia|||(sem médico)"` quando não há médico
- Compatível com registros antigos que têm médico

---

## 🎨 Fluxo Atualizado

### **Opção 1: Com Médico (Fluxo Original)**
```
1. Selecionar Especialidade
   ↓ [Próximo]
2. Selecionar Médico
   ↓ [Próximo]
3. Adicionar Procedimentos
   ↓ [Salvar]
✅ Salva: "Ortopedia - Dr. Diogo"
```

### **Opção 2: Sem Médico (NOVO)**
```
1. Selecionar Especialidade
   ↓ [⏭ Pular Médico] ← NOVO BOTÃO
3. Adicionar Procedimentos
   ↓ [Salvar]
✅ Salva: "Ortopedia" (sem médico)
```

### **Opção 3: Pular na Etapa 2**
```
1. Selecionar Especialidade
   ↓ [Próximo]
2. Selecionar Médico (OPCIONAL)
   ↓ [Continuar sem Médico] ← Botão funciona mesmo vazio
3. Adicionar Procedimentos
   ↓ [Salvar]
✅ Salva: "Ortopedia" (sem médico)
```

---

## 📊 Estrutura no Banco

### **Registro com Médico:**
```sql
INSERT INTO agendamentos (
  especialidade,  -- 'Ortopedia'
  medico,         -- 'Dr. Diogo'
  procedimentos,  -- NULL (linha de especialidade)
  is_grade_cirurgica -- true
)
```

### **Registro sem Médico (Equipe):**
```sql
INSERT INTO agendamentos (
  especialidade,  -- 'Ortopedia'
  medico,         -- NULL ← NOVO (permitido)
  procedimentos,  -- NULL (linha de especialidade)
  is_grade_cirurgica -- true
)
```

---

## ✅ Funcionalidades Mantidas

- ✅ Todas as funcionalidades anteriores continuam funcionando
- ✅ Compatibilidade com registros antigos (com médico)
- ✅ Replicação de grade funciona com ou sem médico
- ✅ Adicionar procedimentos funciona com ou sem médico
- ✅ Filtro de grade cirúrgica na Documentação continua funcionando

---

## 🎯 Casos de Uso

### **Caso 1: Equipe Médica**
- Especialidade: "Ortopedia"
- Médico: (não especificado)
- Procedimentos: LCA, MENISCO, PTJ
- **Resultado:** Grade mostra apenas "Ortopedia" com seus procedimentos

### **Caso 2: Médico Específico**
- Especialidade: "Ortopedia"
- Médico: "Dr. Diogo"
- Procedimentos: LCA, MENISCO
- **Resultado:** Grade mostra "Ortopedia - Dr. Diogo" com seus procedimentos

### **Caso 3: Múltiplas Equipes na Mesma Data**
- Especialidade 1: "Ortopedia" (sem médico)
- Especialidade 2: "Cardiologia" (sem médico)
- **Resultado:** Ambas aparecem na grade, agrupadas por especialidade

---

## 🔍 Validações

### **Obrigatório:**
- ✅ Especialidade (deve ser selecionada)

### **Opcional:**
- ⚪ Médico (pode ser pulado)
- ⚪ Procedimentos (pode salvar apenas especialidade)

---

## 📝 Notas Importantes

1. **Compatibilidade:** Registros antigos com médico continuam funcionando normalmente
2. **Banco de Dados:** Campo `medico` aceita `NULL` (já era nullable)
3. **Exibição:** Interface adapta automaticamente para mostrar com ou sem médico
4. **Filtros:** Todos os filtros continuam funcionando normalmente

---

## 🐛 Troubleshooting

### **Problema: Botão "Pular Médico" não aparece**

**Solução:** Verificar se está na Etapa 1 (seleção de especialidade)

### **Problema: Erro ao salvar sem médico**

**Solução:** Verificar se o campo `medico` no banco aceita `NULL` (deve aceitar)

### **Problema: Grade não mostra especialidade sem médico**

**Solução:** Verificar se o reagrupamento está considerando casos sem médico (já implementado)

---

## ✅ Status

**Implementação:** ✅ Completa  
**Testes:** ⚠️ Recomendado testar antes de usar em produção  
**Compatibilidade:** ✅ Total com registros antigos

