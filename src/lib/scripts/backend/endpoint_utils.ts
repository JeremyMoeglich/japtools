import { parse } from 'cookie';
import type { user_data_type } from '../universal/datatypes';
import { prisma_client } from './db/prisma_client';
import type { JsonValue } from 'type-fest';
import type { z, ZodError } from 'zod';
import type { ZodObjectAny } from '../universal/zod_util';

export async function get_request_body<T extends ZodObjectAny>(
	request: Request,
	schema: T
): Promise<z.infer<T> | ZodError<T>> {
	const body = await get_body(request);
	const parsed = schema.safeParse(body);
	if (parsed.success) {
		return parsed.data;
	} else {
		return parsed.error;
	}
}

export async function get_body(request: Request): Promise<JsonValue | Error> {
	const decoded_body = await request.text();
	const body: JsonValue = JSON.parse(decoded_body.trim() ? decoded_body : '{}');
	if (typeof body !== 'object') {
		return new Error('Invalid body');
	}
	return body;
}

export async function get_auth_user_data(request: Request): Promise<user_data_type | Error> {
	const cookies = parse(request.headers.get('cookie') ?? '');
	if (!cookies?.login_token) {
		return new Error('Not logged in');
	}
	const data = await prisma_client.loginToken.findUnique({
		where: {
			value: cookies.login_token
		},
		select: {
			userId: true
		}
	});
	const user_id = data?.userId;

	if (!user_id) {
		return new Error('Invalid login token');
	}

	const user = await prisma_client.user.findUnique({
		where: {
			id: user_id
		},
		select: {
			name: true,
			id: true,
			email: true,
			createdAt: true,
			progressId: true
		}
	});

	if (!user) {
		await prisma_client.loginToken.delete({
			where: {
				value: cookies.login_token
			}
		});
		return new Error('Invalid login token');
	}
	return user;
}
