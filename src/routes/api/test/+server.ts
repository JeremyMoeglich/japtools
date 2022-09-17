import { get_body } from '$lib/scripts/backend/endpoint_utils.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '../../../../.svelte-kit/types/src/routes/api/$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await get_body(request);
	return json({
		message: 'This is a post request',
		echo: body
	});
};

export const GET: RequestHandler = async () => {
	return json({
		message: 'This is a get request'
	});
};

export const PUT: RequestHandler = async () => {
	return json({
		message: 'This is a put request'
	});
};

export const DELETE: RequestHandler = async () => {
	return json({
		message: 'This is a delete request'
	});
};
