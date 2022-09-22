import { user_data_type_schema } from '$lib/scripts/universal/datatypes';
import { domain } from '$lib/scripts/frontend/domain';
import { parse_to_date } from '$lib/scripts/universal/zod_util';
import { get } from 'svelte/store';
import { z } from 'zod';
import { login_token_store } from './login_token';
import { user_data_store } from './user_data';

export async function check_token_and_login() {
	const token = get(login_token_store);
	if (!token) {
		return;
	}
	try {
		await token_login(token);
	} catch (error) {
		if (error instanceof Error && error.message !== 'Invalid token') {
			throw error;
		}
	}
}

export async function token_login(token: string, validate = true) {
	if (validate) {
		const result = await fetch(`${domain}/api/auth/token_login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ token })
		}).catch((v) => v);
		const data = await result.json();
		const valid = z
			.object({
				valid: z.boolean()
			})
			.parse(data).valid;
		if (!valid) {
			login_token_store.set('');
			throw new Error('Invalid token');
		}
	}

	login_token_store.set(token);
	const response = await (await fetch(`${domain}/api/auth/get_own_user_data`)).json();
	const parsed = parse_to_date(
		z
			.object({
				user_data: user_data_type_schema.extend({
					created_at: z.string()
				})
			})
			.parse(response).user_data,
		user_data_type_schema,
		['created_at']
	);
	user_data_store.set(parsed);
}
