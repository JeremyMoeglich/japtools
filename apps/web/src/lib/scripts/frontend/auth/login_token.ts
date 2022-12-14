import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import Cookies from 'js-cookie';

export const login_token_store = writable<'' | string>('');

if (browser) {
	const token = Cookies.get('login_token');
	if (token) {
		login_token_store.set(token);
	}

	login_token_store.subscribe((token) => {
		if (token) {
			Cookies.set('login_token', token, {
				expires: 365,
				secure: true
			});
		} else {
			Cookies.remove('login_token');
		}
	});
}
