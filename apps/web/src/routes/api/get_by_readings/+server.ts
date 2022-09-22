import { z } from 'zod';
import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { typed_entries, typed_from_entries } from 'functional-utilities';
import { json } from '@sveltejs/kit';
import { prisma_client } from '$lib/scripts/backend/prisma_client.server';

export const POST: RequestHandler = async ({ request }) => {
	const { readings } = await get_request_body(
		request,
		z.object({
			readings: z.array(z.string())
		})
	);
	const unique_readings = Array.from(new Set(readings));
	const query_result = (
		await prisma_client.subjectIndex.findMany({
			where: {
				readings: {
					hasSome: unique_readings
				}
			}
		})
	).map((v) => ({
		id: v.subjectId,
		readings: v.readings,
		meanings: v.meanings
	}));
	const subjects_map: Record<string, { readings: string[]; meanings: string[]; id: number }[]> =
		typed_from_entries(unique_readings.map((v) => [v, []]));
	for (const { id, readings, meanings } of query_result) {
		for (const reading of readings) {
			if (!subjects_map[reading]) {
				continue;
			}
			subjects_map[reading].push({ readings, meanings, id });
		}
	}
	const result = typed_from_entries(
		typed_entries(subjects_map).filter(([reading]) => unique_readings.includes(reading))
	);
	return json({
		subjects_map: result
	});
};
