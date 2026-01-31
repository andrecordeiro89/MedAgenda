import React, { useState, useMemo } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { Button, Modal, PlusIcon, EditIcon, TrashIcon, Badge, Input } from './ui';
import { AppointmentForm, DoctorForm, ProcedureForm } from './forms';
import { formatDate } from '../utils';
import { 
    medicoService,
    procedimentoService,
    agendamentoService
} from '../services/supabase';

type ManagementTab = 'agendamentos' | 'medicos' | 'procedimentos';

interface ManagementViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
  onDataUpdate: () => void;
  hospitalId?: string; // ID do hospital selecionado
}

const ManagementView: React.FC<ManagementViewProps> = ({ 
  agendamentos, 
  medicos, 
  procedimentos, 
  onDataUpdate,
  hospitalId 
}) => {
  const [activeTab, setActiveTab] = useState<ManagementTab>('agendamentos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Agendamento | Medico | Procedimento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funções de CRUD com suporte a hospital_id
  const handleSave = async (data: any) => {
    if (!hospitalId) {
      setError('Hospital não selecionado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Adicionar hospital_id aos dados
      const dataWithHospital = { ...data, hospital_id: hospitalId };

      // Calcular diff para atualizar somente campos modificados
      const buildDiff = (original: any, updated: any) => {
        const diff: any = {};
        Object.entries(updated).forEach(([key, value]) => {
          if (value !== undefined && value !== (original ? (original as any)[key] : undefined)) {
            diff[key] = value;
          }
        });
        return diff;
      };
      
      if (editingItem) {
        // Editar item existente
        switch (activeTab) {
          case 'agendamentos':
            await agendamentoService.update(editingItem.id, buildDiff(editingItem, dataWithHospital));
            break;
          case 'medicos':
            await medicoService.update(editingItem.id, buildDiff(editingItem, dataWithHospital));
            break;
          case 'procedimentos':
            await procedimentoService.update(editingItem.id, buildDiff(editingItem, dataWithHospital));
            break;
        }
      } else {
        // Criar novo item
        switch (activeTab) {
          case 'agendamentos':
            await agendamentoService.create(dataWithHospital);
            break;
          case 'medicos':
            await medicoService.create(dataWithHospital);
            break;
          case 'procedimentos':
            await procedimentoService.create(dataWithHospital);
            break;
        }
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      onDataUpdate(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'agendamentos':
          await agendamentoService.delete(id);
          break;
        case 'medicos':
          await medicoService.delete(id);
          break;
        case 'procedimentos':
          await procedimentoService.delete(id);
          break;
      }
      
      setDeletingId(null);
      onDataUpdate(); // Recarregar dados
    } catch (err) {
      console.error('Erro ao deletar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar item');
    } finally {
      setLoading(false);
    }
  };

  // Funções de UI
  const openCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  // Filtrar dados por busca
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    switch (activeTab) {
      case 'agendamentos':
        return agendamentos.filter(a => 
          a.nome.toLowerCase().includes(searchLower) ||
          formatDate(a.dataAgendamento).includes(searchLower)
        );
      case 'medicos':
        return medicos.filter(m => 
          m.nome.toLowerCase().includes(searchLower) ||
          m.especialidade.toLowerCase().includes(searchLower) ||
          m.crm.toLowerCase().includes(searchLower)
        );
      case 'procedimentos':
        return procedimentos.filter(p => 
          p.nome.toLowerCase().includes(searchLower) ||
          p.tipo.toLowerCase().includes(searchLower)
        );
      default:
        return [];
    }
  }, [activeTab, agendamentos, medicos, procedimentos, searchTerm]);

  // Configurações de tabela por tipo
  const getTableConfig = () => {
    switch (activeTab) {
      case 'agendamentos':
        return {
          title: 'Agendamentos',
          headers: ['Paciente', 'Data', 'Médico', 'Procedimento', 'Status', 'Ações'],
          data: filteredData as Agendamento[]
        };
      case 'medicos':
        return {
          title: 'Médicos',
          headers: ['Nome', 'Especialidade', 'CRM', 'Telefone', 'Email', 'Ações'],
          data: filteredData as Medico[]
        };
      case 'procedimentos':
        return {
          title: 'Procedimentos',
          headers: ['Nome', 'Tipo', 'Duração', 'Descrição', 'Ações'],
          data: filteredData as Procedimento[]
        };
      default:
        return { title: '', headers: [], data: [] };
    }
  };

  // Renderizar linha da tabela
  const renderRow = (item: any) => {
    switch (activeTab) {
      case 'agendamentos':
        const agendamento = item as Agendamento;
        const medico = medicos.find(m => m.id === agendamento.medicoId);
        const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
        
        return (
          <tr key={agendamento.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {agendamento.nome}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {formatDate(agendamento.dataAgendamento)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {medico?.nome || 'Médico não encontrado'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {procedimento?.nome || 'Procedimento não encontrado'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <Badge variant={(agendamento as any).status_liberacao === 'v' ? 'success' : 'warning'}>
                {(agendamento as any).status_liberacao === 'v' ? 'Liberado' : 'Pendente'}
              </Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <Button variant="secondary" size="sm" onClick={() => openEditModal(agendamento)}>
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeletingId(agendamento.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        );

      case 'medicos':
        const medico_item = item as Medico;
        return (
          <tr key={medico_item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {medico_item.nome}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {medico_item.especialidade}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {medico_item.crm}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {medico_item.telefone}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {medico_item.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <Button variant="secondary" size="sm" onClick={() => openEditModal(medico_item)}>
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeletingId(medico_item.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        );

      case 'procedimentos':
        const procedimento_item = item as Procedimento;
        return (
          <tr key={procedimento_item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {procedimento_item.nome}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <Badge variant={procedimento_item.tipo === 'cirurgico' ? 'danger' : 'success'}>
                {procedimento_item.tipo === 'cirurgico' ? 'Cirúrgico' : 'Ambulatorial'}
              </Badge>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {procedimento_item.duracaoEstimada} min
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
              {procedimento_item.descricao || 'Sem descrição'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <Button variant="secondary" size="sm" onClick={() => openEditModal(procedimento_item)}>
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeletingId(procedimento_item.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </td>
          </tr>
        );

      default:
        return null;
    }
  };

  // Renderizar formulário no modal
  const renderForm = () => {
    switch (activeTab) {
      case 'agendamentos':
        return (
          <AppointmentForm
            agendamento={editingItem as Agendamento}
            medicos={medicos}
            procedimentos={procedimentos}
            allAgendamentos={agendamentos}
            onSave={handleSave}
            onCancel={closeModal}
            loading={loading}
            error={error}
          />
        );
      case 'medicos':
        return (
          <DoctorForm
            medico={editingItem as Medico}
            onSave={handleSave}
            onCancel={closeModal}
            loading={loading}
            error={error}
          />
        );
      case 'procedimentos':
        return (
          <ProcedureForm
            procedimento={editingItem as Procedimento}
            onSave={handleSave}
            onCancel={closeModal}
            loading={loading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  const { title, headers, data } = getTableConfig();

  return (
    <div className="space-y-6">
      {/* Cabeçalho com abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['agendamentos', 'medicos', 'procedimentos'] as ManagementTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchTerm('');
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder={`Buscar ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Adicionar {title.slice(0, -1)}
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {title} ({data.length})
          </h3>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Nenhum resultado encontrado' : `Nenhum ${activeTab.slice(0, -1)} cadastrado`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulário */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`${editingItem ? 'Editar' : 'Adicionar'} ${title.slice(0, -1)}`}
      >
        {renderForm()}
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManagementView;
