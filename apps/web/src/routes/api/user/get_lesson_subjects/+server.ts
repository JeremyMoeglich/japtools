import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import { get_auth_user_data, get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import {
	get_subjects_by_level,
	get_subject_by_id
} from '$lib/scripts/backend/wanikani_data.server';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { error, json } from '@sveltejs/kit';
import type { SubjectDataType } from '$lib/scripts/universal/datatypes';

//const daily_lesson_limit = 20; [TODO] implement this

export const POST: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	const { amount } = await get_request_body(
		request,
		z.object({
			amount: z.number().min(1).max(100)
		})
	);
	const current_date = new Date();
	const lessons = await prisma_client.subjectProgress.findMany({
		where: {
			progress_id: user_data.progress_id,
			next_review: {
				lte: current_date
			}
		},
		orderBy: {
			next_review: 'desc'
		},
		select: {
			subject_id: true,
			skill_level: true,
			next_review: true
		},
		take: amount
	});

	if (lessons.length < amount) {
		const next_day_lessons = await prisma_client.subjectProgress.findMany({
			where: {
				progress_id: user_data.progress_id,
				next_review: {
					gte: current_date,
					lt: new Date(current_date.getTime() + 86400000)
				}
			},
			orderBy: {
				next_review: 'desc'
			},
			select: {
				subject_id: true,
				skill_level: true,
				next_review: true
			}
		});
		for (const lesson of next_day_lessons) {
			if (lessons.length >= amount) {
				break;
			}
			if (lesson.skill_level > 5) {
				lessons.push(lesson);
			}
		}
		if (!(lessons.length >= amount) && lessons.length < amount) {
			const amount_to_add = amount - lessons.length;
			console.log('amount_to_add', amount_to_add);
			const current_level = (
				await prisma_client.progress.findUnique({
					where: {
						id: user_data.progress_id
					},
					select: {
						current_level: true
					}
				})
			)?.current_level;
			if (current_level === undefined) {
				throw error(500, 'User has no current level');
			}
			const existing_level_subject_ids = (
				await prisma_client.subjectProgress.findMany({
					where: {
						level: current_level,
						progress_id: user_data.progress_id
					},
					select: {
						subject_id: true
					}
				})
			).map((subject) => subject.subject_id);

			const possible_subjects = (await get_subjects_by_level(current_level)).filter(
				(subject: SubjectDataType) => {
					if (existing_level_subject_ids.includes(subject.id)) {
						return false;
					}
					return true;
				}
			);
			const subjects_to_add = possible_subjects.slice(0, amount_to_add);
			const added = await Promise.all(
				subjects_to_add.map(async (subject) => {
					const promise = await prisma_client.subjectProgress.create({
						data: {
							progress_id: user_data.progress_id,
							subject_id: subject.id,
							next_review: current_date,
							level: current_level
						}
					});
					return promise;
				})
			);
			console.log(`Added ${added.length} subjects to lessons`);
			for (const subject of added) {
				lessons.push(subject);
			}
		}
	}

	//remove duplicates
	const subject_ids = lessons.map((lesson) => lesson.subject_id);
	const filtered_lessons = lessons.filter((lesson, index) => {
		const found_index = subject_ids.indexOf(lesson.subject_id);
		if (found_index === index) {
			return true;
		} else {
			console.log('Duplicate lesson found');
			return false;
		}
	});
	const lesson_subjects = await Promise.all(
		filtered_lessons.map(async (lesson) => ({
			subject_id: lesson.subject_id,
			skill_level: lesson.skill_level,
			next_review: lesson.next_review.toISOString(),
			subject: await get_subject_by_id(lesson.subject_id)
		}))
	);

	console.log(`Sending ${lessons.length} lessons to user ${user_data.name}`);

	return json({
		lessons: lesson_subjects
	});
};
