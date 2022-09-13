import { get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { json } from '@sveltejs/kit';
import { get_subject_by_kanji } from '$lib/scripts/backend/wanikani_data.server';
import type { KanjiDataType } from '$lib/scripts/universal/datatypes';

export const POST: RequestHandler = async ({ request }) => {
	const { text } = await get_request_body(
		request,
		z.object({
			text: z.string().min(1).max(100)
		})
	);

	const kanji_map = Object.fromEntries(
		(
			await Promise.all(
				text
					.split('')
					.map(
						async (char) =>
							[char, await get_subject_by_kanji(char)] as [string, KanjiDataType | undefined]
					)
			)
		).filter((char) => char[1] !== undefined)
	);
	return json(kanji_map);
};
