import { token_login } from './token_login';
import { z } from 'zod';
import { domain } from '$lib/scripts/frontend/domain';

export async function login(email: string, password: string): Promise<Error | undefined> {
	const result = await fetch(`${domain}/api/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email,
			password
		})
	});
	const data: unknown = await result.json();
	const token_result = z
		.object({
			token: z.string()
		})
		.safeParse(data);

	if (token_result.success) {
		await token_login(token_result.data.token, false);
		return undefined;
	} else {
		const error = z
			.object({
				error: z.string()
			})
			.parse(data);
		return new Error(error.error);
	}
}
