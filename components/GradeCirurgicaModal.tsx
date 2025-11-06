import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Input, PlusIcon, TrashIcon, CopyIcon } from './ui';
import { GradeCirurgicaDia, GradeCirurgicaItem, DiaSemana } from '../types';

interface GradeCirurgicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesAtual: Date;
  diaSemanaClicado: number; // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb
  hospitalId: string;
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
  hospitalId
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

  // Gerar chave única para armazenamento no localStorage
  const storageKey = useMemo(() => 
    `gradeCirurgica_${hospitalId}_${DAY_NUMBER_TO_DIA_SEMANA[diaSemanaClicado]}_${mesAtual.getFullYear()}_${mesAtual.getMonth() + 2}`,
    [hospitalId, diaSemanaClicado, mesAtual]
  );

  // Estado das grades
  const [grades, setGrades] = useState<GradeCirurgicaDia[]>(() => {
    // Tentar carregar do localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar se as datas batem
        if (parsed.length === proximasDatas.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar grade salva:', e);
    }
    
    // Se não houver grade salva, criar vazia
    return proximasDatas.map(data => ({
      data: data.toISOString().split('T')[0],
      diaSemana: DAY_NUMBER_TO_DIA_SEMANA[diaSemanaClicado],
      itens: []
    }));
  });

  // Estado para controlar se já houve a primeira edição
  const [primeiraEdicaoFeita, setPrimeiraEdicaoFeita] = useState(() => {
    // Se já há itens salvos, considera que já foi feita a primeira edição
    return grades.some(g => g.itens.length > 0);
  });

  // Salvar no localStorage sempre que as grades mudarem
  useEffect(() => {
    if (grades.some(g => g.itens.length > 0)) {
      localStorage.setItem(storageKey, JSON.stringify(grades));
    }
  }, [grades, storageKey]);

  // Adicionar especialidade
  const handleAddEspecialidade = (gradeIndex: number) => {
    setGrades(prev => prev.map((grade, i) => {
      if (i === gradeIndex) {
        const novoItem: GradeCirurgicaItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          tipo: 'especialidade',
          texto: '',
          ordem: grade.itens.length + 1
        };
        return { ...grade, itens: [...grade.itens, novoItem] };
      }
      return grade;
    }));
  };

  // Adicionar procedimento (com especialidadeId para inserir na posição correta)
  const handleAddProcedimento = (gradeIndex: number, especialidadeId?: string) => {
    setGrades(prev => prev.map((grade, i) => {
      if (i === gradeIndex) {
        const novoItem: GradeCirurgicaItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          tipo: 'procedimento',
          texto: '',
          ordem: 0 // Será recalculado
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
              itens: novosItens.map((item, idx) => ({ ...item, ordem: idx + 1 }))
            };
          }
        }
        
        // Se não foi passado especialidadeId ou não encontrou, adiciona no final
        return { 
          ...grade, 
          itens: [...grade.itens, { ...novoItem, ordem: grade.itens.length + 1 }] 
        };
      }
      return grade;
    }));
  };

  // Atualizar texto de um item
  const handleUpdateItem = (gradeIndex: number, itemId: string, novoTexto: string) => {
    setGrades(prev => {
      const novasGrades = prev.map((grade, i) => {
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

      // Se for a primeira edição no primeiro dia e o texto não estiver vazio, replicar para todos
      if (!primeiraEdicaoFeita && gradeIndex === 0 && novoTexto.trim() !== '') {
        const primeiroDia = novasGrades[0];
        if (primeiroDia.itens.some(item => item.texto.trim() !== '')) {
          setPrimeiraEdicaoFeita(true);
          // Replicar para todos os outros dias
          return novasGrades.map((grade, i) => {
            if (i === 0) return grade;
            return {
              ...grade,
              itens: primeiroDia.itens.map(item => ({
                ...item,
                id: `temp-${Date.now()}-${Math.random()}-${i}`
              }))
            };
          });
        }
      }

      return novasGrades;
    });
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

  // Replicar grade
  const handleReplicarGrade = (gradeOrigemIndex: number, gradeDestinoIndex: number) => {
    const gradeOrigem = grades[gradeOrigemIndex];
    setGrades(prev => prev.map((grade, i) => {
      if (i === gradeDestinoIndex) {
        return {
          ...grade,
          itens: gradeOrigem.itens.map(item => ({
            ...item,
            id: `temp-${Date.now()}-${Math.random()}-${i}`
          }))
        };
      }
      return grade;
    }));
  };

  // Replicar para todas
  const handleReplicarParaTodas = (gradeOrigemIndex: number) => {
    const gradeOrigem = grades[gradeOrigemIndex];
    setGrades(prev => prev.map((grade, i) => ({
      ...grade,
      itens: gradeOrigem.itens.map(item => ({
        ...item,
        id: `temp-${Date.now()}-${Math.random()}-${i}`
      }))
    })));
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
        {/* Grid com as 3 datas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {proximasDatas.map((data, index) => {
            const grade = grades[index];

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
                          {grade.itens.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Botões de ação do header */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAddEspecialidade(index)}
                        className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-medium transition-colors"
                        title="Adicionar Especialidade"
                      >
                        <PlusIcon className="w-2.5 h-2.5" />
                        Especialidade
                      </button>
                      
                      {grade.itens.length > 0 && (
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

                              {/* Badge com contador */}
                              <span className="bg-white/30 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {grupo.procedimentos.length}
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
                            <div className="p-1 space-y-0.5 bg-slate-50">
                              {grupo.procedimentos.map((proc) => (
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

                                  {/* Input do Procedimento */}
                                  <Input
                                    value={proc.texto}
                                    onChange={(e) => handleUpdateItem(index, proc.id, e.target.value)}
                                    placeholder="Ex: LCA"
                                    className="flex-1 border-0 shadow-none text-xs focus:ring-1 py-0.5 px-1.5"
                                  />

                                  {/* Botão remover */}
                                  <button
                                    onClick={() => handleRemoveItem(index, proc.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-red-600 hover:bg-red-100 rounded transition-all"
                                    title="✕"
                                  >
                                    <TrashIcon className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
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
        <div className="flex justify-between items-center px-4 py-2 border-t flex-shrink-0 bg-white">
          <span className="text-[10px] text-slate-500 italic">
            ✓ Auto-salvo
          </span>
          <Button
            onClick={onClose}
            variant="secondary"
            className="text-xs py-1.5 px-4"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GradeCirurgicaModal;
