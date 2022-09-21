import { domain } from './domain';
import { SubjectDataSchema, type SubjectDataType } from '../universal/datatypes';
import { z } from 'zod';

export async function get_by_reading(reading: string): Promise<SubjectDataType[]> {
	const response = await fetch(`${domain}/api/get_by_reading`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			reading
		})
	});
	const data = z
		.object({
			subjects: SubjectDataSchema.array()
		})
		.parse(await response.json());
	return data.subjects;
}
