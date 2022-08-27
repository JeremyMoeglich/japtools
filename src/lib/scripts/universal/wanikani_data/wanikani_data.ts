import raw_data from '$lib/data/wanikani_data.json';
import { z } from 'zod';
import { subjectDataOuterSchema } from './wanikani_schema';
import type { SubjectDataOuter } from './wanikani_types';

const wanikani_data_id_index = z.record(z.string(), subjectDataOuterSchema).parse(raw_data);
const wanikani_data_level_index: Map<number, Array<number>> = Object.entries(wanikani_data_id_index)
	.map(([id, data]) => {
		const level = data.data.level;
		return [level, parseInt(id)] as [number, number];
	})
	.reduce((current, [level, id]) => {
		const ids = current.get(level) ?? [];
		ids.push(id);
		current.set(level, ids);
		return current;
	}, new Map<number, Array<number>>());

const wanikani_data_reading_index: Map<string, Array<string>> = Object.entries(
	wanikani_data_id_index
).reduce((current, [id, data]) => {
	const readings = data.object !== 'radical' ? data.data.readings : [];
	readings.forEach((reading) => {
		if (current.has(reading.reading)) {
			current.get(reading.reading)?.push(id);
		} else {
			current.set(reading.reading, [id]);
		}
	});
	return current;
}, new Map<string, Array<string>>());
const wanikani_data_kanji_index: Map<string, string> = Object.entries(
	wanikani_data_id_index
).reduce((current, [id, data]) => {
	if (data.object !== 'kanji') {
		return current;
	}
	const symbol = data.data.characters;

	if (current.has(symbol)) {
		throw new Error(`Duplicate symbol: ${symbol}`);
	} else {
		current.set(symbol, id);
	}

	return current;
}, new Map<string, string>());

export function get_subject_by_id(id: number): SubjectDataOuter {
	return wanikani_data_id_index[id.toString()];
}

export function get_subjects_by_level(level: number): SubjectDataOuter[] {
	const ids = wanikani_data_level_index.get(level);
	if (ids === undefined) {
		throw new Error(`No subjects found for level ${level}`);
	}
	return ids.map((id) => get_subject_by_id(id));
}

export function get_subjects_by_reading(reading: string): SubjectDataOuter[] {
	const ids = wanikani_data_reading_index.get(reading);
	if (ids === undefined) {
		throw new Error(`No subjects found for reading ${reading}`);
	}
	return ids.map((id) => get_subject_by_id(parseInt(id)));
}

export function get_subject_by_kanji(symbol: string) {
	const id = wanikani_data_kanji_index.get(symbol);
	if (id === undefined) {
		return undefined;
	}
	const subject = get_subject_by_id(parseInt(id));
	if (subject.object !== 'kanji') {
		throw new Error(`Subject ${id} is not a kanji`);
	}
	return subject;
}
