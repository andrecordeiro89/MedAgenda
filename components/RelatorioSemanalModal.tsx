import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button } from './ui';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils';
import { Agendamento, Medico } from '../types';
import { agendamentoService, medicoService } from '../services/supabase';
import { useToast } from '../contexts/ToastContext';

interface RelatorioSemanalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  hospitalNome?: string;
}

const RelatorioSemanalModal: React.FC<RelatorioSemanalModalProps> = ({
  isOpen,
  onClose,
  hospitalId,
  hospitalNome = 'Hospital'
}) => {
  const { warning, error: toastError } = useToast();
  // Estado para mês e ano separados
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth()); // 0-11

  // Estado para dias específicos selecionados (formato: YYYY-MM-DD)
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(new Set<string>());

  // Estado para dias que têm grade cirúrgica
  const [diasComGrade, setDiasComGrade] = useState<Set<string>>(new Set());

  const [gerando, setGerando] = useState(false);
  const [carregandoGrades, setCarregandoGrades] = useState(false);
  
  // Estado para médicos e filtro
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState<string>('todos'); // 'todos' ou nome do médico
  const [carregandoMedicos, setCarregandoMedicos] = useState(false);
  
  // Estado para armazenar agendamentos carregados
  const [agendamentosCarregados, setAgendamentosCarregados] = useState<Agendamento[]>([]);

  // Calcular dias do mês selecionado
  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(anoSelecionado, mesSelecionado, 1);
    const ultimoDia = new Date(anoSelecionado, mesSelecionado + 1, 0);
    const totalDias = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay(); // 0=Dom, 1=Seg...

    const dias: Array<{ data: Date; dataString: string; dia: number } | null> = [];

    // Adicionar células vazias antes do primeiro dia
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }

    // Adicionar todos os dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
      const data = new Date(anoSelecionado, mesSelecionado, dia);
      const dataString = data.toISOString().split('T')[0]; // YYYY-MM-DD
      dias.push({ data, dataString, dia });
    }

    return dias;
  }, [anoSelecionado, mesSelecionado]);

  const mesNome = new Date(anoSelecionado, mesSelecionado).toLocaleString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Filtrar médicos que têm procedimentos nos dias selecionados
  const medicosDisponiveis = useMemo(() => {
    if (diasSelecionados.size === 0) {
      return []; // Se nenhum dia selecionado, não mostrar médicos
    }

    // Buscar médicos únicos que têm procedimentos COM PACIENTE nos dias selecionados
    const nomeMedicosSet = new Set<string>();
    
    agendamentosCarregados.forEach(ag => {
      const dataAgendamento = ag.data_agendamento || ag.dataAgendamento;
      if (!dataAgendamento) return;

      const dataNormalizada = dataAgendamento.split('T')[0];
      
      // Verificar se é um dos dias selecionados
      if (diasSelecionados.has(dataNormalizada)) {
        // Verificar se tem paciente
        const nomePaciente = ag.nome_paciente || ag.nome || '';
        const temPaciente = nomePaciente.trim() !== '';
        
        // Verificar se tem médico
        const medicoNome = ag.medico || '';
        
        if (temPaciente && medicoNome.trim() !== '') {
          nomeMedicosSet.add(medicoNome.trim());
        }
      }
    });

    // Filtrar médicos cadastrados que estão nos dias selecionados
    const medicosComProcedimentos = medicos.filter(medico => 
      nomeMedicosSet.has(medico.nome)
    );

    console.log('👨‍⚕️ Médicos disponíveis nos dias selecionados:', medicosComProcedimentos.length);
    
    return medicosComProcedimentos;
  }, [diasSelecionados, medicos, agendamentosCarregados]);

  // Resetar seleção de médico quando dias mudarem
  useEffect(() => {
    // Se o médico selecionado não está mais disponível, resetar para 'todos'
    if (medicoSelecionado !== 'todos') {
      const medicoAindaDisponivel = medicosDisponiveis.some(m => m.nome === medicoSelecionado);
      if (!medicoAindaDisponivel) {
        setMedicoSelecionado('todos');
      }
    }
  }, [medicosDisponiveis, medicoSelecionado]);

  // Carregar médicos do hospital ao abrir modal
  useEffect(() => {
    const carregarMedicos = async () => {
      if (!isOpen) return;
      
      setCarregandoMedicos(true);
      try {
        const medicosData = await medicoService.getAll(hospitalId);
        setMedicos(medicosData);
        console.log('👨‍⚕️ Médicos carregados:', medicosData.length);
      } catch (error) {
        console.error('❌ Erro ao carregar médicos:', error);
        setMedicos([]);
      } finally {
        setCarregandoMedicos(false);
      }
    };
    
    carregarMedicos();
  }, [isOpen, hospitalId]);

  // Carregar grades do mês ao abrir modal ou mudar mês
  useEffect(() => {
    const carregarGradesDoMes = async () => {
      if (!isOpen) return;

      setCarregandoGrades(true);
      try {
        const agendamentos = await agendamentoService.getAll(hospitalId);
        
        // Armazenar agendamentos para uso posterior (filtro de médicos)
        setAgendamentosCarregados(agendamentos);
        
        // Filtrar agendamentos do mês atual que têm procedimentos (são grades)
        const diasSet = new Set<string>();
        
        agendamentos.forEach(ag => {
          const dataAgendamento = ag.data_agendamento || ag.dataAgendamento;
          if (!dataAgendamento) return;

          const data = new Date(dataAgendamento + 'T00:00:00');
          const agAno = data.getFullYear();
          const agMes = data.getMonth();

          // FILTRO: Marcar apenas dias com pacientes agendados (ignora estrutura de grade)
          const nomePaciente = ag.nome_paciente || ag.nome || '';
          const temPaciente = nomePaciente.trim() !== '';

          // Se é do mês atual e tem procedimentos e tem paciente
          if (agAno === anoSelecionado && agMes === mesSelecionado && ag.procedimentos && ag.procedimentos.trim() && temPaciente) {
            const dataNormalizada = dataAgendamento.split('T')[0];
            diasSet.add(dataNormalizada);
          }
        });

        setDiasComGrade(diasSet);
      } catch (error) {
        console.error('Erro ao carregar grades:', error);
      } finally {
        setCarregandoGrades(false);
      }
    };

    carregarGradesDoMes();
  }, [isOpen, anoSelecionado, mesSelecionado, hospitalId]);

  const toggleDia = (dataString: string) => {
    setDiasSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(dataString)) {
        novo.delete(dataString);
      } else {
        novo.add(dataString);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    const novo = new Set<string>();
    diasDoMes.forEach(dia => {
      if (dia) {
        novo.add(dia.dataString);
      }
    });
    setDiasSelecionados(novo);
  };

  const desmarcarTodos = () => {
    setDiasSelecionados(new Set());
  };

  const mudarMes = (direcao: number) => {
    let novoMes = mesSelecionado + direcao;
    let novoAno = anoSelecionado;

    if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    } else if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    }

    setMesSelecionado(novoMes);
    setAnoSelecionado(novoAno);
    
    // Limpar seleção ao mudar de mês para evitar confusão
    setDiasSelecionados(new Set());
  };

  // Função para converter imagem para base64
  const imageToBase64 = (imagePath: string): Promise<string> => {
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
          const dataURL = canvas.toDataURL('image/jpeg');
          resolve(dataURL);
        } else {
          reject(new Error('Não foi possível obter contexto do canvas'));
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = imagePath;
    });
  };

  const gerarRelatorio = async () => {
    // Validar seleção
    if (diasSelecionados.size === 0) {
      warning('Selecione pelo menos um dia no calendário');
      return;
    }

    setGerando(true);

    try {
      // Buscar todos os agendamentos
      const agendamentos = await agendamentoService.getAll(hospitalId);
      
      // Converter Set para Array e ordenar por data
      const diasArray: string[] = Array.from(diasSelecionados.values());
      diasArray.sort((a, b) => a.localeCompare(b));

      // Agrupar agendamentos por dia específico
      const agendamentosPorDia: { [key: string]: Agendamento[] } = {};
      
      diasArray.forEach(dia => {
        agendamentosPorDia[dia] = [];
      });

      agendamentos.forEach(ag => {
        const dataAgendamento = ag.data_agendamento || ag.dataAgendamento;
        if (!dataAgendamento) return;

        // Normalizar data
        const dataNormalizada = dataAgendamento.split('T')[0]; // YYYY-MM-DD

        // FILTRO: Apenas agendamentos com paciente (ignora estrutura de grade)
        const nomePaciente = ag.nome_paciente || ag.nome || '';
        const temPaciente = nomePaciente.trim() !== '';
        
        // FILTRO: Por médico (se selecionado)
        const medicoDoAgendamento = ag.medico || '';
        const passaFiltroMedico = medicoSelecionado === 'todos' || 
                                  medicoDoAgendamento.toLowerCase().includes(medicoSelecionado.toLowerCase());

        if (diasSelecionados.has(dataNormalizada) && temPaciente && passaFiltroMedico) {
          agendamentosPorDia[dataNormalizada].push(ag);
        }
      });

      console.log('📊 Agendamentos agrupados por dia:', agendamentosPorDia);

      // Verificar se há dados
      const totalAgendamentos = Object.values(agendamentosPorDia).reduce(
        (total, arr) => total + arr.length, 
        0
      );

      if (totalAgendamentos === 0) {
        warning('Não há agendamentos para os dias selecionados');
        return;
      }

      // Gerar PDF (passando info do médico selecionado)
      await gerarPDF(agendamentosPorDia, mesNome, medicoSelecionado);

      // Fechar modal após gerar
      onClose();
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      toastError('Erro ao gerar relatório. Por favor, tente novamente');
    } finally {
      setGerando(false);
    }
  };

  const gerarPDF = async (
    agendamentosPorDia: { [key: string]: Agendamento[] },
    mesNome: string,
    medicoFiltrado: string = 'todos'
  ) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    let primeiraPagina = true;

    try {
      // Carregar logo
      const logoPath = '/CIS Sem fundo.jpg';
      const logoBase64 = await imageToBase64(logoPath);

      // Para cada dia específico (ordenado)
      const diasOrdenados = Object.keys(agendamentosPorDia).sort();

      for (const dataString of diasOrdenados) {
        const agendamentos = agendamentosPorDia[dataString];
        
        if (agendamentos.length === 0) continue;

        // Formatar data para exibição (ex: "05/01/2026 - Segunda-feira")
        const data = new Date(dataString + 'T00:00:00');
        const dataFormatada = formatDate(dataString);
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
        const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

        // Nova página (exceto a primeira)
        if (!primeiraPagina) {
          doc.addPage();
        }
        primeiraPagina = false;

        // Adicionar logo no cabeçalho
        const logoWidth = 25;
        const logoHeight = 15;
        doc.addImage(logoBase64, 'JPEG', 14, 8, logoWidth, logoHeight, undefined, 'FAST');

        // Título do relatório
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleY = 8 + (logoHeight / 2) - 3;
        const tituloRelatorio = medicoFiltrado !== 'todos' 
          ? `Grade Cirúrgica - ${dataFormatada} - ${medicoFiltrado}`
          : `Grade Cirúrgica - ${dataFormatada}`;
        doc.text(tituloRelatorio, 14 + logoWidth + 5, titleY);

        // Informações adicionais
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${hospitalNome}`, 14 + logoWidth + 5, titleY + 5);
        const infoMedico = medicoFiltrado !== 'todos' ? ` - Médico: ${medicoFiltrado}` : '';
        doc.text(`${diaSemanaCapitalizado} - ${mesNome}${infoMedico}`, 14 + logoWidth + 5, titleY + 10);
        doc.text(`Total de registros: ${agendamentos.length}`, 14 + logoWidth + 5, titleY + 15);

        // Preparar dados da tabela
        const tableData = agendamentos.map(ag => {
          const dataAgendamento = ag.data_agendamento || ag.dataAgendamento || '-';
          const dataFormatada = dataAgendamento !== '-' 
            ? formatDate(dataAgendamento)
            : '-';

          // Calcular idade
          let idade: string | null = null;
          if (ag.data_nascimento) {
            const [y, m, d] = ag.data_nascimento.split('-');
            const hoje = new Date();
            let idadeCalculada = hoje.getFullYear() - parseInt(y, 10);
            const mesAtual = hoje.getMonth() + 1;
            const diaAtual = hoje.getDate();
            const mesNasc = parseInt(m, 10);
            const diaNasc = parseInt(d, 10);
            if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
              idadeCalculada--;
            }
            idade = idadeCalculada >= 0 ? String(idadeCalculada) : null;
          }

          const procedimentoTexto = (() => {
            const base = ag.procedimentos || '';
            const esp = ag.procedimento_especificacao || '';
            if (!base) return '-';
            if (esp && esp.trim() !== '') return `${base} - ${esp}`;
            return base;
          })();

          return [
            dataFormatada,
            ag.especialidade || '-',
            procedimentoTexto,
            ag.medico || '-',
            ag.nome_paciente || ag.nome || '-',
            idade ? `${idade} anos` : '-',
            ag.cidade_natal || ag.cidadeNatal || '-',
            ag.telefone || '-',
            ag.data_consulta ? formatDate(ag.data_consulta) : '-',
            ag.data_nascimento ? formatDate(ag.data_nascimento) : '-'
          ];
        });

        // Adicionar tabela
        autoTable(doc, {
          head: [['Data', 'Especialidade', 'Procedimento', 'Médico', 'Paciente', 'Idade', 'Cidade', 'Telefone', 'Data Consulta', 'Data Nascimento']],
          body: tableData,
          startY: 33,
          styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            halign: 'left'
          },
          headStyles: {
            fillColor: [128, 128, 128],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7
          },
          columnStyles: {
            0: { cellWidth: 20 }, // Data
            1: { cellWidth: 30 }, // Especialidade
            2: { cellWidth: 35 }, // Procedimento
            3: { cellWidth: 30 }, // Médico
            4: { cellWidth: 35 }, // Paciente
            5: { cellWidth: 15 }, // Idade
            6: { cellWidth: 25 }, // Cidade
            7: { cellWidth: 25 }, // Telefone
            8: { cellWidth: 25 }, // Data Consulta
            9: { cellWidth: 25 }  // Data Nascimento
          },
          margin: { left: 14, right: 14 },
          didDrawPage: function (data: any) {
            // Adicionar número da página
            doc.setFontSize(8);
            doc.text(
              `${dataFormatada} - Página ${data.pageNumber}`,
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'center' }
            );
          }
        });
      }

      // Salvar PDF
      const sufixoMedico = medicoFiltrado !== 'todos' ? `_${medicoFiltrado.replace(/\s+/g, '_')}` : '';
      const nomeArquivo = `Grade_Semanal_${mesNome.replace(/\s+/g, '_')}${sufixoMedico}.pdf`;
      doc.save(nomeArquivo);

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      toastError('Erro ao gerar PDF. Por favor, tente novamente');
      throw error;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Compartilhar Grade"
      size="large"
    >
      <div className="p-6">
        {/* Navegação do Mês */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => mudarMes(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Mês anterior"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-800 capitalize">
              {mesNome}
            </h3>

            <button
              onClick={() => mudarMes(1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Próximo mês"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Filtro de Médico */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrar por Médico:
            </label>
            <select
              value={medicoSelecionado}
              onChange={(e) => setMedicoSelecionado(e.target.value)}
              disabled={carregandoMedicos || diasSelecionados.size === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="todos">
                {diasSelecionados.size === 0 
                  ? '📋 Selecione dias primeiro' 
                  : `📋 Todos os Médicos (${medicosDisponiveis.length})`
                }
              </option>
              {diasSelecionados.size > 0 && medicosDisponiveis.length > 0 ? (
                medicosDisponiveis
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map(medico => (
                    <option key={medico.id} value={medico.nome}>
                      👨‍⚕️ {medico.nome} - {medico.especialidade}
                    </option>
                  ))
              ) : diasSelecionados.size > 0 ? (
                <option disabled>Nenhum médico nos dias selecionados</option>
              ) : null}
            </select>
            {diasSelecionados.size === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ Selecione pelo menos um dia no calendário para filtrar médicos
              </p>
            )}
            {diasSelecionados.size > 0 && medicosDisponiveis.length > 0 && medicoSelecionado !== 'todos' && (
              <p className="mt-1 text-xs text-blue-600">
                ✓ Filtrando por: <strong>{medicoSelecionado}</strong>
              </p>
            )}
            {diasSelecionados.size > 0 && medicosDisponiveis.length > 0 && medicoSelecionado === 'todos' && (
              <p className="mt-1 text-xs text-green-600">
                ✓ {medicosDisponiveis.length} {medicosDisponiveis.length === 1 ? 'médico disponível' : 'médicos disponíveis'} nos dias selecionados
              </p>
            )}
          </div>

          {/* Botões de ação rápida */}
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-gray-700">
              Selecione os dias no calendário:
            </label>
            <div className="flex gap-2">
              <button
                onClick={selecionarTodos}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded"
              >
                Selecionar Todos
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={desmarcarTodos}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 hover:bg-gray-50 rounded"
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Contador de dias selecionados */}
          {diasSelecionados.size > 0 && (
            <div className="mb-3 text-center">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {diasSelecionados.size} {diasSelecionados.size === 1 ? 'dia selecionado' : 'dias selecionados'}
              </span>
            </div>
          )}

          {/* Legenda */}
          <div className="mb-3 flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 bg-blue-500 rounded"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-300 bg-gray-100 rounded"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-200 bg-white rounded relative">
                <div className="absolute top-0 right-0 w-1 h-1 bg-green-500 rounded-full"></div>
              </div>
              <span>Com grade</span>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="mb-6">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div
                key={dia}
                className="text-center text-xs font-semibold text-gray-600 py-2"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {diasDoMes.map((dia, index) => {
              if (!dia) {
                // Célula vazia
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const selecionado = diasSelecionados.has(dia.dataString);
              const hoje = new Date().toISOString().split('T')[0] === dia.dataString;
              const temGrade = diasComGrade.has(dia.dataString);

              return (
                <button
                  key={dia.dataString}
                  onClick={() => toggleDia(dia.dataString)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium
                    transition-all border-2 relative
                    ${selecionado
                      ? 'bg-blue-500 text-white border-blue-600 shadow-md hover:bg-blue-600'
                      : hoje
                        ? 'bg-gray-100 text-gray-900 border-gray-300 hover:border-blue-400'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                  title={`${dia.data.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}${temGrade ? ' - Possui grade cirúrgica' : ''}`}
                >
                  {dia.dia}
                  {temGrade && (
                    <div className="absolute top-0.5 right-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${selecionado ? 'bg-white' : 'bg-green-500'}`}></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>


        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={gerando}
          >
            Cancelar
          </Button>
          <Button
            onClick={gerarRelatorio}
            disabled={gerando || diasSelecionados.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {gerando ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Gerando PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gerar Relatório PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RelatorioSemanalModal;

