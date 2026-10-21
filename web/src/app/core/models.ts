export interface Profile {
  id: string;
  username: string;
  name: string;
  role: string;
  callsign: string | null;
}

export interface StaffUser {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  callsign: string | null;
  createdAt: string;
}

export interface Unit {
  id: string;
  callsign: string;
  officerName: string;
  department: string;
  type: string;
  status: string;
  location: string | null;
  updatedAt: string;
}

export interface CallNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  unitId: string;
  unit: Unit;
}

export interface Call {
  id: string;
  number: number;
  type: string;
  priority: number;
  title: string;
  description: string;
  location: string;
  postal: string | null;
  caller: string | null;
  status: string;
  source: string;
  posX: number | null;
  posY: number | null;
  posZ: number | null;
  createdBy: string | null;
  createdAt: string;
  closedAt: string | null;
  assignments: Assignment[];
  notes: CallNote[];
}

export interface Bolo {
  id: string;
  kind: string;
  title: string;
  description: string;
  subject: string | null;
  plate: string | null;
  risk: string;
  active: boolean;
  createdAt: string;
}

export interface Warrant {
  id: string;
  personId: string;
  charge: string;
  issuedBy: string;
  active: boolean;
  notes: string | null;
  issuedAt: string;
  person?: { id: string; firstName: string; lastName: string };
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  ownerId: string | null;
  insurance: string;
  registration: string;
  flags: string | null;
  notes: string | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  license: string;
  flags: string | null;
  notes: string | null;
  warrants?: Warrant[];
  vehicles?: { id: string; plate: string; model: string }[];
}

export interface PanicAlert {
  id: string;
  callsign: string;
  officerName: string;
  location: string | null;
  message: string;
  active: boolean;
  createdAt: string;
}

export interface LiveEvent<T> {
  action: 'upsert' | 'delete';
  reason?: 'create' | 'update' | 'panic' | 'clear';
  actorId?: string | null;
  data: T;
}

export interface Option {
  label: string;
  value: string;
}
