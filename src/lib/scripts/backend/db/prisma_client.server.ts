import { dev } from '$app/environment';

const PrismaClient = dev
	? await import('@prisma/client').then((m) => m.PrismaClient)
	: await import('@prisma/client/edge').then((m) => m.PrismaClient);

export const prisma_client = new PrismaClient();
