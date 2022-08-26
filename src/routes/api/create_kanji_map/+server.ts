import { get_request_body } from '$lib/scripts/backend/endpoint_utils';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { json } from '@sveltejs/kit';
import { get_subject_by_kanji } from '$lib/scripts/universal/wanikani_data';



export const GET: RequestHandler = async ({ request }) => {
	const { text } = await get_request_body(
		request,
		z.object({
			text: z.string().min(1).max(100)
		})
	);

	const kanji_map = {
		map: text.split('').map((char) => ({
			symbol: char,
			data: get_subject_by_kanji(char)
		})).filter((char) => char.data !== undefined)
	}
	return json(kanji_map);
};
