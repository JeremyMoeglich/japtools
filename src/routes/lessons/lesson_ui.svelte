<script lang="ts">
import PrettyObj from '$lib/components/pretty_obj.svelte';

	import type { Lesson } from '$lib/scripts/universal/lesson_type';

	import type { SubjectType } from '@prisma/client';
	import type { MaybePromise } from '@sveltejs/kit/types/internal';

	export let lesson: Lesson | undefined;
	export let response_type: 'ja' | 'en' | 'locked' | undefined;
	export let response_value: string = '';
	export let question: string = '';
	export let next_lesson: () => MaybePromise<void>;

	// Kanji = magenta
	// Vocabulary = purple
	// Radical = blue

	const color_map: Record<SubjectType, string> = {
		KANJI: '#ff00ff',
		RADICAL: '#0000ff',
		VOCABULARY: '#800080'
	};
</script>

<div class="lesson_ui w-full flex flex-col items-center relative">
	<p class="absolute top-5 left-5">
		ID: {lesson?.subject_id}
	</p>
	<div
		style:background-color={lesson ? color_map[lesson.subject_type] : '#99a1ad'}
		class="w-full p-6 pt-16 pb-16 flex justify-center"
	>
		<slot />
	</div>
	<p class="text-center text-3xl text-white bg-slate-500 p-5 w-full">
		{question}
	</p>
	{#if response_type}
		<div class="flex mt-8 gap-4">
			<input
				on:keypress={(event) => {
					if (event.key === 'Enter') {
						next_lesson();
					}
				}}
				type="text"
				bind:value={response_value}
				class="input-primary text-black bg-white"
			/>
			<button class="btn btn-secondary" on:click={next_lesson}>Confirm</button>
			<PrettyObj obj={lesson} />
		</div>
	{/if}
	<!-- <div class="absolute bottom-5 right-5 flex">
		<button class="btn btn-secondary" on:click={next_lesson}>Skip</button>
	</div> -->
</div>

<style>
</style>
