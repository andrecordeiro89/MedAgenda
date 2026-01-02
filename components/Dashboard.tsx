
import React, { useState, useEffect } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
 
import { useAuth } from './PremiumLogin';
import ImageWithFallback from './ImageWithFallback';
import { agendamentoService } from '../services/supabase';

const DashboardImage: React.FC = () => (
    <ImageWithFallback
        baseName="imagem_de_login"
        alt="Painel de boas‑vindas"
        className="max-w-[680px] w-full object-contain select-none"
    />
);

interface DashboardProps {
    agendamentos: Agendamento[];
    medicos: Medico[];
    procedimentos: Procedimento[];
    onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agendamentos: agendamentosProps, medicos, procedimentos, onRefresh }) => {
    const { hospitalSelecionado } = useAuth();
    const [agendamentosComDocumentacao, setAgendamentosComDocumentacao] = useState<Agendamento[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    
    // Carregar agendamentos com campos de documentação do Supabase
    useEffect(() => {
        const carregarAgendamentosComDocs = async () => {
            if (!hospitalSelecionado?.id) return;
            
            setLoadingDocs(true);
            try {
                const dados = await agendamentoService.getAll(hospitalSelecionado.id);
                setAgendamentosComDocumentacao(dados);
            } catch (error) {
                console.error('Erro ao carregar agendamentos com documentação:', error);
                // Em caso de erro, usar os agendamentos recebidos como props
                setAgendamentosComDocumentacao(agendamentosProps);
            } finally {
                setLoadingDocs(false);
            }
        };
        
        carregarAgendamentosComDocs();
    }, [hospitalSelecionado?.id, agendamentosProps]);
    
    // Usar agendamentos com documentação se disponíveis, senão usar os props
    const agendamentosBrutos = agendamentosComDocumentacao.length > 0 ? agendamentosComDocumentacao : agendamentosProps;
    
    // ============================================================================
    // FILTRAR REGISTROS VÁLIDOS (Mesma lógica que Documentação/Anestesia/Faturamento)
    // ============================================================================
    // Aplicar a mesma filtragem para garantir CONSISTÊNCIA entre todas as telas
    const agendamentos = agendamentosBrutos.filter(ag => {
        const temPaciente = ag.nome_paciente && ag.nome_paciente.trim() !== '';
        const temProcedimento = ag.procedimentos && ag.procedimentos.trim() !== '';
        
        // CASO 1: Tem paciente E procedimento → SEMPRE MOSTRAR (mesmo se is_grade_cirurgica = true)
        if (temPaciente && temProcedimento) {
            return true; // ✅ Mostrar
        }
        
        // CASO 2: Registro estrutural de grade (sem paciente) → OCULTAR
        if (ag.is_grade_cirurgica === true && !temPaciente) {
            return false; // ❌ Ocultar (é apenas estrutura)
        }
        
        // CASO 3: Registro vazio (compatibilidade) → OCULTAR
        if (!temProcedimento && !temPaciente) {
            return false;
        }
        
        // CASO 4: Demais casos → MOSTRAR
        return true;
    });
    
    // DEBUG: Log para verificar consistência com outras telas
    useEffect(() => {
        if (agendamentosBrutos.length > 0) {
            const totalOriginal = agendamentosBrutos.length;
            const totalFiltrado = agendamentos.length;
            const totalExcluidos = totalOriginal - totalFiltrado;
            
            // Contar pacientes únicos no total filtrado
            const pacientesUnicos = new Set<string>();
            agendamentos.forEach(ag => {
                const nomePaciente = (ag.nome_paciente || ag.nome || '').trim().toLowerCase();
                if (nomePaciente && nomePaciente !== '') {
                    pacientesUnicos.add(nomePaciente);
                }
            });
            
            console.log('📊 DASHBOARD - CONTAGEM:');
            console.log(`  Total de REGISTROS no banco: ${totalOriginal}`);
            console.log(`  Total de REGISTROS após filtro: ${totalFiltrado}`);
            console.log(`  Total de REGISTROS excluídos: ${totalExcluidos}`);
            console.log(`  🎯 PACIENTES ÚNICOS (final): ${pacientesUnicos.size}`);
        }
    }, [agendamentosBrutos, agendamentos]);
    
    // Obter data atual no fuso horário de Brasília (America/Sao_Paulo)
    const getDataAtualBrasilia = () => {
        const agora = new Date();
        // Converter para o fuso horário de Brasília
        const dataAtualBrasilia = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        return dataAtualBrasilia.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Formatar data para exibição em português brasileiro
    const formatarDataCompleta = (dataString: string) => {
        const data = new Date(dataString + 'T00:00:00');
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        });
    };

    const dataHoje = getDataAtualBrasilia();
    const agendamentosHoje = agendamentos.filter(a => a.dataAgendamento === dataHoje);
    
    // Função para obter o tipo correto do agendamento baseado no procedimento
    const getAgendamentoTipo = (agendamento: Agendamento) => {
        const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
        return procedimento?.tipo || agendamento.tipo || 'ambulatorial';
    };
    
    // Calcular KPIs baseados na documentação - CONTANDO POR PACIENTES ÚNICOS
    // Função auxiliar para obter pacientes únicos de uma lista de agendamentos
    const getPacientesUnicos = (agendamentosList: Agendamento[]): Set<string> => {
        const pacientes = new Set<string>();
        agendamentosList.forEach(a => {
            const nomePaciente = (a.nome_paciente || a.nome || '').trim();
            // Ignorar registros sem paciente (ex: linhas de grade cirúrgica)
            if (nomePaciente && nomePaciente !== '') {
                pacientes.add(nomePaciente.toLowerCase()); // lowercase para evitar duplicatas por case
            }
        });
        return pacientes;
    };
    
    // Sem exames: contar PACIENTES ÚNICOS (não procedimentos)
    const agendamentosSemExames = agendamentos.filter(a => {
        // Sem exames: documentos_ok não é true (pode ser false, null ou undefined)
        return !(a.documentos_ok === true);
    });
    const semExames = getPacientesUnicos(agendamentosSemExames).size;
    
    // Com exames: contar PACIENTES ÚNICOS
    const agendamentosComExames = agendamentos.filter(a => {
        // Com exames: tem docs OK
        return a.documentos_ok === true;
    });
    const comExames = getPacientesUnicos(agendamentosComExames).size;
    
    // Debug detalhado dos KPIs (para verificar consistência)
    useEffect(() => {
        if (agendamentos.length > 0) {
            console.log('📊 DASHBOARD - KPIs Detalhados:');
            console.log(`  SEM EXAMES: ${semExames} pacientes únicos`);
            console.log(`  COM EXAMES: ${comExames} pacientes únicos`);
            console.log(`  TOTAL: ${semExames + comExames} pacientes únicos`);
            
            // Amostra dos primeiros 3 registros
            console.log('  📋 Amostra (primeiros 3):');
            agendamentos.slice(0, 3).forEach((a, idx) => {
                console.log(`    ${idx + 1}. ${a.nome_paciente || a.nome}:`, {
                    documentos_ok: a.documentos_ok,
                    ficha_pre_anestesica_ok: a.ficha_pre_anestesica_ok,
                    complementares_ok: a.complementares_ok
                });
            });
        }
    }, [agendamentos, semExames, comExames]);

    // Funções auxiliares para buscar dados relacionados
    const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'Médico não encontrado';
    const getMedicoEspecialidade = (id: string) => medicos.find(m => m.id === id)?.especialidade || 'N/A';

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 pt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-6">
                    <div className="flex justify-center">
                        <DashboardImage />
                    </div>
                    <div>
                        <div className="mb-4 text-center md:text-left">
                            <h2 className="text-3xl font-bold text-slate-900">
                                Bem-vindo ao {hospitalSelecionado?.nome || 'Sistema MedAgenda'}
                            </h2>
                            <p className="text-slate-600 text-sm md:text-base mt-1">
                                {formatarDataCompleta(dataHoje)} • Horário de Brasília • {new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-slate-700 text-sm md:text-base mt-2">
                                Seu centro de comando para organizar o ciclo cirúrgico com eficiência, visibilidade e segurança.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Agenda</h4>
                                <p className="text-slate-700 text-sm">Monte e replique grades por especialidade e dia.</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Documentação</h4>
                                <p className="text-slate-700 text-sm">Indicadores de completude e padronização pré‑operatória.</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Assistência/Anestesia</h4>
                                <p className="text-slate-700 text-sm">Liberação clínica, observações e status em tempo real.</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Faturamento</h4>
                                <p className="text-slate-700 text-sm">Consolidação de procedimentos e rotinas de cobrança.</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Relatórios</h4>
                                <p className="text-slate-700 text-sm">PDF e visualizações agregadas para decisão rápida.</p>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 hover:shadow-sm">
                                <h4 className="text-lg font-semibold text-slate-900 mb-2">Operação</h4>
                                <p className="text-slate-700 text-sm">Filtros por hospital e perfil, integração Supabase/API.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
