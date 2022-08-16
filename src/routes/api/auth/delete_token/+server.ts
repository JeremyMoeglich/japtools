import { json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request }) => {
	const body = await get_request_body(
		request,
		z.object({
			token: z.string()
		})
	);
	if (body instanceof Error) {
		return json({
			error: body.message
		}, {
			status: 400
		});
	}
	const { token } = body;
	await prisma_client.loginToken.delete({
		where: { value: token }
	});
	return new Response(undefined);
};
