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
	import { cloneDeep } from 'lodash-es';
	import NewSubject from './new_subject.svelte';
	import VocabKunOnNan from './vocab_kun_on_nan.svelte';

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

	const max_chunks = 3;

	let lesson_queue: Lesson[] = [];
	let lesson_chunks: Lesson[][] = [];
	let level_promises: Promise<void>[][] = [];
	let chunk_load_active = false;

	async function load_chunks(): Promise<void> {
		if (lesson_queue.length !== 0 && lesson_chunks.length >= max_chunks) {
			return;
		}
		if (chunk_load_active) {
			return;
		}
		debugger;
		const preloaded_chunk_amount = lesson_chunks.length - 1;
		const next_chunk_promise = (async () => {
			chunk_load_active = true;
			if (level_promises.length >= max_chunks) {
				await Promise.all(level_promises.shift() ?? error('level_promises is empty'));
			}
			const previous_ids = lesson_chunks.flat().map((lesson) => lesson.subject_id);
			const next_chunk = await get_lessons(previous_ids);

			lesson_chunks.push(next_chunk);
			//console.log('next_chunk', next_chunk);
			chunk_load_active = false;
		})();
		if (preloaded_chunk_amount <= 0) {
			await next_chunk_promise;
		}
		if (lesson_chunks.length > max_chunks) {
			lesson_chunks.shift();
		}
		if (lesson_queue.length === 0) {
			lesson_queue = cloneDeep(lesson_chunks[0] ?? error('lesson_chunks is empty'));
			//console.log('lesson_queue', lesson_queue);
			level_promises.push([]);
		}
		if (lesson_chunks.length < max_chunks) {
			(async () => {
				await next_chunk_promise;
				await load_chunks();
			})();
		}
	}

	let current_lesson: Lesson | undefined = undefined;

	async function next_lesson() {
		try {
			if (lesson_queue.length === 0) {
				is_loading_store.set(true);
				await load_chunks();
			}
		} finally {
			is_loading_store.set(false);
		}
		current_lesson = lesson_queue.shift();
		current_lesson_state = 'in_progress';
		current_input = '';
		// if (current_lesson && current_lesson.subject_id !== 8761) {
		// 	await change_level(current_lesson.subject_id, 1);
		// 	await next_lesson();
		// }
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
				level_promises[0].push(change_level(current_lesson.subject_id, 1));
				await next_lesson();
				return true;
			} else {
				current_lesson_state = 'wrong';
				if (current_lesson.skill_level > 1) {
					level_promises[0].push(change_level(current_lesson.subject_id, -1));
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

	if (browser) {
		next_lesson();
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
		bind:lesson={current_lesson}
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
				{:else if current_lesson.lesson_type === 'vocabulary_kun_on_yomi'}
					<VocabKunOnNan
						lesson={current_lesson}
						bind:correct
						bind:question
						show_correct={current_lesson_state === 'wrong'}
					/>
				{:else if current_lesson.lesson_type === 'new_subject'}
					<NewSubject lesson={current_lesson} bind:question />
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
