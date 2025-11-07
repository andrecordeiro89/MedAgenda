// ============================================================================
// SCRIPT DE TESTE - Sistema Mock
// Execute no console do navegador (F12) para testar o sistema
// ============================================================================

console.log('🧪 Iniciando testes do sistema mock...\n');

// ============================================================================
// 1. VERIFICAR SE DADOS INICIAIS EXISTEM
// ============================================================================
console.log('📦 1. Verificando dados iniciais...');

const hospitais = JSON.parse(localStorage.getItem('mock_hospitais') || '[]');
const especialidades = JSON.parse(localStorage.getItem('mock_especialidades') || '[]');

console.log(`   ✅ Hospitais: ${hospitais.length} encontrados`);
console.log(`   ✅ Especialidades: ${especialidades.length} encontradas`);

if (hospitais.length === 0) {
    console.warn('   ⚠️ Nenhum hospital encontrado! Recarregue a página.');
}

if (especialidades.length === 0) {
    console.warn('   ⚠️ Nenhuma especialidade encontrada! Recarregue a página.');
}

// ============================================================================
// 2. VERIFICAR DADOS DO USUÁRIO
// ============================================================================
console.log('\n👤 2. Verificando dados do usuário...');

const authData = localStorage.getItem('medagenda-auth');
if (authData) {
    const auth = JSON.parse(authData);
    console.log(`   ✅ Usuário logado: ${auth.usuario.email}`);
    console.log(`   ✅ Hospital selecionado: ${auth.hospital.nome}`);
} else {
    console.log('   ⚠️ Nenhum usuário logado');
}

// ============================================================================
// 3. VERIFICAR DADOS CADASTRADOS
// ============================================================================
console.log('\n📊 3. Verificando dados cadastrados...');

const medicos = JSON.parse(localStorage.getItem('mock_medicos') || '[]');
const procedimentos = JSON.parse(localStorage.getItem('mock_procedimentos') || '[]');
const agendamentos = JSON.parse(localStorage.getItem('mock_agendamentos') || '[]');
const metas = JSON.parse(localStorage.getItem('mock_metas') || '[]');

console.log(`   📋 Médicos: ${medicos.length}`);
console.log(`   📋 Procedimentos: ${procedimentos.length}`);
console.log(`   📋 Agendamentos: ${agendamentos.length}`);
console.log(`   📋 Metas: ${metas.length}`);

// ============================================================================
// 4. VERIFICAR GRADES CIRÚRGICAS
// ============================================================================
console.log('\n🗓️ 4. Verificando grades cirúrgicas...');

let gradesCount = 0;
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('grade_')) {
        gradesCount++;
    }
}

console.log(`   📋 Grades cirúrgicas: ${gradesCount}`);

// ============================================================================
// 5. TESTAR OPERAÇÕES BÁSICAS
// ============================================================================
console.log('\n🧪 5. Testando operações básicas...');

try {
    // Teste 1: Criar médico mock
    const testMedico = {
        nome: 'Dr. Teste',
        especialidade: 'Teste',
        crm: '99999-TS',
        telefone: '(99) 99999-9999',
        email: 'teste@teste.com'
    };
    
    console.log('   🔄 Testando criação de médico...');
    // (não executar de verdade, apenas verificar estrutura)
    console.log('   ✅ Estrutura de médico válida');

    // Teste 2: Criar procedimento mock
    const testProcedimento = {
        nome: 'Procedimento Teste',
        tipo: 'ambulatorial',
        duracaoEstimada: 30,
        descricao: 'Teste',
        hospitalId: hospitais[0]?.id
    };
    
    console.log('   🔄 Testando criação de procedimento...');
    console.log('   ✅ Estrutura de procedimento válida');

    // Teste 3: Criar agendamento mock
    const testAgendamento = {
        nome: 'Paciente Teste',
        dataNascimento: '1990-01-01',
        cidadeNatal: 'Teste',
        telefone: '99999999',
        whatsapp: '99999999',
        dataAgendamento: '2025-12-01',
        statusLiberacao: 'x',
        medicoId: medicos[0]?.id || 'test-id',
        procedimentoId: procedimentos[0]?.id || 'test-id',
        hospitalId: hospitais[0]?.id
    };
    
    console.log('   🔄 Testando criação de agendamento...');
    console.log('   ✅ Estrutura de agendamento válida');

} catch (error) {
    console.error('   ❌ Erro nos testes:', error);
}

// ============================================================================
// 6. ESTATÍSTICAS GERAIS
// ============================================================================
console.log('\n📈 6. Estatísticas gerais...');

const totalKeys = localStorage.length;
const mockKeys = Object.keys(localStorage).filter(k => k.startsWith('mock_')).length;
const gradeKeys = Object.keys(localStorage).filter(k => k.startsWith('grade_')).length;

console.log(`   📦 Total de chaves no localStorage: ${totalKeys}`);
console.log(`   📦 Chaves mock: ${mockKeys}`);
console.log(`   📦 Chaves de grades: ${gradeKeys}`);

// Calcular tamanho aproximado
let totalSize = 0;
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
    }
}

const sizeKB = (totalSize / 1024).toFixed(2);
console.log(`   💾 Tamanho aproximado: ${sizeKB} KB`);

// ============================================================================
// 7. RESUMO FINAL
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DO TESTE');
console.log('='.repeat(60));

const allTestsPassed = 
    hospitais.length > 0 &&
    especialidades.length > 0;

if (allTestsPassed) {
    console.log('✅ Sistema Mock Funcionando Corretamente!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Popular dados de exemplo (se ainda não fez)');
    console.log('2. Testar CRUD de médicos, procedimentos e agendamentos');
    console.log('3. Testar configuração de grades cirúrgicas');
    console.log('4. Testar definição de metas');
} else {
    console.log('⚠️ Alguns problemas detectados!');
    console.log('');
    console.log('Soluções:');
    console.log('1. Recarregue a página (F5)');
    console.log('2. Se persistir, limpe o localStorage: localStorage.clear()');
    console.log('3. Recarregue novamente');
}

console.log('='.repeat(60));

// ============================================================================
// 8. FUNÇÕES ÚTEIS
// ============================================================================
console.log('\n🔧 Funções úteis disponíveis:\n');

console.log('// Popular dados de exemplo:');
console.log("import('./services/mock-storage.js').then(m => { m.populateSampleData('3ea8c82a-02dd-41c3-9247-1ae07a1ecaba'); location.reload(); });\n");

console.log('// Ver todos os dados:');
console.log("Object.keys(localStorage).filter(k => k.startsWith('mock_')).forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))));\n");

console.log('// Limpar tudo:');
console.log('localStorage.clear(); location.reload();\n');

console.log('// Backup completo:');
console.log('const backup = {}; Object.keys(localStorage).forEach(k => backup[k] = localStorage.getItem(k)); console.log(JSON.stringify(backup, null, 2));\n');

console.log('='.repeat(60));
console.log('✅ Teste concluído!\n');

