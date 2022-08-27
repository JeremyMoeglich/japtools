<script lang="ts">
	import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson, VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
	import { kanjiDataSchema } from '$lib/scripts/universal/wanikani_data/wanikani_schema';
	import { range } from 'functional-utilities';
	import { z } from 'zod';
	import { isKanji } from 'wanakana';
	import PrettyObj from '$lib/components/pretty_obj.svelte';

	let subjects: Awaited<ReturnType<typeof get_lesson_subjects>> = [];

	let subject_map: Record<number, typeof subjects[number]> = {};
	$: {
		subject_map = {};
		for (let subject of subjects) {
			subject_map[subject.subject_id] = subject;
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
			const new_lessons = (
				await Promise.all(
					subjects.map(async ({ next_review, skill_level, subject, subject_id }) => {
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
								subject_id: subject_id,
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
									subject_id: subject_id,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'readings'
									},
									subject_id: subject_id,
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
									subject_id: subject_id,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'symbol_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'symbol'
									},
									subject_id: subject_id,
									subject_type: subject_type,
									skill_level: skill_level
								});
							}
							{
								const partial_required_data = {
									readings: subject.data.readings.map((r) => r.reading),
									meanings: subject.data.meanings.map((m) => m.meaning)
								};
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'meanings'
									},
									subject_id: subject_id,
									subject_type: subject_type,
									skill_level: skill_level
								});
								new_lessons.push({
									lesson_type: 'reading_and_meaning',
									required_data: {
										...partial_required_data,
										to: 'readings'
									},
									subject_id: subject_id,
									subject_type: subject_type,
									skill_level: skill_level
								});
							}

							{
								const kanji_types = await (async () => {
									const kanji_data = z.record(z.string(), kanjiDataSchema).parse(
										await (
											await fetch('/api/create_kanji_map', {
												method: 'POST',
												body: JSON.stringify({
													text: txt
												})
											})
										).json()
									);

									return Object.fromEntries(
										subject.data.readings.map((r_ref) => {
											const kanji_types: (
												| typeof kanji_data[string]['readings'][number]['type']
												| undefined
											)[] = [];
											let r = r_ref.reading;
											let character_string = subject.data.characters;
											while (character_string.length > 0) {
												if (character_string[0] === r[0]) {
													character_string = character_string.slice(1);
													r = r.slice(1);
												} else if (isKanji(character_string[0])) {
													const kanji = character_string[0];
													character_string = character_string.slice(1);
													const viable_readings = kanji_data[kanji].readings.filter(
														(kanji_reading) => r.startsWith(kanji_reading.reading)
													);
													if (
														viable_readings.every((v) => v.reading === viable_readings[0].reading)
													) {
														range(viable_readings[0].reading.length).forEach(() => {
															kanji_types.push(undefined);
														});
														kanji_types.push(viable_readings[0].type);
														r = r.slice(viable_readings[0].reading.length);
													} else {
														throw new Error(
															`Multiple viable ${kanji} readings ${new Array(
																new Set(viable_readings.map((v) => v.reading)).keys()
															).join(', ')}`
														);
													}
												} else {
													throw new Error('Invalid character');
												}
											}
											return [r, kanji_types];
										})
									);
								})();
								if (Object.entries(kanji_types).length > 1) {
									throw new Error('Multiple Vocabulary reading are not supported yet');
								}
								if (Object.entries(kanji_types).length === 0) {
									throw new Error('No Vocabulary reading found');
								}
								const kanji_type = Object.values(kanji_types)[0];
								new_lessons.push({
									lesson_type: 'vocabulary_kun_on_yomi',
									required_data: {
										vocabulary: txt,
										string_map: kanji_type.map((v) => (v === undefined ? 'not_a_kanji' : v))
									},
									subject_id: subject_id,
									skill_level: skill_level,
									subject_type: subject_type
								});
							}
						}
						return new_lessons;
					})
				)
			).flat();
			lesson_queue = single_sort(
				lesson_queue.concat(new_lessons),
				(lesson) => lesson.skill_level + Math.random() * 0.5
			).filter((lesson) => required_level_table[lesson.lesson_type] <= lesson.skill_level);
		}
	})();
</script>

<PrettyObj obj={lesson_queue} />
