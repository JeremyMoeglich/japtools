import { error, json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import type { RequestHandler } from './$types';
import { hash } from 'bcrypt';
import cuid from 'cuid';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request }) => {
	const body = await get_request_body(
		request,
		z.object({
			email: z.string().email(),
			password: z.string().min(8),
			name: z.string().min(4)
		})
	);
	const { email, password, name } = body;
	const user_exists = await prisma_client.user.findUnique({
		where: { email: email },
		select: { id: true }
	});
	if (user_exists) {
		throw error(400, 'User already exists');
	}
	const password_hash = await hash(password, 10);
	const user = await prisma_client.user.create({
		data: {
			email: email,
			password_hash: password_hash,
			name: name,
			progress: {
				create: {}
			}
		}
	});
	const token = await prisma_client.loginToken.create({
		data: {
			userId: user.id,
			value: cuid()
		}
	});
	return json({
		token: token.value
	}, {
		status: 201
	});
};