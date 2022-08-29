import { hasProperty } from 'functional-utilities';

export async function update_subject_progress(subject_id: number, skill_level: number) {
	const lessons_raw: unknown = await (
		await fetch('/api/user/update_subject_progress', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				subject_id: subject_id,
				skill_level
			})
		})
	).json();
	if (hasProperty(lessons_raw, 'error')) {
		if (typeof lessons_raw.error !== 'string') {
			throw new Error('Invalid error message');
		}
		throw new Error(lessons_raw.error);
	}
}
