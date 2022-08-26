<script lang="ts">
	import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson, VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
import { kanjiDataSchema } from '$lib/scripts/universal/wanikani_data_zod';
import { string, z } from 'zod';

	let subjects: Awaited<ReturnType<typeof get_lesson_subjects>> = [];

	let subject_map: Record<number, typeof subjects[number]> = {};
	$: {
		subject_map = {};
		for (let subject of subjects) {
			subject_map[subject.subjectId] = subject;
		}
	}

	const subject_level_decrease: Record<number, number> = {};

	async function decrease_level(subjectId: number) {
		if (subject_level_decrease[subjectId] === undefined) {
			subject_level_decrease[subjectId] = 0;
		}

		if (subject_level_decrease[subjectId] < 2) {
			await update_subject_progress(subjectId, subject_map[subjectId].skill_level - 1);
		}

		subject_level_decrease[subjectId]++;
	}

	function single_sort<T>(lst: T[], func: (v: T) => number) {
		return lst.sort((a, b) => func(a) - func(b));
	}

	let lesson_queue: Lesson[] = [];

	const required_level_table: Record<Lesson['lesson_type'], number> = {
		kanji_nan_kun_on_yomi: 1,
		reading_and_meaning: 0,
		symbol_and_meaning: 0,
		vocabulary_kun_on_yomi: 1
	};

	$: (async () => {
		if (lesson_queue.length === 0) {
			const subjects = await get_lesson_subjects();
			lesson_queue = single_sort(
				lesson_queue.concat(
					subjects.flatMap(({ next_review, skill_level, subject, subjectId }) => {
						const subject_type = subject.object;
						const new_lessons: Lesson[] = [];
						if (subject_type === 'kanji') {
							const symbol = subject.data.characters;
							new_lessons.push({
								lesson_type: 'kanji_nan_kun_on_yomi',
								required_data: {
									kanji: symbol,
									kunyomi: subject.data.readings
										.filter((r) => r.type === 'kunyomi')
										.map((r) => r.reading),
									onyomi: subject.data.readings
										.filter((r) => r.type === 'onyomi')
										.map((r) => r.reading),
									nanori: subject.data.readings
										.filter((r) => r.type === 'nanori')
										.map((r) => r.reading)
								},
								subject_id: subjectId,
								subject_type: subject_type,
								skill_level: skill_level
							});
							{
								const partial_required_data = {
									meanings: subject.data.meanings.map((m) => m.meaning),
									readings: subject.data.readings.map((r) => r.reading)
								};
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'meanings'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'readings'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
							}
						} else if (subject_type === 'vocabulary') {
							const txt = subject.data.slug;
							{
								const partial_required_data = {
									symbol: txt,
									meanings: subject.data.meanings.map((m) => m.meaning)
								};
								new_lessons.push({
									lesson_type: 'symbol_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'meanings'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'symbol_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'symbol'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
							}
							{
								const partial_required_data = {
									readings: subject.data.readings.map((r) => r.reading),
									meanings: subject.data.meanings.map((m) => m.meaning)
								}
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'meanings'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'readings'
									},
									subject_id: subjectId,
									subject_type: subject_type,
									skill_level: skill_level
								});
							}
							new_lessons.push({
								lesson_type: 'vocabulary_kun_on_yomi',
								required_data: {
									kanji_map: z.record(z.string(), z.object({
										data: kanjiDataSchema,
										object: z.literal('kanji'),
										id: z.number(),
										url: z.string().url(),
										data_updated_at: z.string()
									}))
								}
							})
						}

						return new_lessons;
					})
				),
				(lesson) => lesson.skill_level + Math.random() * 0.5
			).filter((lesson) => required_level_table[lesson.lesson_type] <= lesson.skill_level);
		}
	})();
</script>
