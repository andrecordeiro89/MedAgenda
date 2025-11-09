import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, PlusIcon, TrashIcon, CopyIcon } from './ui';
import { GradeCirurgicaDia, GradeCirurgicaItem, DiaSemana, Especialidade } from '../types';
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
  especialidades // Receber especialidades
}) => {
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

  // Carregar grade DO SUPABASE ao abrir o modal
  useEffect(() => {
    const loadGrade = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        console.log('🔍 Buscando agendamentos do Supabase para as datas:', proximasDatas.map(d => d.toISOString().split('T')[0]));
        
        // Buscar agendamentos reais do banco para cada data
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
                if (agendamento.especialidade && agendamento.medico) {
                  const chave = `${agendamento.especialidade}|||${agendamento.medico}`;
                  
                  if (!gruposPorEspecialidade.has(chave)) {
                    gruposPorEspecialidade.set(chave, {
                      especialidade: agendamento.especialidade,
                      medico: agendamento.medico,
                      procedimentos: []
                    });
                  }
                  
                  // Adicionar procedimento ao array COM ID e dados do paciente (se houver)
                  if (agendamento.procedimentos && agendamento.procedimentos.trim() && agendamento.id) {
                    const procedimentoData: any = {
                      nome: agendamento.procedimentos,
                      agendamentoId: agendamento.id
                    };
                    
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
                // Adicionar especialidade
                itens.push({
                  id: `esp-${Date.now()}-${Math.random()}`,
                  tipo: 'especialidade',
                  texto: `${grupo.especialidade} - ${grupo.medico}`,
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
                  
                  itens.push({
                    id: `proc-${Date.now()}-${Math.random()}-${idx}`,
                    tipo: 'procedimento',
                    texto: proc.nome,
                    ordem: itens.length,
                    pacientes: pacientes,
                    agendamentoId: proc.agendamentoId
                  });
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

    if (isOpen) {
      loadGrade();
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

  // ETAPA 1 → ETAPA 2: Confirmar especialidade e ir para médico
  const handleConfirmEspecialidade = () => {
    if (!especialidadeSelecionada) return;
    
    const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
    if (!especialidade) return;
    
    // Salvar nome da especialidade
    setEspecialidadeNome(especialidade.nome);
    
    // Avançar para etapa 2 (Médico)
    setEtapaAtual(2);
    
    console.log('✅ Etapa 1 concluída - Especialidade:', especialidade.nome);
  };

  // ETAPA 2 → ETAPA 3: Confirmar médico e ir para procedimentos
  const handleConfirmMedico = () => {
    if (!medicoSelecionado) {
      mostrarMensagem('⚠️ Atenção', 'Por favor, selecione um médico', 'aviso');
      return;
    }
    
    const medico = medicosDisponiveis.find(m => m.id === medicoSelecionado);
    if (!medico) {
      mostrarMensagem('❌ Erro', 'Médico não encontrado. Por favor, selecione novamente.', 'erro');
      return;
    }
    
    // Armazenar o nome do médico para usar depois mesmo se a lista for limpa
    setMedicoNomeSelecionado(medico.nome);
    console.log('✅ Etapa 2 concluída - Médico:', medico.nome);
    
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

  // ETAPA 3: Salvar tudo no banco (ESPECIALIDADE + MÉDICO + PROCEDIMENTOS)
  const handleSalvarAgendamento = async () => {
    // Validar antes de obter o nome do médico
    if (!especialidadeNome || !medicoSelecionado || addingEspecialidade === null) {
      console.error('❌ Validação falhou:', { especialidadeNome, medicoSelecionado, addingEspecialidade });
      mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade e selecione um médico', 'aviso');
      return;
    }
    
    const nomeMedico = getNomeMedicoSelecionado();
    
    if (!nomeMedico) {
      console.error('❌ Nome do médico não encontrado:', { medicoSelecionado, medicosDisponiveis: medicosDisponiveis.length });
      mostrarMensagem('❌ Erro', 'Médico selecionado não encontrado. Por favor, selecione novamente.', 'erro');
      return;
    }
    
    console.log('✅ Validação OK:', { especialidadeNome, medicoSelecionado, nomeMedico });
    
    setSalvandoAgendamento(true);
    
    try {
      // Pegar a data do dia selecionado
      const dataSelecionada = proximasDatas[addingEspecialidade];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('💾 Salvando especialidade, médico e procedimentos...');
      
      // 1. Salvar especialidade (sem procedimentos)
      await agendamentoService.create({
        nome_paciente: '',
        data_nascimento: '2000-01-01',
        data_agendamento: dataFormatada,
        especialidade: especialidadeNome,
        medico: nomeMedico,
        hospital_id: hospitalId || null,
        cidade_natal: null,
        telefone: null
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
        if (agendamento.especialidade && agendamento.medico) {
          const chave = `${agendamento.especialidade}|||${agendamento.medico}`;
          
          if (!gruposPorEspecialidade.has(chave)) {
            gruposPorEspecialidade.set(chave, {
              especialidade: agendamento.especialidade,
              medico: agendamento.medico,
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
        itens.push({
          id: `esp-${Date.now()}-${Math.random()}`,
          tipo: 'especialidade',
          texto: `${grupo.especialidade} - ${grupo.medico}`,
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
    const nomeMedico = getNomeMedicoSelecionado();
    
    if (!especialidadeNome || !medicoSelecionado || !nomeMedico || addingEspecialidade === null) {
      mostrarMensagem('⚠️ Atenção', 'Por favor, preencha a especialidade e selecione um médico', 'aviso');
      return;
    }
    
    setSalvandoAgendamento(true);
    
    try {
      // Reutilizar a mesma lógica de handleSalvarAgendamento
      const dataSelecionada = proximasDatas[addingEspecialidade];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      
      console.log('💾 Salvando especialidade, médico e procedimentos...');
      
      // 1. Salvar especialidade
      await agendamentoService.create({
        nome_paciente: '',
        data_nascimento: '2000-01-01',
        data_agendamento: dataFormatada,
        especialidade: especialidadeNome,
        medico: nomeMedico,
        hospital_id: hospitalId || null,
        cidade_natal: null,
        telefone: null
      });
      
      // 2. Salvar cada procedimento
      for (const procedimento of procedimentosTemp) {
        await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: dataFormatada,
          especialidade: especialidadeNome,
          medico: nomeMedico,
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
        if (agendamento.especialidade && agendamento.medico) {
          const chave = `${agendamento.especialidade}|||${agendamento.medico}`;
          
          if (!gruposPorEspecialidade.has(chave)) {
            gruposPorEspecialidade.set(chave, {
              especialidade: agendamento.especialidade,
              medico: agendamento.medico,
              procedimentos: []
            });
          }
          
          if (agendamento.procedimentos && agendamento.procedimentos.trim()) {
            gruposPorEspecialidade.get(chave)!.procedimentos.push(agendamento.procedimentos);
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

  // Adicionar procedimento (COM AUTO-SAVE)
  const handleAddProcedimento = (gradeIndex: number, especialidadeId?: string) => {
    // Calcular novo estado
    const updatedGrades = grades.map((grade, i) => {
      if (i === gradeIndex) {
        const novoItem: GradeCirurgicaItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          tipo: 'procedimento',
          texto: '',
          ordem: 0, // Será recalculado
          pacientes: [] // Array vazio de pacientes
        };

        // Se foi passado o ID da especialidade, inserir logo após ela
        if (especialidadeId) {
          const especialidadeIndex = grade.itens.findIndex(item => item.id === especialidadeId);
          
          if (especialidadeIndex !== -1) {
            // Encontrar a posição do último procedimento desta especialidade
            let insertIndex = especialidadeIndex + 1;
            
            // Avançar até encontrar outra especialidade ou o fim
            while (
              insertIndex < grade.itens.length && 
              grade.itens[insertIndex].tipo === 'procedimento'
            ) {
              insertIndex++;
            }
            
            // Inserir o novo procedimento nessa posição
            const novosItens = [
              ...grade.itens.slice(0, insertIndex),
              novoItem,
              ...grade.itens.slice(insertIndex)
            ];
            
            // Reordenar todos os itens
            return {
              ...grade,
              itens: novosItens.map((item, idx) => ({ ...item, ordem: idx }))
            };
          }
        }
        
        // Se não foi passado especialidadeId ou não encontrou, adiciona no final
        return { 
          ...grade, 
          itens: [...grade.itens, { ...novoItem, ordem: grade.itens.length }] 
        };
      }
      return grade;
    });

    // Atualizar estado local
    setGrades(updatedGrades);
  };

  // Atualizar texto de um item
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

  // Função auxiliar para auto-save após edição (chamada on Blur)
  const handleBlurItem = async (gradeIndex: number, itemId: string) => {
    const grade = grades[gradeIndex];
    const item = grade.itens.find(i => i.id === itemId);
    
    if (!item || item.tipo !== 'procedimento' || !item.texto.trim()) {
      return;
    }
    
    // Encontrar a especialidade deste procedimento
    let especialidadeAtual = '';
    let medicoAtual = '';
    
    for (const gradeItem of grade.itens) {
      if (gradeItem.tipo === 'especialidade') {
        const [esp, med] = gradeItem.texto.split(' - ');
        especialidadeAtual = esp || '';
        medicoAtual = med || '';
      }
      if (gradeItem.id === itemId) {
        break;
      }
    }
    
    if (especialidadeAtual && medicoAtual) {
      try {
        const dataSelecionada = proximasDatas[gradeIndex];
        const dataFormatada = dataSelecionada.toISOString().split('T')[0];
        
        await agendamentoService.create({
          nome_paciente: '',
          data_nascimento: '2000-01-01',
          data_agendamento: dataFormatada,
          especialidade: especialidadeAtual,
          medico: medicoAtual,
          procedimentos: item.texto,
          hospital_id: hospitalId || null,
          cidade_natal: null,
          telefone: null
        });
        
        console.log('✅ Procedimento salvo! Recarregando...');
        
        // Recarregar dados do banco
        const agendamentos = await agendamentoService.getAll(hospitalId);
        const agendamentosDoDia = agendamentos.filter(a => a.data_agendamento === dataFormatada);
        
        // Reagrupar itens
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
        
        // Atualizar grade
        const updatedGrades = grades.map((g, i) => {
          if (i === gradeIndex) {
            return { ...g, itens };
          }
          return g;
        });
        
        setGrades(updatedGrades);
        
      } catch (error) {
        console.error('❌ Erro ao salvar procedimento:', error);
      }
    }
  };

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
      let medicoAtual = '';
      
      // Percorrer itens limpos e salvar especialidades e procedimentos (SEM pacientes)
      for (const item of itensLimpos) {
        if (item.tipo === 'especialidade') {
          const [espNome, medNome] = item.texto.split(' - ');
          especialidadeAtual = espNome || '';
          medicoAtual = medNome || '';
          
          // Salvar especialidade
          if (especialidadeAtual && medicoAtual) {
            try {
              await agendamentoService.create({
                nome_paciente: '',
                data_nascimento: '2000-01-01',
                data_agendamento: dataFormatada,
                especialidade: especialidadeAtual,
                medico: medicoAtual,
                hospital_id: hospitalId || null,
                cidade_natal: null,
                telefone: null
              });
            } catch (error) {
              console.error('❌ Erro ao salvar especialidade replicada:', error);
            }
          }
        } else if (item.tipo === 'procedimento' && item.texto.trim() && especialidadeAtual && medicoAtual) {
          // Salvar procedimento
          try {
            await agendamentoService.create({
              nome_paciente: '',
              data_nascimento: '2000-01-01',
              data_agendamento: dataFormatada,
              especialidade: especialidadeAtual,
              medico: medicoAtual,
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

    return grupos;
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
            {/* Grid com as 3 datas */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {proximasDatas.map((data, index) => {
                const grade = grades[index];
                
                // Proteção: se grade não existir ainda (loading), pular
                if (!grade) return null;

            return (
              <div
                key={index}
                className="border-2 border-slate-300 rounded-lg bg-white shadow-md flex flex-col"
              >
                {/* Header do Card */}
                <div className={`px-3 py-1.5 border-b-2 ${
                  grade.itens.length > 0 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        {data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </h3>
                      {grade.itens.length > 0 && (
                        <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                          {(() => {
                            const totalPacientes = grade.itens
                              .filter(item => item.tipo === 'procedimento')
                              .reduce((sum, item) => sum + (item.pacientes?.length || 0), 0);
                            return totalPacientes > 0 ? totalPacientes : grade.itens.length;
                          })()}
                        </span>
                      )}
                    </div>
                    
                    {/* Botões de ação do header */}
                    <div className="flex items-center gap-1">
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
                        {etapaAtual > 2 ? '✓' : '2'} Médico
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
                            title="Próximo: Informar Médico"
                          >
                            ➜ Próximo
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
                            disabled={!medicoSelecionado || carregandoMedicos}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="Próximo: Adicionar Procedimentos"
                          >
                            ➜ Próximo
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
                        {/* Resumo: Especialidade e Médico */}
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-300">
                          <span className="text-xs text-blue-900">
                            <strong>Especialidade:</strong> {especialidadeNome}
                          </span>
                          <span className="text-xs text-blue-900">•</span>
                          <span className="text-xs text-blue-900">
                            <strong>Médico:</strong> {getNomeMedicoSelecionado()}
                          </span>
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

                {/* Tabela de Itens Agrupados por Especialidade */}
                <div className="flex-1 p-2">
                  {grade.itens.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      <p className="text-xs">Vazio</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {getEspecialidadesAgrupadas(grade.itens).map((grupo, grupoIndex) => (
                        <div key={grupoIndex} className="border border-slate-300 rounded overflow-hidden bg-white shadow-sm">
                          {/* Header da Especialidade */}
                          {grupo.especialidade && (
                            <div className="group flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
                                className="flex-1 border-0 shadow-none bg-white/20 text-white placeholder-white/70 font-bold text-xs focus:bg-white/30 py-0.5 px-1.5"
                              />

                              {/* Badge com contador de procedimentos e pacientes */}
                              <span className="bg-white/30 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
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
                                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-medium transition-colors"
                                title="Adicionar Procedimento"
                              >
                                <PlusIcon className="w-2.5 h-2.5" />
                                Proc.
                              </button>

                              {/* Botão remover */}
                              <button
                                onClick={() => handleRemoveItem(index, grupo.especialidade!.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-white hover:bg-white/20 rounded transition-all"
                                title="✕"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Lista de Procedimentos */}
                          {grupo.procedimentos.length > 0 && (
                            <div className="bg-slate-50">
                              <div className="p-1 space-y-0.5">
                                {(() => {
                                  const expanded = grupo.especialidade ? isExpanded(index, grupo.especialidade.id) : true;
                                  const procedimentosVisiveis = expanded ? grupo.procedimentos : grupo.procedimentos.slice(0, 5);
                                  
                                  return procedimentosVisiveis.map((proc) => {
                                    // Para cada procedimento com pacientes, criar uma linha para cada paciente
                                    if (proc.pacientes && proc.pacientes.length > 0) {
                                      return proc.pacientes.map((paciente, pIdx) => {
                                        // Calcular idade a partir da data de nascimento
                                        const idade = paciente.dataNascimento
                                          ? new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()
                                          : null;
                                        
                                        return (
                                        <div
                                          key={`${proc.id}-${pIdx}`}
                                          className="group flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-green-50 to-white rounded border border-green-200 hover:border-green-300 transition-all shadow-sm"
                                        >
                                          {/* Botões de ordem (apenas no primeiro paciente) */}
                                          {pIdx === 0 && (
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => handleMoveUp(index, proc.id)}
                                                disabled={grade.itens.indexOf(proc) === (grupo.especialidade ? grade.itens.indexOf(grupo.especialidade) + 1 : 0)}
                                                className="p-0.5 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="↑"
                                              >
                                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() => handleMoveDown(index, proc.id)}
                                                className="p-0.5 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="↓"
                                              >
                                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </button>
                                            </div>
                                          )}
                                          {pIdx > 0 && <div className="w-4"></div>}

                                          {/* Dados do procedimento e paciente */}
                                          <div className="flex-1 flex items-center gap-2">
                                            {/* Procedimento */}
                                            <span className="text-xs font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                              {proc.texto}
                                            </span>
                                            
                                            {/* Seta */}
                                            <span className="text-slate-400">→</span>
                                            
                                            {/* Dados do Paciente */}
                                            <div className="flex items-center gap-2 flex-1">
                                              {/* Nome e Idade */}
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-green-800 bg-green-100 px-2 py-0.5 rounded">
                                                  👤 {paciente.nome}
                                                </span>
                                                {idade && (
                                                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {idade} anos
                                                  </span>
                                                )}
                                              </div>
                                              
                                              {/* Informações adicionais compactas */}
                                              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                                {paciente.cidade && (
                                                  <span className="flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {paciente.cidade}
                                                  </span>
                                                )}
                                                {paciente.telefone && (
                                                  <span className="flex items-center gap-0.5 bg-purple-50 px-1.5 py-0.5 rounded">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {paciente.telefone}
                                                  </span>
                                                )}
                                                {paciente.dataConsulta && (
                                                  <span className="flex items-center gap-0.5 bg-orange-50 px-1.5 py-0.5 rounded">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(paciente.dataConsulta).toLocaleDateString('pt-BR')}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Botões de ação */}
                                          <div className="flex items-center gap-1">
                                            {/* Botão editar paciente */}
                                            <button
                                              onClick={() => handleEditarPaciente(index, proc.id, pIdx)}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-100 rounded transition-all flex-shrink-0"
                                              title="Editar paciente"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                            </button>
                                            
                                            {/* Botão remover paciente */}
                                            <button
                                              onClick={() => handleRemovePaciente(index, proc.id, pIdx)}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 rounded transition-all flex-shrink-0"
                                              title="Remover paciente"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      )});
                                    }

                                    // Se não tem pacientes, mostrar linha do procedimento vazio
                                    return (
                                      <div
                                        key={proc.id}
                                        className="group flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 hover:border-slate-300 transition-all"
                                      >
                                        {/* Botões de ordem */}
                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleMoveUp(index, proc.id)}
                                            disabled={grade.itens.indexOf(proc) === (grupo.especialidade ? grade.itens.indexOf(grupo.especialidade) + 1 : 0)}
                                            className="p-0.5 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="↑"
                                          >
                                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleMoveDown(index, proc.id)}
                                            className="p-0.5 text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="↓"
                                          >
                                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </button>
                                        </div>

                                        {/* Input do Procedimento e botões */}
                                        <div className="flex items-center gap-1 flex-1">
                                          <Input
                                            value={proc.texto}
                                            onChange={(e) => handleUpdateItem(index, proc.id, e.target.value)}
                                            onBlur={() => handleBlurItem(index, proc.id, proc.texto, proc.tipo)}
                                            placeholder="Ex: LCA"
                                            className="flex-1 border-0 shadow-none text-xs font-medium focus:ring-1 py-0.5 px-1.5"
                                          />

                                          {/* Botão adicionar paciente */}
                                          <button
                                            onClick={() => handleAddPacienteClick(index, proc.id)}
                                            className="p-0.5 text-green-600 hover:bg-green-100 rounded transition-all flex-shrink-0"
                                            title="Adicionar Paciente"
                                          >
                                            <PlusIcon className="w-3 h-3" />
                                          </button>

                                          {/* Botão remover procedimento */}
                                          <button
                                            onClick={() => handleRemoveItem(index, proc.id)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-red-600 hover:bg-red-100 rounded transition-all flex-shrink-0"
                                            title="✕"
                                          >
                                            <TrashIcon className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }).flat();
                                })()}
                              </div>
                              
                              {/* Botão Ver mais / Ver menos */}
                              {grupo.procedimentos.length > 5 && grupo.especialidade && (
                                <button
                                  onClick={() => toggleExpansao(index, grupo.especialidade!.id)}
                                  className="w-full py-1 px-2 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium transition-colors border-t border-slate-200"
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
          <Input
            value={pacienteCidade}
            onChange={(e) => setPacienteCidade(e.target.value)}
            placeholder="Digite a cidade"
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
  </>
  );
};

export default GradeCirurgicaModal;
