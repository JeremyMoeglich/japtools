<script lang="ts">
	import type { TextAndMeaning } from '$lib/scripts/universal/lesson_type';
	import { panic } from 'functional-utilities';
	import { compare } from '$lib/scripts/universal/compare';
	import { onMount } from 'svelte';
	import TitleRender from './title_render.svelte';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let lesson: TextAndMeaning<number>;
	export let input_value: string;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: chosen_meaning = choice(lesson.required_data.meanings);
	$: shown =
		lesson.required_data.to === 'meanings'
			? 'text' in lesson.required_data
				? {
						type: 'text',
						value: lesson.required_data.text
				  }
				: {
						value: lesson.required_data.image_url,
						type: 'image'
				  }
			: {
					type: 'text',
					value: chosen_meaning
			  };
	$: internal_question =
		lesson.required_data.to === 'meanings'
			? lesson.subject_type === 'KANJI'
				? `What does the Kanji || mean?`
				: lesson.subject_type === 'VOCABULARY'
				? `What does the vocabulary || mean?`
				: `What does this radical stand for?`
			: lesson.subject_type === 'KANJI'
			? `Type the kanji that means ||`
			: lesson.subject_type === 'VOCABULARY'
			? `Type || in Japanese`
			: panic('Lessons going from meanings to radicals are not supported');
	$: question =
		shown.type === 'text' ? internal_question.replace('||', shown.value) : internal_question;
	$: correct_answer =
		lesson.required_data.to === 'meanings'
			? lesson.required_data.meanings
			: [lesson.required_data.text].concat(lesson.required_data.readings);

	function check_answer(current_input: string, correct_answer: string[]) {
		if (lesson.required_data.to === 'meanings') {
			correct = correct_answer.some((answer) => compare(answer, current_input));
		} else {
			correct = correct_answer.some(
				(answer) => answer.toLowerCase().trim() === current_input.toLowerCase().trim()
			);
		}
	}

	onMount(() => {
		check_answer(input_value, correct_answer);
		lesson = lesson;
	});

	$: check_answer(input_value, correct_answer);
</script>

<div class="relative">
	<TitleRender type={shown.type === 'text' ? 'text' : 'url'} value={shown.value} />
	{#if show_correct}
		<div
			class="absolute top-20 w-max left-1/2 bg-red-500 text-white p-2 rounded-lg -translate-x-1/2 shadow-xl"
		>
			Incorrect - {correct_answer.join(', ')}
		</div>
	{/if}
</div>
