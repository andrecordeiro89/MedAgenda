
import React, { useState, useMemo, useEffect } from 'react';
import { Agendamento, Medico, Procedimento, Especialidade } from '../types';
import { Button, Modal, PlusIcon, EditIcon, TrashIcon, Badge, Input, Select } from './ui';
import { AppointmentForm, DoctorForm, ProcedureForm } from './forms';
import SigtapProceduresView from './SigtapProceduresView';
import { formatDate } from '../utils';
import { 
    simpleMedicoService,
    simpleProcedimentoService,
    simpleAgendamentoService
} from '../services/api-simple';
import { useAuth } from './PremiumLogin';
import externalDataService from '../services/external-supabase';
import { exportAllProceduresToExcel } from '../utils/excelExport';

type ManagementTab = 'agendamentos' | 'medicos' | 'procedimentos' | 'sigtap';

interface ManagementViewProps {
  agendamentos: Agendamento[];
  medicos: Medico[];
  procedimentos: Procedimento[];
  especialidades: Especialidade[];
  onRefresh: () => void;
}

// Tipo para registros mais usados vindos do Supabase externo
interface ExternalProcedureRecord {
  codigo_procedimento_original: string;
  procedure_description: string;
  complexity?: string;
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
  
  // Estados dos filtros para agendamentos
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'liberado' | 'pendente'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cirurgico' | 'ambulatorial'>('todos');
  const [filtroMedico, setFiltroMedico] = useState<string>('todos');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  
  // Procedimentos mais usados (externos)
  const [mostUsedProcedures, setMostUsedProcedures] = useState<ExternalProcedureRecord[]>([]);
  const [loadingMostUsed, setLoadingMostUsed] = useState(false);
  const [errorMostUsed, setErrorMostUsed] = useState<string | null>(null);
  const [rawMostUsedCount, setRawMostUsedCount] = useState<number>(0);
  // Paginação para procedimentos mais usados (únicos)
  const [mostUsedPage, setMostUsedPage] = useState<number>(1);
  const [mostUsedPageSize, setMostUsedPageSize] = useState<number>(50);
  const [mostUsedTotal, setMostUsedTotal] = useState<number>(0);
  
  // Filtros para procedimentos mais usados
  const [filterCodigo, setFilterCodigo] = useState<string>('');
  const [filterDescricao, setFilterDescricao] = useState<string>('');
  const [filterComplexidade, setFilterComplexidade] = useState<string>('');
  
  // Resetar página quando filtros mudarem (não precisa mais já que filtragem é local)
  // useEffect(() => {
  //   if (filterCodigo || filterDescricao || filterComplexidade) {
  //     setMostUsedPage(1);
  //   }
  // }, [filterCodigo, filterDescricao, filterComplexidade]);
  
  // Carregamento paginado de registros únicos de procedure_records
  useEffect(() => {
    const loadMostUsed = async () => {
      if (activeTab !== 'procedimentos') return;
      try {
        setLoadingMostUsed(true);
        setErrorMostUsed(null);
        const { data, totalCount, page } = await (externalDataService as any).getMostUsedProceduresUnique({
          page: mostUsedPage,
          pageSize: mostUsedPageSize,
          searchTerm: searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined,
        });
        setMostUsedProcedures((data || []) as ExternalProcedureRecord[]);
        setMostUsedTotal(totalCount || 0);
        setRawMostUsedCount(totalCount || 0);
        // Ajuste de segurança: se a página atual estiver além do total (após uma busca), voltar para 1
        const totalPages = Math.max(1, Math.ceil((totalCount || 0) / mostUsedPageSize));
        if (mostUsedPage > totalPages) {
          setMostUsedPage(1);
        }
      } catch (e: any) {
        console.error('Erro ao carregar procedimentos mais usados (paginado):', e);
        setErrorMostUsed(e?.message || 'Erro ao carregar procedimentos mais usados');
      } finally {
        setLoadingMostUsed(false);
      }
    };
  
    loadMostUsed();
  }, [activeTab, mostUsedPage, mostUsedPageSize, searchTerm]);
  
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
    agendamentos.filter(a => {
      // Filtro de busca textual
      const matchesSearch = searchTerm === '' || 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMedicoName(a.medicoId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMedicoEspecialidade(a.medicoId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProcedimentoName(a.procedimentoId).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'liberado' && a.statusLiberacao === 'v') ||
        (filtroStatus === 'pendente' && a.statusLiberacao === 'x');
      
      // Filtro de tipo (baseado no procedimento)
      const procedimento = procedimentos.find(p => p.id === a.procedimentoId);
      const tipoReal = procedimento?.tipo || a.tipo || 'ambulatorial';
      const matchesTipo = filtroTipo === 'todos' || tipoReal === filtroTipo;
      
      // Filtro de médico
      const matchesMedico = filtroMedico === 'todos' || a.medicoId === filtroMedico;
      
      // Filtro de especialidade
      const especialidadeMedico = getMedicoEspecialidade(a.medicoId);
      const matchesEspecialidade = filtroEspecialidade === 'todos' || especialidadeMedico === filtroEspecialidade;
      
      // Filtro de data
      const dataAgendamento = new Date(a.dataAgendamento);
      const matchesDataInicio = !filtroDataInicio || dataAgendamento >= new Date(filtroDataInicio);
      const matchesDataFim = !filtroDataFim || dataAgendamento <= new Date(filtroDataFim);
      
      return matchesSearch && matchesStatus && matchesTipo && matchesMedico && matchesEspecialidade && matchesDataInicio && matchesDataFim;
    }), [agendamentos, searchTerm, filtroStatus, filtroTipo, filtroMedico, filtroEspecialidade, filtroDataInicio, filtroDataFim, medicos, procedimentos]);
  
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
  
