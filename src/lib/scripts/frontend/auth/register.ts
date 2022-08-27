import { hasProperty } from 'functional-utilities';
import { z } from 'zod';
import { token_login } from './token_login';

export async function register(
	name: string,
	email: string,
	password: string
): Promise<Error | undefined> {
	const response = await (
		await fetch('/api/auth/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name, email, password })
		})
	).json();

	const token = z
		.object({
			token: z.string()
		})
		.parse(response).token;
	await token_login(token, false);
	return undefined;
}
