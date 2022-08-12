<script lang="ts">
	import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { lesson_subject_data_type } from '$lib/scripts/universal/datatypes';
	import type { SubjectDataOuter } from '$lib/scripts/universal/wanikani_data';

	let subjects: Awaited<ReturnType<typeof get_lesson_subjects>> = [];

	let subject_map: Record<number, typeof subjects[number]> = {};
	$: {
		subject_map = {};
		for (let subject of subjects) {
			subject_map[subject.subjectId] = subject;
		}
	}

	const subject_level_decrease: Record<number, number> = {};

	async function decrease_level(subjectId: number) {
		if (subject_level_decrease[subjectId] === undefined) {
			subject_level_decrease[subjectId] = 0;
		}

		if (subject_level_decrease[subjectId] < 2) {
			await update_subject_progress(subjectId, subject_map[subjectId].skill_level - 1);
		}

		subject_level_decrease[subjectId]++;
	}

	type lesson_types: ()[] = [
		{
			subject_type: SubjectDataOuter['object'];
		}
	]

	const lesson_queue: lesson_type[] = [];

	let subject_queue: lesson_subject_data_type[] = [];

	$: (async () => {
		if (subject_queue.length === 0) {
			subject_queue = await get_lesson_subjects();
		}
	})();
</script>