  // Estado para armazenar TODOS os procedimentos únicos (para exportação)
  const [allMostUsedProcedures, setAllMostUsedProcedures] = useState<ExternalProcedureRecord[]>([]);

  // Função para carregar TODOS os procedimentos únicos (sem paginação)
  const loadAllMostUsedProcedures = async () => {
    try {
      // Usar a função manual com um pageSize muito grande para pegar todos
      const { data } = await (externalDataService as any).getMostUsedProceduresUniqueManual({
        page: 1,
        pageSize: 10000, // Número grande para pegar todos os registros
        searchTerm: searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined,
      });
      setAllMostUsedProcedures((data || []) as ExternalProcedureRecord[]);
    } catch (e: any) {
      console.error('Erro ao carregar todos os procedimentos únicos:', e);
    }
  };

  // Filtro para TODOS os procedimentos únicos (para exportação)
  const allFilteredMostUsedProcedures = useMemo(() => {
    if (!allMostUsedProcedures) return [];
    
    return allMostUsedProcedures.filter(procedure => {
      // Filtro por código (sem pontos - busca por números sequenciais)
      const codigoMatch = filterCodigo === '' || 
        procedure.codigo_procedimento_original?.replace(/\./g, '').toLowerCase().includes(filterCodigo.replace(/\./g, '').toLowerCase());
      
      // Filtro por descrição
      const descricaoMatch = filterDescricao === '' || 
        procedure.procedure_description?.toLowerCase().includes(filterDescricao.toLowerCase());
      
      // Filtro por complexidade
      const complexidadeMatch = filterComplexidade === '' || 
        procedure.complexity?.toLowerCase().includes(filterComplexidade.toLowerCase());
      
      return codigoMatch && descricaoMatch && complexidadeMatch;
    });
  }, [allMostUsedProcedures, filterCodigo, filterDescricao, filterComplexidade]);
  const filteredMostUsedProcedures = useMemo(() => {
    if (!mostUsedProcedures) return [];
    
    return mostUsedProcedures.filter(procedure => {
      // Filtro por código (sem pontos - busca por números sequenciais)
      const codigoMatch = filterCodigo === '' || 
        procedure.codigo_procedimento_original?.replace(/\./g, '').toLowerCase().includes(filterCodigo.replace(/\./g, '').toLowerCase());
      
      // Filtro por descrição
      const descricaoMatch = filterDescricao === '' || 
        procedure.procedure_description?.toLowerCase().includes(filterDescricao.toLowerCase());
      
      // Filtro por complexidade
      const complexidadeMatch = filterComplexidade === '' || 
        procedure.complexity?.toLowerCase().includes(filterComplexidade.toLowerCase());
      
      return codigoMatch && descricaoMatch && complexidadeMatch;
    });
  }, [mostUsedProcedures, filterCodigo, filterDescricao, filterComplexidade]);

