import { browser } from '$app/env';
import type { user_data_type } from '$lib/scripts/universal/datatypes';
import { writable, type Writable } from 'svelte/store';

export const user_datas_store: Writable<undefined | user_data_type> = writable(undefined);

if (browser) {
	const { check_token_and_login } = await import('./token_login');
	check_token_and_login();
}
