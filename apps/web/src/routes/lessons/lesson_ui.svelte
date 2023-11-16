<script lang="ts">
	import { subject_store } from '$lib/scripts/frontend/user/subject_store';
	import { update_subject_progress } from '$lib/scripts/frontend/user/update_subject_progress';
	import { toast } from '@zerodevx/svelte-toast';

	import type { Lesson } from '$lib/scripts/universal/lesson_type';

	import type { SubjectType } from '@prisma/client/edge';
	import LessonInput from './lesson_input.svelte';
	import SubjectBrowser from './subject_browser.svelte';
	import { get } from 'svelte/store';
	import { panic } from 'functional-utilities';
	import type { MaybePromise } from '@sveltejs/kit';
	//import PrettyObj from '$lib/components/pretty_obj.svelte';

	export let lesson: Lesson | undefined;
	export let response_type: 'ja' | 'en' | 'locked' | undefined;
	export let response_value: string = '';
	export let question: string = '';
	export let confirm: () => MaybePromise<boolean>;
	export let show_correct: boolean;

	// Kanji = magenta
	// Vocabulary = purple
	// Radical = blue

	const color_map: Record<SubjectType, string> = {
		KANJI: '#ff00ff',
		RADICAL: '#0000ff',
		VOCABULARY: 'rgb(12 157 78)'
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
			class="absolute top-5 right-5 clear capitalize z-10 btn btn-xs bg-gray-700 hover:bg-gray-500 opacity-60 hover:opacity-100"
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
				const subject_data =
					get(subject_store).get(lesson.subject_id)?.subject ?? panic('Subject not found');
				lesson = {
					lesson_type: 'new_subject',
					skill_level: 0,
					need_input: false,
					preferred_tab: 'Readings',
					subject_id: lesson.subject_id,
					required_data:
						'characters' in subject_data && subject_data.characters
							? {
									text: subject_data.characters
							  }
							: {
									image_url:
										'image_url' in subject_data
											? subject_data.image_url ?? panic('Image URL is undefined')
											: panic('Image URL not found')
							  },
					subject_type: lesson.subject_type
				};
			}}
		>
			Reset Progress
		</button>
	{/if}
	<div
		style:background-color={lesson ? color_map[lesson.subject_type] : '#99a1ad'}
		class="w-full p-6 pt-16 pb-16 flex justify-center duration-1000"
	>
		<slot />
	</div>
	<!-- {lesson?.subject_type} -->

	<div class="text-center text-3xl text-white bg-slate-500 p-5 w-full">
		<p class="col-start-1 row-start-1">
			{question}
		</p>
	</div>

	<div class="mt-8 mb-8">
		{#if response_type && lesson?.skill_level !== 0 && lesson?.need_input}
			<LessonInput
				{response_type}
				bind:response_value
				submit_callback={async () => {
					input_element?.focus();
					return await confirm();
				}}
				bind:input_element
			/>
		{:else if lesson && (lesson.skill_level === 0 || !lesson.need_input)}
			<button on:click={confirm} bind:this={next_button}
				>{lesson?.need_input ? 'Next' : 'Confirm'}</button
			>
		{/if}
		<!-- <PrettyObj obj={lesson} /> -->
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
