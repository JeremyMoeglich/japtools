import { domain } from './domain';
import { z } from 'zod';

export async function get_by_readings(readings: string[]) {
	const response = await fetch(`${domain}/api/get_by_readings`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			readings
		})
	});
	const data = z
		.object({
			subjects_map: z.record(
				z.string(),
				z.array(
					z.object({
						id: z.number().int(),
						readings: z.array(z.string()),
						meanings: z.array(z.string())
					})
				)
			)
		})
		.parse(await response.json());
	return data.subjects_map;
}
