import { init_globals } from '$lib/scripts/backend/endpoint_utils.server';
import type { Handle } from '@sveltejs/kit';
import { inspect } from 'node-inspect-extracted';

export const handle: Handle = async ({ event, resolve }) => {
	const { platform } = event;
	init_globals(platform);
	console.log('handle-env', inspect(platform.env));
	console.log('handle-env', inspect(globalThis));
	return await resolve(event);
};
