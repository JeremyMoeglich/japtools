import { parse } from 'cookie';
import type { user_data_type } from '../universal/datatypes';
import { prisma_client } from '@japtools/db';
import type { JsonValue } from 'type-fest';
import type { z } from 'zod';
import type { ZodObjectAny } from '../universal/zod_util';
import { error } from '@sveltejs/kit';

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

export async function get_auth_user_data(request: Request): Promise<user_data_type> {
	const cookies = parse(request.headers.get('cookie') ?? '');
	if (!cookies?.login_token) {
		throw error(401, 'Unauthorized, no login token');
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
		throw error(401, 'Invalid login token');
	}

	const user = await (
		prisma_client
	).user.findUnique({
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
		await (
			prisma_client
		).loginToken.delete({
			where: {
				value: cookies.login_token
			}
		});
		throw error(401, "Login token doesn't match any user");
	}
	return user;
}