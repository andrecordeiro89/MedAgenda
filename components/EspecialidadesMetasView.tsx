import React, { useState, useMemo, useCallback } from 'react';
import { MetaEspecialidade, Especialidade, DiaSemana, Medico, Procedimento } from '../types';
import { Button, Modal, Input, Select, FormField, Badge, EditIcon, TrashIcon, PlusIcon } from './ui';
import { simpleMetaEspecialidadeService } from '../services/api-simple';

interface EspecialidadesMetasViewProps {
  especialidades: Especialidade[];
  metas: MetaEspecialidade[];
  hospitalId: string;
  medicos: Medico[];
  procedimentos: Procedimento[];
  onRefresh: () => void;
}

const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' }
];

const getDiaLabel = (dia: DiaSemana): string => {
  return DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
};

const EspecialidadesMetasView: React.FC<EspecialidadesMetasViewProps> = ({
  especialidades,
  metas,
  hospitalId,
  medicos,
  procedimentos,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaEspecialidade | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    especialidadeId: '',
    diaSemana: 'segunda' as DiaSemana,
    quantidadeAgendamentos: 10,
    ativo: true,
    observacoes: ''
  });

  // Ordenar especialidades alfabeticamente
  const especialidadesOrdenadas = useMemo(() => {
    const sortedEspecialidades = [...especialidades].sort((a, b) => 
      a.nome.localeCompare(b.nome, 'pt-BR')
    );
    
    console.log('🎯 Especialidades disponíveis:', {
      total: especialidades.length,
      especialidades: sortedEspecialidades.map(e => e.nome)
    });
    
    return sortedEspecialidades;
  }, [especialidades]);

  // Agrupar metas por especialidade
  const metasPorEspecialidade = useMemo(() => {
    const grupos: Record<string, MetaEspecialidade[]> = {};
    
    metas.forEach(meta => {
      if (!grupos[meta.especialidadeId]) {
        grupos[meta.especialidadeId] = [];
      }
      grupos[meta.especialidadeId].push(meta);
    });

    return grupos;
  }, [metas]);

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormData({
      especialidadeId: '',
      diaSemana: 'segunda',
      quantidadeAgendamentos: 10,
      ativo: true,
      observacoes: ''
    });
    setEditingMeta(null);
    setError(null);
  }, []);

  // Abrir modal para criar/editar
  const openModal = useCallback((meta: MetaEspecialidade | null = null) => {
    if (meta) {
      setFormData({
        especialidadeId: meta.especialidadeId,
        diaSemana: meta.diaSemana,
        quantidadeAgendamentos: meta.quantidadeAgendamentos,
        ativo: meta.ativo,
        observacoes: meta.observacoes || ''
      });
      setEditingMeta(meta);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  }, [resetForm]);

  // Fechar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  // Salvar meta
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.especialidadeId) {
        throw new Error('Selecione uma especialidade');
      }

      if (formData.quantidadeAgendamentos <= 0) {
        throw new Error('A quantidade deve ser maior que zero');
      }

      const metaData = {
        especialidadeId: formData.especialidadeId,
        diaSemana: formData.diaSemana,
        quantidadeAgendamentos: formData.quantidadeAgendamentos,
        ativo: formData.ativo,
        hospitalId: hospitalId,
        observacoes: formData.observacoes
      };

      if (editingMeta) {
        await simpleMetaEspecialidadeService.update(editingMeta.id, metaData);
      } else {
        await simpleMetaEspecialidadeService.create(metaData);
      }

      onRefresh();
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar meta');
    } finally {
      setLoading(false);
    }
  };

  // Excluir meta
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
      return;
    }

    setDeletingId(id);
    try {
      await simpleMetaEspecialidadeService.delete(id);
      onRefresh();
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
      alert('Erro ao excluir meta: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">
            Metas de Agendamento por Especialidade
          </h3>
          <p className="text-slate-600 mt-1">
            Defina metas de agendamentos para cada especialidade por dia da semana
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nova Meta
        </Button>
      </div>

      {/* Lista de Especialidades com Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {especialidadesOrdenadas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-600 text-lg mb-2">
              Nenhuma especialidade cadastrada
            </p>
            <p className="text-slate-500 text-sm">
              Execute o script SQL para cadastrar as especialidades no banco de dados.
            </p>
          </div>
        ) : (
          especialidadesOrdenadas.map(especialidade => {
          const metasEspec = metasPorEspecialidade[especialidade.id] || [];
          const totalMetas = metasEspec.length;
          const metasAtivas = metasEspec.filter(m => m.ativo).length;
          const totalAgendamentos = metasEspec
            .filter(m => m.ativo)
            .reduce((sum, m) => sum + m.quantidadeAgendamentos, 0);

          return (
            <div
              key={especialidade.id}
              className="bg-white rounded-lg shadow-md border border-slate-200 p-5"
            >
              {/* Header da Especialidade */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800">
                    {especialidade.nome}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalAgendamentos}
                  </div>
                  <div className="text-xs text-slate-500">
                    agend./semana
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="flex gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex-1 text-center">
                  <div className="text-lg font-semibold text-slate-700">
                    {metasAtivas}
                  </div>
                  <div className="text-xs text-slate-500">Dias ativos</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-semibold text-slate-700">
                    {totalMetas}
                  </div>
                  <div className="text-xs text-slate-500">Total de metas</div>
                </div>
              </div>

              {/* Lista de Metas por Dia */}
              <div className="space-y-2">
                {metasEspec.length > 0 ? (
                  metasEspec.map(meta => (
                    <div
                      key={meta.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        meta.ativo
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {getDiaLabel(meta.diaSemana)}
                          </span>
                          <Badge variant={meta.ativo ? 'success' : 'default'}>
                            {meta.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {meta.observacoes && (
                          <p className="text-xs text-slate-600 mt-1">
                            {meta.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {meta.quantidadeAgendamentos}
                          </div>
                          <div className="text-xs text-slate-500">agend.</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openModal(meta)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Editar"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(meta.id)}
                            disabled={deletingId === meta.id}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>Nenhuma meta definida</p>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          especialidadeId: especialidade.id
                        }));
                        openModal();
                      }}
                      className="text-blue-600 hover:underline text-sm mt-2"
                    >
                      Adicionar primeira meta
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMeta ? 'Editar Meta de Agendamento' : 'Nova Meta de Agendamento'}
        size="medium"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Especialidade */}
          <FormField label="Especialidade" error={error && !formData.especialidadeId ? 'Selecione uma especialidade' : undefined}>
            <Select
              value={formData.especialidadeId}
              onChange={(e) => setFormData(prev => ({ ...prev, especialidadeId: e.target.value }))}
              required
              disabled={!!editingMeta}
            >
              <option value="">Selecione uma especialidade</option>
              {especialidadesOrdenadas.map(esp => (
                <option key={esp.id} value={esp.id}>
                  {esp.nome}
                </option>
              ))}
            </Select>
            {especialidadesOrdenadas.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Nenhuma especialidade disponível. Execute o script SQL para cadastrar especialidades.
              </p>
            )}
          </FormField>

          {/* Dia da Semana */}
          <FormField label="Dia da Semana">
            <Select
              value={formData.diaSemana}
              onChange={(e) => setFormData(prev => ({ ...prev, diaSemana: e.target.value as DiaSemana }))}
              required
            >
              {DIAS_SEMANA.map(dia => (
                <option key={dia.value} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Quantidade de Agendamentos */}
          <FormField label="Quantidade de Agendamentos">
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.quantidadeAgendamentos}
              onChange={(e) => setFormData(prev => ({ ...prev, quantidadeAgendamentos: parseInt(e.target.value) || 0 }))}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Meta de agendamentos para este dia da semana
            </p>
          </FormField>

          {/* Ativo */}
          <FormField label="Status">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Meta ativa</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Apenas metas ativas são contabilizadas nos relatórios
            </p>
          </FormField>

          {/* Observações */}
          <FormField label="Observações (opcional)">
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ex: Meta para casos urgentes, priorizar pacientes..."
            />
          </FormField>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editingMeta ? 'Atualizar Meta' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EspecialidadesMetasView;

