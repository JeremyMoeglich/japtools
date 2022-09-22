import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import {
	type KanjiDataType,
	type RadicalDataType,
	type SubjectDataType,
	type VocabularyDataType,
	is_radical_data
} from '../universal/datatypes';
import { error } from '@sveltejs/kit';
import type {
	AuxiliaryMeaning,
	ContextSentence,
	KanjiReading,
	KanjiSubject,
	RadicalSubject,
	SubjectMeaning,
	SubjectType,
	VocabularyReading,
	VocabularySubject
} from '@prisma/client/edge';
import { typed_from_entries } from 'functional-utilities';

function convert_vocabulary(
	data: VocabularySubject & {
		auxiliary_meanings: AuxiliaryMeaning[];
		context_sentences: ContextSentence[];
		meanings: SubjectMeaning[];
		readings: VocabularyReading[];
	}
): VocabularyDataType {
	return {
		...data,
		auxiliary_meanings: data.auxiliary_meanings.map((auxiliary_meaning) => ({
			...auxiliary_meaning,
			subject_id: auxiliary_meaning.vocabularySubjectId ?? error(500, 'Subject not found')
		})),
		context_sentences: data.context_sentences.map((context_sentence) => ({
			...context_sentence,
			subject_id: context_sentence.vocabularySubjectId ?? error(500, 'Subject not found')
		})),
		meanings: data.meanings.map((meaning) => ({
			...meaning,
			subject_id: meaning.vocabularySubjectId ?? error(500, 'Subject not found')
		})),
		readings: data.readings.map((reading) => ({
			...reading,
			subject_id: reading.vocabularySubjectId ?? error(500, 'Subject not found')
		}))
	};
}

function convert_radical(
	data: RadicalSubject & {
		auxiliary_meanings: AuxiliaryMeaning[];
		meanings: SubjectMeaning[];
	}
): RadicalDataType {
	return {
		...data,
		characters: data.characters ? data.characters : undefined,
		auxiliary_meanings: data.auxiliary_meanings.map((auxiliary_meaning) => ({
			...auxiliary_meaning,
			subject_id: auxiliary_meaning.radicalSubjectId ?? error(500, 'Subject not found')
		})),
		meanings: data.meanings.map((meaning) => ({
			...meaning,
			subject_id: meaning.radicalSubjectId ?? error(500, 'Subject not found')
		})),
		image_url: data.image_url ? data.image_url : undefined
	};
}

function convert_kanji(
	data: KanjiSubject & {
		auxiliary_meanings: AuxiliaryMeaning[];
		meanings: SubjectMeaning[];
		readings: KanjiReading[];
	}
): KanjiDataType {
	return {
		...data,
		meaning_hint: data.meaning_hint ? data.meaning_hint : undefined,
		auxiliary_meanings: data.auxiliary_meanings.map((auxiliary_meaning) => ({
			...auxiliary_meaning,
			subject_id: auxiliary_meaning.kanjiSubjectId ?? error(500, 'Subject not found')
		})),
		meanings: data.meanings.map((meaning) => ({
			...meaning,
			subject_id: meaning.kanjiSubjectId ?? error(500, 'Subject not found')
		})),
		readings: data.readings.map((reading) => ({
			...reading,
			subject_id: reading.kanjiSubjectId ?? error(500, 'Subject not found')
		}))
	};
}

export async function get_subject_by_id(id: number, type?: SubjectType): Promise<SubjectDataType> {
	const subject_type =
		type ??
		(
			await prisma_client.subjectIndex.findUnique({
				where: {
					subjectId: id
				}
			})
		)?.subject_type ??
		error(500, 'Subject not found');

	if (subject_type === 'KANJI') {
		return convert_kanji(
			(await prisma_client.kanjiSubject.findUnique({
				where: {
					id
				},
				include: {
					auxiliary_meanings: true,
					meanings: true,
					readings: true
				}
			})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
		);
	} else if (subject_type === 'VOCABULARY') {
		return convert_vocabulary(
			(await prisma_client.vocabularySubject.findUnique({
				where: {
					id
				},
				include: {
					auxiliary_meanings: true,
					context_sentences: true,
					meanings: true,
					readings: true
				}
			})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
		);
	} else if (subject_type === 'RADICAL') {
		const radical = convert_radical(
			(await prisma_client.radicalSubject.findUnique({
				where: {
					id
				},
				include: {
					auxiliary_meanings: true,
					meanings: true
				}
			})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
		);
		return radical;
	}
	throw new Error('Subject not found');
}

export async function get_subjects_by_level(level: number): Promise<SubjectDataType[]> {
	const subject_index = await prisma_client.subjectIndex.findMany({
		where: {
			level: level
		}
	});
	return await Promise.all(
		subject_index.map(async (subject) => {
			return await get_subject_by_id(subject.subjectId, subject.subject_type);
		})
	);
}

export async function get_subjects_by_reading(reading: string): Promise<SubjectDataType[]> {
	const subject_index = await prisma_client.subjectIndex.findMany({
		where: {
			readings: {
				has: reading
			}
		}
	});
	return await Promise.all(
		subject_index.map(async (subject) => {
			return await get_subject_by_id(subject.subjectId, subject.subject_type);
		})
	);
}

export async function get_subjects_by_readings(
	readings: string[]
): Promise<Record<string, (KanjiDataType | VocabularyDataType)[]>> {
	const unique_readings = Array.from(new Set(readings));
	const unique_subjects_map = typed_from_entries(
		(
			await Promise.all(
				unique_readings.map(async (reading) => {
					return [reading, await get_subjects_by_reading(reading)];
				})
			)
		).map(([reading, subjects]) => [reading, subjects] as [string, SubjectDataType[]])
	);
	return typed_from_entries(
		readings.map((reading) => {
			const subject_map = unique_subjects_map[reading];
			if (subject_map.some((subject) => is_radical_data(subject))) {
				throw error(500, "Internal error Radicals don't have readings");
			}
			return [reading, subject_map as (KanjiDataType | VocabularyDataType)[]];
		})
	);
}

export async function get_subject_by_kanji(symbol: string): Promise<KanjiDataType | undefined> {
	const resp = await prisma_client.kanjiSubject.findUnique({
		where: {
			characters: symbol
		},
		include: {
			auxiliary_meanings: true,
			meanings: true,
			readings: true
		}
	});

	if (!resp) {
		return undefined;
	}

	return convert_kanji(resp);
}
