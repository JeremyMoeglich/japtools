import { safe_get_auth_user_data } from '$lib/scripts/backend/endpoint_utils.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	const user_data = await safe_get_auth_user_data(request);
	if ('status' in user_data) {
		return {
			user_data: undefined
		};
	}
	return {
		user_data
	};
};
