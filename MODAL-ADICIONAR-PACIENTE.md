# 📋 Modal de Adicionar Paciente aos Procedimentos

## 🎯 Objetivo

Implementar um modal completo para vincular pacientes aos procedimentos já criados na grade cirúrgica, **atualizando** o registro existente no banco de dados ao invés de criar um novo.

---

## 🔄 Fluxo de Funcionamento

### 1. **Criar Grade Cirúrgica**
- Usuário cria especialidade, médico e procedimentos (sem paciente)
- Os registros são salvos no banco com `nome_paciente` vazio

### 2. **Vincular Paciente**
- Usuário clica no botão **"+"** verde ao lado do procedimento
- Abre modal com campos para preencher dados do paciente
- Sistema faz **UPDATE** no registro existente usando o `agendamentoId`

---

## 📝 Campos do Modal

| Campo | Coluna no Banco | Obrigatório | Tipo |
|-------|----------------|-------------|------|
| Nome do Paciente | `nome_paciente` | ✅ Sim | texto |
| Data de Nascimento | `data_nascimento` | ✅ Sim | data |
| Cidade | `cidade_natal` | ❌ Não | texto |
| Telefone | `telefone` | ❌ Não | texto |
| Data de Consulta | `data_consulta` | ❌ Não | data |

---

## 🛠️ Implementação Técnica

### 1. **Tipo `Agendamento`** (`types.ts`)

```typescript
export interface Agendamento {
  id?: string;
  nome_paciente: string;
  data_nascimento: string;
  cidade_natal?: string | null;
  telefone?: string | null;
  data_agendamento: string;
  data_consulta?: string | null; // 🆕 NOVO CAMPO
  hospital_id?: string | null;
  especialidade?: string | null;
  medico?: string | null;
  procedimentos?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### 2. **Tipo `GradeCirurgicaItem`** (`types.ts`)

```typescript
export interface GradeCirurgicaItem {
  id: string;
  tipo: 'especialidade' | 'procedimento';
  texto: string;
  ordem: number;
  pacientes?: string[];
  especialidadeId?: string;
  procedimentoId?: string;
  agendamentoId?: string; // 🆕 RASTREAMENTO DO ID DO BANCO
}
```

### 3. **Serviço de UPDATE** (`services/supabase.ts`)

```typescript
async update(id: string, agendamento: Partial<Omit<Agendamento, 'id' | 'idade' | 'tipo'>>): Promise<Agendamento> {
  console.log('🔄 Atualizando agendamento no Supabase...', { id, agendamento });
  
  const updateData: any = {}
  
  // Novos campos diretos
  if (agendamento.nome_paciente !== undefined) updateData.nome_paciente = agendamento.nome_paciente
  if (agendamento.data_nascimento !== undefined) updateData.data_nascimento = agendamento.data_nascimento
  if (agendamento.telefone !== undefined) updateData.telefone = agendamento.telefone
  if (agendamento.cidade_natal !== undefined) updateData.cidade_natal = agendamento.cidade_natal
  if (agendamento.data_consulta !== undefined) updateData.data_consulta = agendamento.data_consulta
  // ... outros campos

  const { data, error } = await supabase
    .from('agendamentos')
    .update(updateData)
    .eq('id', id) // 🎯 UPDATE pelo ID
    .select()
    .single()
  
  if (error) {
    console.error('❌ Erro ao atualizar agendamento:', error);
    throw new Error(error.message);
  }
  
  console.log('✅ Agendamento atualizado com sucesso!', data);
  return data as Agendamento;
}
```

### 4. **Carregamento da Grade** (`GradeCirurgicaModal.tsx`)

Ao carregar os agendamentos do banco, agora **preservamos o ID**:

```typescript
// Adicionar cada procedimento (inclusive duplicatas) COM agendamentoId
grupo.procedimentos.forEach((proc, idx) => {
  itens.push({
    id: `proc-${Date.now()}-${Math.random()}-${idx}`,
    tipo: 'procedimento',
    texto: proc.nome,
    ordem: itens.length,
    pacientes: [],
    agendamentoId: proc.agendamentoId // ✅ INCLUIR ID DO AGENDAMENTO
  });
});
```

### 5. **Função de Salvar Paciente** (`GradeCirurgicaModal.tsx`)

```typescript
const handleSalvarPaciente = async () => {
  if (!procedimentoSelecionado) return;
  
  // Validações
  if (!pacienteNome.trim()) {
    alert('Por favor, preencha o nome do paciente');
    return;
  }
  if (!pacienteDataNascimento) {
    alert('Por favor, preencha a data de nascimento');
    return;
  }
  
  setSalvandoPaciente(true);
  
  try {
    // 🔄 UPDATE no banco usando o agendamentoId
    await agendamentoService.update(procedimentoSelecionado.agendamentoId, {
      nome_paciente: pacienteNome,
      data_nascimento: pacienteDataNascimento,
      cidade_natal: pacienteCidade || null,
      telefone: pacienteTelefone || null,
      data_consulta: pacienteDataConsulta || null
    });
    
    console.log('✅ Paciente vinculado com sucesso!');
    
    // Atualizar UI (adicionar o nome na lista de pacientes)
    // ...
    
    // Fechar modal
    setModalPacienteAberto(false);
  } catch (error) {
    console.error('❌ Erro ao salvar paciente:', error);
    alert(`Erro ao salvar paciente: ${error.message}`);
  } finally {
    setSalvandoPaciente(false);
  }
};
```

---

## 🎨 Interface do Modal

```tsx
<Modal
  isOpen={modalPacienteAberto}
  onClose={handleCancelarPaciente}
  title="Adicionar Paciente ao Procedimento"
