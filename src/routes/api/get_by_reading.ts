import { z } from 'zod';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import type { RequestHandler } from '@sveltejs/kit';
import type { Jsonify } from 'type-fest';
import {
	get_subjects_by_reading,
	type SubjectDataOuter
} from '$lib/scripts/universal/wanikani_data';

export const POST: RequestHandler<
	Record<string, never>,
	{
		subjects?: Jsonify<SubjectDataOuter[]>;
		error?: string;
	}
> = async ({ request }) => {
	const body = await get_request_body(
		request,
		z.object({
			reading: z.string()
		})
	);
	if (body instanceof Error) {
		return {
			status: 400,
			body: {
				error: body.message
			}
		};
	}
	const { reading } = body;
	const subjects = get_subjects_by_reading(reading);
	return {
		status: 200,
		body: {
			subjects
		}
	};
};
