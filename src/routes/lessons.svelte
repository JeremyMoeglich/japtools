<script lang="ts">
	import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { lesson_subject_data_type } from '$lib/scripts/universal/datatypes';
	import type { Lesson } from '$lib/scripts/universal/lesson_type';
	import type { SubjectDataOuter } from '$lib/scripts/universal/wanikani_data';
	import { get } from 'svelte/store';

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
								lesson_type: 'kanji_kun_on_yomi',
								required_data: {
									kanji: symbol,
									kunyomi: subject.data.
								}
							})
						}

						return new_lessons;
					})
				),
				(lesson) => lesson.skill_level
			);
		}
	})();
</script>
