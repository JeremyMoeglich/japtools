<script lang="ts">
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import { get_lessons } from './get_lessons';
	import { get } from 'svelte/store';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import { browser } from '$app/environment';
	import TextMeaning from './text_meaning.svelte';
	import { is_loading_store } from '$lib/scripts/frontend/is_loading';
	import LessonUi from './lesson_ui.svelte';
	import ReadingMeaning from './reading_meaning.svelte';

	async function change_level(subject_id: number, n: number) {
		await update_subject_progress(
			subject_id,
			Math.max(
				0,
				(get(subject_store).get(subject_id) ?? error(`Data for Subject ${subject_id} not in store`))
					.skill_level + n
			)
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
		// if (current_lesson && current_lesson.subject_id !== 8761) {
		// 	await change_level(current_lesson.subject_id, 1);
		// 	await next_lesson();
		// }
	}

	if (browser) {
		update_lessons();
	}

	let current_lesson_state: 'in_progress' | 'wrong' | 'waiting_for_next' = 'in_progress';
	let current_input = '';
	let correct: boolean = false;
	let question = '';

	async function confirm() {
		if (!current_lesson) {
			throw new Error('No lesson');
		}
		if (current_lesson_state === 'in_progress') {
			if (correct || current_lesson.skill_level === 0) {
				current_lesson_state = 'waiting_for_next';
				const change_level_promise = change_level(current_lesson.subject_id, 1);
				if (lesson_queue.length === 0) {
					await change_level_promise;
				}
				await next_lesson();
				return true;
			} else {
				current_lesson_state = 'wrong';
				if (current_lesson.skill_level > 1) {
					await change_level(current_lesson.subject_id, -1);
				}
				return false;
			}
		} else if (current_lesson_state === 'wrong') {
			current_lesson_state = 'waiting_for_next';
			await next_lesson();
			return true;
		} else {
			return true;
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
		response_type={current_lesson_state === 'wrong'
			? 'locked'
			: current_lesson?.preferred_tab === 'Readings'
			? 'ja'
			: 'en'}
		{question}
		{confirm}
		show_correct={current_lesson_state === 'wrong'}
	>
		<div>
			{#if current_lesson}
				{#if current_lesson.lesson_type === 'text_and_meaning'}
					<TextMeaning
						lesson={current_lesson}
						input_value={current_input}
						bind:correct
						bind:question
						show_correct={current_lesson_state === 'wrong'}
					/>
				{:else if current_lesson.lesson_type === 'reading_and_meaning'}
					<ReadingMeaning
						lesson={current_lesson}
						input_value={current_input}
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
		height: 100%;
	}
</style>
