import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import { get_auth_user_data, get_request_body } from '$lib/scripts/backend/endpoint_utils';
import { get_subjects_by_level, get_subject_by_id } from '$lib/scripts/universal/wanikani_data';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { error, json } from '@sveltejs/kit';

const daily_lesson_limit = 20;

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
			progressId: user_data.progressId,
			next_review: {
				lte: current_date
			}
		},
		orderBy: {
			next_review: 'desc'
		},
		select: {
			subjectId: true,
			skill_level: true,
			next_review: true
		},
		take: amount
	});
	if (lessons.length < amount) {
		const next_day_lessons = await prisma_client.subjectProgress.findMany({
			where: {
				progressId: user_data.progressId,
				next_review: {
					gte: current_date,
					lt: new Date(current_date.getTime() + 86400000)
				}
			},
			orderBy: {
				next_review: 'desc'
			},
			select: {
				subjectId: true,
				skill_level: true,
				next_review: true
			}
		});
		const lesson_total = next_day_lessons.length + lessons.length;
		if (!(lesson_total >= daily_lesson_limit)) {
			const amount_to_add = daily_lesson_limit - lesson_total;
			const current_level = (
				await prisma_client.progress.findUnique({
					where: {
						id: user_data.progressId
					},
					select: {
						current_level: true
					}
				})
			)?.current_level;
			if (!current_level) {
				throw error(500, 'User has no current level');
			}
			const added_level_subject_ids = (
				await prisma_client.subjectProgress.findMany({
					where: {
						level: current_level,
						progressId: user_data.progressId
					},
					select: {
						subjectId: true
					}
				})
			).map((subject) => subject.subjectId);

			const possible_subjects = get_subjects_by_level(current_level).filter((subject) => {
				if (added_level_subject_ids.includes(subject.id)) {
					return false;
				}
				return true;
			});
			const subjects_to_add = possible_subjects.slice(0, amount_to_add);
			await Promise.all(
				subjects_to_add.map((subject) => {
					const subject_data = get_subject_by_id(subject.id);
					if (!subject_data) {
						throw error(500, 'Could not get subject data');
					}
					const promise = prisma_client.subjectProgress.create({
						data: {
							progressId: user_data.progressId,
							subjectId: subject.id,
							next_review: current_date,
							level: current_level
						}
					});
					return promise;
				})
			);
		}
	}
	return json({
		lessons: lessons.map((lesson) => ({
			subjectId: lesson.subjectId,
			skill_level: lesson.skill_level,
			next_review: lesson.next_review.toISOString(),
			subject: get_subject_by_id(lesson.subjectId)
		}))
	})
};