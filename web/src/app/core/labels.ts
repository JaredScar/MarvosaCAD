import { Option } from './models';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const STATUS_LABELS: Record<string, string> = {
  '911': '911',
  traffic: 'Traffic',
  medical: 'Medical',
  fire: 'Fire',
  disturbance: 'Disturbance',
  theft: 'Theft',
  pursuit: 'Pursuit',
  other: 'Other',
  pending: 'Pending',
  dispatched: 'Dispatched',
  enroute: 'En route',
  onscene: 'On scene',
  closed: 'Closed',
  available: 'Available',
  busy: 'Busy',
  offduty: 'Off duty',
  panic: 'Panic',
  valid: 'Valid',
  suspended: 'Suspended',
  revoked: 'Revoked',
  expired: 'Expired',
  none: 'None',
  leo: 'Law enforcement',
  ems: 'EMS',
  person: 'Person',
  vehicle: 'Vehicle',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  armed: 'Armed',
  admin: 'Administrator',
  dispatcher: 'Dispatcher',
  officer: 'Officer',
};

export const DEPARTMENT_NAMES: Record<string, string> = {
  LSPD: 'Los Santos Police',
  BCSO: 'Blaine County Sheriff',
  SAHP: 'San Andreas Highway Patrol',
  LSFD: 'Los Santos Fire',
  EMS: 'Emergency Medical Services',
};

export const CALL_TYPES: Option[] = [
  { label: '911', value: '911' },
  { label: 'Traffic', value: 'traffic' },
  { label: 'Medical', value: 'medical' },
  { label: 'Fire', value: 'fire' },
  { label: 'Disturbance', value: 'disturbance' },
  { label: 'Theft', value: 'theft' },
  { label: 'Pursuit', value: 'pursuit' },
  { label: 'Other', value: 'other' },
];

export const CALL_STATUSES: Option[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'En route', value: 'enroute' },
  { label: 'On scene', value: 'onscene' },
  { label: 'Closed', value: 'closed' },
];

export const UNIT_STATUSES: Option[] = [
  { label: 'Available', value: 'available' },
  { label: 'Busy', value: 'busy' },
  { label: 'En route', value: 'enroute' },
  { label: 'On scene', value: 'onscene' },
  { label: 'Off duty', value: 'offduty' },
  { label: 'Panic', value: 'panic' },
];

export const UNIT_TYPES: Option[] = [
  { label: 'Law enforcement', value: 'leo' },
  { label: 'EMS', value: 'ems' },
  { label: 'Fire', value: 'fire' },
];

export const DEPARTMENTS: Option[] = [
  { label: 'LSPD', value: 'LSPD' },
  { label: 'BCSO', value: 'BCSO' },
  { label: 'SAHP', value: 'SAHP' },
  { label: 'LSFD', value: 'LSFD' },
  { label: 'EMS', value: 'EMS' },
];

export const PRIORITIES: Option[] = [
  { label: 'Priority 1', value: '1' },
  { label: 'Priority 2', value: '2' },
  { label: 'Priority 3', value: '3' },
];

export const LICENSES: Option[] = [
  { label: 'Valid', value: 'valid' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Revoked', value: 'revoked' },
  { label: 'None', value: 'none' },
];

export const RECORD_STATES: Option[] = [
  { label: 'Valid', value: 'valid' },
  { label: 'Expired', value: 'expired' },
  { label: 'None', value: 'none' },
];

export const BOLO_KINDS: Option[] = [
  { label: 'Person', value: 'person' },
  { label: 'Vehicle', value: 'vehicle' },
];

export const BOLO_RISKS: Option[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Armed', value: 'armed' },
];

export function labelFor(value: string | null | undefined) {
  if (!value) return '—';
  return STATUS_LABELS[value] ?? value;
}

export function callSeverity(status: string): TagSeverity {
  if (status === 'pending' || status === 'panic') return 'danger';
  if (status === 'dispatched' || status === 'busy') return 'warn';
  if (status === 'enroute') return 'info';
  if (status === 'onscene' || status === 'available') return 'success';
  return 'secondary';
}

export function prioritySeverity(priority: number): TagSeverity {
  if (priority === 1) return 'danger';
  if (priority === 2) return 'warn';
  return 'info';
}

export function riskSeverity(risk: string): TagSeverity {
  if (risk === 'armed') return 'danger';
  if (risk === 'high') return 'warn';
  if (risk === 'medium') return 'info';
  return 'secondary';
}

export function splitFlags(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
