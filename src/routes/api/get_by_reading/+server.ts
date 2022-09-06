import { z } from 'zod';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { get_subjects_by_reading } from '$lib/scripts/universal/wanikani_data/wanikani_data';

export const POST: RequestHandler = async ({ request }) => {
	const { reading } = await get_request_body(
		request,
		z.object({
			reading: z.string()
		})
	);
	const subjects = get_subjects_by_reading(reading);
	return new Response(JSON.stringify(subjects));
};
