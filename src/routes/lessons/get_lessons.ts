import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
import {
	get_subject_type,
	is_kanji_data,
	is_radical_data,
	is_vocabulary_data,
	KanjiDataSchema,
	type ReadingTypeType
} from '$lib/scripts/universal/datatypes';
import type { Lesson } from '$lib/scripts/universal/lesson_type';
import { error } from 'functional-utilities';
import { sortBy } from 'lodash-es';
import { isKanji } from 'wanakana';
import { z } from 'zod';

const required_level_table: Record<Lesson['lesson_type'], number> = {
	//kanji_nan_kun_on_yomi: 1,
	reading_and_meaning: 0,
	text_and_meaning: 0,
	vocabulary_kun_on_yomi: 1
};

export async function get_lessons() {
	const subjects = await get_lesson_subjects();
	return sortBy(
		(
			await Promise.all(
				subjects.map(async ({ skill_level, subject, subject_id }) => {
					const new_lessons: Lesson[] = [];
					if (is_kanji_data(subject)) {
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
							const partial_required_data = {
								meanings: subject.meanings.map((m) => m.meaning),
								readings: subject.readings.map((r) => r.reading)
							};
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'KANJI',
								skill_level: skill_level,
								need_input: true
							});
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'readings'
								},
								subject_id: subject_id,
								subject_type: 'KANJI',
								skill_level: skill_level,
								need_input: true
							});
						}
					} else if (is_vocabulary_data(subject)) {
						const txt = subject.characters;
						{
							const partial_required_data = {
								text: txt,
								meanings: subject.meanings.map((m) => m.meaning)
							};
							new_lessons.push({
								lesson_type: 'text_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true
							});
							new_lessons.push({
								lesson_type: 'text_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'symbol'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true
							});
						}
						{
							const partial_required_data = {
								readings: subject.readings.map((r) => r.reading),
								meanings: subject.meanings.map((m) => m.meaning)
							};
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'meanings'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true
							});
							new_lessons.push({
								lesson_type: 'reading_and_meaning',
								required_data: {
									...partial_required_data,
									to: 'readings'
								},
								subject_id: subject_id,
								subject_type: 'VOCABULARY',
								skill_level: skill_level,
								need_input: true
							});
						}

						{
							const kanji_types = await (async () => {
								const kanji_data = z.record(z.string(), KanjiDataSchema).parse(
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
													viable_readings.every((v) => v.reading === viable_readings[0].reading)
												) {
													kanji_types.push(viable_readings[0].reading_type);
													r = r.slice(viable_readings[0].reading.length);
												} else {
													throw new Error(
														`Multiple viable ${kanji} readings ${new Array(
															new Set(viable_readings.map((v) => v.reading)).keys()
														).join(', ')}`
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
								if (Object.entries(kanji_types).length > 1) {
									throw new Error('Multiple Vocabulary reading are not supported yet');
								}
								if (Object.entries(kanji_types).length === 0) {
									throw new Error('No Vocabulary reading found');
								}
								const kanji_type = Object.values(kanji_types)[0];
								if (kanji_type === undefined) {
									throw new Error("Internal error: kanji_type can't be undefined");
								}
								if (!kanji_type.every((v) => v === undefined)) {
									new_lessons.push({
										lesson_type: 'vocabulary_kun_on_yomi',
										required_data: {
											vocabulary: txt,
											string_map: kanji_type.map((v) => (v === undefined ? 'NONE' : v))
										},
										subject_id: subject_id,
										skill_level: skill_level,
										subject_type: 'VOCABULARY',
										need_input: false
									});
								}
							}
						}
					} else if (is_radical_data(subject)) {
						new_lessons.push({
							lesson_type: 'text_and_meaning',
							required_data: {
								text: subject.characters ?? error('No characters'),
								meanings: subject.meanings.map((meaning) => meaning.meaning),
								to: 'meanings'
							},
							subject_id: subject_id,
							skill_level: skill_level,
							subject_type: 'RADICAL',
							need_input: true
						});
					} else {
						throw new Error(`Unsupported subject type ${get_subject_type(subject)}`);
					}
					return new_lessons;
				})
			)
		).flat(),
		(lesson: Lesson<number>) => lesson.skill_level + Math.random() * 0.5
	).filter(
		(lesson: Lesson<number>) => required_level_table[lesson.lesson_type] <= lesson.skill_level
	);
}
