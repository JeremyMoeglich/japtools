import { error, json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import type { RequestHandler } from './$types';
import bcryptjs from 'bcryptjs';
const { hash } = bcryptjs;
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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
	const progress_uuid = uuidv4();
	const user = await prisma_client.user.create({
		data: {
			email: email,
			password_hash: password_hash,
			name: name,
			progress: { create: { id: progress_uuid } }
		}
	});
	const token = await prisma_client.loginToken.create({
		data: {
			user_id: user.id,
			value: uuidv4()
		}
	});
	return json(
		{
			token: token.value
		},
		{
			status: 201
		}
	);
};
