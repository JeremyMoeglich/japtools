import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import { prisma_client } from '$lib/scripts/backend/db/prisma_client.server';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const body = await get_request_body(
		request,
		z.object({
			token: z.string()
		})
	);
	const { token } = body;
	await prisma_client.loginToken.delete({
		where: { value: token }
	});
	return json({});
};
