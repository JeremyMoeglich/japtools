import { domain } from '$lib/scripts/frontend/domain';
import { error } from 'functional-utilities';
import { get } from 'svelte/store';
import { subject_store } from './subject_store';

export async function update_subject_progress(subject_id: number, skill_level: number) {
	const current_subject_store = get(subject_store);
	const current_subject = current_subject_store.get(subject_id) ?? error('subject not found');

	const response = await fetch(`${domain}/api/user/update_subject_progress`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			subject_id: subject_id,
			skill_level,
			level: current_subject.subject.level
		})
	});
	if (response.status !== 200) {
		throw new Error(await response.text());
	}

	current_subject.skill_level = skill_level;
	current_subject_store.set(subject_id, current_subject);
	subject_store.set(current_subject_store);
}
