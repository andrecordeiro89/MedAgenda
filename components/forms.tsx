
import React, { useState, useEffect, useCallback } from 'react';
import { Agendamento, Medico, Procedimento } from '../types';
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
        horario: agendamento?.horario || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [idade, setIdade] = useState(agendamento ? calculateAge(agendamento.dataNascimento) : 0);

    useEffect(() => {
        if (formData.dataNascimento) {
            setIdade(calculateAge(formData.dataNascimento));
        }
    }, [formData.dataNascimento]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (formData.nome.length < 2) newErrors.nome = 'Nome deve ter pelo menos 2 caracteres.';
        if (!formData.dataNascimento) newErrors.dataNascimento = 'Data de nascimento é obrigatória.';
        if (new Date(formData.dataNascimento) > new Date()) newErrors.dataNascimento = 'Data de nascimento não pode ser futura.';
        if (!formData.procedimentoId) newErrors.procedimentoId = 'Procedimento é obrigatório.';
        if (!formData.medicoId) newErrors.medicoId = 'Médico é obrigatório.';
        if (!formData.dataAgendamento) newErrors.dataAgendamento = 'Data do agendamento é obrigatória.';
        if (new Date(formData.dataAgendamento) < new Date(getTodayDateString())) newErrors.dataAgendamento = 'Agendamento não pode ser no passado.';
        if (!formData.horario) newErrors.horario = 'Horário é obrigatório.';
        
        const appointmentData = {
            ...formData,
            tipo: procedimentos.find(p => p.id === formData.procedimentoId)?.tipo || 'ambulatorial',
            id: agendamento?.id || ''
        };
        
        if (hasScheduleConflict(appointmentData, allAgendamentos)) {
            newErrors.horario = 'Conflito de horário para este médico nesta data e hora.';
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
                <FormField label="Procedimento" error={errors.procedimentoId}>
                    <Select name="procedimentoId" value={formData.procedimentoId} onChange={handleChange} required>
                        <option value="">Selecione um procedimento</option>
                        {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </Select>
                </FormField>
                <FormField label="Data do Agendamento" error={errors.dataAgendamento}>
                    <Input type="date" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleChange} required />
                </FormField>
                <FormField label="Horário" error={errors.horario}>
                    <Select name="horario" value={formData.horario} onChange={handleChange} required>
                        <option value="">Selecione um horário</option>
                        {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(h => <option key={h} value={h}>{h}</option>)}
                    </Select>
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
    onSave: (medico: Omit<Medico, 'id'>, id?: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    error?: string | null;
}

export const DoctorForm: React.FC<DoctorFormProps> = ({ medico, onSave, onCancel, loading = false, error }) => {
    const [formData, setFormData] = useState({
        nome: medico?.nome || '',
        especialidade: medico?.especialidade || '',
        crm: medico?.crm || '',
        telefone: medico?.telefone || '',
        email: medico?.email || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData, medico?.id);
    };

     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome Completo">
                <Input name="nome" value={formData.nome} onChange={handleChange} required />
            </FormField>
            <FormField label="Especialidade">
                <Input name="especialidade" value={formData.especialidade} onChange={handleChange} required />
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
    onSave: (procedimento: Omit<Procedimento, 'id'>, id?: string) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    error?: string | null;
}

export const ProcedureForm: React.FC<ProcedureFormProps> = ({ procedimento, onSave, onCancel, loading = false, error }) => {
    const [formData, setFormData] = useState({
        nome: procedimento?.nome || '',
        tipo: procedimento?.tipo || 'ambulatorial',
        duracaoEstimada: procedimento?.duracaoEstimada || 30,
        descricao: procedimento?.descricao || '',
    });
     const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData, procedimento?.id);
    };
     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Nome do Procedimento">
                <Input name="nome" value={formData.nome} onChange={handleChange} required />
            </FormField>
            <FormField label="Tipo">
                <Select name="tipo" value={formData.tipo} onChange={handleChange}>
                    <option value="ambulatorial">Ambulatorial</option>
                    <option value="cirurgico">Cirúrgico</option>
                </Select>
            </FormField>
            <FormField label="Duração Estimada (minutos)">
                <Input name="duracaoEstimada" type="number" value={formData.duracaoEstimada} onChange={handleChange} required />
            </FormField>
            <FormField label="Descrição">
                <Input name="descricao" value={formData.descricao} onChange={handleChange} />
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
                    {loading ? 'Salvando...' : 'Salvar Procedimento'}
                </Button>
            </div>
        </form>
    );
};
