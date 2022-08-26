import { json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import type { RequestHandler } from './$types';
import { compare } from 'bcrypt';
import cuid from 'cuid';
import { z } from 'zod';

export const POST: RequestHandler = async ({ request }) => {
	const body = await get_request_body(
		request,
		z.object({
			email: z.string().email(),
			password: z.string().min(8)
		})
	);
	if (body instanceof Error) {
		return json({
			error: body.message
		}, {
			status: 400
		});
	}
	const { email, password } = body;
	if (!email || !password) {
		return json({
			error: 'Missing email or password'
		}, {
			status: 400
		});
	}
	if (typeof email !== 'string' || typeof password !== 'string') {
		return json({
			error: 'Invalid identifier or password'
		}, {
			status: 400
		});
	}
	const userId = (await prisma_client.user.findUnique({ where: { email }, select: { id: true } }))
		?.id;

	if (!userId) {
		return json({
			error: 'Invalid email or password'
		}, {
			status: 401
		});
	}
	const password_hash: string | undefined = (
		await prisma_client.user.findUnique({
			where: { id: userId },
			select: {
				password_hash: true
			}
		})
	)?.password_hash;

	if (!password_hash) {
		return json({
			error: 'Invalid identifier'
		}, {
			status: 404
		});
	}
	const is_valid = await compare(password, password_hash);
	if (!is_valid) {
		return json({
			error: 'Invalid password'
		}, {
			status: 401
		});
	}
	const current_token = await prisma_client.loginToken.findUnique({
		where: { userId: userId },
		select: { value: true, time: true }
	});
	if (current_token) {
		// check if token is newer than 1 week
		if (current_token.time.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 7) {
			return json({
				token: current_token.value
			});
		} else {
			await prisma_client.loginToken.delete({ where: { userId: userId } });
		}
	}
	const new_token = await prisma_client.loginToken.create({
		data: {
			userId: userId,
			value: cuid()
		}
	});
	return json({
		token: new_token.value
	}, {
		status: 201
	});
};