import { domain } from './domain';
import {
	KanjiDataSchema,
	VocabularyDataSchema,
	type KanjiDataType,
	type VocabularyDataType
} from '../universal/datatypes';
import { z } from 'zod';

export async function get_by_reading(
	reading: string
): Promise<(KanjiDataType | VocabularyDataType)[]> {
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
			subjects: z.array(z.union([KanjiDataSchema, VocabularyDataSchema]))
		})
		.parse(await response.json());
	return data.subjects;
}
