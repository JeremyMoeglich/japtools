import { init_globals } from '$lib/scripts/backend/endpoint_utils.server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { platform } = event;
	init_globals(platform);
	return await resolve(event);
};
