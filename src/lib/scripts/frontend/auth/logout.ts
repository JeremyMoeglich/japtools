import { domain } from '$lib/scripts/frontend/domain';
import { get } from 'svelte/store';
import { logged_in } from './auth_state';
import { login_token_store } from './login_token';

export async function logout() {
	logged_in.set(false);
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
