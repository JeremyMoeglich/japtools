import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import { get_auth_user_data, get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { json } from '@sveltejs/kit';
import { get_next_date } from '$lib/scripts/universal/date_gen';

export const POST: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	const { subject_id, skill_level, level } = await get_request_body(
		request,
		z.object({
			subject_id: z.number().min(0).int(),
			skill_level: z.number().min(0).int(),
			level: z.number().min(0).int()
		})
	);

	const next_review = get_next_date(skill_level);
	console.log('next_review', next_review.toLocaleDateString(), next_review.toLocaleTimeString());

	//const now = new Date();
	//console.log(
	//	'timemap\n',
	//	range(10)
	//		.map((n) => {
	//			const diff = date_diff(get_next_date(n), now);
	//			return `${n} ${diff}`;
	//		})
	//		.join('\n')
	//);

	await prisma_client.$transaction([
		prisma_client.subjectProgress.upsert({
			where: {
				subject_id_progress_id: {
					subject_id,
					progress_id: user_data.progress_id
				}
			},
			update: {
				skill_level,
				next_review,
				last_level_change: new Date()
			},
			create: {
				subject_id,
				progress_id: user_data.progress_id,
				skill_level,
				next_review,
				level,
				last_level_change: new Date()
			}
		}),
		prisma_client.user.update({
			where: {
				id: user_data.id
			},
			data: {
				total_completed: user_data.total_completed + 1
			}
		})
	]);
	return json({});
};
