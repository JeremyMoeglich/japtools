import { prisma_client } from '$lib/scripts/backend/prisma_client.server';
import { get_auth_user_data, get_request_body } from '$lib/scripts/backend/endpoint_utils.server';
import type { RequestHandler } from './$types';
import { range } from 'functional-utilities';
import { z } from 'zod';
import { json } from '@sveltejs/kit';
import { get_subject_by_id } from '$lib/scripts/backend/wanikani_data.server';

function date_diff(a: Date, b: Date): string {
	const diff = a.getTime() - b.getTime();
	const hours = Math.floor(diff / 3600000);
	const minutes = Math.floor((diff - hours * 3600000) / 60000);
	const seconds = Math.floor((diff - hours * 3600000 - minutes * 60000) / 1000);
	return `${hours}:${minutes}:${seconds}`;
}

function get_next_date(n: number): Date {
	if (n < 0) {
		n = 0;
	}
	const hour_offset = range(n).reduce((acc) => acc + acc ** 1.1 + 1, 0);
	return new Date(Date.now() + hour_offset * 3600000);
}

export const POST: RequestHandler = async ({ request }) => {
	const user_data = await get_auth_user_data(request);
	const { subject_id, skill_level } = await get_request_body(
		request,
		z.object({
			subject_id: z.number().min(0).int(),
			skill_level: z.number().min(0).int()
		})
	);

	const subject = await get_subject_by_id(subject_id);

	const next_review = get_next_date(skill_level);
	console.log(
		'next_review',
		next_review.toLocaleDateString(),
		next_review.toLocaleTimeString(),
		subject.characters
	);

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

	await prisma_client.subjectProgress.update({
		where: {
			subject_id_progress_id: {
				subject_id,
				progress_id: user_data.progress_id
			}
		},
		data: {
			skill_level,
			next_review
		}
	});
	return json({});
};
