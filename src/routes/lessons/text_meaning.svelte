<script lang="ts">
	import type { TextAndMeaning } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import levenshtein from 'js-levenshtein';
	import { onMount } from 'svelte';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let lesson: TextAndMeaning<number>;
	export let input: string;
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
	$: question =
		lesson.required_data.to === 'meanings'
			? lesson.subject_type === 'KANJI'
				? `What does the Kanji {} mean?`
				: lesson.subject_type === 'VOCABULARY'
				? `What does the vocabulary {} mean?`
				: `What does the radical {} stand for?`
			: lesson.subject_type === 'KANJI'
			? `Type the kanji that means {}`
			: lesson.subject_type === 'VOCABULARY'
			? `Type {} in Japanese`
			: error('Lessons going from meanings to radicals are not supported');
	$: correct_answer =
		lesson.required_data.to === 'meanings'
			? lesson.required_data.meanings
			: [lesson.required_data.text].concat(lesson.required_data.readings);

	function compare(str1: string, str2: string): boolean {
		const similarity =
			1 - levenshtein(str1.toLowerCase(), str2.toLowerCase()) / Math.max(str1.length, str2.length);
		return similarity > 0.8;
	}

	function check_answer(current_input: string, correct_answer: string[]) {
		if (lesson.required_data.to === 'meanings') {
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
	<h2 class=" text-white text-5xl">{shown}</h2>
	{#if show_correct}
		<div
			class="absolute top-20 w-max left-1/2 bg-red-500 text-white p-2 rounded-lg -translate-x-1/2 shadow-xl"
		>
			Incorrect - {correct_answer.join(', ')}
		</div>
	{/if}
</div>
