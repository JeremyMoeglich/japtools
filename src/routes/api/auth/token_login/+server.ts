import { json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

export const POST: RequestHandler<
	Record<string, never>,
	{ valid: boolean; error?: string }
> = async ({ request }) => {
	const body = await get_request_body(request, z.object({ token: z.string() }));
	if (body instanceof Error) {
		return json({
			valid: false,
			error: body.message
		}, {
			status: 400
		});
	}
	const { token } = body;
	const loginToken = await prisma_client.loginToken.findUnique({
		where: { value: token },
		select: { userId: true, time: true }
	});
	if (!loginToken) {
		return json({
			valid: false,
			error: 'Invalid token'
		}, {
			status: 401
		});
	}
	if (loginToken.time.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 7) {
		return json({
			valid: false,
			error: 'Token expired'
		}, {
			status: 401
		});
	}
	return json({
		valid: true
	});
};
