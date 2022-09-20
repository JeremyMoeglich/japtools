<script lang="ts">
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import { toast } from '@zerodevx/svelte-toast';

	import type { Lesson } from '$lib/scripts/universal/lesson_type';

	import type { SubjectType } from '@prisma/client/edge';
	import type { MaybePromise } from '@sveltejs/kit/types/internal';
	import LessonInput from './lesson_input.svelte';
	import SubjectBrowser from './subject_browser.svelte';
	import PrettyObj from '$lib/components/pretty_obj.svelte';

	export let lesson: Lesson | undefined;
	export let response_type: 'ja' | 'en' | 'locked' | undefined;
	export let response_value: string = '';
	export let question: string = '';
	export let confirm: () => MaybePromise<boolean>;
	export let show_correct: boolean;

	function toWordUpperCase(str: string) {
		return str.replace(/\w\S*/g, (txt) => {
			return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
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

	let input_element: HTMLInputElement | undefined;
	let next_button: HTMLButtonElement | undefined;

	$: next_button?.focus();
	$: input_element?.focus();

	$: subject = lesson ? $subject_store.get(lesson.subject_id)?.subject : undefined;
</script>

<div class="lesson_ui w-full flex flex-col items-center relative min-h-full justify-start">
	<p class="absolute top-5 left-5">
		ID: {lesson ? lesson.subject_id : 'Loading...'}
	</p>
	{#if lesson && lesson.skill_level !== 0}
		<button
			class="absolute bottom-5 right-5 capitalize z-10"
			on:click={async () => {
				if (!lesson) {
					return;
				}
				await update_subject_progress(lesson.subject_id, 0);
				toast.push('Progress reset', {
					duration: 2000,
					theme: {
						'--toastBackground': '#ff0000',
						'--toastColor': '#ffffff'
					}
				});
			}}
		>
			Reset {lesson ? toWordUpperCase(lesson.subject_type) : 'Loading...'} Progress
		</button>
	{/if}
	<div
		style:background-color={lesson ? color_map[lesson.subject_type] : '#99a1ad'}
		class="w-full p-6 pt-16 pb-16 flex justify-center duration-1000"
	>
		<slot />
	</div>
	{lesson?.subject_type}

	<div class="text-center text-3xl text-white bg-slate-500 p-5 w-full">
		<p class="col-start-1 row-start-1">
			{lesson?.skill_level === 0
				? `New ${toWordUpperCase(lesson.subject_type)} - ${subject?.characters}`
				: question}
		</p>
	</div>

	<div class="mt-8 mb-8">
		{#if response_type && lesson?.skill_level !== 0}
			<LessonInput
				{response_type}
				bind:response_value
				submit_callback={async () => {
					return await confirm();
				}}
				bind:input_element
			/>
		{:else if lesson?.skill_level === 0}
			<button on:click={confirm} bind:this={next_button}>Next</button>
		{/if}
		<PrettyObj obj={lesson} />
	</div>

	{#if lesson && (show_correct || lesson.skill_level === 0)}
		<div class="mt-auto">
			<SubjectBrowser {subject} />
		</div>
	{/if}

	<!-- <div class="absolute bottom-5 right-5 flex">
		<button class="btn btn-secondary" on:click={next_lesson}>Skip</button>
	</div> -->
</div>
