import { json } from '@sveltejs/kit';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import type { RequestHandler } from './$types';
import bcryptjs from 'bcryptjs';
const { compare } = bcryptjs;
import { v4 as uuidv4 } from 'uuid';
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
		return json(
			{
				error: body.message
			},
			{
				status: 400
			}
		);
	}
	const { email, password } = body;
	if (!email || !password) {
		return json(
			{
				error: 'Missing email or password'
			},
			{
				status: 400
			}
		);
	}
	if (typeof email !== 'string' || typeof password !== 'string') {
		return json(
			{
				error: 'Invalid identifier or password'
			},
			{
				status: 400
			}
		);
	}
	const user_id = (await prisma_client.user.findUnique({ where: { email }, select: { id: true } }))
		?.id;

	if (!user_id) {
		return json(
			{
				error: 'Invalid email or password'
			},
			{
				status: 401
			}
		);
	}
	const password_hash: string | undefined = (
		await prisma_client.user.findUnique({
			where: { id: user_id },
			select: {
				password_hash: true
			}
		})
	)?.password_hash;

	if (!password_hash) {
		return json(
			{
				error: 'Invalid identifier'
			},
			{
				status: 404
			}
		);
	}
	const is_valid = await compare(password, password_hash);
	if (!is_valid) {
		return json(
			{
				error: 'Invalid password'
			},
			{
				status: 401
			}
		);
	}
	const current_tokens = await prisma_client.loginToken.findMany({
		where: { user_id: user_id },
		select: { value: true, time: true }
	});
	const new_token_value = uuidv4();
	await Promise.all([
		Promise.all(
			current_tokens.map(async (current_token) => {
				// check if token is newer than 1 week
				const days = 7;
				if (current_token.time.getTime() < Date.now() - 1000 * 60 * 60 * 24 * days) {
					await prisma_client.loginToken.delete({ where: { value: current_token.value } });
				}
			})
		),
		prisma_client.loginToken.create({
			data: {
				user_id: user_id,
				value: new_token_value
			}
		})
	]);
	return json(
		{
			token: new_token_value
		},
		{
			status: 201
		}
	);
};
