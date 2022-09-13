<script lang="ts">
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import { get_lessons } from './get_lessons';
	import { get } from 'svelte/store';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { browser } from '$app/environment';
	import TextMeaning from './text_meaning.svelte';
	import { is_loading_store } from '$lib/scripts/frontend/is_loading';
	import LessonUi from './lesson_ui.svelte';

	async function decrease_level(subject_id: number) {
		await update_subject_progress(
			subject_id,
			(get(subject_store).get(subject_id) ?? error(`Data for Subject ${subject_id} not in store`))
				.skill_level - 1
		);
	}

	let lesson_queue: Lesson[] = [];

	async function update_lessons() {
		lesson_queue = await get_lessons();
		if (lesson_queue.length === 0) {
			throw new Error('No lessons found');
		}
		if (current_lesson === undefined) {
			current_lesson = lesson_queue.shift();
		}
	}

	let current_lesson: Lesson | undefined = undefined;

	async function next_lesson() {
		current_lesson = lesson_queue.shift();
		if (current_lesson === undefined) {
			is_loading_store.set(true);
		}
		try {
			if (lesson_queue.length === 0) {
				await update_lessons();
			}
		} finally {
			is_loading_store.set(false);
		}
		current_lesson_state = 'in_progress';
		current_input = '';
	}

	if (browser) {
		update_lessons();
	}

	$: current_lesson,
		(async () => {
			{
				// DEV ONLY [TODO] remove
				while (
					current_lesson?.lesson_type !== 'text_and_meaning' &&
					get(is_loading_store) === false
				) {
					console.log('Skipping lesson');
					await next_lesson();
				}
			}
		})();

	let current_lesson_state: 'in_progress' | 'wrong' | 'waiting_for_next' = 'in_progress';
	let current_input = '';
	let correct: boolean = false;
	let question = '';

	function confirm() {
		if (current_lesson_state === 'in_progress') {
			if (correct) {
				current_lesson_state = 'waiting_for_next';
				next_lesson();
			} else {
				current_lesson_state = 'wrong';
			}
		} else if (current_lesson_state === 'wrong') {
			current_lesson_state = 'waiting_for_next';
			next_lesson();
		}
	}
</script>

<div class="outer">
	<!-- <div class="left">
		<p>
			CURRENT:
			<PrettyObj obj={current_lesson} />
		</p>
		<p>
			ALL:
			<PrettyObj obj={lesson_queue} />
		</p>
	</div> -->
	<LessonUi
		lesson={current_lesson}
		bind:response_value={current_input}
		response_type={current_lesson_state === 'wrong' ? 'locked' : 'ja'}
		{question}
		next_lesson={confirm}
	>
		<div>
			{#if current_lesson}
				{#if current_lesson.lesson_type === 'text_and_meaning'}
					<TextMeaning
						{current_lesson}
						bind:current_input
						bind:correct
						bind:question
						show_correct={current_lesson_state === 'wrong'}
					/>
				{:else}
					<p>Unknown lesson type</p>
				{/if}
			{/if}
		</div>
	</LessonUi>
</div>

<style>
	.outer {
		display: flex;
		flex-direction: row;
	}
</style>
