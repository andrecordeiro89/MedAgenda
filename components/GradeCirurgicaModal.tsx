import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, PlusIcon, TrashIcon, CopyIcon } from './ui';
import { GradeCirurgicaDia, GradeCirurgicaItem, DiaSemana, Especialidade } from '../types';
// MODO MOCK
// import { simpleGradeCirurgicaService } from '../services/api-simple';
import { mockServices } from '../services/mock-storage';
const simpleGradeCirurgicaService = mockServices.gradeCirurgica;

// Importar service real de agendamentos do Supabase
import { agendamentoService } from '../services/supabase';

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
  // Calcular as 3 próximas ocorrências do dia da semana clicado no próximo mês
  const proximasDatas = useMemo(() => {
    const proximoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
    const datas: Date[] = [];
    
    // Encontrar as 3 próximas ocorrências do dia da semana
    for (let dia = 1; dia <= 31 && datas.length < 3; dia++) {
      const data = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), dia);
      if (data.getMonth() === proximoMes.getMonth() && data.getDay() === diaSemanaClicado) {
        datas.push(data);
      }
    }
    
    return datas;
  }, [mesAtual, diaSemanaClicado]);

  // Mês de referência no formato YYYY-MM
  const mesReferencia = useMemo(() => {
    const proximoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
    const ano = proximoMes.getFullYear();
    const mes = String(proximoMes.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }, [mesAtual]);

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
              
              // Montar itens da grade a partir dos agendamentos (AGRUPADOS)
              const itens: GradeCirurgicaItem[] = [];
              
              // Agrupar por especialidade
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
                  
                  // Adicionar procedimento se existir
                  if (agendamento.procedimentos && agendamento.procedimentos.trim()) {
                    gruposPorEspecialidade.get(chave)!.procedimentos.add(agendamento.procedimentos);
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
                
                // Adicionar procedimentos desta especialidade
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
  }, [isOpen, hospitalId, diaSemanaClicado, mesReferencia]);

  // Estado para controlar expansão de procedimentos (gradeIndex_especialidadeId => boolean)
  const [expandedEspecialidades, setExpandedEspecialidades] = useState<Record<string, boolean>>({});

  // Estado para controlar qual procedimento está adicionando paciente
  const [addingPaciente, setAddingPaciente] = useState<{gradeIndex: number, itemId: string} | null>(null);
  const [novoPacienteNome, setNovoPacienteNome] = useState('');

  // Estado para controlar a adição de especialidade
  const [addingEspecialidade, setAddingEspecialidade] = useState<number | null>(null); // índice da grade
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState('');
  const [especialidadeNome, setEspecialidadeNome] = useState(''); // Nome da especialidade selecionada
  const [nomeMedico, setNomeMedico] = useState(''); // Nome do médico a ser digitado
  const [mostrarCampoMedico, setMostrarCampoMedico] = useState(false); // Controla exibição do campo médico
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false); // Loading ao salvar

  // Salvamento removido - dados são salvos automaticamente no Supabase ao adicionar

  // Auto-save removido - salvamos direto no Supabase ao adicionar cada item

  // Iniciar adição de especialidade (abre o dropdown)
  const handleAddEspecialidadeClick = (gradeIndex: number) => {
    setAddingEspecialidade(gradeIndex);
    setEspecialidadeSelecionada('');
    setMostrarCampoMedico(false);
    setNomeMedico('');
  };

  // Confirmar especialidade selecionada (MOSTRA CAMPO DE MÉDICO)
  const handleConfirmEspecialidade = () => {
    if (!especialidadeSelecionada) return;
    
    const especialidade = especialidades.find(e => e.id === especialidadeSelecionada);
    if (!especialidade) return;
    
    // Salvar nome da especialidade
    setEspecialidadeNome(especialidade.nome);
    
    // Mostrar campo para digitar nome do médico
    setMostrarCampoMedico(true);
    
    console.log('✅ Especialidade selecionada:', especialidade.nome);
  };

  // Salvar agendamento no banco (ESPECIALIDADE + MÉDICO)
  const handleSalvarAgendamento = async () => {
    if (!especialidadeNome || !nomeMedico || addingEspecialidade === null) {
      alert('Por favor, preencha a especialidade e o nome do médico');
      return;
    }
    
    setSalvandoAgendamento(true);
    
    try {
      // Pegar a data do dia selecionado
      const dataSelecionada = proximasDatas[addingEspecialidade];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Criar objeto do agendamento
      const novoAgendamento = {
        nome_paciente: '',
        data_nascimento: '2000-01-01',
        data_agendamento: dataFormatada,
        especialidade: especialidadeNome,
        medico: nomeMedico,
        hospital_id: hospitalId || null,
        cidade_natal: null,
        telefone: null
      };
      
      console.log('💾 Salvando agendamento:', novoAgendamento);
      
      // Salvar no Supabase
      await agendamentoService.create(novoAgendamento);
      
      console.log('✅ Especialidade salva! Recarregando dados...');
      
      // Recarregar dados do banco (reutiliza dataFormatada já declarada)
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
      const updatedGrades = grades.map((grade, i) => {
        if (i === addingEspecialidade) {
          return { ...grade, itens };
        }
        return grade;
      });
      
      setGrades(updatedGrades);
      
      // Limpar estados
      setAddingEspecialidade(null);
      setEspecialidadeSelecionada('');
      setEspecialidadeNome('');
      setNomeMedico('');
      setMostrarCampoMedico(false);
      
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      alert('Erro ao salvar agendamento. Verifique o console para mais detalhes.');
    } finally {
      setSalvandoAgendamento(false);
    }
  };

  // Cancelar adição de especialidade
  const handleCancelAddEspecialidade = () => {
    setAddingEspecialidade(null);
    setEspecialidadeSelecionada('');
    setEspecialidadeNome('');
    setNomeMedico('');
    setMostrarCampoMedico(false);
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

  // Remover item
  const handleRemoveItem = (gradeIndex: number, itemId: string) => {
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

  // Replicar para todas (COM PERSISTÊNCIA NO BANCO)
  const handleReplicarParaTodas = async (gradeOrigemIndex: number) => {
    const gradeOrigem = grades[gradeOrigemIndex];
    
    console.log('🔄 Replicando grade do dia', gradeOrigemIndex, 'para todos os dias');
    console.log('📋 Itens a replicar:', gradeOrigem.itens);
    
    // Calcular novo estado
    const updatedGrades = grades.map((grade, i) => ({
      ...grade,
      itens: gradeOrigem.itens.map(item => ({
        ...item,
        id: `temp-${Date.now()}-${Math.random()}-${i}`
      }))
    }));

    console.log('✅ Grades atualizadas:', updatedGrades);

    // Atualizar estado local
    setGrades(updatedGrades);

    // 🔥 SALVAR NO BANCO SUPABASE (especialidades E procedimentos)
    console.log('💾 Salvando especialidades e procedimentos replicados no banco...');
    
    for (let i = 0; i < proximasDatas.length; i++) {
      const dataSelecionada = proximasDatas[i];
      const dataFormatada = dataSelecionada.toISOString().split('T')[0];
      
      let especialidadeAtual = '';
      let medicoAtual = '';
      
      // Percorrer itens e salvar especialidades e procedimentos
      for (const item of gradeOrigem.itens) {
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

  // Adicionar paciente a um procedimento
  const handleAddPacienteClick = (gradeIndex: number, itemId: string) => {
    setAddingPaciente({ gradeIndex, itemId });
    setNovoPacienteNome('');
  };

  // Confirmar adição de paciente (COM AUTO-SAVE)
  const handleConfirmAddPaciente = () => {
    if (!addingPaciente || !novoPacienteNome.trim()) return;

    // Calcular novo estado
    const updatedGrades = grades.map((grade, i) => {
      if (i === addingPaciente.gradeIndex) {
        return {
          ...grade,
          itens: grade.itens.map(item => {
            if (item.id === addingPaciente.itemId && item.tipo === 'procedimento') {
              const pacientes = item.pacientes || [];
              return {
                ...item,
                pacientes: [...pacientes, novoPacienteNome.trim()]
              };
            }
            return item;
          })
        };
      }
      return grade;
    });

    // Atualizar estado local
    setGrades(updatedGrades);

    setAddingPaciente(null);
    setNovoPacienteNome('');
  };

  // Cancelar adição de paciente
  const handleCancelAddPaciente = () => {
    setAddingPaciente(null);
    setNovoPacienteNome('');
  };

  // Remover paciente de um procedimento
  const handleRemovePaciente = (gradeIndex: number, itemId: string, pacienteIndex: number) => {
    // Calcular novo estado
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

    // Atualizar estado local
    setGrades(updatedGrades);
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Grade Cirúrgica - ${nomeDiaClicado}s de ${mesProximoNome}`}
      size="fullscreen"
    >
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
                      
                      {index === 0 && grade.itens.length > 0 && (
                        <button
                          onClick={() => handleReplicarParaTodas(index)}
                          className="flex items-center gap-0.5 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-medium transition-colors"
                          title="Replicar para todos os dias"
                        >
                          <CopyIcon className="w-2.5 h-2.5" />
                          Replicar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown para Adicionar Especialidade */}
                {addingEspecialidade === index && (
                  <div className="p-3 bg-blue-50 border-b-2 border-blue-200">
                    {!mostrarCampoMedico ? (
                      // ETAPA 1: Selecionar Especialidade
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
                    ) : (
                      // ETAPA 2: Digitar Nome do Médico
                      <div className="space-y-2">
                        {/* Mostrar especialidade selecionada */}
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-300">
                          <span className="text-xs text-blue-900">
                            <strong>Especialidade:</strong> {especialidadeNome}
                          </span>
                          <button
                            onClick={() => {
                              setMostrarCampoMedico(false);
                              setNomeMedico('');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Alterar
                          </button>
                        </div>
                        
                        {/* Campo para digitar nome do médico */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                            Nome do Médico:
                          </label>
                          <input
                            type="text"
                            value={nomeMedico}
                            onChange={(e) => setNomeMedico(e.target.value)}
                            placeholder="Digite o nome do médico"
                            className="flex-1 text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && nomeMedico.trim()) {
                                handleSalvarAgendamento();
                              }
                            }}
                          />
                          <button
                            onClick={handleSalvarAgendamento}
                            disabled={!nomeMedico.trim() || salvandoAgendamento}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Salvar no Banco"
                          >
                            {salvandoAgendamento ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                💾 Salvar
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelAddEspecialidade}
                            disabled={salvandoAgendamento}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
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
                                      return proc.pacientes.map((paciente, pIdx) => (
                                        <div
                                          key={`${proc.id}-${pIdx}`}
                                          className="group flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-slate-200 hover:border-slate-300 transition-all"
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

                                          {/* Nome do procedimento e paciente na mesma linha */}
                                          <span className="text-xs flex-1">
                                            <span className="font-medium text-slate-700">{proc.texto}</span>
                                            <span className="mx-1 text-slate-400">-</span>
                                            <span className="font-semibold text-slate-900 bg-yellow-100 px-1 rounded">{paciente}</span>
                                          </span>

                                          {/* Botão remover paciente */}
                                          <button
                                            onClick={() => handleRemovePaciente(index, proc.id, pIdx)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-red-600 hover:bg-red-100 rounded transition-all flex-shrink-0"
                                            title="Remover paciente"
                                          >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ));
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

                                        {/* Se está adicionando paciente, mostrar input inline */}
                                        {addingPaciente?.gradeIndex === index && addingPaciente?.itemId === proc.id ? (
                                          <>
                                            {/* Input do Procedimento (largura fixa) */}
                                            <Input
                                              value={proc.texto}
                                              onChange={(e) => handleUpdateItem(index, proc.id, e.target.value)}
                                              onBlur={() => handleBlurItem(index, proc.id, proc.texto, proc.tipo)}
                                              placeholder="Ex: LCA"
                                              className="w-32 border-0 shadow-none text-xs font-medium focus:ring-1 py-0.5 px-1.5"
                                            />
                                            <span className="text-xs text-slate-400">-</span>
                                            <Input
                                              value={novoPacienteNome}
                                              onChange={(e) => setNovoPacienteNome(e.target.value)}
                                              placeholder="Nome do paciente"
                                              className="flex-1 text-xs py-0.5 px-2 border-blue-300 bg-blue-50"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirmAddPaciente();
                                                if (e.key === 'Escape') handleCancelAddPaciente();
                                              }}
                                            />
                                            <button
                                              onClick={handleConfirmAddPaciente}
                                              className="p-0.5 text-green-600 hover:bg-green-100 rounded flex-shrink-0"
                                              title="Confirmar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={handleCancelAddPaciente}
                                              className="p-0.5 text-red-600 hover:bg-red-100 rounded flex-shrink-0"
                                              title="Cancelar"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {/* Input do Procedimento */}
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
                                          </>
                                        )}
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
  );
};

export default GradeCirurgicaModal;
