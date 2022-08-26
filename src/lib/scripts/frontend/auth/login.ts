import type { JsonValue } from 'type-fest';
import { hasProperty } from 'functional-utilities';
import { token_login } from './token_login';
import { z } from 'zod';

export async function login(email: string, password: string): Promise<Error | undefined> {
	const result = await fetch('/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email,
			password
		})
	});
	
	const token = z.object({
		token: z.string().uuid()
	}).parse(await result.json()).token;

	await token_login(token, false);
	return undefined;
}
