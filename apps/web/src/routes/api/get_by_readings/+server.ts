import { z } from 'zod';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { get_subjects_by_readings } from '$lib/scripts/backend/wanikani_data.server';
import { typed_entries, typed_from_entries } from 'functional-utilities';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { readings } = await get_request_body(
		request,
		z.object({
			readings: z.array(z.string())
		})
	);
	const subjects_map = await get_subjects_by_readings(readings);
	const mapped = typed_from_entries(
		typed_entries(subjects_map).map(([reading, subjects]) => [
			reading,
			subjects.map((subject) => ({
				id: subject.id,
				readings: subject.readings,
				meanings: subject.meanings
			}))
		])
	);
	return json({
		subjects_map: mapped
	});
};
