import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000);
}

async function main() {
  await prisma.assignment.deleteMany();
  await prisma.callNote.deleteMany();
  await prisma.call.deleteMany();
  await prisma.panicAlert.deleteMany();
  await prisma.bolo.deleteMany();
  await prisma.warrant.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.person.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('marvosa', 10);
  await prisma.user.create({ data: { username: 'admin', password, name: 'Morgan Hale', role: 'admin' } });
  await prisma.user.create({ data: { username: 'dispatch', password, name: 'Alex Rivera', role: 'dispatcher' } });
  const officer = await prisma.user.create({
    data: { username: '1A-12', password, name: 'Jordan Blake', role: 'officer' },
  });

  await prisma.unit.createMany({
    data: [
      { callsign: '1A-12', officerName: 'Jordan Blake', department: 'LSPD', type: 'leo', status: 'available', location: 'Mission Row', userId: officer.id },
      { callsign: '1A-20', officerName: 'Riley Chen', department: 'LSPD', type: 'leo', status: 'enroute', location: 'Great Ocean Hwy' },
      { callsign: '2A-07', officerName: 'Samir Qureshi', department: 'LSPD', type: 'leo', status: 'onscene', location: 'Strawberry Ave' },
      { callsign: 'AIR-1', officerName: 'Morgan Diaz', department: 'LSPD', type: 'leo', status: 'onscene', location: 'Over Strawberry' },
      { callsign: '3B-15', officerName: 'Casey Nguyen', department: 'BCSO', type: 'leo', status: 'available', location: 'Sandy Shores' },
      { callsign: '3B-02', officerName: 'Avery Cole', department: 'BCSO', type: 'leo', status: 'panic', location: 'Senora Fwy, Harmony' },
      { callsign: '4S-11', officerName: 'Parker Singh', department: 'SAHP', type: 'leo', status: 'busy', location: 'Senora Fwy' },
      { callsign: 'M-12', officerName: 'Quinn Harper', department: 'EMS', type: 'ems', status: 'enroute', location: 'Elgin Ave' },
      { callsign: 'M-04', officerName: 'Logan Price', department: 'EMS', type: 'ems', status: 'available', location: 'Pillbox Hill' },
      { callsign: 'E-7', officerName: 'Taylor Brooks', department: 'LSFD', type: 'fire', status: 'onscene', location: 'Davis Ave' },
      { callsign: 'E-1', officerName: 'Reese Patel', department: 'LSFD', type: 'fire', status: 'available', location: 'Rockford Hills' },
    ],
  });

  const units = await prisma.unit.findMany();
  const unitId = (callsign: string) => {
    const unit = units.find((item) => item.callsign === callsign);
    if (!unit) throw new Error(`Missing seeded unit ${callsign}`);
    return unit.id;
  };

  await prisma.panicAlert.create({
    data: {
      callsign: '3B-02',
      unitId: unitId('3B-02'),
      officerName: 'Avery Cole',
      location: 'Senora Fwy, Harmony',
      message: 'Shots fired. Officer needs immediate assistance.',
      active: true,
      createdAt: minutesAgo(3),
    },
  });

  const people = {
    marcus: await prisma.person.create({
      data: {
        firstName: 'Marcus',
        lastName: 'Hale',
        dob: '1988-04-12',
        gender: 'male',
        phone: '555-0142',
        address: '14 Forum Dr, Strawberry',
        license: 'suspended',
        flags: 'Armed, Known associate',
        notes: 'Use caution. Prior armed robbery conviction.',
      },
    }),
    elena: await prisma.person.create({
      data: {
        firstName: 'Elena',
        lastName: 'Voss',
        dob: '1995-11-02',
        gender: 'female',
        phone: '555-0177',
        address: '220 Boulevard Del Perro',
        license: 'valid',
      },
    }),
    diego: await prisma.person.create({
      data: {
        firstName: 'Diego',
        lastName: 'Navarro',
        dob: '1991-07-19',
        gender: 'male',
        phone: '555-0190',
        address: '88 Innocence Blvd',
        license: 'revoked',
        flags: 'Felony evading, Flight risk',
      },
    }),
    priya: await prisma.person.create({
      data: {
        firstName: 'Priya',
        lastName: 'Shah',
        dob: '2000-01-30',
        gender: 'female',
        phone: '555-0118',
        address: '5 Power St, Pillbox Hill',
        license: 'valid',
      },
    }),
    owen: await prisma.person.create({
      data: {
        firstName: 'Owen',
        lastName: 'Briggs',
        dob: '1979-09-08',
        gender: 'male',
        phone: '555-0164',
        address: '410 Route 68, Harmony',
        license: 'valid',
        flags: 'Medical: cardiac history',
      },
    }),
    hannah: await prisma.person.create({
      data: {
        firstName: 'Hannah',
        lastName: 'Cho',
        dob: '1998-03-22',
        gender: 'female',
        phone: '555-0133',
        address: '19 Vespucci Blvd',
        license: 'suspended',
        flags: 'Failure to appear',
      },
    }),
    luis: await prisma.person.create({
      data: {
        firstName: 'Luis',
        lastName: 'Ortega',
        dob: '1985-12-14',
        gender: 'male',
        address: '77 Popular St, La Puerta',
        license: 'none',
        flags: 'No insurance',
      },
    }),
    naomi: await prisma.person.create({
      data: {
        firstName: 'Naomi',
        lastName: 'Reed',
        dob: '1993-06-06',
        gender: 'female',
        phone: '555-0188',
        address: '3 Eclipse Blvd, West Vinewood',
        license: 'valid',
      },
    }),
  };

  await prisma.vehicle.createMany({
    data: [
      { plate: '84KPL221', model: 'Ubermacht Oracle', color: 'Black', ownerId: people.diego.id, insurance: 'expired', registration: 'expired', flags: 'Stolen, Felony evading' },
      { plate: '46MVS018', model: 'Karin Sultan', color: 'Red', ownerId: people.marcus.id, insurance: 'valid', registration: 'valid', flags: 'Armed occupant reported' },
      { plate: '19ELN442', model: 'Gallivanter Baller', color: 'White', ownerId: people.elena.id, insurance: 'valid', registration: 'valid' },
      { plate: '73PRI905', model: 'Obey Tailgater', color: 'Silver', ownerId: people.priya.id, insurance: 'valid', registration: 'valid' },
      { plate: '02OWN331', model: 'Bravado Bison', color: 'Green', ownerId: people.owen.id, insurance: 'valid', registration: 'valid' },
      { plate: '55HAN010', model: 'Dinka Blista', color: 'Yellow', ownerId: people.hannah.id, insurance: 'expired', registration: 'valid', flags: 'Driver license suspended' },
      { plate: '12LUI664', model: 'Karin Rebel', color: 'Brown', ownerId: people.luis.id, insurance: 'none', registration: 'expired', flags: 'No insurance' },
      { plate: '90NAO777', model: 'Lampadati Komoda', color: 'Blue', ownerId: people.naomi.id, insurance: 'valid', registration: 'valid' },
    ],
  });

  await prisma.warrant.createMany({
    data: [
      { personId: people.marcus.id, charge: 'Armed robbery', issuedBy: 'LSPD', active: true, issuedAt: minutesAgo(60 * 24 * 12), notes: '24/7 Strawberry, firearm displayed.' },
      { personId: people.marcus.id, charge: 'Parole violation', issuedBy: 'Department of Corrections', active: true, issuedAt: minutesAgo(60 * 24 * 4) },
      { personId: people.diego.id, charge: 'Grand theft auto', issuedBy: 'LSPD', active: true, issuedAt: minutesAgo(60 * 26), notes: 'Black Oracle, plate 84KPL221.' },
      { personId: people.hannah.id, charge: 'Failure to appear', issuedBy: 'San Andreas Courts', active: true, issuedAt: minutesAgo(60 * 24 * 30) },
    ],
  });

  await prisma.bolo.createMany({
    data: [
      {
        kind: 'vehicle',
        title: 'Stolen Oracle, felony evading',
        description: 'Black Ubermacht Oracle last seen northbound on Great Ocean Highway. Driver is Diego Navarro. Do not pit unless lethal cover is in place.',
        plate: '84KPL221',
        subject: 'Diego Navarro',
        risk: 'armed',
        active: true,
        createdAt: minutesAgo(20),
      },
      {
        kind: 'person',
        title: 'Marcus Hale, armed and dangerous',
        description: 'Male, 38, short black hair, grey hoodie. Wanted for armed robbery. Considered armed.',
        subject: 'Marcus Hale',
        risk: 'armed',
        active: true,
        createdAt: minutesAgo(90),
      },
      {
        kind: 'person',
        title: 'Series robbery suspect',
        description: 'Unknown male, red hoodie, black mask, fled a Little Seoul convenience store on foot toward the canal.',
        subject: 'Unknown male, red hoodie',
        risk: 'high',
        active: true,
        createdAt: minutesAgo(45),
      },
    ],
  });

  await prisma.call.create({
    data: {
      number: 1042,
      type: 'pursuit',
      priority: 1,
      title: 'Vehicle pursuit northbound',
      description: 'Black Oracle refusing to yield. Speeds over 90. Occupant may be armed. Plate matches an active stolen vehicle BOLO.',
      location: 'Great Ocean Hwy, Chumash',
      postal: '511',
      caller: '911 / SAHP',
      status: 'enroute',
      source: 'console',
      posX: -3196,
      posY: 1284,
      posZ: 12,
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(18),
      assignments: { create: [{ unitId: unitId('1A-20') }] },
      notes: {
        create: [
          { author: 'Alex Rivera', body: 'Air unit copied. Spike duty requested at the Lago Zancudo bridge.', createdAt: minutesAgo(16) },
          { author: '1A-20', body: 'Visual on the black Oracle. Plate 84KPL221. Still northbound.', createdAt: minutesAgo(11) },
        ],
      },
    },
  });

  await prisma.call.create({
    data: {
      number: 1043,
      type: 'theft',
      priority: 1,
      title: 'Armed robbery, 24/7',
      description: 'Clerk reports a handgun displayed. Suspect fled on foot toward Forum Drive. Second suspect may still be inside a red Sultan.',
      location: '24/7, Strawberry Ave',
      postal: '328',
      caller: 'Store clerk',
      status: 'onscene',
      source: 'console',
      posX: 28,
      posY: -1348,
      posZ: 29,
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(27),
      assignments: { create: [{ unitId: unitId('2A-07') }, { unitId: unitId('AIR-1') }] },
      notes: {
        create: [
          { author: '2A-07', body: 'On scene. Store is clear. One casing by the counter.', createdAt: minutesAgo(20) },
          { author: 'AIR-1', body: 'Orbiting. No visual on the red Sultan yet.', createdAt: minutesAgo(14) },
        ],
      },
    },
  });

  await prisma.call.create({
    data: {
      number: 1044,
      type: 'medical',
      priority: 1,
      title: 'Cardiac arrest',
      description: 'Adult male collapsed outside Pillbox. Bystander is doing compressions. Not breathing.',
      location: 'Elgin Ave, Pillbox Hill',
      postal: '206',
      caller: 'Bystander',
      status: 'enroute',
      source: 'fivem',
      posX: 298,
      posY: -584,
      posZ: 43,
      createdBy: 'FiveM',
      createdAt: minutesAgo(8),
      assignments: { create: [{ unitId: unitId('M-12') }] },
      notes: {
        create: [{ author: 'FiveM', body: 'Opened from FiveM by a passerby near the hospital doors.', createdAt: minutesAgo(8) }],
      },
    },
  });

  await prisma.call.create({
    data: {
      number: 1045,
      type: 'fire',
      priority: 1,
      title: 'Structure fire, apartments',
      description: 'Smoke from the second floor of a Davis apartment block. Occupants still evacuating. One person reported trapped.',
      location: 'Davis Ave',
      postal: '144',
      caller: 'Neighbor',
      status: 'onscene',
      source: 'console',
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(22),
      assignments: { create: [{ unitId: unitId('E-7') }] },
      notes: {
        create: [{ author: 'E-7', body: 'Water on the fire. Primary search of the second floor is underway.', createdAt: minutesAgo(9) }],
      },
    },
  });

  await prisma.call.create({
    data: {
      number: 1046,
      type: 'traffic',
      priority: 3,
      title: 'Two-car collision, non injury',
      description: 'Two vehicles blocking the right lane. No reported injuries. Drivers are arguing on the sidewalk.',
      location: 'Alta St / Power St',
      postal: '214',
      caller: 'Passing motorist',
      status: 'pending',
      source: 'console',
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(6),
    },
  });

  await prisma.call.create({
    data: {
      number: 1047,
      type: 'disturbance',
      priority: 3,
      title: 'Noise complaint',
      description: 'Loud music and a group on the sidewalk. Caller asks for a check only. No weapons mentioned.',
      location: 'Vespucci Beach boardwalk',
      postal: '392',
      caller: 'Anonymous',
      status: 'pending',
      source: 'console',
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(4),
    },
  });

  await prisma.call.create({
    data: {
      number: 1039,
      type: 'traffic',
      priority: 2,
      title: 'Disabled vehicle',
      description: 'White Baller with a flat, moved to the shoulder. Driver arranged a tow.',
      location: 'Del Perro Fwy',
      postal: '468',
      caller: 'Elena Voss',
      status: 'closed',
      source: 'console',
      createdBy: 'Alex Rivera',
      createdAt: minutesAgo(180),
      closedAt: minutesAgo(150),
      notes: { create: [{ author: 'Alex Rivera', body: 'Tow on scene. Lane is clear.', createdAt: minutesAgo(155) }] },
    },
  });

  console.log('Seeded MarvosaCAD. Sign in with dispatch / marvosa');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
