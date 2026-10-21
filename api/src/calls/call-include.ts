import { Prisma } from '@prisma/client';

export const callInclude = {
  assignments: {
    include: { unit: true },
    orderBy: { assignedAt: 'asc' as const },
  },
  notes: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.CallInclude;
