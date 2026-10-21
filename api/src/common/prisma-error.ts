import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function rethrowKnown(error: unknown, label: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException(`${label} already exists`);
  }
  throw error;
}
