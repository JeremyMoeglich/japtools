import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
import {
	get_subject_type,
	is_kanji_data,
	is_radical_data,
	is_vocabulary_data,
	KanjiDataSchema,
	type KanjiDataType,
	type KanjiReadingType,
	type ReadingTypeType,
	type VocabularyDataType,
	type VocabularyReadingType
} from '$lib/scripts/universal/datatypes';
import { domain } from '$lib/scripts/frontend/domain';
import type { Lesson } from '$lib/scripts/universal/lesson_type';
import { error } from 'functional-utilities';
import { sample, sortBy } from 'lodash-es';
import { isKanji } from 'wanakana';
import { z } from 'zod';
import { get_by_readings } from '$lib/scripts/frontend/get_by_readings';

const required_level_table: Record<Lesson['lesson_type'], number> = {
	//kanji_nan_kun_on_yomi: 1,
	reading_and_meaning: 1,
	text_and_meaning: 1,
	vocabulary_kun_on_yomi: 2,
	new_subject: 0
};

function has_duplicates<T>(array: T[]): boolean {
	return new Set(array).size !== array.length;
}

function arr_identical(arr1: unknown[], arr2: unknown[]): boolean {
	if (has_duplicates(arr1) || has_duplicates(arr2))
		error('arr_identical: arrays must not have duplicates');
	const set1 = new Set(arr1);
	const set2 = new Set(arr2);
	return set1.size === set2.size && [...set1].every((v) => set2.has(v));
}

function get_unique_readings<R extends KanjiReadingType | VocabularyReadingType>(
	readings: R[],
	readings_map: Awaited<ReturnType<typeof get_by_readings>>
): R[] {
	return readings.filter((r) => {
		const mapped = readings_map[r.reading];
		if (mapped.length === 1) return true;
		if (mapped.every((m) => arr_identical(m.readings, readings))) return true;
		return false;
	});
}

