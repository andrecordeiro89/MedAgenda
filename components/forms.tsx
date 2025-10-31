
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Agendamento, Medico, Procedimento, Especialidade, TipoAgendamento } from '../types';
import { Button, FormField, Input, Select } from './ui';
import { calculateAge, hasScheduleConflict, getTodayDateString } from '../utils';

// --- Appointment Form ---
interface AppointmentFormProps {
    agendamento?: Agendamento;
    medicos: Medico[];
    procedimentos: Procedimento[];
    allAgendamentos: Agendamento[];
    onSave: (agendamento: Omit<Agendamento, 'id' | 'idade'>, id?: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    error?: string | null;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ agendamento, medicos, procedimentos, allAgendamentos, onSave, onCancel, loading = false, error }) => {
    const [formData, setFormData] = useState({
        nome: agendamento?.nome || '',
        dataNascimento: agendamento?.dataNascimento || '',
        procedimentoId: agendamento?.procedimentoId || '',
        medicoId: agendamento?.medicoId || '',
        cidadeNatal: agendamento?.cidadeNatal || '',
        statusLiberacao: agendamento?.statusLiberacao || 'x',
        telefone: agendamento?.telefone || '',
        whatsapp: agendamento?.whatsapp || '',
        dataAgendamento: agendamento?.dataAgendamento || '',
    });
    const [selectedTipoProcedimento, setSelectedTipoProcedimento] = useState<TipoAgendamento | ''>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [idade, setIdade] = useState(agendamento ? calculateAge(agendamento.dataNascimento) : 0);

    useEffect(() => {
        if (formData.dataNascimento) {
            setIdade(calculateAge(formData.dataNascimento));
        }
    }, [formData.dataNascimento]);

    // Inicializar tipo de procedimento quando editando agendamento existente
    useEffect(() => {
        if (agendamento && agendamento.procedimentoId) {
            const procedimento = procedimentos.find(p => p.id === agendamento.procedimentoId);
            if (procedimento) {
                setSelectedTipoProcedimento(procedimento.tipo);
            }
        }
    }, [agendamento, procedimentos]);

    // Filtrar procedimentos baseado no tipo selecionado
    const procedimentosFiltrados = useMemo(() => {
        if (!selectedTipoProcedimento) return procedimentos;
        return procedimentos.filter(p => p.tipo === selectedTipoProcedimento);
    }, [procedimentos, selectedTipoProcedimento]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (formData.nome.length < 2) newErrors.nome = 'Nome deve ter pelo menos 2 caracteres.';
        if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória.';
        if (new Date(formData.dataNascimento) > new Date()) newErrors.dataNascimento = 'Data de nascimento não pode ser futura.';
        if (!formData.procedimentoId) newErrors.procedimentoId = 'Procedimento é obrigatório.';
        if (!formData.medicoId) newErrors.medicoId = 'Médico é obrigatório.';
        if (!formData.dataAgendamento) newErrors.dataAgendamento = 'Data do agendamento é obrigatória.';
        if (new Date(formData.dataAgendamento) < new Date(getTodayDateString())) newErrors.dataAgendamento = 'Agendamento não pode ser no passado.';
        
        const appointmentData = {
            ...formData,
            tipo: procedimentos.find(p => p.id === formData.procedimentoId)?.tipo || 'ambulatorial',
            id: agendamento?.id || ''
        };
        
        if (hasScheduleConflict(appointmentData, allAgendamentos)) {
            newErrors.dataAgendamento = 'Conflito de data para este médico nesta data.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, allAgendamentos, agendamento?.id, procedimentos]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const tipo = procedimentos.find(p => p.id === formData.procedimentoId)?.tipo || 'ambulatorial';
            await onSave({ ...formData, tipo }, agendamento?.id);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTipoProcedimentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const novoTipo = e.target.value as TipoAgendamento | '';
        setSelectedTipoProcedimento(novoTipo);
        // Resetar procedimento selecionado quando tipo mudar
        setFormData(prev => ({ ...prev, procedimentoId: '' }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nome Completo" error={errors.nome}>
                    <Input name="nome" value={formData.nome} onChange={handleChange} required />
                </FormField>
                <FormField label="Data de Nascimento" error={errors.dataNascimento}>
                    <Input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required />
                </FormField>
                <FormField label="Idade">
                    <Input value={`${idade} anos`} disabled />
                </FormField>
                <FormField label="Cidade Natal" error={errors.cidadeNatal}>
                    <Input name="cidadeNatal" value={formData.cidadeNatal} onChange={handleChange} />
                </FormField>
                <FormField label="Telefone" error={errors.telefone}>
                    <Input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} />
                </FormField>
                <FormField label="WhatsApp" error={errors.whatsapp}>
                    <Input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                </FormField>
                <FormField label="Médico" error={errors.medicoId}>
                    <Select name="medicoId" value={formData.medicoId} onChange={handleChange} required>
                        <option value="">Selecione um médico</option>
                        {medicos.map(m => <option key={m.id} value={m.id}>{m.nome} - {m.especialidade}</option>)}
                    </Select>
                </FormField>
                <FormField label="Tipo de Procedimento">
                    <Select name="tipoProcedimento" value={selectedTipoProcedimento} onChange={handleTipoProcedimentoChange}>
                        <option value="">Todos os tipos</option>
                        <option value="ambulatorial">Ambulatorial</option>
                        <option value="cirurgico">Cirúrgico</option>
                    </Select>
                </FormField>
                <FormField label="Procedimento" error={errors.procedimentoId}>
                    <Select name="procedimentoId" value={formData.procedimentoId} onChange={handleChange} required>
                        <option value="">
                            {selectedTipoProcedimento 
                                ? `Selecione um procedimento ${selectedTipoProcedimento}` 
                                : "Selecione um procedimento"
                            }
                        </option>
                        {procedimentosFiltrados.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nome} ({p.tipo})
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="Data do Agendamento" error={errors.dataAgendamento}>
                    <Input type="date" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleChange} required />
                </FormField>
                 <FormField label="Status">
                    <Select name="statusLiberacao" value={formData.statusLiberacao} onChange={handleChange}>
                        <option value="x">Pendente</option>
                        <option value="v">Liberado</option>
                    </Select>
                </FormField>
            </div>
             <div className="flex justify-end gap-3 pt-4">
                {error && (
                    <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-3">
                        {error}
                    </div>
                )}
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Agendamento'}
                </Button>
            </div>
        </form>
    );
};

// --- Doctor Form ---
interface DoctorFormProps {
    medico?: Medico;
    especialidades: Especialidade[];
    onSave: (medico: Omit<Medico, 'id'>, id?: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    error?: string | null;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({ medico, especialidades, onSave, onCancel, loading = false, error }) => {
    const [formData, setFormData] = useState({
        nome: medico?.nome || '',
        especialidade: medico?.especialidade || '',
        crm: medico?.crm || '',
        telefone: medico?.telefone || '',
        email: medico?.email || '',
    });

    // Debug: verificar se especialidades estão chegando
    console.log('🏥 DoctorForm - Especialidades recebidas:', especialidades?.length || 0, especialidades);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData, medico?.id);
    };

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome Completo">
                <Input name="nome" value={formData.nome} onChange={handleChange} required />
            </FormField>
            <FormField label="Especialidade">
                <Select name="especialidade" value={formData.especialidade} onChange={handleChange} required>
                    <option value="">
                        {especialidades?.length > 0 ? 'Selecione uma especialidade' : 'Carregando especialidades...'}
                    </option>
                    {especialidades?.map(esp => (
                        <option key={esp.id} value={esp.nome}>
                            {esp.nome}
                        </option>
                    )) || []}
                </Select>
                {especialidades?.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                        ⚠️ Nenhuma especialidade encontrada. Execute o script SQL primeiro.
                    </p>
                )}
            </FormField>
             <FormField label="CRM">
                <Input name="crm" value={formData.crm} onChange={handleChange} required />
            </FormField>
             <FormField label="Telefone">
                <Input name="telefone" type="tel" value={formData.telefone} onChange={handleChange} required />
            </FormField>
             <FormField label="Email">
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </FormField>
            <div className="flex justify-end gap-3 pt-4">
                {error && (
                    <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-3">
                        {error}
                    </div>
                )}
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Médico'}
                </Button>
            </div>
        </form>
    );
};


