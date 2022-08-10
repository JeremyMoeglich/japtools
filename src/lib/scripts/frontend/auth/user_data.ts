import { browser } from '$app/env';
import type { user_data_type } from '$lib/scripts/universal/datatypes';
import { writable, type Writable } from 'svelte/store';
import { check_token_and_login } from './token_login';

export const user_datas_store: Writable<undefined | user_data_type> = writable(undefined);

if (browser) {
	check_token_and_login();
}
