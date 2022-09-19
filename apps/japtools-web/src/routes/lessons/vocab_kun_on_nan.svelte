<script lang="ts">
	import type { VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
	import type { ReadingType } from '@prisma/client';
	import { typed_keys, zip, range } from 'functional-utilities';

	export let current_lesson: VocabularyKunOnYomi<number>;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: question = `Chose what kind of reading each kanji in ${current_lesson.required_data.vocabulary} has`;

	$: zipped = zip([
		current_lesson.required_data.vocabulary.split(''),
		current_lesson.required_data.string_map
	]) as [string, typeof current_lesson.required_data.string_map[number]][];

	const reading_type_map: Record<ReadingType, string> = {
		KUNYOMI: 'Kunyomi',
		ONYOMI: 'Onyomi',
		NANORI: 'Nanori'
	};

	let selected_readings: ReadingType[] = [];

	$: selected_readings = selected_readings.concat(
		(range(selected_readings.length, zipped.length) as number[]).map(() => 'KUNYOMI')
	);

	$: correct = selected_readings.every((reading, index) => reading === zipped[index][1]);
</script>

<div class="relative">
	<h2 class=" text-white text-5xl">
		{#each zipped as [char, type], i}
			{#if type !== 'NONE'}
				{char}
			{:else}
				<span>
					<div>{char}</div>
					{#each typed_keys(reading_type_map) as reading_type}
						<div
							on:click={() => {
								selected_readings[i] = reading_type;
							}}
							class:correct={show_correct && reading_type === zipped[i][1]}
						>
							<p class="text-xl">
								{reading_type_map[reading_type]}
							</p>
						</div>
					{/each}
				</span>
			{/if}
		{/each}
	</h2>
</div>
