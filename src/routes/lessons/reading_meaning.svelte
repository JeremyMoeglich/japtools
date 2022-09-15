<script lang="ts">
	import { compare } from '$lib/scripts/universal/compare';
	import type { ReadingAndMeaning } from '$lib/scripts/universal/lesson_type';
	import { onMount } from 'svelte';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let lesson: ReadingAndMeaning<number>;
	export let input: string;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: data = lesson.required_data;
	$: chosen_meaning = choice(data.meanings);
	$: chosen_reading = choice(data.readings);
	$: txt = data.to === 'meanings' ? chosen_reading : chosen_meaning;
	$: question =
		data.to === 'meanings'
			? `What does the reading ${txt} mean?`
			: lesson.subject_type === 'KANJI'
			? `Type the kanji reading of ${txt}`
			: `Type the reading of ${txt}`;

	$: correct_answer = data.to === 'meanings' ? data.meanings : data.readings;



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
		check_answer(input, correct_answer);
		lesson = lesson;
	});

	$: check_answer(input, correct_answer);
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
