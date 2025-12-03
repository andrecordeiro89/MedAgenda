import React, { useState, useMemo, useEffect, ReactElement } from 'react';
import { Modal, Button, Input, PlusIcon, TrashIcon, CopyIcon } from './ui';
import { SelectCidade } from './SelectCidade';
import { GradeCirurgicaDia, GradeCirurgicaItem, DiaSemana, Especialidade } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// MODO MOCK
// import { simpleGradeCirurgicaService } from '../services/api-simple';
import { mockServices } from '../services/mock-storage';
const simpleGradeCirurgicaService = mockServices.gradeCirurgica;

// Importar service real de agendamentos e médicos do Supabase
import { agendamentoService, medicoService } from '../services/supabase';
import { Medico } from '../types';


interface GradeCirurgicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesAtual: Date;
  diaSemanaClicado: number; // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb
  hospitalId: string;
  especialidades: Especialidade[]; // NOVA PROP: Lista de especialidades do banco
  userEmail?: string; // Email do usuário logado (para verificar se é TI)
}

// Mapeamento de número do dia (getDay()) para DiaSemana
const DAY_NUMBER_TO_DIA_SEMANA: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

// Nomes dos dias por número
const DAY_NUMBER_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
};

const GradeCirurgicaModal: React.FC<GradeCirurgicaModalProps> = ({
  isOpen,
  onClose,
  mesAtual,
  diaSemanaClicado,
  hospitalId,
  especialidades, // Receber especialidades
  userEmail // Email do usuário logado
}) => {
  // Verificar se é usuário TI (permissão especial para alterar procedimentos base)
  const isUsuarioTI = userEmail?.toLowerCase() === 'tifoz@medagenda.com';
  
  // Estado para controlar a navegação entre meses (offset)
  const [offsetMes, setOffsetMes] = useState(1); // 1 = próximo mês (padrão)
  
  // Calcular TODAS as ocorrências do dia da semana clicado no mês alvo
  const proximasDatas = useMemo(() => {
    const mesAlvo = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + offsetMes, 1);
    const datas: Date[] = [];
    
    // Encontrar TODAS as ocorrências do dia da semana no mês alvo
    for (let dia = 1; dia <= 31; dia++) {
      const data = new Date(mesAlvo.getFullYear(), mesAlvo.getMonth(), dia);
      // Verificar se ainda está no mês correto e se é o dia da semana desejado
      if (data.getMonth() === mesAlvo.getMonth() && data.getDay() === diaSemanaClicado) {
        datas.push(data);
      }
    }
    
    return datas;
  }, [mesAtual, diaSemanaClicado, offsetMes]);

  // Mês de referência no formato YYYY-MM
  const mesReferencia = useMemo(() => {
    const mesAlvo = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + offsetMes, 1);
    const ano = mesAlvo.getFullYear();
    const mes = String(mesAlvo.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }, [mesAtual, offsetMes]);

  // Nome do mês exibido
  const mesExibidoNome = useMemo(() => {
    const mesAlvo = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + offsetMes, 1);
    return mesAlvo.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  }, [mesAtual, offsetMes]);

  // Estados
  const [grades, setGrades] = useState<GradeCirurgicaDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  
  // Estados para edição de procedimento
  const [modalAlterarProcAberto, setModalAlterarProcAberto] = useState(false);
  const [modoCriacaoProc, setModoCriacaoProc] = useState(false); // true = criando novo, false = editando existente
  const [procedimentoEmEdicao, setProcedimentoEmEdicao] = useState<{
    gradeIndex: number;
    itemId: string;
    agendamentoId: string;
    textoAtual: string;
    especificacaoAtual: string;
    especialidadeId?: string;
  } | null>(null);
  const [novoProcedimentoTexto, setNovoProcedimentoTexto] = useState('');
  const [novaEspecificacaoTexto, setNovaEspecificacaoTexto] = useState('');
  const [medicoSelecionadoParaProc, setMedicoSelecionadoParaProc] = useState('');
  const [medicoVemDaEspecialidade, setMedicoVemDaEspecialidade] = useState(false); // Se true, campo fica bloqueado

  // Carregar médicos do hospital ao abrir o modal
  useEffect(() => {
    const loadMedicos = async () => {
      if (!isOpen || !hospitalId) return;
      
      setCarregandoMedicosParaProcedimentos(true);
      try {
        console.log('👨‍⚕️ Carregando médicos do hospital:', hospitalId);
        const medicos = await medicoService.getAll(hospitalId);
        console.log('✅ Médicos carregados:', medicos.length);
        setMedicosParaProcedimentos(medicos);
      } catch (error) {
        console.error('❌ Erro ao carregar médicos:', error);
        setMedicosParaProcedimentos([]);
      } finally {
        setCarregandoMedicosParaProcedimentos(false);
      }
    };
    
    if (isOpen) {
      loadMedicos();
    }
  }, [isOpen, hospitalId]);

  // Função para recarregar grades do banco (reutilizável)
  const recarregarGradesDoSupabase = async () => {
    setLoading(true);
    try {
      console.log('🔄 Recarregando agendamentos do Supabase para as datas:', proximasDatas.map(d => d.toISOString().split('T')[0]));
      
      // 1. PRIMEIRO: Carregar médicos do hospital
      console.log('👨‍⚕️ Carregando médicos para relacionar aos procedimentos...');
      let medicosCarregados: Medico[] = [];
      try {
        medicosCarregados = await medicoService.getAll(hospitalId);
        console.log(`✅ ${medicosCarregados.length} médicos carregados`);
      } catch (error) {
        console.error('❌ Erro ao carregar médicos:', error);
        medicosCarregados = [];
      }
      
      // 2. DEPOIS: Buscar agendamentos reais do banco para cada data
      const gradesCarregadas = await Promise.all(
        proximasDatas.map(async (data, index) => {
            const dataFormatada = data.toISOString().split('T')[0];
            
            try {
              const agendamentos = await agendamentoService.getAll(hospitalId);
              const agendamentosDoDia = agendamentos.filter(a => a.data_agendamento === dataFormatada);
              
              console.log(`📅 Dia ${dataFormatada}: ${agendamentosDoDia.length} agendamentos`);
              
              // Montar itens da grade a partir dos agendamentos (SEM AGRUPAR DUPLICATAS)
              const itens: GradeCirurgicaItem[] = [];
              
              // Agrupar por especialidade (usando array para procedimentos)
              const gruposPorEspecialidade = new Map<string, {
                especialidade: string;
                medico: string;
                procedimentos: Array<{
                  nome: string;
                  agendamentoId: string;
                  medicoId?: string;
                  medicoNome?: string;
                  paciente?: {
                    nome: string;
                    dataNascimento: string;
                    cidade?: string | null;
                    telefone?: string | null;
                    dataConsulta?: string | null;
                  };
                }>;
              }>();
              
              agendamentosDoDia.forEach(agendamento => {
                if (agendamento.especialidade) {
                  // Chave inclui médico se existir, senão usa apenas especialidade
                  const medicoKey = agendamento.medico || '(sem médico)';
                  const chave = `${agendamento.especialidade}|||${medicoKey}`;
                  
                  if (!gruposPorEspecialidade.has(chave)) {
                    gruposPorEspecialidade.set(chave, {
                      especialidade: agendamento.especialidade,
                      medico: agendamento.medico || null, // Pode ser null
                      procedimentos: []
                    });
                  }
                  
                  // Adicionar procedimento ao array COM ID e dados do paciente (se houver)
                  if (agendamento.procedimentos && agendamento.procedimentos.trim() && agendamento.id) {
                    const procedimentoData: any = {
                      nome: agendamento.procedimentos,
                      agendamentoId: agendamento.id,
                      especificacao: agendamento.procedimento_especificacao || undefined // Carregar especificação
                    };
                    
                    // Log para debug de especificação
                    if (agendamento.procedimento_especificacao) {
                      console.log('📋 Carregando especificação do banco:', {
                        procedimento: agendamento.procedimentos,
                        especificacao: agendamento.procedimento_especificacao,
                        agendamentoId: agendamento.id
                      });
                    }
                    
                    // Incluir médico associado ao procedimento (se houver)
                    if (agendamento.medico) {
                      // Buscar médico pelo nome na lista de médicos carregados
                      const medicoEncontrado = medicosCarregados.find(m => m.nome === agendamento.medico);
                      
                      if (medicoEncontrado) {
                        procedimentoData.medicoId = medicoEncontrado.id;
                        procedimentoData.medicoNome = agendamento.medico;
                        console.log(`✅ Médico encontrado: ${agendamento.medico} (ID: ${medicoEncontrado.id})`);
                      } else {
                        // Se não encontrar pelo nome, usar apenas o nome do médico
                        procedimentoData.medicoNome = agendamento.medico;
                        console.warn(`⚠️ Médico não encontrado na lista: ${agendamento.medico}`);
                      }
                    }
                    
                    // Se tem paciente cadastrado, incluir os dados
                    if (agendamento.nome_paciente && agendamento.nome_paciente.trim()) {
                      procedimentoData.paciente = {
                        nome: agendamento.nome_paciente,
                        dataNascimento: agendamento.data_nascimento,
                        cidade: agendamento.cidade_natal,
                        telefone: agendamento.telefone,
                        dataConsulta: agendamento.data_consulta
                      };
                    }
                    
                    gruposPorEspecialidade.get(chave)!.procedimentos.push(procedimentoData);
                  }
                }
              });
              
              // Montar itens na ordem: especialidade → seus procedimentos
              gruposPorEspecialidade.forEach((grupo) => {
                // Exibir apenas especialidade se não houver médico
                const textoEspecialidade = grupo.medico 
                  ? `${grupo.especialidade} - ${grupo.medico}`
                  : grupo.especialidade;
                
                // Adicionar especialidade
                itens.push({
                  id: `esp-${Date.now()}-${Math.random()}`,
                  tipo: 'especialidade',
                  texto: textoEspecialidade,
                  ordem: itens.length,
                  pacientes: []
                });
                
                // Adicionar cada procedimento COM agendamentoId e pacientes
                grupo.procedimentos.forEach((proc, idx) => {
                  // Só incluir paciente se tiver nome válido
                  const pacientes = proc.paciente && proc.paciente.nome && proc.paciente.nome.trim() 
                    ? [{
                        nome: proc.paciente.nome,
                        dataNascimento: proc.paciente.dataNascimento,
                        cidade: proc.paciente.cidade,
                        telefone: proc.paciente.telefone,
                        dataConsulta: proc.paciente.dataConsulta
                      }]
                    : [];
                  
                  const itemProcedimento: any = {
                    id: `proc-${Date.now()}-${Math.random()}-${idx}`,
                    tipo: 'procedimento',
                    texto: proc.nome,
                    ordem: itens.length,
                    pacientes: pacientes,
                    agendamentoId: proc.agendamentoId,
                    ...(proc.medicoId && { medicoId: proc.medicoId }),
                    ...(proc.medicoNome && { medicoNome: proc.medicoNome })
                  };
                  
                  // Sempre incluir especificação (mesmo que seja undefined)
                  if ((proc as any).especificacao) {
                    itemProcedimento.especificacao = (proc as any).especificacao;
                    console.log(`📋 Procedimento carregado com especificação: ${proc.nome} → "${(proc as any).especificacao}"`);
                  }
                  
                  itens.push(itemProcedimento);
                  
                  // Log de debug
                  if (proc.medicoId) {
                    console.log(`📋 Procedimento: ${proc.nome} → Médico ID: ${proc.medicoId}, Nome: ${proc.medicoNome}`);
                  }
                });
              });
              
              return {
                id: `grade-${Date.now()}-${index}`,
                data: dataFormatada,
                diaSemana: DAY_NUMBER_TO_DIA_SEMANA[diaSemanaClicado],
                ordem: index + 1,
                itens
              };
            } catch (error) {
              console.error(`❌ Erro ao buscar agendamentos do dia ${dataFormatada}:`, error);
              return {
                id: `grade-${Date.now()}-${index}`,
                data: dataFormatada,
                diaSemana: DAY_NUMBER_TO_DIA_SEMANA[diaSemanaClicado],
                ordem: index + 1,
                itens: []
              };
            }
          })
        );
        
        console.log('✅ Grades carregadas do Supabase:', gradesCarregadas);
        
        // Log detalhado de procedimentos com especificação
        gradesCarregadas.forEach((grade, idx) => {
          const procsComEspecificacao = grade.itens.filter(it => it.tipo === 'procedimento' && it.especificacao);
          if (procsComEspecificacao.length > 0) {
            console.log(`📋 Grade ${idx} (${grade.data}) - Procedimentos com especificação:`, 
              procsComEspecificacao.map(p => ({ texto: p.texto, especificacao: p.especificacao }))
            );
          }
        });
        
        setGrades(gradesCarregadas);
        
      } catch (error) {
        console.error('❌ Erro ao carregar grades:', error);
        // Inicializar vazia em caso de erro
        setGrades(proximasDatas.map((data, index) => ({
          id: `temp-${Date.now()}-${index}`,
          data: data.toISOString().split('T')[0],
          diaSemana: DAY_NUMBER_TO_DIA_SEMANA[diaSemanaClicado],
          ordem: index + 1,
          itens: []
        })));
      } finally {
        setLoading(false);
      }
  };

  // Carregar grade DO SUPABASE ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      recarregarGradesDoSupabase();
    }
  }, [isOpen, hospitalId, diaSemanaClicado, mesReferencia, proximasDatas]);

  // Resetar offset ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setOffsetMes(1); // Sempre começa no próximo mês
    }
  }, [isOpen]);

  // Estado para controlar expansão de procedimentos (gradeIndex_especialidadeId => boolean)
  const [expandedEspecialidades, setExpandedEspecialidades] = useState<Record<string, boolean>>({});
  
  // Estado para controlar expansão de dados do paciente por procedimento (gradeIndex_itemId => boolean)
  const [expandedProcedimentos, setExpandedProcedimentos] = useState<Record<string, boolean>>({});

  // Estado para controlar qual procedimento está adicionando paciente (MODAL)
  const [modalPacienteAberto, setModalPacienteAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false); // Novo: true = editando, false = criando
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<{
    gradeIndex: number;
    itemId: string;
    agendamentoId: string;
    pacienteIndex?: number; // Índice do paciente sendo editado (se houver)
  } | null>(null);
  const [pacienteNome, setPacienteNome] = useState('');
  const [pacienteDataNascimento, setPacienteDataNascimento] = useState('');
  const [pacienteCidade, setPacienteCidade] = useState('');
  const [pacienteTelefone, setPacienteTelefone] = useState('');
  const [pacienteDataConsulta, setPacienteDataConsulta] = useState('');
  const [salvandoPaciente, setSalvandoPaciente] = useState(false);

  // Estado para modal de confirmação
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [confirmacaoData, setConfirmacaoData] = useState<{
    titulo: string;
    mensagem: string;
    onConfirm: () => void;
    tipo?: 'info' | 'sucesso' | 'erro' | 'aviso';
  } | null>(null);

  // Helper para mostrar alerta elegante
  const mostrarAlerta = (titulo: string, mensagem: string) => {
    setConfirmacaoData({
      titulo,
      mensagem,
      onConfirm: () => setModalConfirmacao(false)
    });
    setModalConfirmacao(true);
  };

  // Estado para controlar a adição de especialidade (NOVO FLUXO EM 3 ETAPAS)
  const [addingEspecialidade, setAddingEspecialidade] = useState<number | null>(null); // índice da grade
  const [etapaAtual, setEtapaAtual] = useState<1 | 2 | 3>(1); // Etapa 1=Especialidade, 2=Médico, 3=Procedimentos
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('');
  const [especialidadeNome, setEspecialidadeNome] = useState(''); // Nome da especialidade selecionada
  const [medicoSelecionado, setMedicoSelecionado] = useState(''); // ID do médico selecionado
  const [medicoNomeSelecionado, setMedicoNomeSelecionado] = useState(''); // Nome do médico selecionado (para evitar perder quando limpar lista)
  const [medicosDisponiveis, setMedicosDisponiveis] = useState<Medico[]>([]); // Lista de médicos do hospital
  const [carregandoMedicos, setCarregandoMedicos] = useState(false); // Loading ao carregar médicos
  const [procedimentosTemp, setProcedimentosTemp] = useState<Array<{id: string, nome: string}>>([]);
  const [novoProcedimentoNome, setNovoProcedimentoNome] = useState('');
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false); // Loading ao salvar
  
  // Estado para médicos disponíveis (carregados uma vez ao abrir o modal)
  const [medicosParaProcedimentos, setMedicosParaProcedimentos] = useState<Medico[]>([]);
  const [carregandoMedicosParaProcedimentos, setCarregandoMedicosParaProcedimentos] = useState(false);

  // Estados para mover paciente
  const [modalMoverPaciente, setModalMoverPaciente] = useState(false);
  const [agendamentoParaMover, setAgendamentoParaMover] = useState<{
    id: string;
    nome: string;
    procedimento: string;
    dataAtual: string;
    gradeIndex: number;
    diaSemana?: string;
    dataNascimento?: string | null;
    cidadeNatal?: string | null;
    telefone?: string | null;
    dataConsulta?: string | null;
  } | null>(null);
  const [novaDataSelecionada, setNovaDataSelecionada] = useState('');
  const [datasDisponiveis, setDatasDisponiveis] = useState<Array<{ data: string; label: string }>>([]);
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState<Array<{ id: string; nome: string; medicoId: string; medicoNome: string; agendamentos?: any[] }>>([]);
  const [procedimentosDisponiveis, setProcedimentosDisponiveis] = useState<Array<{ id: string; texto: string; agendamentoId: string }>>([]);
  const [especialidadeSelecionadaDestino, setEspecialidadeSelecionadaDestino] = useState('');
  const [procedimentoSelecionadoDestino, setProcedimentoSelecionadoDestino] = useState('');
  const [movendoPaciente, setMovendoPaciente] = useState(false);
  const [carregandoDestinos, setCarregandoDestinos] = useState(false);
  const [mesCalendario, setMesCalendario] = useState<Date>(new Date());
  const diasDisponiveisSet = useMemo(() => new Set(datasDisponiveis.map(d => d.data)), [datasDisponiveis]);
  const formatISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Função auxiliar para mostrar mensagens personalizadas (substitui alert nativo)
  const mostrarMensagem = (titulo: string, mensagem: string, tipo: 'info' | 'sucesso' | 'erro' | 'aviso' = 'info') => {
    setConfirmacaoData({
      titulo,
      mensagem,
      tipo,
      onConfirm: () => setModalConfirmacao(false)
    });
    setModalConfirmacao(true);
  };

  // Salvamento removido - dados são salvos automaticamente no Supabase ao adicionar

  // Auto-save removido - salvamos direto no Supabase ao adicionar cada item

  // Carregar médicos do hospital quando entrar na etapa 2
  useEffect(() => {
    const carregarMedicos = async () => {
      if (etapaAtual === 2 && hospitalId) {
        setCarregandoMedicos(true);
        try {
          console.log('🔍 Buscando médicos para hospitalId:', hospitalId);
          const medicos = await medicoService.getAll(hospitalId);
          console.log('👨‍⚕️ Médicos encontrados:', medicos);
          console.log('📊 Total de médicos:', medicos.length);
          setMedicosDisponiveis(medicos);
          
          if (medicos.length === 0) {
            console.warn('⚠️ Nenhum médico encontrado para o hospital:', hospitalId);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar médicos:', error);
          setMedicosDisponiveis([]);
        } finally {
          setCarregandoMedicos(false);
        }
      } else {
        // Limpar médicos quando sair da etapa 2
        setMedicosDisponiveis([]);
      }
    };
    
    carregarMedicos();
  }, [etapaAtual, hospitalId]);

  // ETAPA 1: Iniciar adição de especialidade (abre o dropdown)
  const handleAddEspecialidadeClick = (gradeIndex: number) => {
    setAddingEspecialidade(gradeIndex);
    setEtapaAtual(1);
    setEspecialidadeSelecionada('');
    setEspecialidadeNome('');
    setMedicoSelecionado('');
    setMedicoNomeSelecionado('');
    setMedicosDisponiveis([]);
    setProcedimentosTemp([]);
    setNovoProcedimentoNome('');
  };

  // ETAPA 1 → ETAPA 2 ou 3: Confirmar especialidade e ir para médico (ou pular para procedimentos)
  const handleConfirmEspecialidade = () => {
    if (!especialidadeSelecionada) return;
    
    const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
    if (!especialidade) return;
    
    // Salvar nome da especialidade
    setEspecialidadeNome(especialidade.nome);
    
    // Avançar para etapa 2 (Médico) - pode ser pulado depois
    setEtapaAtual(2);
    
    console.log('✅ Etapa 1 concluída - Especialidade:', especialidade.nome);
  };

  // ETAPA 1 → ETAPA 3: Pular médico e ir direto para procedimentos
  const handlePularMedico = () => {
    if (!especialidadeSelecionada) return;
    
    const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
    if (!especialidade) return;
    
    // Salvar nome da especialidade
    setEspecialidadeNome(especialidade.nome);
    
    // Limpar médico selecionado
    setMedicoSelecionado('');
    setMedicoNomeSelecionado('');
    
    // Avançar direto para etapa 3 (Procedimentos)
    setEtapaAtual(3);
    
    console.log('✅ Etapa 1 concluída - Especialidade:', especialidade.nome, '(sem médico)');
  };

  // ETAPA 2 → ETAPA 3: Confirmar médico (opcional) e ir para procedimentos
  const handleConfirmMedico = () => {
    // Médico é opcional agora - pode avançar sem selecionar
    if (medicoSelecionado) {
      const medico = medicosDisponiveis.find(m => m.id === medicoSelecionado);
      if (medico) {
        // Armazenar o nome do médico para usar depois mesmo se a lista for limpa
        setMedicoNomeSelecionado(medico.nome);
        console.log('✅ Etapa 2 concluída - Médico:', medico.nome);
      } else {
        console.warn('⚠️ Médico selecionado não encontrado, continuando sem médico');
        setMedicoNomeSelecionado('');
      }
    } else {
      // Sem médico selecionado - permitir continuar
      setMedicoNomeSelecionado('');
      console.log('✅ Etapa 2 concluída - Sem médico (equipe médica)');
    }
    
    // Avançar para etapa 3 (Procedimentos)
    setEtapaAtual(3);
  };
  
  // Obter nome do médico selecionado
  const getNomeMedicoSelecionado = () => {
    // Primeiro tentar usar o nome armazenado (mais confiável)
    if (medicoNomeSelecionado) {
      return medicoNomeSelecionado;
    }
    
    // Se não tiver nome armazenado, buscar na lista
    if (!medicoSelecionado) {
      return '';
    }
    
    if (medicosDisponiveis.length === 0) {
      console.warn('⚠️ medicosDisponiveis está vazio, usando nome armazenado');
      return medicoNomeSelecionado || '';
    }
    
    const medico = medicosDisponiveis.find(m => m.id === medicoSelecionado);
    return medico?.nome || medicoNomeSelecionado || '';
  };

  // ETAPA 3: Adicionar procedimento à lista temporária
  const handleAddProcedimentoTemp = () => {
    if (!novoProcedimentoNome.trim()) {
      mostrarMensagem('⚠️ Atenção', 'Por favor, digite o nome do procedimento', 'aviso');
      return;
    }
    
    const novoProcedimento = {
      id: `temp-proc-${Date.now()}-${Math.random()}`,
      nome: novoProcedimentoNome.trim()
    };
    
    setProcedimentosTemp([...procedimentosTemp, novoProcedimento]);
    setNovoProcedimentoNome('');
    
    console.log('✅ Procedimento adicionado à lista:', novoProcedimento.nome);
  };

  // ETAPA 3: Remover procedimento da lista temporária
  const handleRemoveProcedimentoTemp = (id: string) => {
    setProcedimentosTemp(procedimentosTemp.filter(p => p.id !== id));
  };

  // Voltar para etapa anterior
  const handleVoltarEtapa = () => {
    if (etapaAtual > 1) {
      setEtapaAtual((etapaAtual - 1) as 1 | 2 | 3);
    }
  };

  // ETAPA 3: Salvar tudo no banco (ESPECIALIDADE + MÉDICO OPCIONAL + PROCEDIMENTOS)
  const handleSalvarAgendamento = async () => {
    // Validar apenas especialidade (médico é opcional agora)
    if (!especialidadeNome || addingEspecialidade === null) {
      console.error('❌ Validação falhou:', { especialidadeNome, addingEspecialidade });
      mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade', 'aviso');
      return;
    }
    
    // Médico é opcional - pode ser vazio para equipes médicas
    const nomeMedico = getNomeMedicoSelecionado() || null;
    
    console.log('✅ Validação OK:', { especialidadeNome, medicoSelecionado, nomeMedico: nomeMedico || '(sem médico - equipe)' });
    
    setSalvandoAgendamento(true);
    
    try {
      // Pegar a data do dia selecionado
      const dataSelecionada = proximasDatas[addingEspecialidade];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('💾 Salvando especialidade, médico e procedimentos...');
      
      // 1. Salvar especialidade (sem procedimentos) - MARCADO COMO GRADE CIRÚRGICA
      await agendamentoService.create({
        nome_paciente: '',
        data_nascimento: '2000-01-01',
        data_agendamento: dataFormatada,
        especialidade: especialidadeNome,
        medico: nomeMedico,
        // REMOVIDO: medico_id - coluna não existe no schema do banco
        hospital_id: hospitalId || null,
        cidade_natal: null,
        telefone: null,
        is_grade_cirurgica: true // Marca como registro de grade cirúrgica
      });
      
      console.log('✅ Especialidade salva!');
      
      // 2. Salvar cada procedimento
      for (const procedimento of procedimentosTemp) {
        console.log(`💾 Salvando procedimento: ${procedimento.nome}`);
        
        await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: dataFormatada,
          especialidade: especialidadeNome,
          medico: nomeMedico,
          // REMOVIDO: medico_id - coluna não existe no schema do banco
          procedimentos: procedimento.nome,
          hospital_id: hospitalId || null,
          cidade_natal: null,
          telefone: null
        });
      }
      
      console.log('✅ Todos os dados salvos! Recarregando...');
      
      // 3. Recarregar dados do banco
      const agendamentos = await agendamentoService.getAll(hospitalId);
      const agendamentosDoDia = agendamentos.filter(a => a.data_agendamento === dataFormatada);
      
      // Reagrupar itens (SEM USAR SET - mantém duplicatas de procedimentos)
      const itens: GradeCirurgicaItem[] = [];
      const gruposPorEspecialidade = new Map<string, {
        especialidade: string;
        medico: string;
        procedimentos: string[]; // Array ao invés de Set
      }>();
      
      agendamentosDoDia.forEach(agendamento => {
        if (agendamento.especialidade) {
          // Chave inclui médico se existir, senão usa apenas especialidade
          const medicoKey = agendamento.medico || '(sem médico)';
          const chave = `${agendamento.especialidade}|||${medicoKey}`;
          
          if (!gruposPorEspecialidade.has(chave)) {
            gruposPorEspecialidade.set(chave, {
              especialidade: agendamento.especialidade,
              medico: agendamento.medico || null, // Pode ser null
              procedimentos: []
            });
          }
          
          // Adicionar procedimento ao array (permite duplicatas)
          if (agendamento.procedimentos && agendamento.procedimentos.trim()) {
            gruposPorEspecialidade.get(chave)!.procedimentos.push(agendamento.procedimentos);
          }
        }
      });
      
      gruposPorEspecialidade.forEach((grupo) => {
        // Exibir apenas especialidade se não houver médico
        const textoEspecialidade = grupo.medico 
          ? `${grupo.especialidade} - ${grupo.medico}`
          : grupo.especialidade;
        
        itens.push({
          id: `esp-${Date.now()}-${Math.random()}`,
          tipo: 'especialidade',
          texto: textoEspecialidade,
          ordem: itens.length,
          pacientes: []
        });
        
        // Adicionar cada procedimento (inclusive duplicatas)
        grupo.procedimentos.forEach((proc, idx) => {
          itens.push({
            id: `proc-${Date.now()}-${Math.random()}-${idx}`,
            tipo: 'procedimento',
            texto: proc,
            ordem: itens.length,
            pacientes: []
          });
        });
      });
      
      // Atualizar grade
      const updatedGrades = grades.map((grade, i) => {
        if (i === addingEspecialidade) {
          return { ...grade, itens };
        }
        return grade;
      });
      
      setGrades(updatedGrades);
      
      // Limpar estados mas MANTER o formulário aberto para adicionar mais especialidades
      // IMPORTANTE: Limpar apenas após salvar com sucesso
      setEtapaAtual(1);
      setEspecialidadeSelecionada('');
      setEspecialidadeNome('');
      setMedicoSelecionado('');
      setMedicoNomeSelecionado(''); // Limpar também o nome armazenado
      setProcedimentosTemp([]);
      setNovoProcedimentoNome('');
      // Limpar também a lista de médicos para recarregar na próxima vez
      setMedicosDisponiveis([]);
      // NÃO fechar o formulário: setAddingEspecialidade(null) removido
      
      console.log('✨ Especialidade salva! Você pode adicionar mais especialidades.');
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      mostrarMensagem('❌ Erro ao Salvar', `Erro ao salvar os dados. Verifique o console para mais detalhes.${error instanceof Error ? '\n\n' + error.message : ''}`, 'erro');
    } finally {
      setSalvandoAgendamento(false);
    }
  };

  // Salvar e fechar o formulário
  const handleSalvarEFechar = async () => {
    // Médico é opcional agora
    const nomeMedico = getNomeMedicoSelecionado() || null;
    
    if (!especialidadeNome || addingEspecialidade === null) {
      mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade', 'aviso');
      return;
    }
    
    setSalvandoAgendamento(true);
    
    try {
      // Reutilizar a mesma lógica de handleSalvarAgendamento
      const dataSelecionada = proximasDatas[addingEspecialidade];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      
      console.log('💾 Salvando especialidade, médico e procedimentos...');
      
      // 1. Salvar especialidade (sem procedimentos) - MARCADO COMO GRADE CIRÚRGICA
      await agendamentoService.create({
        nome_paciente: '',
        data_nascimento: '2000-01-01',
        data_agendamento: dataFormatada,
        especialidade: especialidadeNome,
        medico: nomeMedico || null, // Médico opcional (null para equipes)
        // REMOVIDO: medico_id - coluna não existe no schema do banco
        hospital_id: hospitalId || null,
        cidade_natal: null,
        telefone: null,
        is_grade_cirurgica: true // Marca como registro de grade cirúrgica
      });
      
      // 2. Salvar cada procedimento
      for (const procedimento of procedimentosTemp) {
        await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: dataFormatada,
          especialidade: especialidadeNome,
          medico: nomeMedico || null, // Médico opcional (null para equipes)
          // REMOVIDO: medico_id - coluna não existe no schema do banco
          procedimentos: procedimento.nome,
          hospital_id: hospitalId || null,
          cidade_natal: null,
          telefone: null
        });
      }
      
      // 3. Recarregar dados do banco
      const agendamentos = await agendamentoService.getAll(hospitalId);
      const agendamentosDoDia = agendamentos.filter(a => a.data_agendamento === dataFormatada);
      
      // Reagrupar itens
      const itens: GradeCirurgicaItem[] = [];
      const gruposPorEspecialidade = new Map<string, {
        especialidade: string;
        medico: string;
        procedimentos: string[];
      }>();
      
      agendamentosDoDia.forEach(agendamento => {
        if (agendamento.especialidade) {
          // Chave inclui médico se existir, senão usa apenas especialidade
          const medicoKey = agendamento.medico || '(sem médico)';
          const chave = `${agendamento.especialidade}|||${medicoKey}`;
          
          if (!gruposPorEspecialidade.has(chave)) {
            gruposPorEspecialidade.set(chave, {
              especialidade: agendamento.especialidade,
              medico: agendamento.medico || null, // Pode ser null
              procedimentos: []
            });
          }
          
          if (agendamento.procedimentos && agendamento.procedimentos.trim()) {
            gruposPorEspecialidade.get(chave)!.procedimentos.push(agendamento.procedimentos);
          }
        }
      });
      
      gruposPorEspecialidade.forEach((grupo) => {
        // Exibir apenas especialidade se não houver médico
        const textoEspecialidade = grupo.medico 
          ? `${grupo.especialidade} - ${grupo.medico}`
          : grupo.especialidade;
        
        itens.push({
          id: `esp-${Date.now()}-${Math.random()}`,
          tipo: 'especialidade',
          texto: textoEspecialidade,
          ordem: itens.length,
          pacientes: []
        });
        
        grupo.procedimentos.forEach((proc, idx) => {
          itens.push({
            id: `proc-${Date.now()}-${Math.random()}-${idx}`,
            tipo: 'procedimento',
            texto: proc,
            ordem: itens.length,
            pacientes: []
          });
        });
      });
      
      // Atualizar grade
      const updatedGrades = grades.map((grade, i) => {
        if (i === addingEspecialidade) {
          return { ...grade, itens };
        }
        return grade;
      });
      
      setGrades(updatedGrades);
      
      // Limpar estados e FECHAR o formulário
      setAddingEspecialidade(null);
      setEtapaAtual(1);
      setEspecialidadeSelecionada('');
      setEspecialidadeNome('');
      setMedicoSelecionado('');
      setProcedimentosTemp([]);
      setNovoProcedimentoNome('');
      
      console.log('✨ Especialidade salva e formulário fechado!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      mostrarMensagem('❌ Erro ao Salvar', `Erro ao salvar os dados. Verifique o console para mais detalhes.${error instanceof Error ? '\n\n' + error.message : ''}`, 'erro');
    } finally {
      setSalvandoAgendamento(false);
    }
  };

  // Cancelar adição de especialidade
  const handleCancelAddEspecialidade = () => {
    setAddingEspecialidade(null);
    setEtapaAtual(1);
    setEspecialidadeSelecionada('');
    setEspecialidadeNome('');
    setMedicoSelecionado('');
    setMedicoNomeSelecionado('');
    setProcedimentosTemp([]);
    setNovoProcedimentoNome('');
  };

  // Adicionar procedimento (ABRE MODAL EM VEZ DE CRIAR LINHA VAZIA)
  const handleAddProcedimento = (gradeIndex: number, especialidadeId?: string) => {
    // Buscar informações da especialidade
    const grade = grades[gradeIndex];
    const especialidade = grade.itens.find(item => item.id === especialidadeId);
    
    // Abrir modal em modo criação
    setModoCriacaoProc(true);
    setProcedimentoEmEdicao({
      gradeIndex,
      itemId: '',
      agendamentoId: '',
      textoAtual: '',
      especificacaoAtual: '',
      especialidadeId: especialidadeId
    });
    setNovoProcedimentoTexto('');
    setNovaEspecificacaoTexto('');
    setMedicoSelecionadoParaProc('');
    setModalAlterarProcAberto(true);
    
    console.log('📝 Abrindo modal para criar procedimento na especialidade:', especialidade?.texto);
  };

  // Atualizar médico associado ao procedimento
  const handleUpdateMedicoProcedimento = async (gradeIndex: number, itemId: string, medicoId: string) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || item.tipo !== 'procedimento' || !item.agendamentoId) {
      console.warn('⚠️ Item não encontrado ou não é um procedimento com agendamentoId');
      return;
    }
    
    // Buscar nome do médico
    const medico = medicosParaProcedimentos.find(m => m.id === medicoId);
    const medicoNome = medico ? medico.nome : null;
    
    // Atualizar estado local
    setGrades(prev => prev.map((g, i) => {
      if (i === gradeIndex) {
        return {
          ...g,
          itens: g.itens.map(it => {
            if (it.id === itemId) {
              return {
                ...it,
                medicoId: medicoId || undefined,
                medicoNome: medicoNome || undefined
              };
            }
            return it;
          })
        };
      }
      return g;
    }));
    
    // Salvar no banco
    try {
      console.log('💾 Atualizando médico do procedimento no banco...', {
        agendamentoId: item.agendamentoId,
        medicoId,
        medicoNome
      });
      
      await agendamentoService.update(item.agendamentoId, {
        medico: medicoNome || null
        // REMOVIDO: medico_id - coluna não existe no schema do banco
      });
      
      console.log('✅ Médico do procedimento atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar médico do procedimento:', error);
      mostrarAlerta('❌ Erro', `Erro ao atualizar médico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Atualizar texto de um item (APENAS ESPECIALIDADE - PROCEDIMENTO NÃO É MAIS EDITÁVEL DIRETO)
  const handleUpdateItem = (gradeIndex: number, itemId: string, novoTexto: string) => {
    // Calcular novo estado
    const novasGrades = grades.map((grade, i) => {
      if (i === gradeIndex) {
        return {
          ...grade,
          itens: grade.itens.map(item => 
            item.id === itemId ? { ...item, texto: novoTexto } : item
          )
        };
      }
      return grade;
    });

    // Atualizar estado local
    setGrades(novasGrades);
  };

  // NOVA FUNÇÃO: Abrir modal para alterar procedimento
  const handleAbrirAlterarProcedimento = (gradeIndex: number, itemId: string) => {
    console.log('🔍 Abrindo modal para editar procedimento:', { gradeIndex, itemId, totalGrades: grades.length });
    
    if (gradeIndex < 0 || gradeIndex >= grades.length) {
      console.error('❌ Índice de grade inválido:', gradeIndex);
      mostrarAlerta('❌ Erro', `Índice de grade inválido: ${gradeIndex}`);
      return;
    }
    
    const grade = grades[gradeIndex];
    console.log('✅ Grade encontrada:', { data: grade.data, totalItens: grade.itens.length });
    
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || item.tipo !== 'procedimento') {
      console.error('❌ Procedimento não encontrado:', { itemId, itensDisponiveis: grade.itens.map(i => ({ id: i.id, tipo: i.tipo })) });
      mostrarAlerta('❌ Erro', 'Procedimento não encontrado');
      return;
    }
    
    console.log('✅ Procedimento encontrado:', { id: item.id, texto: item.texto, especificacao: item.especificacao });
    
    // Buscar a especialidade deste procedimento (item anterior do tipo 'especialidade')
    let medicoIdDaEspecialidade = '';
    let medicoNomeDaEspecialidade = '';
    let temMedicoNaEspecialidade = false;
    
    const itemIndex = grade.itens.findIndex(it => it.id === itemId);
    for (let i = itemIndex - 1; i >= 0; i--) {
      if (grade.itens[i].tipo === 'especialidade') {
        const especialidadeTexto = grade.itens[i].texto;
        
        // Verificar se a especialidade tem médico (formato: "Especialidade - Médico")
        if (especialidadeTexto.includes(' - ')) {
          const partes = especialidadeTexto.split(' - ');
          medicoNomeDaEspecialidade = partes[1];
          
          // Buscar ID do médico na lista
          const medicoEncontrado = medicosParaProcedimentos.find(m => m.nome === medicoNomeDaEspecialidade);
          if (medicoEncontrado) {
            medicoIdDaEspecialidade = medicoEncontrado.id;
            temMedicoNaEspecialidade = true;
          }
        }
        break;
      }
    }
    
    // Se não tem agendamentoId, é um procedimento novo (ainda não salvo no banco)
    // Permitir edição e criar registro quando salvar
    setProcedimentoEmEdicao({
      gradeIndex,
      itemId,
      agendamentoId: item.agendamentoId || '', // Pode ser vazio para procedimentos novos
      textoAtual: item.texto, // Procedimento base (imutável - marca d'água)
      especificacaoAtual: item.especificacao || '' // Especificação (editável)
    });
    setNovoProcedimentoTexto(item.texto || ''); // Procedimento base (readonly)
    setNovaEspecificacaoTexto(item.especificacao || ''); // Especificação (editável)
    
    // Definir médico da especialidade (se houver)
    if (temMedicoNaEspecialidade) {
      setMedicoSelecionadoParaProc(medicoIdDaEspecialidade);
      setMedicoVemDaEspecialidade(true); // Bloquear campo
    } else {
      // Se não tem médico na especialidade, permitir seleção
      setMedicoSelecionadoParaProc(item.medicoId || '');
      setMedicoVemDaEspecialidade(false); // Desbloquear campo
    }
    
    setModalAlterarProcAberto(true);
  };

  // NOVA FUNÇÃO: Salvar alteração de procedimento (UPDATE ou INSERT no banco)
  const handleSalvarAlteracaoProcedimento = async () => {
    if (!procedimentoEmEdicao) return;
    
    if (!novoProcedimentoTexto.trim()) {
      mostrarAlerta('⚠️ Campo Obrigatório', 'Por favor, preencha o nome do procedimento');
      return;
    }
    
    setSalvandoPaciente(true);
    
    try {
      console.log('🔍 Iniciando salvamento - Estado atual:', {
        procedimentoEmEdicao,
        totalGrades: grades.length,
        gradeIndex: procedimentoEmEdicao.gradeIndex
      });
      
      const grade = grades[procedimentoEmEdicao.gradeIndex];
      
      if (!grade) {
        console.error('❌ Grade não encontrada no índice:', procedimentoEmEdicao.gradeIndex);
        throw new Error(`Grade não encontrada no índice ${procedimentoEmEdicao.gradeIndex}`);
      }
      
      console.log('✅ Grade encontrada:', {
        data: grade.data,
        totalItens: grade.itens.length,
        itens: grade.itens.map(i => ({ id: i.id, tipo: i.tipo, texto: i.texto }))
      });
      
      // MODO CRIAÇÃO: Criar novo procedimento
      if (modoCriacaoProc) {
        console.log('💾 Criando novo procedimento no banco...', {
          procedimento: novoProcedimentoTexto,
          medico: medicoSelecionadoParaProc,
          data: grade.data
        });
        
        // Buscar especialidade associada
        const especialidade = grade.itens.find(i => i.id === procedimentoEmEdicao.especialidadeId);
        
        if (!especialidade) {
          throw new Error('Especialidade não encontrada');
        }
        
        // Extrair nome da especialidade e médico
        let especialidadeNome = especialidade.texto;
        let medicoNome = null;
        
        if (especialidadeNome.includes(' - ')) {
          const partes = especialidadeNome.split(' - ');
          especialidadeNome = partes[0];
          medicoNome = partes[1];
        }
        
        // Se usuário selecionou outro médico no modal, usar esse
        if (medicoSelecionadoParaProc) {
          const medicoObj = medicosParaProcedimentos.find(m => m.id === medicoSelecionadoParaProc);
          if (medicoObj) {
            medicoNome = medicoObj.nome;
          }
        }
        
        // Criar no banco
        const novoAgendamento = await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: grade.data,
          especialidade: especialidadeNome,
          medico: medicoNome,
          procedimentos: novoProcedimentoTexto.trim(),
          hospital_id: hospitalId || null,
          cidade_natal: null,
          telefone: null,
          is_grade_cirurgica: true
        });
        
        console.log('✅ Procedimento criado com sucesso! ID:', novoAgendamento.id);
        
        // ATUALIZAR ESTADO LOCAL em vez de recarregar tudo
        // Isso mantém a posição da tela e evita perder o scroll
        const novoItem: GradeCirurgicaItem = {
          id: `proc-${Date.now()}-${Math.random()}`,
          tipo: 'procedimento',
          texto: novoProcedimentoTexto.trim(),
          ordem: 0, // Será recalculado
          pacientes: [],
          agendamentoId: novoAgendamento.id,
          medicoId: medicoSelecionadoParaProc || undefined,
          medicoNome: medicoNome || undefined
        };
        
        // Atualizar a grade com o novo procedimento
        setGrades(prevGrades => prevGrades.map((g, i) => {
          if (i === procedimentoEmEdicao.gradeIndex) {
            // Encontrar a posição correta para inserir (após a especialidade)
            const especialidadeIndex = g.itens.findIndex(item => item.id === procedimentoEmEdicao.especialidadeId);
            
            if (especialidadeIndex !== -1) {
              let insertIndex = especialidadeIndex + 1;
              
              // Avançar até o final dos procedimentos dessa especialidade
              while (
                insertIndex < g.itens.length && 
                g.itens[insertIndex].tipo === 'procedimento'
              ) {
                insertIndex++;
              }
              
              // Inserir o novo procedimento nessa posição
              const novosItens = [
                ...g.itens.slice(0, insertIndex),
                novoItem,
                ...g.itens.slice(insertIndex)
              ];
              
              // Reordenar todos os itens
              return {
                ...g,
                itens: novosItens.map((item, idx) => ({ ...item, ordem: idx }))
              };
            }
          }
          return g;
        }));
        
        // Fechar modal
        setModalAlterarProcAberto(false);
        setProcedimentoEmEdicao(null);
        setNovoProcedimentoTexto('');
        setNovaEspecificacaoTexto('');
        setMedicoSelecionadoParaProc('');
        setMedicoVemDaEspecialidade(false);
        setModoCriacaoProc(false);
        setSalvandoPaciente(false);
        
        mostrarMensagem('✅ Sucesso', 'Procedimento criado com sucesso!', 'sucesso');
        return;
      }
      
      // MODO EDIÇÃO: Atualizar procedimento existente
      console.log('🔍 Procurando item na grade:', {
        itemIdProcurado: procedimentoEmEdicao.itemId,
        itensDisponiveis: grade.itens.map(i => ({ id: i.id, tipo: i.tipo, texto: i.texto }))
      });
      
      const item = grade.itens.find(i => i.id === procedimentoEmEdicao.itemId);
      
      if (!item) {
        console.error('❌ Item não encontrado! Detalhes:', {
          itemIdProcurado: procedimentoEmEdicao.itemId,
          gradeIndex: procedimentoEmEdicao.gradeIndex,
          itensNaGrade: grade.itens.map(i => i.id)
        });
        throw new Error(`Item não encontrado (ID: ${procedimentoEmEdicao.itemId})`);
      }
      
      console.log('✅ Item encontrado:', { id: item.id, tipo: item.tipo, texto: item.texto });
      
      // Verificar se é um procedimento novo (sem agendamentoId) ou existente
      if (procedimentoEmEdicao.agendamentoId) {
        // CASO 1: Procedimento JÁ EXISTE no banco → UPDATE
        console.log('✏️ Atualizando procedimento no banco...', {
          agendamentoId: procedimentoEmEdicao.agendamentoId,
          procedimentoBaseAntigo: procedimentoEmEdicao.textoAtual,
          procedimentoBaseNovo: novoProcedimentoTexto,
          especificacaoAntiga: procedimentoEmEdicao.especificacaoAtual,
          especificacaoNova: novaEspecificacaoTexto,
          medico: medicoSelecionadoParaProc,
          isUsuarioTI
        });
        
        // Buscar nome do médico se foi selecionado
        let medicoNome = null;
        if (medicoSelecionadoParaProc) {
          const medicoObj = medicosParaProcedimentos.find(m => m.id === medicoSelecionadoParaProc);
          if (medicoObj) {
            medicoNome = medicoObj.nome;
          }
        }
        
        // Preparar dados para atualização
        const updateData: any = {
          procedimento_especificacao: novaEspecificacaoTexto.trim() || null,
          medico: medicoNome
        };
        
        // Se for usuário TI, permitir alterar o procedimento base também
        if (isUsuarioTI && novoProcedimentoTexto.trim() !== procedimentoEmEdicao.textoAtual) {
          updateData.procedimentos = novoProcedimentoTexto.trim().toUpperCase();
          console.log('🔧 [MODO TI] Atualizando também o procedimento base:', updateData.procedimentos);
        }
        
        // Atualizar no banco
        console.log('📤 Enviando UPDATE para o banco:', { 
          agendamentoId: procedimentoEmEdicao.agendamentoId, 
          updateData 
        });
        
        const resultado = await agendamentoService.update(procedimentoEmEdicao.agendamentoId, updateData);
        
        console.log('✅ Procedimento atualizado com sucesso no banco!', resultado);
        console.log('🔍 Especificação salva:', updateData.procedimento_especificacao);
      } else {
        // CASO 2: Procedimento NOVO (ainda não salvo no banco) → INSERT
        console.log('💾 Criando novo procedimento no banco...', {
          procedimento: novoProcedimentoTexto,
          data: grade.data
        });
        
        // Buscar especialidade associada (item anterior do tipo 'especialidade')
        let especialidadeNome = '';
        let medicoNome = null;
        let medicoId = null;
        
        // Percorrer itens da grade até encontrar a especialidade deste procedimento
        for (let i = grade.itens.findIndex(it => it.id === item.id) - 1; i >= 0; i--) {
          if (grade.itens[i].tipo === 'especialidade') {
            especialidadeNome = grade.itens[i].texto;
            // Extrair médico se houver (formato: "Especialidade - Médico" ou apenas "Especialidade")
            if (especialidadeNome.includes(' - ')) {
              const partes = especialidadeNome.split(' - ');
              especialidadeNome = partes[0];
              medicoNome = partes[1];
            }
            break;
          }
        }
        
        if (!especialidadeNome) {
          throw new Error('Especialidade não encontrada. Adicione uma especialidade antes do procedimento.');
        }
        
        // Criar registro no banco
        const novoAgendamento = await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: grade.data,
          especialidade: especialidadeNome,
          medico: medicoNome,
          // REMOVIDO: medico_id - coluna não existe no schema do banco
          procedimentos: novoProcedimentoTexto.trim(),
          hospital_id: hospitalId || null,
          cidade_natal: null,
          telefone: null,
          is_grade_cirurgica: true
        });
        
        console.log('✅ Procedimento criado com sucesso! ID:', novoAgendamento.id);
        
        // Atualizar item com o agendamentoId recém-criado
        item.agendamentoId = novoAgendamento.id;
      }
      
      // Atualizar UI
      const updatedGrades = grades.map((g, i) => {
        if (i === procedimentoEmEdicao.gradeIndex) {
          return {
            ...g,
            itens: g.itens.map(it => {
              if (it.id === procedimentoEmEdicao.itemId && it.tipo === 'procedimento') {
                const novaEspecificacaoFinal = novaEspecificacaoTexto.trim() || undefined;
                console.log('🔄 Atualizando UI - Especificação:', {
                  procedimento: it.texto,
                  especificacaoAntiga: it.especificacao,
                  especificacaoNova: novaEspecificacaoFinal,
                  novaEspecificacaoTextoOriginal: novaEspecificacaoTexto
                });
                
                return {
                  ...it,
                  // Se for usuário TI E alterou o texto base, atualizar; caso contrário, manter o original
                  texto: isUsuarioTI && novoProcedimentoTexto.trim() !== procedimentoEmEdicao.textoAtual
                    ? novoProcedimentoTexto.trim().toUpperCase()
                    : (procedimentoEmEdicao.textoAtual || novoProcedimentoTexto.trim()),
                  especificacao: novaEspecificacaoFinal, // Atualizar especificação
                  agendamentoId: it.agendamentoId || item.agendamentoId // Atualizar com novo ID se foi criado
                };
              }
              return it;
            })
          };
        }
        return g;
      });
      
      console.log('✅ UI atualizada. Grades após update:', updatedGrades.map(g => ({
        data: g.data,
        itens: g.itens.map(it => ({ tipo: it.tipo, texto: it.texto, especificacao: it.especificacao }))
      })));
      
      setGrades(updatedGrades);
      
      // Fechar modal
      setModalAlterarProcAberto(false);
      setProcedimentoEmEdicao(null);
      setNovoProcedimentoTexto('');
      setNovaEspecificacaoTexto('');
      setMedicoSelecionadoParaProc('');
      setMedicoVemDaEspecialidade(false);
      
      // Mostrar mensagem de sucesso
      const mensagemSucesso = procedimentoEmEdicao.agendamentoId 
        ? (isUsuarioTI && novoProcedimentoTexto.trim() !== procedimentoEmEdicao.textoAtual
            ? '🔧 Procedimento base e especificação atualizados (MODO TI)'
            : 'Especificação atualizada')
        : 'Procedimento criado';
      
      mostrarMensagem('✅ Sucesso', `${mensagemSucesso} com sucesso!`, 'sucesso');
      
      // ✅ Não recarregar do banco - a UI já foi atualizada localmente
      // A especificação foi salva no banco e o estado local já reflete a mudança
      console.log('✅ Especificação salva no banco e UI atualizada localmente!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar procedimento:', error);
      mostrarAlerta('❌ Erro ao Salvar', `Erro ao salvar procedimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSalvandoPaciente(false);
    }
  };

  // FUNÇÃO REMOVIDA: handleBlurItem (não vamos mais criar procedimentos novos ao editar)

  // Remover item (COM DELEÇÃO NO BANCO)
  const handleRemoveItem = async (gradeIndex: number, itemId: string) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item) return;
    
    // Se o item tem agendamentoId, deletar do banco
    if (item.agendamentoId) {
      // Abrir modal de confirmação
      const itemNome = item.tipo === 'especialidade' ? 'especialidade' : 'procedimento';
      setConfirmacaoData({
        titulo: '🗑️ Remover Item',
        mensagem: `Deseja realmente remover este ${itemNome}? Esta ação não pode ser desfeita.`,
        onConfirm: async () => {
          setModalConfirmacao(false);
          
          try {
            console.log('🗑️ Deletando agendamento do banco...', { agendamentoId: item.agendamentoId });
            await agendamentoService.delete(item.agendamentoId);
            console.log('✅ Item deletado do banco com sucesso!');
            
            // Atualizar UI removendo o item
            setGrades(prev => prev.map((grade, i) => {
              if (i === gradeIndex) {
                const novosItens = grade.itens.filter(item => item.id !== itemId);
                // Reordenar
                return {
                  ...grade,
                  itens: novosItens.map((item, idx) => ({ ...item, ordem: idx + 1 }))
                };
              }
              return grade;
            }));
          } catch (error) {
            console.error('❌ Erro ao deletar item:', error);
            setConfirmacaoData({
              titulo: '❌ Erro',
              mensagem: `Erro ao deletar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              onConfirm: () => setModalConfirmacao(false)
            });
            setModalConfirmacao(true);
          }
        }
      });
      setModalConfirmacao(true);
    } else {
      // Se não tem agendamentoId, apenas remover da UI (item temporário)
      setGrades(prev => prev.map((grade, i) => {
        if (i === gradeIndex) {
          const novosItens = grade.itens.filter(item => item.id !== itemId);
          // Reordenar
          return {
            ...grade,
            itens: novosItens.map((item, idx) => ({ ...item, ordem: idx + 1 }))
          };
        }
        return grade;
      }));
    }
  };

  // Limpar Grade: Deletar todos os itens do banco
  const handleLimparGrade = async (gradeIndex: number) => {
    const grade = grades[gradeIndex];
    const dataFormatada = proximasDatas[gradeIndex].toISOString().split('T')[0];
    
    // Buscar TODOS os agendamentos daquela data no banco
    // Isso garante que deletamos tanto especialidades quanto procedimentos
    let agendamentosDoDia: any[] = [];
    try {
      const todosAgendamentos = await agendamentoService.getAll(hospitalId);
      agendamentosDoDia = todosAgendamentos.filter(a => a.data_agendamento === dataFormatada);
      console.log('🔍 Agendamentos encontrados para deletar:', agendamentosDoDia.length);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      mostrarMensagem('❌ Erro', 'Erro ao buscar agendamentos. Tente novamente.', 'erro');
      return;
    }
    
    if (agendamentosDoDia.length === 0) {
      // Se não há agendamentos no banco, apenas limpar a UI
      setGrades(prev => prev.map((g, i) => {
        if (i === gradeIndex) {
          return { ...g, itens: [] };
        }
        return g;
      }));
      console.log('ℹ️ Nenhum agendamento encontrado no banco para esta data');
      return;
    }
    
    // Abrir modal de confirmação
    setConfirmacaoData({
      titulo: '🗑️ Limpar Grade',
      mensagem: `Deseja realmente limpar toda a grade do dia ${dataFormatada}? Isso irá deletar ${agendamentosDoDia.length} registro(s) do banco de dados. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setModalConfirmacao(false);
        
        try {
          console.log('🗑️ Deletando todos os agendamentos da grade...', { 
            gradeIndex, 
            dataFormatada, 
            totalAgendamentos: agendamentosDoDia.length,
            ids: agendamentosDoDia.map(a => a.id)
          });
          
          // Deletar TODOS os agendamentos daquela data
          const promises = agendamentosDoDia.map(agendamento => {
            return agendamentoService.delete(agendamento.id);
          });
          
          await Promise.all(promises);
          console.log('✅ Grade limpa com sucesso!', { totalDeletados: agendamentosDoDia.length });
          
          // Atualizar UI limpando todos os itens
          setGrades(prev => prev.map((g, i) => {
            if (i === gradeIndex) {
              return { ...g, itens: [] };
            }
            return g;
          }));
          
          // Mostrar mensagem de sucesso
          mostrarMensagem('✅ Sucesso', `Grade limpa com sucesso! ${agendamentosDoDia.length} registro(s) deletado(s) do banco de dados.`, 'sucesso');
        } catch (error) {
          console.error('❌ Erro ao limpar grade:', error);
          setConfirmacaoData({
            titulo: '❌ Erro',
            mensagem: `Erro ao limpar grade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            onConfirm: () => setModalConfirmacao(false)
          });
          setModalConfirmacao(true);
        }
      }
    });
    setModalConfirmacao(true);
  };

  // Mover item para cima
  const handleMoveUp = (gradeIndex: number, itemId: string) => {
    setGrades(prev => prev.map((grade, i) => {
      if (i === gradeIndex) {
        const itemIndex = grade.itens.findIndex(item => item.id === itemId);
        if (itemIndex > 0) {
          const novosItens = [...grade.itens];
          [novosItens[itemIndex - 1], novosItens[itemIndex]] = [novosItens[itemIndex], novosItens[itemIndex - 1]];
          return {
            ...grade,
            itens: novosItens.map((item, idx) => ({ ...item, ordem: idx + 1 }))
          };
        }
      }
      return grade;
    }));
  };

  // Mover item para baixo
  const handleMoveDown = (gradeIndex: number, itemId: string) => {
    setGrades(prev => prev.map((grade, i) => {
      if (i === gradeIndex) {
        const itemIndex = grade.itens.findIndex(item => item.id === itemId);
        if (itemIndex < grade.itens.length - 1) {
          const novosItens = [...grade.itens];
          [novosItens[itemIndex], novosItens[itemIndex + 1]] = [novosItens[itemIndex + 1], novosItens[itemIndex]];
          return {
            ...grade,
            itens: novosItens.map((item, idx) => ({ ...item, ordem: idx + 1 }))
          };
        }
      }
      return grade;
    }));
  };

  // Replicar grade (COM AUTO-SAVE)
  const handleReplicarGrade = (gradeOrigemIndex: number, gradeDestinoIndex: number) => {
    const gradeOrigem = grades[gradeOrigemIndex];
    
    // Calcular novo estado
    const updatedGrades = grades.map((grade, i) => {
      if (i === gradeDestinoIndex) {
        return {
          ...grade,
          itens: gradeOrigem.itens.map(item => ({
            ...item, // Mantém todos os campos (especialidadeId, procedimentoId, pacientes)
            id: `temp-${Date.now()}-${Math.random()}-${i}`
          }))
        };
      }
      return grade;
    });

    // Atualizar estado local
    setGrades(updatedGrades);
  };

  // Helper para verificar se a grade tem pacientes vinculados
  const gradeTemPacientes = (grade: GradeCirurgicaDia): boolean => {
    return grade.itens.some(item => 
      item.tipo === 'procedimento' && 
      item.pacientes && 
      item.pacientes.length > 0
    );
  };

  // Replicar para todas (COM PERSISTÊNCIA NO BANCO)
  const handleReplicarParaTodas = async (gradeOrigemIndex: number) => {
    const gradeOrigem = grades[gradeOrigemIndex];
    
    console.log('🔄 Replicando grade do dia', gradeOrigemIndex, 'para todos os dias');
    console.log('📋 Itens a replicar:', gradeOrigem.itens);
    
    // IMPORTANTE: Remover pacientes dos itens antes de replicar
    const itensLimpos = gradeOrigem.itens.map(item => ({
      ...item,
      pacientes: [], // Limpar pacientes
      id: `temp-${Date.now()}-${Math.random()}`
    }));
    
    // Calcular novo estado (replicando SEM pacientes)
    const updatedGrades = grades.map((grade, i) => {
      if (i === gradeOrigemIndex) {
        return grade; // Manter a grade original intacta
      }
      return {
        ...grade,
        itens: itensLimpos.map(item => ({
          ...item,
          id: `temp-${Date.now()}-${Math.random()}-${i}`,
          pacientes: [] // Garantir que não há pacientes
        }))
      };
    });

    console.log('✅ Grades atualizadas (SEM pacientes):', updatedGrades);

    // Atualizar estado local
    setGrades(updatedGrades);

    // 🔥 SALVAR NO BANCO SUPABASE (especialidades E procedimentos, SEM pacientes)
    console.log('💾 Salvando especialidades e procedimentos replicados no banco...');
    
    for (let i = 0; i < proximasDatas.length; i++) {
      if (i === gradeOrigemIndex) continue; // Pular o dia de origem
      
      const dataSelecionada = proximasDatas[i];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      
      let especialidadeAtual = '';
      let medicoAtual: string | null = null;
      let medicoIdAtual: string | null = null;
      
      // Percorrer itens limpos e salvar especialidades e procedimentos (SEM pacientes)
      for (const item of itensLimpos) {
        if (item.tipo === 'especialidade') {
          // Se tem " - " no texto, separa especialidade e médico
          // Se não tem, é apenas especialidade (equipe médica)
          if (item.texto.includes(' - ')) {
            const [espNome, medNome] = item.texto.split(' - ');
            especialidadeAtual = espNome || '';
            medicoAtual = medNome || null;
            
            // Buscar ID do médico pelo nome
            medicoIdAtual = null;
            if (medNome && medicosParaProcedimentos.length > 0) {
              const medicoEncontrado = medicosParaProcedimentos.find(m => m.nome === medNome);
              if (medicoEncontrado) {
                medicoIdAtual = medicoEncontrado.id;
              }
            }
          } else {
            // Apenas especialidade, sem médico
            especialidadeAtual = item.texto;
            medicoAtual = null;
            medicoIdAtual = null;
          }
          
          // Salvar especialidade (médico é opcional)
          if (especialidadeAtual) {
            try {
              await agendamentoService.create({
                nome_paciente: '',
                data_nascimento: '2000-01-01',
                data_agendamento: dataFormatada,
                especialidade: especialidadeAtual,
                medico: medicoAtual || null, // Médico opcional (null para equipes)
                // REMOVIDO: medico_id - coluna não existe no schema do banco
                hospital_id: hospitalId || null,
                cidade_natal: null,
                telefone: null,
                is_grade_cirurgica: true // Marca como registro de grade cirúrgica (replicação)
              });
            } catch (error) {
              console.error('❌ Erro ao salvar especialidade replicada:', error);
            }
          }
        } else if (item.tipo === 'procedimento' && item.texto.trim() && especialidadeAtual) {
          // Salvar procedimento (médico é opcional)
          try {
            await agendamentoService.create({
              nome_paciente: '',
              data_nascimento: '2000-01-01',
              data_agendamento: dataFormatada,
              especialidade: especialidadeAtual,
              medico: medicoAtual || null, // Médico opcional (null para equipes)
              // REMOVIDO: medico_id - coluna não existe no schema do banco
              procedimentos: item.texto,
              hospital_id: hospitalId || null,
              cidade_natal: null,
              telefone: null
            });
          } catch (error) {
            console.error('❌ Erro ao salvar procedimento replicado:', error);
          }
        }
      }
    }
    
    console.log('✅ Grade completa replicada e salva no banco! Recarregando...');
    
    // Recarregar TODAS as grades do banco
    const gradesRecarregadas = await Promise.all(
      proximasDatas.map(async (data) => {
        const dataFormatada = data.toISOString().split('T')[0];
        const agendamentos = await agendamentoService.getAll(hospitalId);
        const agendamentosDoDia = agendamentos.filter(a => a.data_agendamento === dataFormatada);
        
        const itens: GradeCirurgicaItem[] = [];
        const gruposPorEspecialidade = new Map<string, {
          especialidade: string;
          medico: string;
          procedimentos: Set<string>;
        }>();
        
        agendamentosDoDia.forEach(agendamento => {
          if (agendamento.especialidade && agendamento.medico) {
            const chave = `${agendamento.especialidade}|||${agendamento.medico}`;
            
            if (!gruposPorEspecialidade.has(chave)) {
              gruposPorEspecialidade.set(chave, {
                especialidade: agendamento.especialidade,
                medico: agendamento.medico,
                procedimentos: new Set()
              });
            }
            
            if (agendamento.procedimentos && agendamento.procedimentos.trim()) {
              gruposPorEspecialidade.get(chave)!.procedimentos.add(agendamento.procedimentos);
            }
          }
        });
        
        gruposPorEspecialidade.forEach((grupo) => {
          itens.push({
            id: `esp-${Date.now()}-${Math.random()}`,
            tipo: 'especialidade',
            texto: `${grupo.especialidade} - ${grupo.medico}`,
            ordem: itens.length,
            pacientes: []
          });
          
          grupo.procedimentos.forEach(proc => {
            itens.push({
              id: `proc-${Date.now()}-${Math.random()}`,
              tipo: 'procedimento',
              texto: proc,
              ordem: itens.length,
              pacientes: []
            });
          });
        });
        
        return {
          ...grades.find(g => g.data === dataFormatada)!,
          itens
        };
      })
    );
    
    setGrades(gradesRecarregadas);
  };

  // Alternar expansão de especialidade
  const toggleExpansao = (gradeIndex: number, especialidadeId: string) => {
    const key = `${gradeIndex}_${especialidadeId}`;
    setExpandedEspecialidades(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Toggle expansão de dados do paciente no procedimento
  const toggleExpansaoProcedimento = (gradeIndex: number, itemId: string) => {
    const key = `${gradeIndex}_${itemId}`;
    setExpandedProcedimentos(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Verificar se procedimento está expandido
  const isProcedimentoExpanded = (gradeIndex: number, itemId: string) => {
    const key = `${gradeIndex}_${itemId}`;
    return expandedProcedimentos[key] || false;
  };

  // Verificar se especialidade está expandida
  const isExpanded = (gradeIndex: number, especialidadeId: string) => {
    const key = `${gradeIndex}_${especialidadeId}`;
    return expandedEspecialidades[key] || false;
  };

  // Adicionar paciente a um procedimento (ABRE MODAL)
  const handleAddPacienteClick = (gradeIndex: number, itemId: string) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || !item.agendamentoId) {
      mostrarAlerta('❌ Erro', 'ID do agendamento não encontrado');
      return;
    }
    
    // Modo criação
    setModoEdicao(false);
    setProcedimentoSelecionado({
      gradeIndex,
      itemId,
      agendamentoId: item.agendamentoId
    });
    setModalPacienteAberto(true);
    
    // Resetar campos
    setPacienteNome('');
    setPacienteDataNascimento('');
    setPacienteCidade('');
    setPacienteTelefone('');
    setPacienteDataConsulta('');
  };

  // NOVO: Editar paciente (ABRE MODAL PREENCHIDO)
  const handleEditarPaciente = (gradeIndex: number, itemId: string, pacienteIndex: number) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || !item.agendamentoId || !item.pacientes || !item.pacientes[pacienteIndex]) {
      mostrarAlerta('❌ Erro', 'Paciente não encontrado');
      return;
    }
    
    const paciente = item.pacientes[pacienteIndex];
    
    // Modo edição
    setModoEdicao(true);
    setProcedimentoSelecionado({
      gradeIndex,
      itemId,
      agendamentoId: item.agendamentoId,
      pacienteIndex
    });
    setModalPacienteAberto(true);
    
    // Preencher campos com dados existentes
    setPacienteNome(paciente.nome);
    setPacienteDataNascimento(paciente.dataNascimento);
    setPacienteCidade(paciente.cidade || '');
    setPacienteTelefone(paciente.telefone || '');
    setPacienteDataConsulta(paciente.dataConsulta || '');
  };

  // Salvar paciente (UPDATE no banco)
  const handleSalvarPaciente = async () => {
    if (!procedimentoSelecionado) return;
    
    // Validações básicas
    if (!pacienteNome.trim()) {
      mostrarAlerta('⚠️ Campo Obrigatório', 'Por favor, preencha o nome do paciente');
      return;
    }
    if (!pacienteDataNascimento) {
      mostrarAlerta('⚠️ Campo Obrigatório', 'Por favor, preencha a data de nascimento');
      return;
    }
    
    setSalvandoPaciente(true);
    
    try {
      console.log(modoEdicao ? '✏️ Editando paciente...' : '💾 Cadastrando paciente...', {
        id: procedimentoSelecionado.agendamentoId,
        nome_paciente: pacienteNome,
        data_nascimento: pacienteDataNascimento,
        cidade_natal: pacienteCidade || null,
        telefone: pacienteTelefone || null,
        data_consulta: pacienteDataConsulta || null
      });
      
      // UPDATE no banco usando o agendamentoId
      await agendamentoService.update(procedimentoSelecionado.agendamentoId, {
        nome_paciente: pacienteNome,
        data_nascimento: pacienteDataNascimento,
        cidade_natal: pacienteCidade || null,
        telefone: pacienteTelefone || null,
        data_consulta: pacienteDataConsulta || null
      });
      
      console.log(`✅ Paciente ${modoEdicao ? 'atualizado' : 'cadastrado'} com sucesso!`);
      
      const novoPaciente = {
        nome: pacienteNome,
        dataNascimento: pacienteDataNascimento,
        cidade: pacienteCidade || null,
        telefone: pacienteTelefone || null,
        dataConsulta: pacienteDataConsulta || null
      };
      
      // Atualizar UI
      const updatedGrades = grades.map((grade, i) => {
        if (i === procedimentoSelecionado.gradeIndex) {
          return {
            ...grade,
            itens: grade.itens.map(item => {
              if (item.id === procedimentoSelecionado.itemId && item.tipo === 'procedimento') {
                if (modoEdicao && procedimentoSelecionado.pacienteIndex !== undefined) {
                  // EDIÇÃO: Substituir paciente existente
                  const novosPacientes = [...(item.pacientes || [])];
                  novosPacientes[procedimentoSelecionado.pacienteIndex] = novoPaciente;
                  return {
                    ...item,
                    pacientes: novosPacientes
                  };
                } else {
                  // CRIAÇÃO: Adicionar novo paciente
                  return {
                    ...item,
                    pacientes: [...(item.pacientes || []), novoPaciente]
                  };
                }
              }
              return item;
            })
          };
        }
        return grade;
      });
      
      setGrades(updatedGrades);
      
      // Fechar modal
      setModalPacienteAberto(false);
      setProcedimentoSelecionado(null);
      setModoEdicao(false);
      
    } catch (error) {
      console.error('❌ Erro ao salvar paciente:', error);
      mostrarAlerta('❌ Erro ao Salvar', `Erro ao salvar paciente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSalvandoPaciente(false);
    }
  };

  // Cancelar adição de paciente (FECHA MODAL)
  const handleCancelarPaciente = () => {
    setModalPacienteAberto(false);
    setProcedimentoSelecionado(null);
  };

  // Remover paciente de um procedimento (LIMPAR DADOS NO BANCO)
  const handleRemovePaciente = async (gradeIndex: number, itemId: string, pacienteIndex: number) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || !item.agendamentoId || !item.pacientes || !item.pacientes[pacienteIndex]) {
      setConfirmacaoData({
        titulo: '❌ Erro',
        mensagem: 'Paciente não encontrado.',
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
      return;
    }
    
    const paciente = item.pacientes[pacienteIndex];
    
    // Abrir modal de confirmação
    setConfirmacaoData({
      titulo: '🗑️ Remover Paciente',
      mensagem: `Deseja realmente remover o paciente "${paciente.nome}" do procedimento?`,
      onConfirm: async () => {
        setModalConfirmacao(false);
        
        try {
          console.log('🗑️ Removendo paciente do banco...', { agendamentoId: item.agendamentoId });
          
          // UPDATE no banco limpando os dados do paciente
          await agendamentoService.update(item.agendamentoId, {
            nome_paciente: '',
            data_nascimento: '2000-01-01', // Data placeholder
            cidade_natal: null,
            telefone: null,
            data_consulta: null
          });
          
          console.log('✅ Paciente removido com sucesso!');
          
          // Atualizar UI removendo o paciente
          const updatedGrades = grades.map((grade, i) => {
            if (i === gradeIndex) {
              return {
                ...grade,
                itens: grade.itens.map(item => {
                  if (item.id === itemId && item.tipo === 'procedimento' && item.pacientes) {
                    return {
                      ...item,
                      pacientes: item.pacientes.filter((_, idx) => idx !== pacienteIndex)
                    };
                  }
                  return item;
                })
              };
            }
            return grade;
          });

          setGrades(updatedGrades);
          
        } catch (error) {
          console.error('❌ Erro ao remover paciente:', error);
          setConfirmacaoData({
            titulo: '❌ Erro',
            mensagem: `Erro ao remover paciente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            onConfirm: () => setModalConfirmacao(false)
          });
          setModalConfirmacao(true);
        }
      }
    });
    setModalConfirmacao(true);
  };

  // Função para abrir modal de mover paciente
  const handleAbrirModalMoverPaciente = async (
    gradeIndex: number, 
    itemId: string, 
    pacienteIndex: number
  ) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || !item.agendamentoId || !item.pacientes || !item.pacientes[pacienteIndex]) {
      setConfirmacaoData({
        titulo: '❌ Erro',
        mensagem: 'Paciente não encontrado.',
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
      return;
    }
    
    const paciente = item.pacientes[pacienteIndex];
    
    try {
      // Buscar TODOS os agendamentos do hospital para encontrar todas as datas disponíveis
      console.log('🔍 Buscando todas as datas com agendamentos...');
      const todosAgendamentos = await agendamentoService.getAll(hospitalId);
      
      // Descobrir o dia da semana da data atual (0=domingo, 1=segunda, ..., 6=sábado)
      const diaSemanaDaDataAtual = new Date(grade.data + 'T00:00:00').getDay();
      console.log(`📅 Dia da semana da data atual: ${diaSemanaDaDataAtual} (${DAY_NUMBER_NAMES[diaSemanaDaDataAtual]})`);

      // Extrair datas únicas (exceto a data atual) que possuem especialidade e procedimento
      // e pelo menos UM procedimento sem paciente associado (slot disponível)
      const datasUnicas = new Map<string, number>(); // data -> count de slots disponíveis
      todosAgendamentos.forEach(ag => {
        if (
          ag.data_agendamento &&
          ag.data_agendamento !== grade.data &&
          ag.especialidade &&
          ag.procedimentos &&
          (!ag.nome_paciente || ag.nome_paciente.trim() === '')
        ) {
          datasUnicas.set(ag.data_agendamento, (datasUnicas.get(ag.data_agendamento) || 0) + 1);
        }
      });
      
      // Ordenar e formatar as datas
      const datasComGrades = Array.from(datasUnicas.keys())
        .sort() // Ordenar cronologicamente
        .map(data => ({
          data: data,
          label: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })
        }));
      
      console.log(`✅ Encontradas ${datasComGrades.length} datas com slots disponíveis`);
      
      if (datasComGrades.length === 0) {
        setConfirmacaoData({
          titulo: '⚠️ Nenhuma Data Disponível',
          mensagem: `Não há outras datas com especialidades e procedimentos disponíveis (sem paciente) para mover este paciente.`,
          onConfirm: () => setModalConfirmacao(false)
        });
        setModalConfirmacao(true);
        return;
      }
      
      setAgendamentoParaMover({
        id: item.agendamentoId,
        nome: paciente.nome,
        procedimento: item.texto || 'Procedimento',
        dataAtual: grade.data, // grade.data já é uma string no formato YYYY-MM-DD
        gradeIndex,
        diaSemana: DAY_NUMBER_NAMES[diaSemanaDaDataAtual],
        dataNascimento: paciente.dataNascimento || null,
        cidadeNatal: paciente.cidade || null,
        telefone: paciente.telefone || null,
        dataConsulta: paciente.dataConsulta || null
      });
      setDatasDisponiveis(datasComGrades);
      setNovaDataSelecionada('');
      setEspecialidadesDisponiveis([]);
      setProcedimentosDisponiveis([]);
      setEspecialidadeSelecionadaDestino('');
      setProcedimentoSelecionadoDestino('');
      setModalMoverPaciente(true);
      
    } catch (error) {
      console.error('❌ Erro ao buscar datas:', error);
      setConfirmacaoData({
        titulo: '❌ Erro',
        mensagem: 'Erro ao buscar datas disponíveis.',
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
    }
  };

  // Função para carregar especialidades e procedimentos quando uma data é selecionada
  const handleSelecionarDataDestino = async (dataDestino: string) => {
    setNovaDataSelecionada(dataDestino);
    setEspecialidadesDisponiveis([]);
    setProcedimentosDisponiveis([]);
    setEspecialidadeSelecionadaDestino('');
    setProcedimentoSelecionadoDestino('');
    
    if (!dataDestino) return;
    
    setCarregandoDestinos(true);
    try {
      console.log('🔍 Buscando especialidades para a data:', dataDestino);
      
      // Buscar agendamentos da data selecionada diretamente do banco
      const todosAgendamentos = await agendamentoService.getAll(hospitalId);
      const agendamentosDaData = todosAgendamentos.filter(a => a.data_agendamento === dataDestino);
      
      console.log(`📅 Encontrados ${agendamentosDaData.length} agendamentos para ${dataDestino}`);
      
      if (agendamentosDaData.length === 0) {
        setConfirmacaoData({
          titulo: '⚠️ Erro',
          mensagem: 'Nenhuma especialidade encontrada para esta data.',
          onConfirm: () => setModalConfirmacao(false)
        });
        setModalConfirmacao(true);
        setCarregandoDestinos(false);
        return;
      }
      
      // Agrupar por especialidade + médico, considerando apenas slots disponíveis (sem paciente)
      const especialidadesMap = new Map<string, { 
        id: string; 
        nome: string; 
        medicoId: string; 
        medicoNome: string;
        agendamentos: typeof agendamentosDaData;
      }>();
      
      agendamentosDaData.forEach((agendamento) => {
        if (agendamento.especialidade && agendamento.procedimentos && (!agendamento.nome_paciente || agendamento.nome_paciente.trim() === '')) {
          const medico = agendamento.medico || '';
          const key = `${agendamento.especialidade}|||${medico}`;
          
          if (!especialidadesMap.has(key)) {
            especialidadesMap.set(key, {
              id: key, // Usar chave como ID
              nome: agendamento.especialidade,
              medicoId: '', // Não temos o ID do médico aqui
              medicoNome: medico,
              agendamentos: []
            });
          }
          
          especialidadesMap.get(key)!.agendamentos.push(agendamento);
        }
      });
      
      const especialidadesArray = Array.from(especialidadesMap.values());
      console.log(`✅ ${especialidadesArray.length} especialidades encontradas`);
      
      setEspecialidadesDisponiveis(especialidadesArray);
      
    } catch (error) {
      console.error('❌ Erro ao carregar especialidades:', error);
      setConfirmacaoData({
        titulo: '❌ Erro',
        mensagem: 'Erro ao carregar especialidades disponíveis.',
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
    } finally {
      setCarregandoDestinos(false);
    }
  };

  // Função para carregar procedimentos quando uma especialidade é selecionada
  const handleSelecionarEspecialidadeDestino = (especialidadeId: string) => {
    setEspecialidadeSelecionadaDestino(especialidadeId);
    setProcedimentosDisponiveis([]);
    setProcedimentoSelecionadoDestino('');
    
    if (!especialidadeId || !novaDataSelecionada) return;
    
    // Encontrar a especialidade selecionada
    const especialidadeSelecionada = especialidadesDisponiveis.find(e => e.id === especialidadeId);
    
    if (!especialidadeSelecionada || !especialidadeSelecionada.agendamentos) return;
    
    console.log('🔍 Buscando procedimentos para especialidade:', especialidadeSelecionada.nome);
    
    // Extrair procedimentos únicos dos agendamentos desta especialidade
    const procedimentosMap = new Map<string, { id: string; texto: string; agendamentoId: string }>();
    
    especialidadeSelecionada.agendamentos.forEach((agendamento) => {
      // Considerar apenas procedimentos sem paciente associado
      if (agendamento.procedimentos && agendamento.id && (!agendamento.nome_paciente || agendamento.nome_paciente.trim() === '')) {
        const key = agendamento.procedimentos;
        if (!procedimentosMap.has(key)) {
          procedimentosMap.set(key, {
            id: agendamento.id, // Usar o ID do agendamento como ID do procedimento
            texto: agendamento.procedimentos,
            agendamentoId: agendamento.id
          });
        }
      }
    });
    
    const procedimentosArray = Array.from(procedimentosMap.values());
    console.log(`✅ ${procedimentosArray.length} procedimentos encontrados`);
    
    setProcedimentosDisponiveis(procedimentosArray);
  };

  // Função para executar a mudança de data
  const handleMoverPaciente = async () => {
    if (!agendamentoParaMover || !novaDataSelecionada || !especialidadeSelecionadaDestino || !procedimentoSelecionadoDestino) {
      setConfirmacaoData({
        titulo: '⚠️ Atenção',
        mensagem: 'Por favor, selecione a data, especialidade e procedimento de destino.',
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
      return;
    }

    setMovendoPaciente(true);
    try {
      // Buscar dados da especialidade e procedimento de destino
      const especialidadeDestino = especialidadesDisponiveis.find(e => e.id === especialidadeSelecionadaDestino);
      const agendamentoSelecionado = (especialidadeDestino?.agendamentos as any[] || []).find((a: any) => String(a.id) === String(procedimentoSelecionadoDestino));
      if (!especialidadeDestino || !agendamentoSelecionado) {
        throw new Error('Especialidade ou procedimento de destino não encontrado.');
      }
      const procedimentoDestino = { texto: String(agendamentoSelecionado.procedimentos || ''), agendamentoId: String(agendamentoSelecionado.id) };
      
      console.log('📅 Movendo paciente...', {
        agendamentoId: agendamentoParaMover.id,
        dataAtual: agendamentoParaMover.dataAtual,
        novaData: novaDataSelecionada,
        novaEspecialidade: especialidadeDestino.nome,
        novoProcedimento: procedimentoDestino.texto,
        novoMedico: especialidadeDestino.medicoNome
      });

      // 1) Preencher o SLOT DE DESTINO (agendamentoId do procedimento selecionado) com os dados do paciente
      const resultadoDestino = await agendamentoService.update(procedimentoDestino.agendamentoId, {
        nome_paciente: agendamentoParaMover.nome,
        data_nascimento: agendamentoParaMover.dataNascimento || null,
        cidade_natal: agendamentoParaMover.cidadeNatal || null,
        telefone: agendamentoParaMover.telefone || null,
        data_consulta: agendamentoParaMover.dataConsulta || null
      });

      console.log('✅ Paciente atribuído ao destino com sucesso!', resultadoDestino);

      // 2) LIMPAR O SLOT DE ORIGEM
      await agendamentoService.update(agendamentoParaMover.id, {
        nome_paciente: '',
        data_nascimento: '2000-01-01', // placeholder, seguindo a lógica de remoção existente
        cidade_natal: null,
        telefone: null,
        data_consulta: null
      });

      console.log('✅ Slot de origem limpo com sucesso!');
      console.log('🔄 Datas atualmente visíveis no modal:', proximasDatas.map(d => d.toISOString().split('T')[0]));

      // Fechar modal de mover paciente
      setModalMoverPaciente(false);
      setAgendamentoParaMover(null);

      // Recarregar todas as grades do banco (MANTÉM O MODAL PRINCIPAL ABERTO)
      await recarregarGradesDoSupabase();

      // Mostrar mensagem de sucesso
      setConfirmacaoData({
        titulo: '✅ Paciente Movido com Sucesso',
        mensagem: `O paciente "${agendamentoParaMover.nome}" foi movido para:\n\n📅 Data: ${new Date(novaDataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}\n🏥 Especialidade: ${especialidadeDestino.nome}\n💉 Procedimento: ${procedimentoDestino.texto}\n\n✨ As grades foram atualizadas automaticamente!`,
        onConfirm: () => {
          setModalConfirmacao(false);
        }
      });
      setModalConfirmacao(true);

    } catch (error) {
      console.error('❌ Erro ao mover paciente:', error);
      setConfirmacaoData({
        titulo: '❌ Erro',
        mensagem: `Erro ao mover paciente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        onConfirm: () => setModalConfirmacao(false)
      });
      setModalConfirmacao(true);
    } finally {
      setMovendoPaciente(false);
    }
  };


  const mesProximoNome = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1)
    .toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  
  const nomeDiaClicado = DAY_NUMBER_NAMES[diaSemanaClicado];

  // Agrupar itens por especialidade para cada grade
  const getEspecialidadesAgrupadas = (itens: GradeCirurgicaItem[]) => {
    const grupos: { especialidade: GradeCirurgicaItem | null; procedimentos: GradeCirurgicaItem[] }[] = [];
    let especialidadeAtual: GradeCirurgicaItem | null = null;
    let procedimentosAtuais: GradeCirurgicaItem[] = [];

    itens.forEach((item) => {
      if (item.tipo === 'especialidade') {
        // Se já havia uma especialidade anterior, salvar o grupo
        if (especialidadeAtual || procedimentosAtuais.length > 0) {
          grupos.push({
            especialidade: especialidadeAtual,
            procedimentos: procedimentosAtuais
          });
        }
        // Iniciar novo grupo
        especialidadeAtual = item;
        procedimentosAtuais = [];
      } else {
        // Adicionar procedimento ao grupo atual
        procedimentosAtuais.push(item);
      }
    });

    // Adicionar último grupo
    if (especialidadeAtual || procedimentosAtuais.length > 0) {
      grupos.push({
        especialidade: especialidadeAtual,
        procedimentos: procedimentosAtuais
      });
    }

    // Ordenar procedimentos alfabeticamente dentro de cada grupo
    grupos.forEach(grupo => {
      grupo.procedimentos.sort((a, b) => {
        const textoA = (a.texto || '').toLowerCase();
        const textoB = (b.texto || '').toLowerCase();
        return textoA.localeCompare(textoB, 'pt-BR');
      });
    });

    return grupos;
  };

  // Função para gerar dados do relatório
  const dadosRelatorio = useMemo(() => {
    const dados: Array<{
      data: string;
      especialidade: string;
      procedimento: string;
      procedimentoEspecificacao: string | null;
      medico: string;
      paciente: string;
      idade: number | null;
      cidade: string | null;
      telefone: string | null;
      dataConsulta: string | null;
      dataNascimento: string | null;
    }> = [];

    grades.forEach((grade, gradeIndex) => {
      const data = proximasDatas[gradeIndex];
      if (!data) return;

      const grupos = getEspecialidadesAgrupadas(grade.itens);
      
      grupos.forEach((grupo) => {
        grupo.procedimentos.forEach((proc) => {
          // Extrair apenas o nome da especialidade, removendo o nome do médico se presente
          let especialidadeNome = grupo.especialidade?.texto || 'Sem especialidade';
          // Se contém " - ", pegar apenas a parte antes (nome da especialidade)
          if (especialidadeNome.includes(' - ')) {
            especialidadeNome = especialidadeNome.split(' - ')[0];
          }
          const procedimentoNome = proc.texto || 'Sem procedimento';
          const procedimentoEspecificacao = proc.especificacao || null;
          const medicoNome = proc.medicoNome || 'Sem médico';

          if (proc.pacientes && proc.pacientes.length > 0) {
            proc.pacientes.forEach((paciente) => {
              const idade = paciente.dataNascimento
                ? new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
                : null;

              dados.push({
                data: data.toLocaleDateString('pt-BR'),
                especialidade: especialidadeNome,
                procedimento: procedimentoNome,
                procedimentoEspecificacao,
                medico: medicoNome,
                paciente: paciente.nome || 'Sem nome',
                idade,
                cidade: paciente.cidade || null,
                telefone: paciente.telefone || null,
                dataConsulta: paciente.dataConsulta ? new Date(paciente.dataConsulta).toLocaleDateString('pt-BR') : null,
                dataNascimento: paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : null,
              });
            });
          } else {
            // Procedimento sem paciente - mostrar nome do procedimento
            dados.push({
              data: data.toLocaleDateString('pt-BR'),
              especialidade: especialidadeNome,
              procedimento: procedimentoNome,
              procedimentoEspecificacao,
              medico: medicoNome,
              paciente: procedimentoNome, // Mostrar nome do procedimento ao invés de "Sem paciente"
              idade: null,
              cidade: null,
              telefone: null,
              dataConsulta: null,
              dataNascimento: null,
            });
          }
        });
      });
    });

    return dados;
  }, [grades, proximasDatas]);

  // Função para converter imagem em base64
  const imageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Não foi possível criar contexto do canvas'));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Função para gerar e baixar PDF do relatório
  const gerarPDFRelatorio = async () => {
    setGerandoPDF(true);
    try {
    const doc = new jsPDF({
      orientation: 'landscape', // Paisagem
      unit: 'mm',
      format: 'a4'
    });

    try {
      // Carregar e adicionar logo
      const logoPath = '/CIS Sem fundo.jpg';
      const logoBase64 = await imageToBase64(logoPath);
      
      // Adicionar logo no cabeçalho (lado esquerdo)
      // Tamanho: 25mm de largura, altura proporcional (mantém proporção)
      const logoWidth = 25;
      const logoHeight = 15; // Altura fixa para manter proporção
      doc.addImage(logoBase64, 'JPEG', 14, 8, logoWidth, logoHeight, undefined, 'FAST');
      
      // Título do relatório (ao lado do logo, centralizado verticalmente)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const titleY = 8 + (logoHeight / 2) - 3; // Centralizado verticalmente com o logo
      doc.text(`Relatório - ${nomeDiaClicado}s de ${mesExibidoNome}`, 14 + logoWidth + 5, titleY);

      // Informações adicionais (abaixo do título)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de registros: ${dadosRelatorio.length}`, 14 + logoWidth + 5, titleY + 7);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14 + logoWidth + 5, titleY + 12);
    } catch (error) {
      console.warn('Erro ao carregar logo, continuando sem logo:', error);
      // Se não conseguir carregar o logo, continua sem ele
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Relatório - ${nomeDiaClicado}s de ${mesExibidoNome}`, 14, 15);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de registros: ${dadosRelatorio.length}`, 14, 22);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 27);
    }

    // Preparar dados da tabela
    const tableData = dadosRelatorio.map(linha => [
      linha.data,
      linha.especialidade,
      linha.procedimento,
      linha.procedimentoEspecificacao || '-',
      linha.medico,
      linha.paciente,
      linha.idade !== null ? String(linha.idade) : '-',
      linha.cidade || '-',
      linha.telefone || '-',
      linha.dataConsulta || '-',
      linha.dataNascimento || '-'
    ]);

    // Configurar colunas da tabela
    const columns = [
      { header: 'Data', dataKey: 'data' },
      { header: 'Especialidade', dataKey: 'especialidade' },
      { header: 'Procedimento', dataKey: 'procedimento' },
      { header: 'Especificação do Procedimento', dataKey: 'procedimentoEspecificacao' },
      { header: 'Médico', dataKey: 'medico' },
      { header: 'Paciente', dataKey: 'paciente' },
      { header: 'Idade', dataKey: 'idade' },
      { header: 'Cidade', dataKey: 'cidade' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Data Consulta', dataKey: 'dataConsulta' },
      { header: 'Data Nascimento', dataKey: 'dataNascimento' }
    ];

    // Adicionar tabela ao PDF usando autoTable como função
    autoTable(doc, {
      head: [['Data', 'Especialidade', 'Procedimento', 'Especificação do Procedimento', 'Médico', 'Paciente', 'Idade', 'Cidade', 'Telefone', 'Data Consulta', 'Data Nascimento']],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [128, 128, 128],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Data
        1: { cellWidth: 26 }, // Especialidade
        2: { cellWidth: 30 }, // Procedimento
        3: { cellWidth: 32 }, // Especificação do Procedimento
        4: { cellWidth: 26 }, // Médico
        5: { cellWidth: 32 }, // Paciente
        6: { cellWidth: 14 }, // Idade
        7: { cellWidth: 22 }, // Cidade
        8: { cellWidth: 22 }, // Telefone
        9: { cellWidth: 22 }, // Data Consulta
        10: { cellWidth: 22 }  // Data Nascimento
      },
      margin: { left: 14, right: 14 },
      didDrawPage: function (data: any) {
        // Adicionar número da página
        doc.setFontSize(8);
        doc.text(
          `Página ${data.pageNumber}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // Nome do arquivo
    const nomeArquivo = `Relatorio_${nomeDiaClicado}_${mesExibidoNome.replace(/\s+/g, '_')}.pdf`;
    
    // Baixar PDF
    doc.save(nomeArquivo);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setGerandoPDF(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="" 
      size="fullscreen"
      hideCloseButton={true}
    >
      {/* Cabeçalho Customizado com Navegação */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Botão Voltar Mês */}
        <button
          onClick={() => setOffsetMes(prev => prev - 1)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Mês anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Anterior</span>
        </button>

        {/* Título Central */}
        <h2 className="text-xl font-bold text-gray-800">
          Grade Cirúrgica - {nomeDiaClicado}s de {mesExibidoNome}
        </h2>

        {/* Botões à direita */}
        <div className="flex items-center gap-2">
          {/* Botão Emitir Relatório - Download direto do PDF */}
          <button
            onClick={gerarPDFRelatorio}
            disabled={gerandoPDF || dadosRelatorio.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={gerandoPDF ? "Gerando PDF..." : dadosRelatorio.length === 0 ? "Nenhum registro para gerar relatório" : "Emitir Relatório PDF"}
          >
            {gerandoPDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Gerando PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Emitir Relatório</span>
              </>
            )}
          </button>

          {/* Botão Avançar Mês */}
          <button
            onClick={() => setOffsetMes(prev => prev + 1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Próximo mês"
          >
            <span className="text-sm font-medium">Próximo</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col p-4 overflow-y-auto">
        {/* Indicador de Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-600">Carregando grade cirúrgica...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid com 1 dia por linha - sempre 1 coluna para dar espaço à tabela */}
            <div className="flex flex-col gap-4 mb-4">
              {proximasDatas.map((data, index) => {
                const grade = grades[index];
                
                // Proteção: se grade não existir ainda (loading), pular
                if (!grade) return null;

            return (
              <div
                key={index}
                className="border-4 border-blue-400 rounded-xl bg-white shadow-lg flex flex-col w-full overflow-hidden"
              >
                {/* Header do Card com Data e Dia da Semana Destacados */}
                <div className="px-4 py-3 border-b-4 border-blue-300 bg-white">
                  <div className="flex items-center justify-center relative min-h-[3rem]">
                    {/* Botões de ação do header - lado esquerdo */}
                    <div className="absolute left-0 flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleAddEspecialidadeClick(index)}
                        className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-medium transition-colors"
                        title="Adicionar Especialidade"
                      >
                        <PlusIcon className="w-2.5 h-2.5" />
                        Especialidade
                      </button>
                      
                      {/* Botão Limpar Grade: Deletar todos os itens do banco */}
                      {grade.itens.length > 0 && (
                        <button
                          onClick={() => handleLimparGrade(index)}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-medium transition-colors"
                          title="Limpar Grade (deletar todos os itens do banco)"
                        >
                          <TrashIcon className="w-2.5 h-2.5" />
                          Limpar Grade
                        </button>
                      )}
                      
                      {/* Botão Replicar: Só aparece no primeiro dia SE houver procedimentos E não houver pacientes */}
                      {index === 0 && grade.itens.length > 0 && !gradeTemPacientes(grade) && (
                        <button
                          onClick={() => handleReplicarParaTodas(index)}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-medium transition-colors"
                          title="Replicar especialidades, médicos e procedimentos para todos os dias (sem pacientes)"
                        >
                          <CopyIcon className="w-2.5 h-2.5" />
                          Replicar
                        </button>
                      )}
                      
                      {/* Mensagem quando há pacientes */}
                      {index === 0 && grade.itens.length > 0 && gradeTemPacientes(grade) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Não é possível replicar com pacientes vinculados
                        </div>
                      )}
                    </div>
                    
                    {/* Data e Dia da Semana Centralizados - Formato: 05/01/2026 - Segunda-Feira */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold text-black">
                        {String(data.getDate()).padStart(2, '0')}/{String(data.getMonth() + 1).padStart(2, '0')}/{data.getFullYear()}
                      </span>
                      <span className="text-xl font-semibold text-black">-</span>
                      <span className="text-xl font-semibold text-black">
                        {DAY_NUMBER_NAMES[data.getDay()]}
                      </span>
                      {grade.itens.length > 0 && (
                        <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded-full shadow-sm ml-2">
                          {(() => {
                            const totalPacientes = grade.itens
                              .filter(item => item.tipo === 'procedimento')
                              .reduce((sum, item) => sum + (item.pacientes?.length || 0), 0);
                            return totalPacientes > 0 ? totalPacientes : grade.itens.length;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* NOVO FLUXO EM 3 ETAPAS: Especialidade → Médico → Procedimentos */}
                {addingEspecialidade === index && (
                  <div className="p-3 bg-blue-50 border-b-2 border-blue-200">
                    {/* Indicador de progresso das etapas */}
                    <div className="flex items-center justify-center mb-3 gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${etapaAtual === 1 ? 'bg-blue-600 text-white' : etapaAtual > 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {etapaAtual > 1 ? '✓' : '1'} Especialidade
                      </div>
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${etapaAtual === 2 ? 'bg-blue-600 text-white' : etapaAtual > 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {etapaAtual > 2 ? '✓' : '2'} Médico <span className="text-[10px] opacity-75">(opcional)</span>
                      </div>
                      <div className="w-4 h-0.5 bg-gray-300"></div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${etapaAtual === 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        3 Procedimentos
                      </div>
                    </div>

                    {/* ETAPA 1: Selecionar Especialidade */}
                    {etapaAtual === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                            Especialidade:
                          </label>
                          <select
                            value={especialidadeSelecionada}
                            onChange={(e) => setEspecialidadeSelecionada(e.target.value)}
                            className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          >
                            <option value="">-- Selecione --</option>
                            {especialidades.map(esp => (
                              <option key={esp.id} value={esp.id}>
                                {esp.nome}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleConfirmEspecialidade}
                            disabled={!especialidadeSelecionada}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Próximo: Informar Médico (opcional)"
                          >
                            ➜ Próximo
                          </button>
                          <button
                            onClick={handlePularMedico}
                            disabled={!especialidadeSelecionada}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Pular Médico: Ir direto para Procedimentos (para equipes médicas)"
                          >
                            ⏭ Pular Médico
                          </button>
                          <button
                            onClick={handleCancelAddEspecialidade}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                            title="Cancelar"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ETAPA 2: Digitar Nome do Médico */}
                    {etapaAtual === 2 && (
                      <div className="space-y-2">
                        {/* Mostrar especialidade selecionada */}
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-300">
                          <span className="text-xs text-blue-900">
                            <strong>Especialidade:</strong> {especialidadeNome}
                          </span>
                          <button
                            onClick={handleVoltarEtapa}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            ← Alterar
                          </button>
                        </div>
                        
                        {/* Campo para selecionar médico */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                            Nome do Médico:
                          </label>
                          {carregandoMedicos ? (
                            <div className="flex-1 text-xs text-gray-500 px-2 py-1">
                              Carregando médicos...
                            </div>
                          ) : medicosDisponiveis.length === 0 ? (
                            <div className="flex-1 text-xs text-red-500 px-2 py-1">
                              Nenhum médico encontrado para este hospital
                            </div>
                          ) : (
                            <select
                              value={medicoSelecionado}
                              onChange={(e) => setMedicoSelecionado(e.target.value)}
                              className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              autoFocus
                            >
                              <option value="">Selecione um médico...</option>
                              {medicosDisponiveis.map((medico) => (
                                <option key={medico.id} value={medico.id}>
                                  {medico.nome}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={handleConfirmMedico}
                            disabled={carregandoMedicos}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Próximo: Adicionar Procedimentos (médico é opcional)"
                          >
                            ➜ {medicoSelecionado ? 'Próximo' : 'Continuar sem Médico'}
                          </button>
                          <button
                            onClick={handleCancelAddEspecialidade}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                            title="Cancelar"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ETAPA 3: Adicionar Procedimentos (SIMPLIFICADO) */}
                    {etapaAtual === 3 && (
                      <div className="space-y-3">
                        {/* Resumo: Especialidade e Médico (opcional) */}
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-300">
                          <span className="text-xs text-blue-900">
                            <strong>Especialidade:</strong> {especialidadeNome}
                          </span>
                          {getNomeMedicoSelecionado() && (
                            <>
                              <span className="text-xs text-blue-900">•</span>
                              <span className="text-xs text-blue-900">
                                <strong>Médico:</strong> {getNomeMedicoSelecionado()}
                              </span>
                            </>
                          )}
                          {!getNomeMedicoSelecionado() && (
                            <>
                              <span className="text-xs text-blue-900">•</span>
                              <span className="text-xs text-purple-600 italic">
                                <strong>Equipe Médica</strong> (sem médico específico)
                              </span>
                            </>
                          )}
                          <button
                            onClick={handleVoltarEtapa}
                            className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto"
                          >
                            ← Voltar
                          </button>
                        </div>

                        {/* Campo para adicionar novo procedimento */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                            Procedimento:
                          </label>
                          <input
                            type="text"
                            value={novoProcedimentoNome}
                            onChange={(e) => setNovoProcedimentoNome(e.target.value)}
                            placeholder="Digite o nome do procedimento (ex: LCA, MENISCO)"
                            className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && novoProcedimentoNome.trim()) {
                                handleAddProcedimentoTemp();
                              }
                            }}
                          />
                          <button
                            onClick={handleAddProcedimentoTemp}
                            disabled={!novoProcedimentoNome.trim()}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Adicionar Procedimento"
                          >
                            + Adicionar
                          </button>
                        </div>

                        {/* Lista de procedimentos adicionados */}
                        {procedimentosTemp.length > 0 && (
                          <div className="bg-white rounded border border-blue-300 p-3">
                            <div className="text-xs font-semibold text-blue-900 mb-2">
                              Procedimentos adicionados ({procedimentosTemp.length}):
                            </div>
                            <div className="space-y-1">
                              {procedimentosTemp.map((proc, idx) => (
                                <div key={proc.id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2 hover:bg-slate-100 transition-colors">
                                  <span className="text-sm font-medium text-slate-800">
                                    {idx + 1}. {proc.nome}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveProcedimentoTemp(proc.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-bold"
                                    title="Remover procedimento"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botões finais */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-300">
                          <button
                            onClick={handleSalvarAgendamento}
                            disabled={salvandoAgendamento || procedimentosTemp.length === 0}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Salvar e continuar adicionando especialidades"
                          >
                            {salvandoAgendamento ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                💾 Salvar e Continuar ({procedimentosTemp.length} proc.)
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleSalvarEFechar}
                            disabled={salvandoAgendamento || procedimentosTemp.length === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Salvar e fechar o formulário"
                          >
                            {salvandoAgendamento ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                ✅ Salvar e Fechar
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelAddEspecialidade}
                            disabled={salvandoAgendamento}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                            title="Cancelar"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabela de Itens Agrupados por Especialidade - Formato Excel */}
                <div className="flex-1 p-2">
                  {grade.itens.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      <p className="text-xs">Vazio</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getEspecialidadesAgrupadas(grade.itens).map((grupo, grupoIndex) => (
                        <div key={grupoIndex} className="border border-slate-300 rounded overflow-hidden bg-white shadow-sm">
                          {/* Header da Especialidade */}
                          {grupo.especialidade && (
                            <div className="group flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                              {/* Botões de ordem */}
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleMoveUp(index, grupo.especialidade!.id)}
                                  disabled={grade.itens.indexOf(grupo.especialidade!) === 0}
                                  className="p-0.5 text-white hover:text-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="↑"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleMoveDown(index, grupo.especialidade!.id)}
                                  className="p-0.5 text-white hover:text-blue-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="↓"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>

                              {/* Input da Especialidade */}
                              <Input
                                value={grupo.especialidade.texto}
                                onChange={(e) => handleUpdateItem(index, grupo.especialidade!.id, e.target.value)}
                                placeholder="Ex: Ortopedia - Joelho"
                                className="flex-1 border-0 shadow-none bg-white/20 text-white placeholder-white/70 font-bold text-sm focus:bg-white/30 py-1 px-2"
                              />

                              {/* Badge com contador */}
                              <span className="bg-white/30 text-white px-2 py-1 rounded text-xs font-semibold">
                                {(() => {
                                  const totalPacientes = grupo.procedimentos.reduce((sum, proc) => 
                                    sum + (proc.pacientes?.length || 0), 0
                                  );
                                  return totalPacientes > 0 ? totalPacientes : grupo.procedimentos.length;
                                })()}
                              </span>

                              {/* Botão adicionar procedimento */}
                              <button
                                onClick={() => handleAddProcedimento(index, grupo.especialidade!.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-medium transition-colors"
                                title="Adicionar Procedimento"
                              >
                                <PlusIcon className="w-3 h-3" />
                                Proc.
                              </button>

                              {/* Botão remover */}
                              <button
                                onClick={() => handleRemoveItem(index, grupo.especialidade!.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-white hover:bg-white/20 rounded transition-all"
                                title="✕"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Tabela estilo Excel */}
                          {grupo.procedimentos.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse table-fixed">
                                {/* Cabeçalho da tabela */}
                                <thead>
                                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-300 w-56">Procedimento</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-300 w-36">Médico</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 border-r border-slate-300 w-72">Nome do Paciente</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 border-r border-slate-300 w-20">Idade</th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 w-24">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const expanded = grupo.especialidade ? isExpanded(index, grupo.especialidade.id) : true;
                                    const procedimentosVisiveis = expanded ? grupo.procedimentos : grupo.procedimentos.slice(0, 5);
                                    
                                    // Preparar linhas da tabela
                                    const linhas: ReactElement[] = [];
                                    
                                    procedimentosVisiveis.forEach((proc) => {
                                      // Se tem pacientes, criar uma linha para cada paciente
                                      if (proc.pacientes && proc.pacientes.length > 0) {
                                        proc.pacientes.forEach((paciente, pIdx) => {
                                          // Calcular idade
                                          const idade = paciente.dataNascimento
                                            ? new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
                                            : null;
                                          
                                          const isFirstPaciente = pIdx === 0;
                                          const isProcExpanded = isProcedimentoExpanded(index, proc.id);
                                          
                                          linhas.push(
                                            <tr 
                                              key={`${proc.id}-${pIdx}`}
                                              className="group hover:bg-slate-50 border-b border-slate-200"
                                            >
                                              {/* Coluna Procedimento */}
                                              <td className="px-3 py-2 border-r border-slate-200 w-56 overflow-hidden">
                                                {isFirstPaciente ? (
                                                  <div className="flex items-center gap-1 group relative">
                                                    {/* Exibição com Marca d'Água + Especificação */}
                                                    <div className="flex-1 flex items-center gap-2 min-h-[1.5rem]">
                                                      {/* Marca d'Água (Procedimento Base) */}
                                                      <span className="text-2xl font-bold text-slate-300 uppercase select-none tracking-wider flex-shrink-0">
                                                        {proc.texto}
                                                      </span>
                                                      
                                                      {/* Especificação (Texto Normal) - À direita da marca d'água */}
                                                      {proc.especificacao ? (
                                                        <span 
                                                          className="text-sm font-semibold text-slate-900 bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm flex-shrink-0"
                                                          title={`${proc.texto} - ${proc.especificacao}`}
                                                        >
                                                          {proc.especificacao}
                                                        </span>
                                                      ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                          (sem especificação)
                                                        </span>
                                                      )}
                                                    </div>
                                                    
                                                    <button
                                                      onClick={() => handleAbrirAlterarProcedimento(index, proc.id)}
                                                      className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all flex-shrink-0"
                                                      title="Adicionar/Editar especificação"
                                                    >
                                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span className="text-sm text-slate-500 italic truncate block">
                                                    └ {proc.especificacao || proc.texto}
                                                  </span>
                                                )}
                                              </td>
                                              
                                              {/* Coluna Médico */}
                                              <td className="px-3 py-2 border-r border-slate-200 w-36 overflow-hidden">
                                                {isFirstPaciente ? (
                                                  <select
                                                    value={proc.medicoId || ''}
                                                    onChange={(e) => handleUpdateMedicoProcedimento(index, proc.id, e.target.value)}
                                                    className="text-sm px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full truncate"
                                                    title="Selecione o médico para este procedimento"
                                                  >
                                                    <option value="">Sem médico</option>
                                                    {carregandoMedicosParaProcedimentos ? (
                                                      <option disabled>Carregando...</option>
                                                    ) : (
                                                      medicosParaProcedimentos.map((medico) => (
                                                        <option key={medico.id} value={medico.id}>
                                                          {medico.nome}
                                                        </option>
                                                      ))
                                                    )}
                                                  </select>
                                                ) : (
                                                  <span className="text-sm text-slate-500 truncate block">{proc.medicoNome || '-'}</span>
                                                )}
                                              </td>
                                              
                                              {/* Coluna Nome do Paciente */}
                                              <td className="px-3 py-2 border-r border-slate-200 w-72 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium text-slate-800 truncate">{paciente.nome}</span>
                                                  {isFirstPaciente && (
                                                    <button
                                                      onClick={() => toggleExpansaoProcedimento(index, proc.id)}
                                                      className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-all"
                                                      title={isProcExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                                                    >
                                                      {isProcExpanded ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                      ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                      )}
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                              
                                              {/* Coluna Idade */}
                                              <td className="px-3 py-2 text-center border-r border-slate-200 w-20 overflow-hidden">
                                                {idade ? (
                                                  <span className="text-sm text-slate-700">{idade} anos</span>
                                                ) : (
                                                  <span className="text-sm text-slate-400">-</span>
                                                )}
                                              </td>
                                              
                                              {/* Coluna Ações */}
                                              <td className="px-3 py-2 text-center w-24 overflow-hidden">
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    onClick={() => handleEditarPaciente(index, proc.id, pIdx)}
                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                                                    title="Editar paciente"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                  </button>
                                                  <button
                                                    onClick={() => handleAbrirModalMoverPaciente(index, proc.id, pIdx)}
                                                    className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-all"
                                                    title="Mover paciente para outra data"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                  </button>
                                                  <button
                                                    onClick={() => handleRemovePaciente(index, proc.id, pIdx)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                                    title="Remover paciente"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  </button>
                                                  {isFirstPaciente && (
                                                    <button
                                                      onClick={() => handleRemoveItem(index, proc.id)}
                                                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                                      title="Remover procedimento"
                                                    >
                                                      <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                          
                                          // Linha expandida com detalhes (apenas no primeiro paciente quando expandido)
                                          if (isFirstPaciente && isProcExpanded) {
                                            linhas.push(
                                              <tr key={`${proc.id}-expanded`} className="bg-gradient-to-r from-slate-50 to-blue-50/30">
                                                <td colSpan={5} className="px-3 py-3">
                                                  <div className="flex items-start gap-2 pl-6 border-l-2 border-blue-400/30">
                                                    {/* Ícone de informação */}
                                                    <div className="flex-shrink-0 mt-0.5">
                                                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                      </svg>
                                                    </div>
                                                    
                                                    {/* Grid de informações */}
                                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1 text-xs">
                                                      {/* Cidade */}
                                                      {paciente.cidade && (
                                                        <div className="flex items-center gap-2">
                                                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                          </svg>
                                                          <div className="flex flex-col">
                                                            <span className="text-slate-500 font-medium">Cidade</span>
                                                            <span className="text-slate-700">{paciente.cidade}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Telefone */}
                                                      {paciente.telefone && (
                                                        <div className="flex items-center gap-2">
                                                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                          </svg>
                                                          <div className="flex flex-col">
                                                            <span className="text-slate-500 font-medium">Telefone</span>
                                                            <span className="text-slate-700">{paciente.telefone}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Data de Nascimento */}
                                                      {paciente.dataNascimento && (
                                                        <div className="flex items-center gap-2">
                                                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                          </svg>
                                                          <div className="flex flex-col">
                                                            <span className="text-slate-500 font-medium">Nascimento</span>
                                                            <span className="text-slate-700">{new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Data da Consulta */}
                                                      {paciente.dataConsulta && (
                                                        <div className="flex items-center gap-2">
                                                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                          </svg>
                                                          <div className="flex flex-col">
                                                            <span className="text-slate-500 font-medium">Consulta</span>
                                                            <span className="text-slate-700">{new Date(paciente.dataConsulta).toLocaleDateString('pt-BR')}</span>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          }
                                        });
                                      } else {
                                        // Procedimento sem pacientes
                                        const isProcExpanded = isProcedimentoExpanded(index, proc.id);
                                        
                                        linhas.push(
                                          <tr 
                                            key={proc.id}
                                            className="group hover:bg-slate-50 border-b border-slate-200"
                                          >
                                            {/* Coluna Procedimento */}
                                            <td className="px-3 py-2 border-r border-slate-200 w-56 overflow-hidden">
                                              <div className="flex items-center gap-1 group relative">
                                                {/* Exibição com Marca d'Água + Especificação */}
                                                <div className="flex-1 flex items-center gap-2 min-h-[1.5rem]">
                                                  {/* Marca d'Água (Procedimento Base) */}
                                                  <span className="text-2xl font-bold text-slate-300 uppercase select-none tracking-wider flex-shrink-0">
                                                    {proc.texto}
                                                  </span>
                                                  
                                                  {/* Especificação (Texto Normal) - À direita da marca d'água */}
                                                  {proc.especificacao ? (
                                                    <span 
                                                      className="text-sm font-semibold text-slate-900 bg-blue-50 border border-blue-200 px-2 py-1 rounded shadow-sm flex-shrink-0"
                                                      title={`${proc.texto} - ${proc.especificacao}`}
                                                    >
                                                      {proc.especificacao}
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                      (sem especificação)
                                                    </span>
                                                  )}
                                                </div>
                                                
                                                <button
                                                  onClick={() => handleAbrirAlterarProcedimento(index, proc.id)}
                                                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all flex-shrink-0"
                                                  title="Adicionar/Editar especificação"
                                                >
                                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </td>
                                            
                                            {/* Coluna Médico */}
                                            <td className="px-3 py-2 border-r border-slate-200 w-36 overflow-hidden">
                                              <select
                                                value={proc.medicoId || ''}
                                                onChange={(e) => handleUpdateMedicoProcedimento(index, proc.id, e.target.value)}
                                                className="text-sm px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white w-full truncate"
                                                title="Selecione o médico para este procedimento"
                                              >
                                                <option value="">Sem médico</option>
                                                {carregandoMedicosParaProcedimentos ? (
                                                  <option disabled>Carregando...</option>
                                                ) : (
                                                  medicosParaProcedimentos.map((medico) => (
                                                    <option key={medico.id} value={medico.id}>
                                                      {medico.nome}
                                                    </option>
                                                  ))
                                                )}
                                              </select>
                                            </td>
                                            
                                            {/* Coluna Nome do Paciente */}
                                            <td className="px-3 py-2 border-r border-slate-200 w-72 overflow-hidden">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-400 italic opacity-60">{proc.texto || 'Procedimento'}</span>
                                                <button
                                                  onClick={() => toggleExpansaoProcedimento(index, proc.id)}
                                                  className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-all"
                                                  title={isProcExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                                                >
                                                  {isProcExpanded ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                  ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                  )}
                                                </button>
                                              </div>
                                            </td>
                                            
                                            {/* Coluna Idade */}
                                            <td className="px-3 py-2 text-center border-r border-slate-200 w-20 overflow-hidden">
                                              <span className="text-sm text-slate-400">-</span>
                                            </td>
                                            
                                            {/* Coluna Ações */}
                                            <td className="px-3 py-2 text-center w-24 overflow-hidden">
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  onClick={() => handleAddPacienteClick(index, proc.id)}
                                                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-all"
                                                  title="Adicionar Paciente"
                                                >
                                                  <PlusIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveItem(index, proc.id)}
                                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                                                  title="Remover procedimento"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                        
                                        // Linha expandida para procedimento sem pacientes
                                        if (isProcExpanded) {
                                          linhas.push(
                                            <tr key={`${proc.id}-expanded`} className="bg-slate-50">
                                              <td colSpan={5} className="px-3 py-2">
                                                <div className="text-xs text-slate-500 italic">
                                                  Nenhum paciente cadastrado ainda. Clique no botão "+" para adicionar.
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        }
                                      }
                                    });
                                    
                                    return linhas;
                                  })()}
                                </tbody>
                              </table>
                              
                              {/* Botão Ver mais / Ver menos */}
                              {grupo.procedimentos.length > 5 && grupo.especialidade && (
                                <div className="border-t border-slate-200 bg-slate-50">
                                  <button
                                    onClick={() => toggleExpansao(index, grupo.especialidade!.id)}
                                    className="w-full py-2 px-3 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium transition-colors"
                                  >
                                    {isExpanded(index, grupo.especialidade.id) ? (
                                      <span className="flex items-center justify-center gap-1">
                                        Ver menos
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </span>
                                    ) : (
                                      <span className="flex items-center justify-center gap-1">
                                        Ver mais ({grupo.procedimentos.length - 5} ocultos)
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </span>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

            {/* Botões de Ação */}
            <div className="flex justify-end items-center px-4 py-2 border-t flex-shrink-0 bg-white">
              <Button
                onClick={onClose}
                variant="secondary"
                className="text-xs py-1.5 px-4"
              >
                Fechar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>

    {/* MODAL DE ADICIONAR/EDITAR PACIENTE */}
    <Modal
      isOpen={modalPacienteAberto}
      onClose={handleCancelarPaciente}
      title={modoEdicao ? "Editar Dados do Paciente" : "Adicionar Paciente ao Procedimento"}
    >
      <div className="p-6 space-y-4">
        {/* Nome do Paciente */}
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

        {/* Data de Nascimento */}
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

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade
          </label>
          <SelectCidade
            value={pacienteCidade}
            onChange={setPacienteCidade}
            placeholder="Selecione ou digite a cidade"
            className="w-full"
          />
        </div>

        {/* Telefone */}
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

        {/* Data de Consulta */}
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
            {salvandoPaciente 
              ? '💾 Salvando...' 
              : modoEdicao 
                ? '✏️ Atualizar Paciente' 
                : '💾 Salvar Paciente'
            }
          </Button>
        </div>
      </div>
    </Modal>

    {/* MODAL DE CONFIRMAÇÃO ELEGANTE */}
    {confirmacaoData && (
      <Modal
        isOpen={modalConfirmacao}
        onClose={() => setModalConfirmacao(false)}
        title={confirmacaoData.titulo}
      >
        <div className="p-6">
          {/* Ícone e cor baseado no tipo */}
          <div className={`flex items-center justify-center mb-4 ${
            confirmacaoData.tipo === 'sucesso' ? 'text-green-600' :
            confirmacaoData.tipo === 'erro' ? 'text-red-600' :
            confirmacaoData.tipo === 'aviso' ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {confirmacaoData.tipo === 'sucesso' && (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {confirmacaoData.tipo === 'erro' && (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {confirmacaoData.tipo === 'aviso' && (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {(!confirmacaoData.tipo || confirmacaoData.tipo === 'info') && (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <p className={`mb-6 text-center text-base ${
            confirmacaoData.tipo === 'sucesso' ? 'text-green-700' :
            confirmacaoData.tipo === 'erro' ? 'text-red-700' :
            confirmacaoData.tipo === 'aviso' ? 'text-yellow-700' :
            'text-gray-700'
          }`}>
            {confirmacaoData.mensagem}
          </p>
          
          <div className="flex justify-end gap-3">
            {confirmacaoData.titulo.includes('Remover') || confirmacaoData.titulo.includes('Limpar') ? (
              <>
                <Button
                  onClick={() => setModalConfirmacao(false)}
                  variant="secondary"
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmacaoData.onConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
                >
                  {confirmacaoData.titulo.includes('Limpar') ? 'Sim, Limpar' : 'Sim, Remover'}
                </Button>
              </>
            ) : (
              <Button
                onClick={confirmacaoData.onConfirm}
                className={`px-6 ${
                  confirmacaoData.tipo === 'sucesso' ? 'bg-green-600 hover:bg-green-700' :
                  confirmacaoData.tipo === 'erro' ? 'bg-red-600 hover:bg-red-700' :
                  confirmacaoData.tipo === 'aviso' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                OK
              </Button>
            )}
          </div>
        </div>
      </Modal>
    )}

    {/* Modal de Relatório */}
    {modalRelatorioAberto && (
      <Modal
        isOpen={modalRelatorioAberto}
        onClose={() => setModalRelatorioAberto(false)}
        title={`Relatório - ${nomeDiaClicado}s de ${mesExibidoNome}`}
        size="large"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Relatório de todas as <strong>{nomeDiaClicado}s</strong> do mês de <strong>{mesExibidoNome}</strong>
            </p>
          </div>

          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Data</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Especialidade</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Procedimento</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Especificação do Procedimento</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Médico</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Paciente</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Idade</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Cidade</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Telefone</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Data Consulta</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Data Nascimento</th>
                </tr>
              </thead>
              <tbody>
                {dadosRelatorio.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      Nenhum agendamento encontrado para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  dadosRelatorio.map((linha, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.data}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.especialidade}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.procedimento}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.procedimentoEspecificacao || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.medico}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{linha.paciente}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                        {linha.idade !== null ? `${linha.idade} anos` : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.cidade || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.telefone || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.dataConsulta || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{linha.dataNascimento || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total de registros: <strong>{dadosRelatorio.length}</strong>
            </p>
            <div className="flex gap-2">
              <Button
                onClick={gerarPDFRelatorio}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                disabled={dadosRelatorio.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </Button>
              <Button
                onClick={() => setModalRelatorioAberto(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    )}

    {/* Modal de Mover Paciente */}
    {modalMoverPaciente && agendamentoParaMover && (
      <Modal
        isOpen={modalMoverPaciente}
        onClose={() => {
          setModalMoverPaciente(false);
          setAgendamentoParaMover(null);
        }}
        title={`📅 Mover Paciente para outra ${agendamentoParaMover.diaSemana || 'Data'}`}
        size="medium"
      >
        <div className="p-6">
          {/* Informações do Paciente Atual */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 Informações Atuais</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Paciente:</strong> {agendamentoParaMover.nome}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Procedimento:</strong> {agendamentoParaMover.procedimento}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Data Atual:</strong> {new Date(agendamentoParaMover.dataAtual + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Etapa 1: Selecionar Data */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">1️⃣ Selecione a Nova Data</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMesCalendario(new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() - 1, 1))} className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100">Anterior</button>
                <div className="text-sm font-semibold text-gray-800">
                  {mesCalendario.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={() => setMesCalendario(new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 1))} className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100">Próximo</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((w) => (
                <div key={w} className="text-xs font-semibold text-gray-600 text-center">{w}</div>
              ))}
              {Array.from({ length: new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1).getDay() }, (_, i) => (
                <div key={`pad-${i}`} className="h-10" />
              ))}
              {Array.from({ length: new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 0).getDate() }, (_, i) => {
                const day = i + 1;
                const dateObj = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), day);
                const iso = formatISODate(dateObj);
                const disponivel = diasDisponiveisSet.has(iso);
                const selecionado = novaDataSelecionada === iso;
                return (
                  <button
                    key={iso}
                    onClick={() => disponivel && handleSelecionarDataDestino(iso)}
                    className={`h-10 rounded border text-sm ${disponivel ? (selecionado ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-100 text-gray-800') : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'}`}
                    title={disponivel ? dateObj.toLocaleDateString('pt-BR') : 'Sem slots disponíveis'}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {novaDataSelecionada && (
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">2️⃣ Selecione o Procedimento na Grade</div>
              {carregandoDestinos ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">Carregando grade...</div>
              ) : (
                <div className="space-y-3">
                  {especialidadesDisponiveis.length === 0 ? (
                    <div className="text-sm text-gray-500">Nenhuma especialidade com slots disponíveis.</div>
                  ) : (
                    especialidadesDisponiveis.map((esp) => {
                      const procsMap = new Map<string, { id: string; texto: string; agendamentoId: string }>();
                      (esp.agendamentos as any[] || []).forEach((a: any) => {
                        if (!a.nome_paciente || String(a.nome_paciente).trim() === '') {
                          const key = String(a.procedimentos);
                          if (!procsMap.has(key)) {
                            procsMap.set(key, { id: String(a.id), texto: String(a.procedimentos), agendamentoId: String(a.id) });
                          }
                        }
                      });
                      const procs: Array<{ id: string; texto: string; agendamentoId: string }> = Array.from(procsMap.values());
                      return (
                        <div key={esp.id} className="border rounded-lg">
                          <div className="px-3 py-2 bg-slate-100 text-sm font-semibold text-slate-800">{esp.nome}{esp.medicoNome ? ` - ${esp.medicoNome}` : ''}</div>
                          <div className="p-3 flex flex-wrap gap-2">
                            {procs.length === 0 ? (
                              <span className="text-xs text-gray-500">Sem procedimentos disponíveis</span>
                            ) : (
                              procs.map((p) => {
                                const selected = procedimentoSelecionadoDestino === p.id && especialidadeSelecionadaDestino === esp.id;
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => { setEspecialidadeSelecionadaDestino(esp.id); setProcedimentoSelecionadoDestino(p.id); }}
                                    className={`px-2 py-1 text-xs rounded border ${selected ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 hover:bg-gray-100 text-gray-800'}`}
                                    title={p.texto}
                                  >
                                    {p.texto}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Etapa 3 removida: seleção ocorre pela grade acima */}

          {/* Resumo da Seleção */}
          {novaDataSelecionada && especialidadeSelecionadaDestino && procedimentoSelecionadoDestino && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-3">✅ Destino Selecionado</h3>
              <p className="text-sm text-green-800 mb-1"><strong>Data:</strong> {new Date(novaDataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              <p className="text-sm text-green-800 mb-1"><strong>Especialidade:</strong> {especialidadesDisponiveis.find(e => e.id === especialidadeSelecionadaDestino)?.nome}{especialidadesDisponiveis.find(e => e.id === especialidadeSelecionadaDestino)?.medicoNome ? ` - ${especialidadesDisponiveis.find(e => e.id === especialidadeSelecionadaDestino)?.medicoNome}` : ''}</p>
              <p className="text-sm text-green-800"><strong>Procedimento:</strong> {(() => { const esp = especialidadesDisponiveis.find(e => e.id === especialidadeSelecionadaDestino); const p = (esp?.agendamentos as any[] || []).find((a: any) => String(a.id) === String(procedimentoSelecionadoDestino))?.procedimentos; return p || '-'; })()}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setModalMoverPaciente(false);
                setAgendamentoParaMover(null);
              }}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMoverPaciente}
              disabled={!novaDataSelecionada || !especialidadeSelecionadaDestino || !procedimentoSelecionadoDestino || movendoPaciente}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {movendoPaciente ? 'Movendo...' : 'Confirmar Mudança'}
            </Button>
          </div>
        </div>
      </Modal>
    )}

    {/* Modal de Alterar Procedimento */}
    {modalAlterarProcAberto && procedimentoEmEdicao && (
      <Modal
        isOpen={modalAlterarProcAberto}
        onClose={() => {
          setModalAlterarProcAberto(false);
          setProcedimentoEmEdicao(null);
          setNovoProcedimentoTexto('');
          setNovaEspecificacaoTexto('');
          setMedicoSelecionadoParaProc('');
          setMedicoVemDaEspecialidade(false);
        }}
        title={modoCriacaoProc ? "➕ Novo Procedimento" : "✏️ Alterar Procedimento"}
        size="medium"
      >
        <div className="p-6">
          {/* Informações da Especialidade (modo criação) */}
          {modoCriacaoProc && procedimentoEmEdicao.especialidadeId && (() => {
            const grade = grades[procedimentoEmEdicao.gradeIndex];
            const especialidade = grade.itens.find(i => i.id === procedimentoEmEdicao.especialidadeId);
            return (
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-sm font-bold text-blue-800">Especialidade:</div>
                    <div className="text-base font-semibold text-blue-900 mt-1">
                      {especialidade?.texto || '-'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        
          {/* Procedimento Base (Marca d'Água - Imutável ou Editável para TI) */}
          {!modoCriacaoProc && procedimentoEmEdicao.textoAtual && (
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Procedimento Base {isUsuarioTI ? '(Editável - TI)' : '(Fixo)'}
                {isUsuarioTI && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                    🔧 MODO TI
                  </span>
                )}
              </label>
              {isUsuarioTI ? (
                // MODO TI: Campo editável
                <div>
                  <Input
                    value={novoProcedimentoTexto}
                    onChange={(e) => setNovoProcedimentoTexto(e.target.value.toUpperCase())}
                    placeholder="Ex: MENISCO, LCA, CISTOLITOTRIPSIA"
                    className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg uppercase bg-purple-50"
                    autoFocus
                  />
                  <p className="text-xs text-purple-600 mt-1 flex items-center gap-1 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    ⚠️ ATENÇÃO: Você está alterando o procedimento base. Esta alteração afetará este registro específico.
                  </p>
                </div>
              ) : (
                // MODO NORMAL: Apenas visualização (marca d'água)
                <div>
                  <div className="relative bg-slate-50 border-2 border-slate-300 rounded-lg p-4 min-h-[4rem] flex items-center">
                    {/* Marca d'Água Grande */}
                    <span className="text-4xl font-bold text-slate-200 uppercase select-none tracking-wider">
                      {procedimentoEmEdicao.textoAtual}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    ⚠️ O procedimento base não pode ser alterado. Adicione uma especificação abaixo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Campo para Especificação (Editável) */}
          {!modoCriacaoProc && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✏️ Especificação do Procedimento
              </label>
              <Input
                value={novaEspecificacaoTexto}
                onChange={(e) => setNovaEspecificacaoTexto(e.target.value)}
                placeholder={`Ex: ${procedimentoEmEdicao.textoAtual === 'MENISCO' ? 'meniscectomia medial à esquerda' : 'detalhes específicos do procedimento'}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Adicione detalhes como lateralidade, tipo específico, etc.
              </p>
            </div>
          )}

          {/* Campo para Novo Procedimento (Modo Criação) */}
          {modoCriacaoProc && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Procedimento: <span className="text-red-500">*</span>
              </label>
              <Input
                value={novoProcedimentoTexto}
                onChange={(e) => setNovoProcedimentoTexto(e.target.value)}
                placeholder="Ex: MENISCO, LCA, CISTOLITOTRIPSIA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Este procedimento será salvo no banco de dados.
              </p>
            </div>
          )}
          
          {/* Campo para Selecionar Médico */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Médico Responsável:
              {medicoVemDaEspecialidade ? (
                <span className="text-blue-600 font-normal ml-2">(definido pela especialidade)</span>
              ) : (
                <span className="text-gray-500 font-normal ml-2">(opcional)</span>
              )}
            </label>
            <select
              value={medicoSelecionadoParaProc}
              onChange={(e) => setMedicoSelecionadoParaProc(e.target.value)}
              disabled={medicoVemDaEspecialidade}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                medicoVemDaEspecialidade 
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-700' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="">Sem médico (equipe médica)</option>
              {carregandoMedicosParaProcedimentos ? (
                <option disabled>Carregando...</option>
              ) : (
                medicosParaProcedimentos.map((medico) => (
                  <option key={medico.id} value={medico.id}>
                    {medico.nome}
                  </option>
                ))
              )}
            </select>
            {medicoVemDaEspecialidade ? (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Este médico foi definido na especialidade e não pode ser alterado aqui.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Selecione o médico que irá realizar este procedimento.
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setModalAlterarProcAberto(false);
                setProcedimentoEmEdicao(null);
                setNovoProcedimentoTexto('');
                setNovaEspecificacaoTexto('');
                setMedicoSelecionadoParaProc('');
                setMedicoVemDaEspecialidade(false);
                setModoCriacaoProc(false);
              }}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarAlteracaoProcedimento}
              disabled={modoCriacaoProc ? !novoProcedimentoTexto.trim() : false || salvandoPaciente}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {salvandoPaciente 
                ? '💾 Salvando...' 
                : modoCriacaoProc
                  ? '💾 Criar Procedimento'
                  : '✏️ Salvar Especificação'
              }
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>
  );
};

export default GradeCirurgicaModal;
