
import React, { useState, useMemo } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
import { Button, Modal, PlusIcon, EditIcon, TrashIcon, Badge, Input } from './ui';
import { AppointmentForm, DoctorForm, ProcedureForm } from './forms';
import { formatDate } from '../utils';
import { 
    simpleMedicoService,
    simpleProcedimentoService,
    simpleAgendamentoService
} from '../services/api-simple';
import { useAuth } from './PremiumLogin';

type ManagementTab = 'agendamentos' | 'medicos' | 'procedimentos';

interface ManagementViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
  onRefresh: () => void;
}

const ManagementView: React.FC<ManagementViewProps> = ({ agendamentos, medicos, procedimentos, onRefresh }) => {
  const { hospital } = useAuth();
  const [activeTab, setActiveTab] = useState<ManagementTab>('agendamentos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Agendamento | Medico | Procedimento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (item: Agendamento | Medico | Procedimento | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };
  
  const getMedicoName = (id: string) => medicos.find(m => m.id === id)?.nome || 'N/A';
  const getProcedimentoName = (id: string) => procedimentos.find(p => p.id === id)?.nome || 'N/A';

  const filteredAgendamentos = useMemo(() =>
    agendamentos.filter(a =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getMedicoName(a.medicoId).toLowerCase().includes(searchTerm.toLowerCase())
    ), [agendamentos, searchTerm, medicos]);

  const filteredMedicos = useMemo(() =>
    medicos.filter(m =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
    ), [medicos, searchTerm]);

  const filteredProcedimentos = useMemo(() =>
    procedimentos.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ), [procedimentos, searchTerm]);

  const TabButton: React.FC<{ tab: ManagementTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === tab
          ? 'bg-white border-b-2 border-primary text-primary'
          : 'text-slate-500 hover:text-primary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Gerenciamento</h2>
        <Button onClick={() => openModal()}>
          <PlusIcon className="w-5 h-5"/>
          Novo {activeTab === 'agendamentos' ? 'Agendamento' : activeTab === 'medicos' ? 'Médico' : 'Procedimento'}
        </Button>
      </div>

      <div className="border-b border-slate-200">
        <TabButton tab="agendamentos" label="Agendamentos" />
        <TabButton tab="medicos" label="Médicos" />
        <TabButton tab="procedimentos" label="Procedimentos" />
      </div>

      <div className="bg-white p-4 rounded-b-lg shadow-md">
        <div className="mb-4">
            <Input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
        </div>
        <div className="overflow-x-auto">
          {activeTab === 'agendamentos' && (
             <DataTable 
                headers={['Paciente', 'Data', 'Médico', 'Procedimento', 'Status', 'Ações']}
                data={filteredAgendamentos}
                renderRow={(item: Agendamento) => (
                    <>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-6 py-4">{formatDate(item.dataAgendamento)}</td>
                        <td className="px-6 py-4">{getMedicoName(item.medicoId)}</td>
                        <td className="px-6 py-4">{getProcedimentoName(item.procedimentoId)}</td>
                        <td className="px-6 py-4">
                            <Badge color={item.statusLiberacao === 'v' ? 'green' : 'red'}>
                                {item.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button>
                            <button onClick={() => setDeletingId(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </>
                )}
            />
          )}
          {activeTab === 'medicos' && (
              <DataTable
                headers={['Nome', 'Especialidade', 'CRM', 'Telefone', 'Email', 'Ações']}
                data={filteredMedicos}
                renderRow={(item: Medico) => (
                    <>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-6 py-4">{item.especialidade}</td>
                        <td className="px-6 py-4">{item.crm}</td>
                        <td className="px-6 py-4">{item.telefone}</td>
                        <td className="px-6 py-4">{item.email}</td>
                        <td className="px-6 py-4 flex gap-2">
                           <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button>
                           <button onClick={() => setDeletingId(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </>
                )}
              />
          )}
           {activeTab === 'procedimentos' && (
              <DataTable
                headers={['Nome', 'Tipo', 'Duração (min)', 'Ações']}
                data={filteredProcedimentos}
                renderRow={(item: Procedimento) => (
                    <>
                        <td className="px-6 py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-6 py-4 capitalize">{item.tipo}</td>
                        <td className="px-6 py-4">{item.duracaoEstimada}</td>
                        <td className="px-6 py-4 flex gap-2">
                            <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button>
                            <button onClick={() => setDeletingId(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </>
                )}
              />
          )}
        </div>
      </div>
      
        {/* Modal for Forms */}
      <Modal 
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? `Editar ${activeTab.slice(0, -1)}` : `Novo ${activeTab.slice(0, -1)}`}
      >
        {activeTab === 'agendamentos' && 
            <AppointmentForm 
                agendamento={editingItem as Agendamento | undefined}
                medicos={medicos}
                procedimentos={procedimentos}
                allAgendamentos={agendamentos}
                onSave={async (data, id) => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        if (id) {
                            await simpleAgendamentoService.update(id, data);
                        } else {
                            const dataWithHospital = { ...data, hospitalId: hospital?.id };
                            await simpleAgendamentoService.create(dataWithHospital);
                        }
                        
                        onRefresh();
                        closeModal();
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Erro ao salvar agendamento');
                    } finally {
                        setLoading(false);
                    }
                }}
                onCancel={closeModal}
                loading={loading}
                error={error}
            />
        }
        {activeTab === 'medicos' &&
            <DoctorForm 
                medico={editingItem as Medico | undefined}
                onSave={async (data, id) => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        if (id) {
                            await simpleMedicoService.update(id, data);
                        } else {
                            const dataWithHospital = { ...data, hospitalId: hospital?.id };
                            await simpleMedicoService.create(dataWithHospital);
                        }
                        
                        onRefresh();
                        closeModal();
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Erro ao salvar médico');
                    } finally {
                        setLoading(false);
                    }
                }}
                onCancel={closeModal}
                loading={loading}
                error={error}
            />
        }
        {activeTab === 'procedimentos' &&
            <ProcedureForm 
                procedimento={editingItem as Procedimento | undefined}
                onSave={async (data, id) => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        if (id) {
                            await simpleProcedimentoService.update(id, data);
                        } else {
                            const dataWithHospital = { ...data, hospitalId: hospital?.id };
                            await simpleProcedimentoService.create(dataWithHospital);
                        }
                        
                        onRefresh();
                        closeModal();
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Erro ao salvar procedimento');
                    } finally {
                        setLoading(false);
                    }
                }}
                onCancel={closeModal}
                loading={loading}
                error={error}
            />
        }
      </Modal>

      {/* Confirmation Modal for Deletion */}
      <Modal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Confirmar Exclusão"
        footer={
            <>
                <Button variant="secondary" onClick={() => setDeletingId(null)} disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    variant="danger" 
                    disabled={loading}
                    onClick={async () => {
                        if (!deletingId) return;
                        
                        try {
                            setLoading(true);
                            setError(null);
                            
                            if (activeTab === 'agendamentos') {
                                await simpleAgendamentoService.delete(deletingId);
                            } else if (activeTab === 'medicos') {
                                await simpleMedicoService.delete(deletingId);
                            } else if (activeTab === 'procedimentos') {
                                await simpleProcedimentoService.delete(deletingId);
                            }
                            
                            onRefresh();
                            setDeletingId(null);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Erro ao excluir item');
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {loading ? 'Excluindo...' : 'Excluir'}
                </Button>
            </>
        }
      >
        <div>
            <p>Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
            {error && (
                <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};


interface DataTableProps<T> {
    headers: string[];
    data: T[];
    renderRow: (item: T) => React.ReactNode;
}

const DataTable = <T extends {id: string}, >({ headers, data, renderRow }: DataTableProps<T>) => {
    return (
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                    {headers.map(h => <th key={h} scope="col" className="px-6 py-3">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? data.map(item => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                        {renderRow(item)}
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={headers.length} className="text-center py-8 text-slate-500">
                            Nenhum dado encontrado.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};


export default ManagementView;
