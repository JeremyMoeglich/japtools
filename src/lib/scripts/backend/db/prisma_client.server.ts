import { dev } from '$app/environment';

export const prisma_client_promise = (
	dev ? import('@prisma/client') : import('@prisma/client/edge')
).then((mod) => new mod.PrismaClient());
