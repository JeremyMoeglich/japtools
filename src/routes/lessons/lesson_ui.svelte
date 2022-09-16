<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';

	import type { Lesson } from '$lib/scripts/universal/lesson_type';

	import type { SubjectType } from '@prisma/client';
	import type { MaybePromise } from '@sveltejs/kit/types/internal';
	import LessonInput from './lesson_input.svelte';
	import SubjectBrowser from './subject_browser.svelte';

	export let lesson: Lesson | undefined;
	export let response_type: 'ja' | 'en' | 'locked' | undefined;
	export let response_value: string = '';
	export let question: string = '';
	export let next_lesson: () => MaybePromise<boolean>;
	export let show_correct: boolean;

	function toWordUpperCase(str: string) {
		return str.replace(/\w\S*/g, (txt) => {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	// Kanji = magenta
	// Vocabulary = purple
	// Radical = blue

	const color_map: Record<SubjectType, string> = {
		KANJI: '#ff00ff',
		RADICAL: '#0000ff',
		VOCABULARY: '#ba00ba'
	};
</script>

<div class="lesson_ui w-full flex flex-col items-center relative">
	<p class="absolute top-5 left-5">
		ID: {lesson ? lesson.subject_id : 'Loading...'}
	</p>
	<button class="absolute bottom-5 right-5 capitalize z-10">
		Reset {lesson ? toWordUpperCase(lesson.subject_type) : 'Loading...'} Progress
	</button>
	{#if lesson && show_correct}
		<div class="absolute bottom-0 left-0 w-full h-2/5">
			<SubjectBrowser subject={$subject_store.get(lesson.subject_id)?.subject} />
		</div>
	{/if}
	<div
		style:background-color={lesson ? color_map[lesson.subject_type] : '#99a1ad'}
		class="w-full p-6 pt-16 pb-16 flex justify-center duration-1000"
	>
		<slot />
	</div>

	<div
		class="text-center text-3xl text-white bg-slate-500 p-5 w-full grid grid-cols-1 grid-rows-1 overflow-hidden"
	>
		<p class="col-start-1 row-start-1">
			{question}
		</p>
	</div>

	{#if response_type}
		<LessonInput {response_type} bind:response_value submit_callback={next_lesson} />
	{/if}

	<!-- <div class="absolute bottom-5 right-5 flex">
		<button class="btn btn-secondary" on:click={next_lesson}>Skip</button>
	</div> -->
</div>
