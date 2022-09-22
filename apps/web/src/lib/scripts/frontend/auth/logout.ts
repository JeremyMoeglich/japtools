import { domain } from '$lib/scripts/frontend/domain';
import { get } from 'svelte/store';
import { login_token_store } from './login_token';
import { user_data_store } from './user_data';

export async function logout() {
	user_data_store.set(undefined);
	const token = get(login_token_store);
	if (!token) {
		return;
	}
	await fetch(`${domain}/api/auth/delete_token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token })
	});
	login_token_store.set('');
}
