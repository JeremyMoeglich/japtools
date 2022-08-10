import { user_data_type_schema } from '$lib/scripts/universal/datatypes';
import { parse_to_date } from '$lib/scripts/universal/zod_util';
import type { JSONValue } from '@sveltejs/kit/types/private';
import { hasProperty } from 'functional-utilities';
import { get } from 'svelte/store';
import { z } from 'zod';
import { logged_in } from './auth_state';
import { login_token_store } from './login_token';
import { user_datas_store } from './user_data';

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
		const result = await fetch('/auth/token_login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ token })
		}).catch((v) => v);
		const data: JSONValue = await result.json();
		if (!data) {
			throw new Error('Invalid response from server (expected truthy object)');
		}
		if (typeof data !== 'object') {
			throw new Error('Invalid response from server (expected object)');
		}
		if (hasProperty(data, 'error')) {
			if (typeof data.error !== 'string') {
				throw new Error('Invalid response from server (expected error to be string)');
			}
			if (data.error === 'Invalid token') {
				login_token_store.set('');
			}
			throw new Error(data.error);
		}
		if (!hasProperty(data, 'valid')) {
			throw new Error('Invalid response from server (expected valid attribute)');
		}
		if (typeof data.valid !== 'boolean') {
			throw new Error('Invalid response from server (expected token to be string)');
		}
		const valid = data.valid;
		if (!valid) {
			login_token_store.set('');
			throw new Error('Invalid token');
		}
	}

	console.log('token_login', token);
	login_token_store.set(token);
	console.log('cookies', document.cookie);
	const response: unknown = await (await fetch('/auth/get_own_user_data')).json();
	if (!response) {
		throw new Error('Invalid response from server (expected truthy object)');
	}
	if (hasProperty(response, 'error')) {
		if (typeof response.error !== 'string') {
			throw new Error('Invalid response from server (expected error to be string)');
		}
		throw new Error(response.error);
	}
	if (!hasProperty(response, 'user_data')) {
		throw new Error('Invalid response from server (expected user_data attribute)');
	}
	const parsed = parse_to_date(response.user_data, user_data_type_schema, ['createdAt']);
	user_datas_store.set(parsed);
	logged_in.set(true);
}
