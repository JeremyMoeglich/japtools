import { json } from '@sveltejs/kit';
import { get_auth_user_data } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	return json({
		user_data: {
			name: user_data.name,
			id: user_data.id,
			email: user_data.email,
			created_at: user_data.created_at.toISOString(),
			progress_id: user_data.progress_id,
			total_completed: user_data.total_completed
		}
	});
};
