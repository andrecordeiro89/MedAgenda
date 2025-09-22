
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
    const [year, month, day] = dateString.split('-');
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
            existing.dataAgendamento === newAppointment.dataAgendamento &&
            existing.horario === newAppointment.horario
    );
};

export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
};
