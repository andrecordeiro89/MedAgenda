
import React, { useState, useMemo, useEffect } from 'react';
import { Agendamento, Medico, Procedimento, Especialidade } from '../types';
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
  especialidades: Especialidade[];
  onRefresh: () => void;
}

const ManagementView: React.FC<ManagementViewProps> = ({ agendamentos, medicos, procedimentos, especialidades, onRefresh }) => {
  const { hospitalSelecionado } = useAuth();
  
  // Debug: verificar se especialidades estão chegando no ManagementView
  console.log('🏥 ManagementView - Especialidades recebidas:', especialidades?.length || 0, especialidades);
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
  const getMedicoEspecialidade = (id: string) => medicos.find(m => m.id === id)?.especialidade || 'N/A';
  const getProcedimentoName = (id: string) => procedimentos.find(p => p.id === id)?.nome || 'N/A';
  const getProcedimentoEspecialidade = (procedimento: Procedimento) => {
    // Usar a coluna física especialidade se disponível, senão usar o JOIN
    if (procedimento.especialidade) return procedimento.especialidade;
    if (!procedimento.especialidadeId) return 'N/A';
    return especialidades.find(e => e.id === procedimento.especialidadeId)?.nome || 'N/A';
  };

  const filteredAgendamentos = useMemo(() =>
    agendamentos.filter(a =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getMedicoName(a.medicoId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getMedicoEspecialidade(a.medicoId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProcedimentoName(a.procedimentoId).toLowerCase().includes(searchTerm.toLowerCase())
    ), [agendamentos, searchTerm, medicos, procedimentos]);

  const filteredMedicos = useMemo(() =>
    medicos.filter(m =>
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
    ), [medicos, searchTerm]);

  const filteredProcedimentos = useMemo(() =>
    procedimentos.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProcedimentoEspecialidade(p).toLowerCase().includes(searchTerm.toLowerCase())
    ), [procedimentos, searchTerm, especialidades]);

  const TabButton: React.FC<{ tab: ManagementTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      data-tab={tab}
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
        <Button onClick={() => openModal()} data-new-appointment={activeTab === 'agendamentos' ? 'true' : undefined}>
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
                headers={['Paciente', 'Data', 'Médico', 'Especialidade', 'Procedimento', 'Status', 'Ações']}
                data={filteredAgendamentos}
                renderRow={(item: Agendamento) => (
                    <>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{formatDate(item.dataAgendamento)}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{getMedicoName(item.medicoId)}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getMedicoEspecialidade(item.medicoId)}
                            </span>
                        </td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{getProcedimentoName(item.procedimentoId)}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                            <Badge color={item.statusLiberacao === 'v' ? 'green' : 'red'}>
                                {item.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                            </Badge>
                        </td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 flex gap-1 md:gap-2">
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
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{item.especialidade}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{item.crm}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 hidden md:table-cell">{item.telefone}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 hidden lg:table-cell">{item.email}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 flex gap-1 md:gap-2">
                           <button onClick={() => openModal(item)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button>
                           <button onClick={() => setDeletingId(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </td>
                    </>
                )}
              />
          )}
           {activeTab === 'procedimentos' && (
              <DataTable
                headers={['Nome', 'Tipo', 'Especialidade', 'Ações']}
                data={filteredProcedimentos}
                renderRow={(item: Procedimento) => (
                    <>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-slate-900">{item.nome}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 capitalize">{item.tipo}</td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getProcedimentoEspecialidade(item)}
                            </span>
                        </td>
                        <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 flex gap-1 md:gap-2">
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
                            const dataWithHospital = { ...data, hospitalId: hospitalSelecionado?.id };
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
                especialidades={especialidades}
                onSave={async (data, id) => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        if (id) {
                            await simpleMedicoService.update(id, data);
                        } else {
                            // VOLTA AO MODELO SIMPLES - incluir hospitalId no objeto
                            const dataWithHospital = { ...data, hospitalId: hospitalSelecionado?.id };
                            await simpleMedicoService.create(dataWithHospital, hospitalSelecionado?.id || '');
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
                especialidades={especialidades}
                onSave={async (data, id) => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        if (id) {
                            await simpleProcedimentoService.update(id, data);
                        } else {
                            const dataWithHospital = { ...data, hospitalId: hospitalSelecionado?.id };
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
        title="Atenção"
        footer={
            <>
                <Button variant="secondary" onClick={() => setDeletingId(null)} disabled={loading}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                            const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir item';
                            console.error('Erro ao excluir:', err);
                            setError(errorMessage);
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {loading ? (
                        <>
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Excluindo...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                        </>
                    )}
                </Button>
            </>
        }
      >
        <div className="space-y-4">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Confirmar Exclusão
                    </h3>
                    <p className="text-gray-600">
                        Você tem certeza que deseja excluir este {
                            activeTab === 'medicos' ? 'médico' : 
                            activeTab === 'procedimentos' ? 'procedimento' : 
                            'agendamento'
                        }? Esta ação não pode ser desfeita.
                    </p>
                </div>
            </div>
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    <div className="flex">
                        <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
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
    // Headers responsivos para médicos
    const getHeaderClass = (index: number, header: string) => {
        const baseClass = "px-3 md:px-4 lg:px-6 py-2 md:py-3";
        
        // Para tabela de médicos - esconder telefone e email em telas pequenas
        if (headers.includes('Telefone') && header === 'Telefone') {
            return `${baseClass} hidden md:table-cell`;
        }
        if (headers.includes('Email') && header === 'Email') {
            return `${baseClass} hidden lg:table-cell`;
        }
        
        return baseClass;
    };

    return (
        <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                    {headers.map((h, index) => (
                        <th key={h} scope="col" className={getHeaderClass(index, h)}>
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? data.map(item => (
                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                        {renderRow(item)}
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={headers.length} className="text-center py-6 md:py-8 text-slate-500">
                            Nenhum dado encontrado.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};


export default ManagementView;
