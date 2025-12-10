
import { Agendamento } from './types';

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  return age;
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const s = String(dateString).trim();
    if (s.includes('/')) return s;
    // Normalizar: manter apenas a parte YYYY-MM-DD
    const iso = s.includes('T') ? s.split('T')[0] : (s.includes(' ') ? s.split(' ')[0] : s);
    const parts = iso.split('-');
    if (parts.length !== 3) return s;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateString: string, timeString: string): string => {
    return `${formatDate(dateString)} às ${timeString}`;
};

export const hasScheduleConflict = (
    newAppointment: Omit<Agendamento, 'id' | 'idade'>,
    allAppointments: Agendamento[]
): boolean => {
    return allAppointments.some(
        (existing) =>
            existing.id !== (newAppointment as Agendamento).id &&
            existing.medicoId === newAppointment.medicoId &&
            existing.dataAgendamento === newAppointment.dataAgendamento
    );
};

export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};

// Função para formatar data localmente sem problemas de timezone
// Evita problemas quando new Date() cria datas locais e toISOString() converte para UTC
export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Função para comparar datas ignorando timezone
export const compareDates = (date1: string, date2: string): boolean => {
    // Normalizar ambas as datas removendo qualquer informação de hora
    const normalize = (dateStr: string) => {
        // Se já está no formato YYYY-MM-DD, retornar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        // Se tem hora, pegar apenas a parte da data
        if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
        }
        // Se tem espaço (formato alternativo)
        if (dateStr.includes(' ')) {
            return dateStr.split(' ')[0];
        }
        return dateStr;
    };
    
    return normalize(date1) === normalize(date2);
};