export async function get_lessons(previous: number[]) {
	const subjects = await get_lesson_subjects(previous);
	const readings_map = await get_by_readings(
		subjects
			.map((v) => v.subject)
			.filter((s) => !is_radical_data(s))
			.flatMap((s) => (s as KanjiDataType | VocabularyDataType).readings.map((r) => r.reading))
	);
	return (
		await Promise.all(
			subjects.map(async ({ skill_level, subject, subject_id }) => {
				const new_lessons: Lesson[] = [];
				if (is_kanji_data(subject)) {
					if (skill_level === 0) {
						const v: Lesson = {
							lesson_type: 'new_subject',
							need_input: false,
							preferred_tab: 'Readings',
							skill_level: 0,
							required_data: {
								text: subject.characters
							},
							subject_id,
							subject_type: 'KANJI'
						};
						return v;
					}
					// const symbol = subject.characters;
					// new_lessons.push({
					// 	lesson_type: 'kanji_nan_kun_on_yomi',
					// 	required_data: {
					// 		kanji: symbol,
					// 		kunyomi: subject.readings
					// 			.filter((r) => r.reading_type === 'KUNYOMI')
					// 			.map((r) => r.reading),
					// 		onyomi: subject.readings
					// 			.filter((r) => r.reading_type === 'ONYOMI')
					// 			.map((r) => r.reading),
					// 		nanori: subject.readings
					// 			.filter((r) => r.reading_type === 'NANORI')
					// 			.map((r) => r.reading)
					// 	},
					// 	subject_id: subject_id,
					// 	subject_type: 'KANJI',
					// 	skill_level: skill_level,
					// 	need_input: false
					// });
					{
						const primary_reading =
							subject.readings.find((r) => r.primary) ?? error('no primary reading');
						const unique_readings = get_unique_readings(subject.readings, readings_map);
						const valid_readings = unique_readings.filter(
							(r) => r.reading_type === primary_reading.reading_type
						);
						if (valid_readings.length > 0) {
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									meanings: subject.meanings.map((m) => m.meaning),
									readings: valid_readings.map((r) => r.reading),
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'KANJI',
								skill_level: skill_level,
								need_input: true,
								preferred_tab: 'Meanings'
							});
						}
						new_lessons.push({
							lesson_type: 'reading_and_meaning',
							required_data: {
								meanings: subject.meanings.map((m) => m.meaning),
								readings: subject.readings
									.filter((r) => r.reading_type === primary_reading.reading_type)
									.map((r) => r.reading),
								to: 'readings'
							},
							subject_id: subject_id,
							subject_type: 'KANJI',
							skill_level: skill_level,
							need_input: true,
							preferred_tab: 'Readings'
						});
					}
				} else if (is_vocabulary_data(subject)) {
					if (skill_level === 0) {
						const v: Lesson = {
							lesson_type: 'new_subject',
							need_input: false,
							preferred_tab: 'Readings',
							required_data: {
								text: subject.characters
							},
							skill_level: 0,
							subject_id,
							subject_type: 'VOCABULARY'
						};

						return v;
					}

					const unique_readings = get_unique_readings(subject.readings, readings_map);
					{
						if (unique_readings.length > 0) {
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									readings: unique_readings.map((r) => r.reading),
									meanings: subject.meanings.map((m) => m.meaning),
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true,
								preferred_tab: 'Meanings'
							});
						}
						new_lessons.push({
							lesson_type: 'reading_and_meaning',
							required_data: {
								readings: subject.readings.map((r) => r.reading),
								meanings: subject.meanings.map((m) => m.meaning),
								to: 'readings'
							},
							subject_id: subject_id,
							subject_type: 'VOCABULARY',
							skill_level: skill_level,
							need_input: true,
							preferred_tab: 'Readings'
						});
					}

					const txt = subject.characters;
					{
						const partial_required_data = {
							text: txt,
							meanings: subject.meanings.map((m) => m.meaning)
						};
						if (!unique_readings.map((r) => r.reading).includes(txt)) {
							new_lessons.push({
								lesson_type: 'text_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true,
								preferred_tab: 'Meanings'
							});
						}
						new_lessons.push({
							lesson_type: 'text_and_meaning',
							required_data: {
								...partial_required_data,
								to: 'symbol',
								readings: subject.readings.map((r) => r.reading)
							},
							subject_id: subject_id,
							subject_type: 'VOCABULARY',
							skill_level: skill_level,
							need_input: true,
							preferred_tab: 'Readings'
						});
					}

					{
						const kanji_types = await (async () => {
							const kanji_data = z.record(z.string(), KanjiDataSchema).parse(
								await (
									await fetch(`${domain}/api/create_kanji_map`, {
										method: 'POST',
										body: JSON.stringify({
											text: txt
										})
									})
								).json()
							);

							return Object.fromEntries(
								subject.readings.map((r_ref) => {
									const kanji_types: (ReadingTypeType | undefined)[] = [];
									let r = r_ref.reading;
									let character_string = subject.characters;
									while (character_string.length > 0) {
										if (
											character_string[0] === r[0] ||
											'っ' + character_string[0] === r.slice(0, 2)
										) {
											character_string = character_string.slice(1);
											r = r.slice(1);
											kanji_types.push(undefined);
										} else if (isKanji(character_string[0])) {
											const kanji = character_string[0];
											character_string = character_string.slice(1);
											const viable_readings = kanji_data[kanji].readings.filter((kanji_reading) =>
												r.startsWith(kanji_reading.reading)
											);
											if (viable_readings.length === 0) {
												return [kanji, undefined];
											}
											if (
												sortBy(viable_readings, (r: { reading: string }) => r.reading.length)
													.reverse()
													.filter(
														(v: { reading: string }) =>
															v.reading.length === viable_readings[0].reading.length
													)
													.every(
														(v: { reading: string }) => v.reading === viable_readings[0].reading
													)
											) {
												kanji_types.push(viable_readings[0].reading_type);
												r = r.slice(viable_readings[0].reading.length);
											} else {
												throw new Error(
													`Multiple viable ${kanji} readings ${[
														...new Set(viable_readings.map((v) => v.reading))
													].join(', ')} on ${r_ref.reading}`
												);
											}
										} else {
											throw new Error(
												`Invalid character ${character_string} in ${subject.characters} for ${r_ref.reading} - ${r}`
											);
										}
									}
									return [r_ref.reading, kanji_types];
								})
							);
						})();
						if (Object.values(kanji_types).every((v) => v !== undefined)) {
							if (Object.entries(kanji_types).length === 0) {
								throw new Error('No Vocabulary reading found');
							}
							const kanji_type = Object.values(kanji_types)[0];
							if (kanji_type === undefined) {
								throw new Error("Internal error: kanji_type can't be undefined");
							}
							// if (
							// 	!kanji_type.every((v) => v === undefined) &&
							// 	Object.entries(kanji_types).length === 1
							// ) {
							// 	new_lessons.push({
							// 		lesson_type: 'vocabulary_kun_on_yomi',
							// 		required_data: {
							// 			vocabulary: txt,
							// 			string_map: kanji_type.map((v) => (v === undefined ? 'NONE' : v))
							// 		},
							// 		subject_id: subject_id,
							// 		skill_level: skill_level,
							// 		subject_type: 'VOCABULARY',
							// 		need_input: false,
							// 		preferred_tab: 'Readings'
							// 	});
							// } TODO add a toggle for this
						}
					}
				} else if (is_radical_data(subject)) {
					if (skill_level === 0) {
						const v: Lesson = {
							lesson_type: 'new_subject',
							required_data: subject.characters
								? {
										text: subject.characters
								  }
								: {
										image_url:
											subject.image_url ??
											error(`Subject ${subject_id} has no image_url or characters`)
								  },
							subject_id,
							skill_level: 0,
							subject_type: 'RADICAL',
							need_input: false,
							preferred_tab: 'Readings'
						};
						return v;
					}
					new_lessons.push({
						lesson_type: 'text_and_meaning',
						required_data: {
							...(subject.characters
								? {
										text: subject.characters
								  }
								: {
										image_url: subject.image_url ?? error('image_url is undefined')
								  }),
							meanings: subject.meanings.map((meaning) => meaning.meaning),
							to: 'meanings'
						},
						subject_id: subject_id,
						skill_level: skill_level,
						subject_type: 'RADICAL',
						need_input: true,
						preferred_tab: 'Meanings'
					});
				} else {
					throw new Error(`Unsupported subject type ${get_subject_type(subject)}`);
				}
				const returned_lesson = sample(new_lessons) ?? error('No lessons found');
				return returned_lesson;
			})
		)
	).filter(
		(lesson: Lesson<number>) => required_level_table[lesson.lesson_type] <= lesson.skill_level
	);
}
