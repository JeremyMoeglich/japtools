import { prisma_client } from './db/prisma_client.server';
import type { SubjectDataType } from '../universal/datatypes';
import { error } from '@sveltejs/kit';

export async function get_subject_by_id(id: number): Promise<SubjectDataType> {
	const subject_index = await prisma_client.subjectIndex.findUnique({
		where: {
			subjectId: id
		}
	});
	if (subject_index) {
		if (subject_index.subject_type === 'KANJI') {
			return (
				(await prisma_client.kanjiSubject.findUnique({
					where: {
						id: subject_index.subjectId
					}
				})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
			);
		} else if (subject_index.subject_type === 'VOCABULARY') {
			return (
				(await prisma_client.vocabularySubject.findUnique({
					where: {
						id: subject_index.subjectId
					}
				})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
			);
		} else if (subject_index.subject_type === 'RADICAL') {
			return (
				(await prisma_client.radicalSubject.findUnique({
					where: {
						id: subject_index.subjectId
					}
				})) ??
				(() => {
					throw error(500, 'Subject not found');
				})()
			);
		} else {
			throw error(500, 'Internal Error, unknown subject type');
		}
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
			if (subject.subject_type === 'KANJI') {
				return (
					(await prisma_client.kanjiSubject.findUnique({
						where: {
							id: subject.subjectId
						}
					})) ??
					(() => {
						throw error(500, 'Subject not found');
					})()
				);
			} else if (subject.subject_type === 'VOCABULARY') {
				return (
					(await prisma_client.vocabularySubject.findUnique({
						where: {
							id: subject.subjectId
						}
					})) ??
					(() => {
						throw error(500, 'Subject not found');
					})()
				);
			} else if (subject.subject_type === 'RADICAL') {
				return (
					(await prisma_client.radicalSubject.findUnique({
						where: {
							id: subject.subjectId
						}
					})) ??
					(() => {
						throw error(500, 'Subject not found');
					})()
				);
			} else {
				throw error(500, 'Internal Error, unknown subject type');
			}
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
			if (subject.subject_type === 'KANJI') {
				return (
					(await prisma_client.kanjiSubject.findUnique({
						where: {
							id: subject.subjectId
						}
					})) ??
					(() => {
						throw error(500, 'Subject not found');
					})()
				);
			} else if (subject.subject_type === 'VOCABULARY') {
				return (
					(await prisma_client.vocabularySubject.findUnique({
						where: {
							id: subject.subjectId
						}
					})) ??
					(() => {
						throw error(500, 'Subject not found');
					})()
				);
			} else if (subject.subject_type === 'RADICAL') {
				throw error(500, 'Internal Error, radicals do not have readings');
			} else {
				throw error(500, 'Internal Error, unknown subject type');
			}
		})
	);
}

export async function get_subject_by_kanji(symbol: string) {
	const kanji = await prisma_client.kanjiSubject.findUnique({
		where: {
			
		}
	});
}
