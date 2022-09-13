<script lang="ts">
	import type { TextAndMeaning } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import levenshtein from 'js-levenshtein';
	import { onMount } from 'svelte';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let current_lesson: TextAndMeaning<number>;
	export let current_input: string;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: data = current_lesson.required_data;
	$: chosen_meaning = choice(data.meanings);
	$: txt = data.to === 'meanings' ? data.text : chosen_meaning;
	$: question =
		data.to === 'meanings'
			? current_lesson.subject_type === 'KANJI'
				? `What does the Kanji ${txt} mean?`
				: current_lesson.subject_type === 'VOCABULARY'
				? `What does the vocabulary ${txt} mean?`
				: `What does the radical ${txt} stand for?`
			: current_lesson.subject_type === 'KANJI'
			? `Type the kanji that means ${txt}`
			: current_lesson.subject_type === 'VOCABULARY'
			? `Type ${txt} in Japanese`
			: error('Lessons going from meanings to radicals are not supported');
	$: correct_answer = data.to === 'meanings' ? data.meanings : [data.text];

	function compare(str1: string, str2: string): boolean {
		const similarity =
			1 - levenshtein(str1.toLowerCase(), str2.toLowerCase()) / Math.max(str1.length, str2.length);
		return similarity > 0.8;
	}

	function check_answer(current_input: string, correct_answer: string[]) {
		if (data.to === 'meanings') {
			correct = correct_answer.some((answer) => compare(answer, current_input));
		} else {
			correct = correct_answer.some(
				(answer) => answer.toLowerCase() === current_input.toLowerCase()
			);
		}
	}

	onMount(() => {
		check_answer(current_input, correct_answer);
		current_lesson = current_lesson;
	});

	$: check_answer(current_input, correct_answer);
</script>

<div class="relative">
	<h2 class=" text-white text-5xl">{txt}</h2>
	{#if show_correct}
		<div
			class="absolute top-20 w-max left-1/2 bg-red-500 text-white p-2 rounded-lg -translate-x-1/2 shadow-xl"
		>
			Incorrect - {correct_answer.join(', ')}
		</div>
	{/if}
</div>
