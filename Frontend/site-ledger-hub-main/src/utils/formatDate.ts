import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'dd MMM yyyy') : '—';
};

export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'dd/MM/yy') : '—';
};
