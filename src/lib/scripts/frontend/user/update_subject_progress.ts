export async function update_subject_progress(subject_id: number, skill_level: number) {
	const response = await fetch('/api/user/update_subject_progress', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			subject_id: subject_id,
			skill_level
		})
	});
	if (response.status !== 200) {
		throw new Error(await response.text());
	}
}
