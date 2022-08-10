<script lang="ts">
	import { get_lesson_subjects } from '$lib/scripts/frontend/user/get_lesson_subjects';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';

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

	type lesson_type = {
		subjectId: number;
	} & {};

	const lesson_queue: lesson_type[] = [];
</script>
