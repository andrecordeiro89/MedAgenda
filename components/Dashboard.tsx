
import React from 'react';
import { Agendamento } from '../types';
import { Card } from './ui';

interface DashboardProps {
    agendamentos: Agendamento[];
    onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agendamentos }) => {
    const totalAgendamentos = agendamentos.length;
    const pendentes = agendamentos.filter(a => a.statusLiberacao === 'x').length;
    const liberados = agendamentos.filter(a => a.statusLiberacao === 'v').length;
    const cirurgicos = agendamentos.filter(a => a.tipo === 'cirurgico').length;
    const ambulatoriais = agendamentos.filter(a => a.tipo === 'ambulatorial').length;

    const StatCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
        <Card className={`border-l-4 ${color}`}>
            <h3 className="text-slate-500 text-lg font-medium">{title}</h3>
            <p className="text-4xl font-bold text-slate-800 mt-2">{value}</p>
        </Card>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total de Agendamentos" value={totalAgendamentos} color="border-primary" />
                <StatCard title="Agendamentos Liberados" value={liberados} color="border-success" />
                <StatCard title="Agendamentos Pendentes" value={pendentes} color="border-danger" />
                <StatCard title="Procedimentos Cirúrgicos" value={cirurgicos} color="border-yellow-500" />
                <StatCard title="Atendimentos Ambulatoriais" value={ambulatoriais} color="border-indigo-500" />
            </div>
            <div className="mt-8">
                <Card>
                    <h3 className="text-xl font-semibold mb-4">Próximos Agendamentos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Paciente</th>
                                    <th scope="col" className="px-6 py-3">Data e Hora</th>
                                    <th scope="col" className="px-6 py-3">Médico</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendamentos
                                    .filter(a => new Date(a.dataAgendamento) >= new Date())
                                    .sort((a, b) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime())
                                    .slice(0, 5)
                                    .map(a => (
                                        <tr key={a.id} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{a.nome}</td>
                                            <td className="px-6 py-4">{new Date(a.dataAgendamento).toLocaleDateString()} {a.horario}</td>
                                            <td className="px-6 py-4">{a.medicoId}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${a.statusLiberacao === 'v' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {a.statusLiberacao === 'v' ? 'Liberado' : 'Pendente'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
