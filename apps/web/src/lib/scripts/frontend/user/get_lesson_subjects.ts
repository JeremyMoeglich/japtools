import {
	LessonSubjectDataSchema,
	type LessonSubjectDataType
} from '$lib/scripts/universal/datatypes';
import { domain } from '$lib/scripts/frontend/domain';
import { parse_to_date } from '$lib/scripts/universal/zod_util';
import { get } from 'svelte/store';
import { z } from 'zod';
import { subject_store } from './subject_store';

export async function get_lesson_subjects(previous: number[]): Promise<LessonSubjectDataType[]> {
	const lessons_raw: unknown = await (
		await fetch(`${domain}/api/user/get_lesson_subjects`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				max_amount: 12,
				previous
			})
		})
	).json();

	const lessons_raw_arr = z
		.object({
			lessons: z.array(z.unknown())
		})
		.parse(lessons_raw).lessons;
	const lessons = lessons_raw_arr.map((v) =>
		parse_to_date(v, LessonSubjectDataSchema, ['next_review'])
	);
	const current_subject_store = get(subject_store);
	lessons.forEach((lesson) => {
		current_subject_store.set(lesson.subject_id, lesson);
	});
	subject_store.set(current_subject_store);
	return lessons;
}
