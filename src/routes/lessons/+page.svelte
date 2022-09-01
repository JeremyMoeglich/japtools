<script lang="ts">
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import { get_lessons } from './get_lessons';
	import { get } from 'svelte/store';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
import PrettyObj from '$lib/components/pretty_obj.svelte';
import ReadingMeaning from './reading_meaning.svelte';

	async function decrease_level(subject_id: number) {
		await update_subject_progress(
			subject_id,
			(get(subject_store).get(subject_id) ?? error(`Data for Subject ${subject_id} not in store`))
				.skill_level - 1
		);
	}

	let lesson_queue: Lesson[] = [];

	$: (async () => {
		if (lesson_queue.length === 0) {
			lesson_queue = await get_lessons();
			if (lesson_queue.length === 0) {
				throw new Error('No lessons found');
			}
		}
	})();

	let current_lesson: Lesson | undefined = undefined;
	
	function next_lesson() {
		current_lesson = lesson_queue.shift();
	}
</script>

<div>
	<div class="left">
		<PrettyObj obj={lesson_queue} />
	</div>
	<div class="comp">
		{#if current_lesson}
			{#if current_lesson.lesson_type === 'reading_and_meaning'}
				<ReadingMeaning {current_lesson} />
			{:else}
				<p>Unknown lesson type</p>
			{/if}
		{/if}
	</div>
</div>