  // Função para exportar todos os procedimentos únicos para Excel
  const handleExportToExcel = async () => {
    try {
      // Carregar todos os dados se ainda não foram carregados
      if (allMostUsedProcedures.length === 0) {
        await loadAllMostUsedProcedures();
      }
      
      // Usar os dados filtrados completos para exportação
      const dataToExport = allFilteredMostUsedProcedures.length > 0 ? allFilteredMostUsedProcedures : allMostUsedProcedures;
      
      exportAllProceduresToExcel(
        allMostUsedProcedures || [],
        dataToExport
      );
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
    }
  };
  
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
  
  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroStatus('todos');
    setFiltroTipo('todos');
    setFiltroMedico('todos');
    setFiltroEspecialidade('todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Gerenciamento</h2>
        {(activeTab === 'agendamentos' || activeTab === 'medicos') && (
          <Button onClick={() => openModal()} data-new-appointment={activeTab === 'agendamentos' ? 'true' : undefined}>
            <PlusIcon className="w-5 h-5"/>
            Novo {activeTab === 'agendamentos' ? 'Agendamento' : 'Médico'}
          </Button>
        )}
      </div>
  
      <div className="border-b border-slate-200">
        <TabButton tab="agendamentos" label="Agendamentos" />
        <TabButton tab="medicos" label="Médicos" />
        <TabButton tab="procedimentos" label="Procedimentos (Mais usados)" />
        <TabButton tab="sigtap" label="Procedimentos SIGTAP" />
      </div>
  
      <div className="bg-white p-4 rounded-b-lg shadow-md">
        {/* Filtros para Agendamentos */}
        {activeTab === 'agendamentos' && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros de Agendamentos
              </h4>
              <button
                onClick={limparFiltros}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Limpar Filtros
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Primeira linha: Busca e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Busca Textual */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Buscar</label>
                  <Input 
                    type="text" 
                    placeholder="Nome, médico, procedimento..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                {/* Filtro Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <Select 
                    value={filtroStatus} 
                    onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'liberado' | 'pendente')}
                    className="text-sm"
                  >
                    <option value="todos">Todos os Status</option>
                    <option value="liberado">Liberado</option>
                    <option value="pendente">Pendente</option>
                  </Select>
                </div>
                