// --- Procedure Form ---
interface ProcedureFormProps {
    procedimento?: Procedimento;
    especialidades: Especialidade[];
    onSave: (procedimento: Omit<Procedimento, 'id'>, id?: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    error?: string | null;
}

export const ProcedureForm: React.FC<ProcedureFormProps> = ({ procedimento, especialidades, onSave, onCancel, loading = false, error }) => {
    const [formData, setFormData] = useState({
        nome: procedimento?.nome || '',
        tipo: procedimento?.tipo || 'ambulatorial',
        duracaoEstimada: procedimento?.duracaoEstimada || 30,
        descricao: procedimento?.descricao || '',
        especialidade: procedimento?.especialidade || 
            (procedimento?.especialidadeId ? 
                especialidades.find(e => e.id === procedimento.especialidadeId)?.nome || '' : '')
    });
     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Converter nome da especialidade para ID (se preenchido)
        const especialidadeId = formData.especialidade ? 
            especialidades.find(e => e.nome === formData.especialidade)?.id : 
            undefined;
        
        const dataToSave = {
            nome: formData.nome,
            tipo: formData.tipo,
            duracaoEstimada: formData.duracaoEstimada,
            descricao: formData.descricao,
            especialidade: formData.especialidade || '', // Salvar nome na coluna física
            especialidadeId: especialidadeId // Salvar ID para relacionamento
        };
        
        await onSave(dataToSave, procedimento?.id);
    };
     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome do Procedimento">
                <Input name="nome" value={formData.nome} onChange={handleChange} required placeholder="Ex: Consulta Ambulatorial" />
            </FormField>
            
            {/* Campos opcionais - podem ser editados depois */}
            <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-3">
                    💡 <strong>Campos opcionais:</strong> Você pode preencher agora ou editar depois
                </p>
                
                <FormField label="Tipo (Opcional)">
                    <Select name="tipo" value={formData.tipo} onChange={handleChange}>
                        <option value="ambulatorial">Ambulatorial</option>
                        <option value="cirurgico">Cirúrgico</option>
                    </Select>
                </FormField>
                
                <FormField label="Especialidade (Opcional)">
                    <Select name="especialidade" value={formData.especialidade} onChange={handleChange}>
                        <option value="">Nenhuma</option>
                        {especialidades.map(esp => (
                            <option key={esp.id} value={esp.nome}>
                                {esp.nome}
                            </option>
                        ))}
                    </Select>
                </FormField>
                
                <FormField label="Duração Estimada (Opcional)">
                    <div className="flex items-center gap-2">
                        <Input 
                            name="duracaoEstimada" 
                            type="number" 
                            value={formData.duracaoEstimada} 
                            onChange={handleChange} 
                            className="w-32"
                        />
                        <span className="text-sm text-gray-500">minutos</span>
                    </div>
                </FormField>
                
                <FormField label="Descrição (Opcional)">
                    <Input name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Informações adicionais..." />
                </FormField>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
                {error && (
                    <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-3">
                        {error}
                    </div>
                )}
                <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Procedimento'}
                </Button>
            </div>
        </form>
    );
};
