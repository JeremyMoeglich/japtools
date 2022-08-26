import { prisma_client } from '$lib/scripts/backend/db/prisma_client';
import { get_auth_user_data, get_request_body } from '$lib/scripts/backend/endpoint_utils';
import type { RequestHandler } from './$types';
import { range } from 'functional-utilities';
import { z } from 'zod';
import { json } from '@sveltejs/kit';

function get_next_date(n: number): Date {
	const hour_offset = range(n).reduce((acc, _) => acc + acc ** 1.1 + 1, 0);
	return new Date(Date.now() + hour_offset * 3600000);
}

export const UPDATE: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	const { subjectId, skill_level } = await get_request_body(
		request,
		z.object({
			subjectId: z.number().min(0).int(),
			skill_level: z.number().min(0).int()
		})
	);

	const next_review = get_next_date(skill_level);

	await prisma_client.subjectProgress.update({
		where: {
			subjectId_progressId: {
				subjectId,
				progressId: user_data.progressId
			}
		},
		data: {
			skill_level,
			next_review
		}
	});
	return json({})
};