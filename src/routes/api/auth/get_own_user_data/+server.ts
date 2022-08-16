import { json } from '@sveltejs/kit';
import { get_auth_user_data } from '$lib/scripts/backend/endpoint_utils';
import type { user_data_type } from '$lib/scripts/universal/datatypes';
import type { RequestHandler } from '@sveltejs/kit';
import type { Jsonify } from 'type-fest';

export const GET: RequestHandler<
	Record<string, never>,
	{
		user_data?: Jsonify<user_data_type>;
		error?: string;
	}
> = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	if (user_data instanceof Error) {
		return json({
			error: user_data.message
		}, {
			status: 401
		});
	}
	return json({
		user_data: {
			name: user_data.name,
			id: user_data.id,
			email: user_data.email,
			createdAt: user_data.createdAt.toISOString(),
			progressId: user_data.progressId
		}
	});
};
