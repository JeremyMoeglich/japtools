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

	const token_result = z
		.object({
			token: z.string()
		})
		.safeParse(response);

	if (token_result.success) {
		await token_login(token_result.data.token, false);
		return undefined;
	} else {
		const error = z
			.object({
				error: z.string()
			})
			.parse(response);
		return new Error(error.error);
	}
}
