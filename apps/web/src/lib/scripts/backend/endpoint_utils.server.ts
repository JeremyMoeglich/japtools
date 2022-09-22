import { parse } from 'cookie';
import type { user_data_type } from '../universal/datatypes';
import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import type { JsonValue } from 'type-fest';
import type { z } from 'zod';
import type { ZodObjectAny } from '../universal/zod_util';
import { error } from '@sveltejs/kit';

export interface UtilHttpError extends Error {
	status: number;
}

export async function get_request_body<T extends ZodObjectAny>(
	request: Request,
	schema: T
): Promise<z.infer<T>> {
	const body = await get_body(request);
	console.log(`Request body: ${JSON.stringify(body)}`);
	const parsed = schema.safeParse(body);
	if (parsed.success) {
		return parsed.data;
	} else {
		throw error(400, `Invalid request body: ${parsed.error.message}`);
	}
}

export async function get_body(request: Request): Promise<JsonValue> {
	const decoded_body = await request.text();
	try {
		const body: JsonValue = JSON.parse(decoded_body.trim() ? decoded_body : '{}');
		if (typeof body !== 'object') {
			throw error(400, 'Not an object');
		}
		return body;
	} catch (_) {
		throw error(400, 'Invalid JSON');
	}
}

export async function safe_get_auth_user_data(
	request: Request
): Promise<user_data_type | UtilHttpError> {
	const cookies = parse(request.headers.get('cookie') ?? '');
	if (!cookies?.login_token) {
		return {
			status: 401,
			message: 'Not logged in (no login token)',
			name: 'Not logged in'
		};
	}
	const data = await prisma_client.loginToken.findUnique({
		where: {
			value: cookies.login_token
		},
		select: {
			user_id: true
		}
	});
	const user_id = data?.user_id;

	if (!user_id) {
		return {
			status: 401,
			message: 'Not logged in (invalid login token)',
			name: 'Not logged in'
		};
	}

	const user = await prisma_client.user.findUnique({
		where: {
			id: user_id
		},
		select: {
			name: true,
			id: true,
			email: true,
			created_at: true,
			progress_id: true
		}
	});

	if (!user) {
		await prisma_client.loginToken.delete({
			where: {
				value: cookies.login_token
			}
		});
		return {
			status: 401,
			message: 'Not logged in (invalid user)',
			name: 'Not logged in'
		};
	}
	return user;
}

export async function get_auth_user_data(request: Request): Promise<user_data_type> {
	const user_data = await safe_get_auth_user_data(request);
	if (user_data instanceof Error) {
		throw error(user_data.status, user_data.message);
	}
	return user_data;
}
