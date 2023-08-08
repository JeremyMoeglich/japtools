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
import { pipe } from 'functional-utilities';

//const daily_lesson_limit = 20; [TODO] implement this
const max_add = 1;

export const POST: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	const { amount, previous } = pipe(
		await get_request_body(
			request,
			z.object({
				max_amount: z.number().min(1).max(100),
				previous: z.number().array().optional()
			})
		),
		(body) => ({
			amount: body.max_amount,
			previous: body.previous ?? []
		})
	);
	const current_date = new Date();
	const lessons = (
		await prisma_client.subjectProgress.findMany({
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
		})
	).filter((lesson) => !previous.includes(lesson.subject_id));

	if (lessons.length < amount) {
		const next_day_lessons = (
			await prisma_client.subjectProgress.findMany({
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
			})
		).filter((lesson) => !previous.includes(lesson.subject_id));
		for (const lesson of next_day_lessons) {
			if (lessons.length >= amount) {
				break;
			}
			if (lesson.skill_level > 3) {
				lessons.push(lesson);
			}
		}
		if (lessons.length < amount) {
			let current_level = (
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
			let amount_added = 0;
			while (current_level < 60 && lessons.length < amount) {
				const amount_to_add = amount - lessons.length;
				console.log('Adding new words: n =', amount_to_add);
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
						return !previous.includes(subject.id);
					}
				);
				const subjects_to_add = possible_subjects.slice(0, Math.min(amount_to_add, max_add));
				const added = subjects_to_add.map((subject) => ({
					progress_id: user_data.progress_id,
					subject_id: subject.id,
					next_review: current_date,
					level: current_level,
					skill_level: 0
				}));
				//console.log(`Added ${added.length} subjects to lessons`);
				for (const subject of added) {
					lessons.push(subject);
				}

				amount_added += added.length;

				if (lessons.length < amount && amount_added < max_add) {
					current_level++;
				}
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

	//console.log(`Sending ${lessons.length} lessons to user ${user_data.name}`);

	return json({
		lessons: lesson_subjects
	});
};
