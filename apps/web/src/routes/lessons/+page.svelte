<script lang="ts">
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import type { Lesson } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import { get_lessons } from './get_lessons';
	import { get } from 'svelte/store';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import TextMeaning from './text_meaning.svelte';
	import { is_loading_store } from '$lib/scripts/frontend/is_loading';
	import LessonUi from './lesson_ui.svelte';
	import ReadingMeaning from './reading_meaning.svelte';
	import { cloneDeep } from 'lodash-es';
	import NewSubject from './new_subject.svelte';
	import VocabKunOnNan from './vocab_kun_on_nan.svelte';
	import { browser } from '$app/environment';
	import TitleRender from './title_render.svelte';
	//import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { user_data_store } from '$lib/scripts/frontend/auth/user_data';
	import { reverse_get_next_date } from '$lib/scripts/universal/date_gen';
	import type { LessonSubjectDataType } from '$lib/scripts/universal/datatypes';

	let level_change_map: Record<number, number> = {};

	function get_max_level_increase(subject_lesson: LessonSubjectDataType): number {
		const review_time = subject_lesson.last_level_change;
		if (!review_time) {
			return 1;
		}
		const now = new Date();
		const hour_offset = (now.getTime() - review_time.getTime()) / 1000 / 60 / 60;
		const time_offset_level = reverse_get_next_date(hour_offset);
		const level_offset = time_offset_level - subject_lesson.skill_level;
		return level_offset + 1;
	}

	async function change_level(subject_id: number, n: number) {
		const current_subject =
			get(subject_store).get(subject_id) ?? error(`Data for Subject ${subject_id} not in store`);
		const current_level = current_subject.skill_level;
		const max_level_increase = get_max_level_increase(current_subject);
		const new_level = Math.max(max_level_increase, current_level + n);
		const current_change = level_change_map[subject_id] ?? 0;
		if (current_change === 0 || (n < 0 && current_change >= -1)) {
			level_change_map[subject_id] = current_change + n;
			await update_subject_progress(subject_id, Math.max(1, new_level));
		}
	}

	const max_chunks = 2;

	let lesson_queue: Lesson[] = [];
	let lesson_chunks: Lesson[][] = [];
	let level_promises: Promise<void>[][] = [];
	let active_load: undefined | Promise<void[]>;

	async function load_chunks(): Promise<void> {
		if (lesson_queue.length !== 0) {
			return;
		}
		if (lesson_chunks.length >= max_chunks) {
			lesson_queue = cloneDeep(lesson_chunks.shift() ?? error('lesson_chunks is empty'));
			return;
		}
		if (active_load) {
			await active_load;
			return;
		}
		const preloaded_chunk_amount = lesson_chunks.length - 1;
		const next_chunk_promise =
			lesson_chunks.length > max_chunks
				? undefined
				: (async () => {
						if (level_promises.length >= max_chunks) {
							active_load = Promise.all(level_promises.shift() ?? error('level_promises is empty'));
							await active_load;
						}
						const previous_ids = [
							...new Set(
								lesson_chunks
									.flat()
									.concat(lesson_queue)
									.map((lesson) => lesson.subject_id)
							)
						];
						const next_chunk = await get_lessons(previous_ids);

						lesson_chunks.push(next_chunk);
						//console.log('next_chunk', next_chunk);
						active_load = undefined;
				  })();
		if (preloaded_chunk_amount <= 0 && lesson_queue.length === 0) {
			await next_chunk_promise;
		}
		if (lesson_queue.length === 0) {
			lesson_queue = cloneDeep(lesson_chunks.shift() ?? error('lesson_chunks is empty'));
			//console.log('lesson_queue', lesson_queue);
			level_promises.push([]);
			level_change_map = {};
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
		} catch (e) {
			console.error(e);
		} finally {
			is_loading_store.set(false);
		}
		current_lesson = lesson_queue.shift() ?? error('lesson_queue is empty');
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

	$: get(user_data_store) && current_lesson === undefined && browser ? next_lesson() : undefined;
	// $: current_subject_lession = current_lesson
	// 	? get(subject_store).get(current_lesson.subject_id)
	// 	: undefined;
</script>

<div class="outer">
	<!-- <div>
		{#each lesson_queue as lesson, i}
			<div>
				{lesson.subject_id} - {lesson.skill_level} - {lesson.lesson_type}
			</div>
		{/each}
	</div> -->
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
			{:else}
				<TitleRender type={'text'} value={' '} />
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