                {/* Filtro Tipo */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                  <Select 
                    value={filtroTipo} 
                    onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'cirurgico' | 'ambulatorial')}
                    className="text-sm"
                  >
                    <option value="todos">Todos os Tipos</option>
                    <option value="cirurgico">Cirúrgico</option>
                    <option value="ambulatorial">Ambulatorial</option>
                  </Select>
                </div>
              </div>
              
              {/* Segunda linha: Médico, Especialidade e Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro Médico */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Médico</label>
                  <Select 
                    value={filtroMedico} 
                    onChange={(e) => setFiltroMedico(e.target.value)}
                    className="text-sm"
                  >
                    <option value="todos">Todos os Médicos</option>
                    {medicos.map(medico => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nome}
                      </option>
                    ))}
                  </Select>
                </div>
                
                {/* Filtro Especialidade */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Especialidade</label>
                  <Select 
                    value={filtroEspecialidade} 
                    onChange={(e) => setFiltroEspecialidade(e.target.value)}
                    className="text-sm"
                  >
                    <option value="todos">Todas as Especialidades</option>
                    {[...new Set(medicos.map(m => m.especialidade))].sort().map(especialidade => (
                      <option key={especialidade} value={especialidade}>
                        {especialidade}
                      </option>
                    ))}
                  </Select>
                </div>
                
                {/* Filtro Data Início */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Data Início</label>
                  <Input 
                    type="date" 
                    value={filtroDataInicio} 
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                {/* Filtro Data Fim */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Data Fim</label>
                  <Input 
                    type="date" 
                    value={filtroDataFim} 
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Contador de resultados */}
            <div className="mt-4 text-xs text-slate-600">
              Mostrando {filteredAgendamentos.length} de {agendamentos.length} agendamentos
            </div>
          </div>
        )}
        
        {/* Filtros simples para outras abas */}
        {activeTab !== 'agendamentos' && activeTab !== 'sigtap' && (
          <div className="mb-4">
            <Input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
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
              <>
                <div className="mb-2 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    {loadingMostUsed ? (
                      <span>Carregando procedimentos mais usados...</span>
                    ) : (
                      <span>
                        Exibindo {filteredMostUsedProcedures.length} itens | Página {mostUsedPage} de {Math.max(1, Math.ceil((mostUsedTotal || 0) / mostUsedPageSize))} | Total únicos: {mostUsedTotal}
                      </span>
                    )}
                    {errorMostUsed && (
                      <span className="ml-2 text-red-600">Erro: {errorMostUsed}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                      onClick={() => setMostUsedPage(p => Math.max(1, p - 1))}
                      disabled={mostUsedPage <= 1 || loadingMostUsed}
                      aria-label="Página anterior"
                    >
                      « Anterior
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                      onClick={() => setMostUsedPage(p => p + 1)}
                      disabled={loadingMostUsed || (mostUsedPage >= Math.max(1, Math.ceil((mostUsedTotal || 0) / mostUsedPageSize)))}
                      aria-label="Próxima página"
                    >
                      Próxima »
                    </button>
                  </div>
                </div>
                
                {/* Estado de Loading */}
                {loadingMostUsed && (
                  <div className="p-8 text-center border rounded-lg bg-white">
                    <div className="text-blue-500 mb-4">
                      <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{animationDirection: 'reverse'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-slate-600">Carregando procedimentos mais usados...</p>
                  </div>
                )}

                {/* Campos de Filtro */}
                {!loadingMostUsed && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Código (sem pontos)
                        </label>
                        <Input
                          type="text"
                          placeholder="Ex: 0101010012"
                          value={filterCodigo}
                          onChange={(e) => setFilterCodigo(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Descrição
                        </label>
                        <Input
                          type="text"
                          placeholder="Buscar por descrição..."
                          value={filterDescricao}
                          onChange={(e) => setFilterDescricao(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Complexidade
                        </label>
                        <Select
                          value={filterComplexidade}
                          onChange={(e) => setFilterComplexidade(e.target.value)}
                          className="w-full text-sm"
                        >
                          <option value="">Todas</option>
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </Select>
                      </div>
                    </div>
                    {(filterCodigo || filterDescricao || filterComplexidade) && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          {filteredMostUsedProcedures.length} resultado(s) encontrado(s)
                        </span>
                        <button
                          onClick={() => {
                            setFilterCodigo('');
                            setFilterDescricao('');
                            setFilterComplexidade('');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de exportação */}
                {!loadingMostUsed && filteredMostUsedProcedures.length > 0 && (
                  <div className="mb-4">
                    <Button
                      onClick={handleExportToExcel}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar para Excel ({allFilteredMostUsedProcedures.length > 0 ? allFilteredMostUsedProcedures.length : mostUsedTotal} registros)
                    </Button>
                  </div>
                )}

                {/* Tabela de dados */}
                {!loadingMostUsed && (
                  <DataTable
                    headers={['Código', 'Descrição', 'Complexidade']}
                    data={filteredMostUsedProcedures as any}
                    getKey={(item: ExternalProcedureRecord) => item.codigo_procedimento_original || item.procedure_description}
                    renderRow={(item: ExternalProcedureRecord) => (
                        <>
                            <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 font-medium text-slate-900">{item.codigo_procedimento_original}</td>
                            <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{item.procedure_description}</td>
                            <td className="px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4">{item.complexity || '-'}</td>
                        </>
                    )}
                  />
                )}
              </>
          )}

          {activeTab === 'sigtap' && (
            <SigtapProceduresView />
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
        {activeTab === 'procedimentos' && null}
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
                                // Aba procedimentos agora é somente leitura (procedimentos mais usados)
                                // Nenhuma exclusão é permitida aqui.
                                throw new Error('Exclusão não permitida nesta aba.');
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
                            activeTab === 'procedimentos' ? 'procedimento (não permitido)' : 
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
    getKey?: (item: T) => string | number;
}

const DataTable = <T extends any>({ headers, data, renderRow, getKey }: DataTableProps<T>) => {
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
                {data.length > 0 ? data.map((item, idx) => (
                    <tr key={(getKey ? getKey(item) : (item as any).id) ?? idx} className="bg-white border-b hover:bg-slate-50">
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
