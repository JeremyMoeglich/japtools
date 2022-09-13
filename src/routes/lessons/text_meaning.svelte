<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import type { TextAndMeaning } from '$lib/scripts/universal/lesson_type';
	import { error } from 'functional-utilities';
	import levenshtein from 'js-levenshtein';

	function choice<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	export let current_lesson: TextAndMeaning<number>;
	export let current_input: string;
	export let correct: boolean;

	$: data = current_lesson.required_data;
	$: chosen_meaning = choice(data.meanings);
	$: question =
		data.to === 'meanings'
			? current_lesson.subject_type === 'KANJI'
				? `What does the Kanji "${data.text}" mean?`
				: current_lesson.subject_type === 'VOCABULARY'
				? `What does the vocabulary "${data.text}" mean?`
				: `What does the radical ${data.text} stand for?`
			: current_lesson.subject_type === 'KANJI'
			? `Type the kanji that means "${chosen_meaning}"`
			: current_lesson.subject_type === 'VOCABULARY'
			? `Type "${chosen_meaning}" in Japanese`
			: error('Lessons going from meanings to radicals are not supported');
	$: correct_answer = data.to === 'meanings' ? [data.text] : data.meanings;

	function compare(str1: string, str2: string): boolean {
		const similarity = 1 - levenshtein(str1, str2) / Math.max(str1.length, str2.length);
		return similarity > 0.8;
	}

	function check_answer(current_input: string, correct_answer: string[]) {
		if (data.to === 'meanings') {
			correct = correct_answer.some((answer) => compare(answer, current_input));
		} else {
			correct = correct_answer.some((answer) => answer === current_input);
		}
	}
	$: check_answer(current_input, correct_answer);
</script>

<PrettyObj obj={data} />

<div>
	<h2 class="text-center">{question}</h2>
</div>
