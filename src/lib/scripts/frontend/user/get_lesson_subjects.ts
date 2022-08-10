import { lesson_data_type_schema, type lesson_data_type } from '$lib/scripts/universal/datatypes';
import { parse_to_date } from '$lib/scripts/universal/zod_util';
import { z } from 'zod';

export async function get_lesson_subjects(): Promise<lesson_data_type[]> {
	const lessons_raw: unknown = await (
		await fetch('/user/get_lesson_subjects', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				amount: 10
			})
		})
	).json();
	const lessons_raw_arr = z.array(z.unknown()).parse(lessons_raw);
	const lessons = lessons_raw_arr.map((v) =>
		parse_to_date(v, lesson_data_type_schema, ['next_review'])
	);
	return lessons;
}