>
  <div className="p-6 space-y-4">
    {/* Nome do Paciente * */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Nome do Paciente <span className="text-red-500">*</span>
      </label>
      <Input
        value={pacienteNome}
        onChange={(e) => setPacienteNome(e.target.value)}
        placeholder="Digite o nome completo"
        className="w-full"
        autoFocus
      />
    </div>

    {/* Data de Nascimento * */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Data de Nascimento <span className="text-red-500">*</span>
      </label>
      <Input
        type="date"
        value={pacienteDataNascimento}
        onChange={(e) => setPacienteDataNascimento(e.target.value)}
        className="w-full"
      />
    </div>

    {/* Cidade (opcional) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Cidade
      </label>
      <Input
        value={pacienteCidade}
        onChange={(e) => setPacienteCidade(e.target.value)}
        placeholder="Digite a cidade"
        className="w-full"
      />
    </div>

    {/* Telefone (opcional) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Telefone
      </label>
      <Input
        value={pacienteTelefone}
        onChange={(e) => setPacienteTelefone(e.target.value)}
        placeholder="(XX) XXXXX-XXXX"
        className="w-full"
      />
    </div>

    {/* Data de Consulta (opcional) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Data de Consulta
      </label>
      <Input
        type="date"
        value={pacienteDataConsulta}
        onChange={(e) => setPacienteDataConsulta(e.target.value)}
        className="w-full"
      />
    </div>

    {/* Botões */}
    <div className="flex justify-end gap-2 pt-4">
      <Button
        onClick={handleCancelarPaciente}
        variant="secondary"
        disabled={salvandoPaciente}
      >
        Cancelar
      </Button>
      <Button
        onClick={handleSalvarPaciente}
        disabled={salvandoPaciente}
        className="bg-green-600 hover:bg-green-700"
      >
        {salvandoPaciente ? '💾 Salvando...' : '💾 Salvar Paciente'}
      </Button>
    </div>
  </div>
</Modal>
```

---

## 🗄️ Estrutura no Banco de Dados

### Tabela `agendamentos`

```sql
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_paciente TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  cidade_natal TEXT,
  telefone TEXT,
  data_agendamento DATE NOT NULL,
  data_consulta DATE, -- 🆕 NOVA COLUNA
  hospital_id UUID REFERENCES hospitais(id),
  especialidade TEXT,
  medico TEXT,
  procedimentos TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Script de Migração (se necessário)

```sql
-- Adicionar nova coluna data_consulta
ALTER TABLE agendamentos 
ADD COLUMN data_consulta DATE;
```

---

## ✅ Benefícios da Abordagem

1. **Simplicidade**: Um modal intuitivo com campos claros
2. **Integridade**: UPDATE ao invés de INSERT evita duplicação
3. **Rastreabilidade**: Cada procedimento mantém referência ao agendamento
4. **Flexibilidade**: Campos opcionais para informações adicionais
5. **Alinhamento com SUS**: Separação entre criação de grade e agendamento com paciente

---

## 🧪 Teste do Fluxo

### Passo a Passo

1. **Criar Grade**:
   - Selecionar especialidade (Ex: Ortopedia)
   - Digitar médico (Ex: Dr. João Silva)
   - Adicionar procedimentos (Ex: LCA, Meniscectomia)
   - Salvar

2. **Vincular Paciente**:
   - Clicar no botão **"+"** ao lado de "LCA"
   - Modal abre
   - Preencher dados:
     - Nome: José da Silva
     - Data Nasc: 15/03/1980
     - Cidade: São Paulo
     - Telefone: (11) 98765-4321
     - Data Consulta: 10/12/2024
   - Clicar em "💾 Salvar Paciente"
   - Sucesso! Nome "José da Silva" aparece vinculado ao procedimento

3. **Verificar no Banco**:
   ```sql
   SELECT * FROM agendamentos 
   WHERE especialidade = 'Ortopedia' 
   AND medico = 'Dr. João Silva' 
   AND procedimentos = 'LCA';
   ```
   - Deve mostrar o registro **atualizado** com os dados do paciente

---

## 📦 Arquivos Modificados

1. **`types.ts`**:
   - ✅ Adicionado campo `data_consulta` em `Agendamento`
   - ✅ Adicionado campo `agendamentoId` em `GradeCirurgicaItem`

2. **`services/supabase.ts`**:
   - ✅ Atualizado `agendamentoService.create()` para incluir `data_consulta`
   - ✅ Atualizado `agendamentoService.update()` para aceitar novos campos

3. **`components/GradeCirurgicaModal.tsx`**:
   - ✅ Adicionado estados para o modal de paciente
   - ✅ Implementado `handleAddPacienteClick()` para abrir modal
   - ✅ Implementado `handleSalvarPaciente()` com UPDATE
   - ✅ Atualizado carregamento para preservar `agendamentoId`
   - ✅ Adicionado Modal de Paciente na UI

---

## 🎯 Próximos Passos (Futuro)

1. **Edição de Paciente**: Permitir editar dados já vinculados
2. **Visualização de Detalhes**: Modal com todos os dados ao clicar no nome
3. **Histórico**: Ver histórico de alterações do paciente
4. **Validação de CPF**: Campo adicional para documento
5. **Integração com SUS**: API para buscar dados do paciente

---

## 🚀 Conclusão

O modal de adicionar paciente implementa uma solução elegante e funcional para o contexto do SUS, onde a criação da grade cirúrgica e o agendamento com o paciente são processos separados e sequenciais.

**Sistema agora está mais alinhado com o fluxo real do SUS! ✅**

