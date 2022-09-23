<script lang="ts">
	import type { VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
	import type { ReadingType } from '@prisma/client/edge';
	import { typed_keys, zip, range } from 'functional-utilities';

	export let lesson: VocabularyKunOnYomi<number>;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: question = `Chose what kind of reading each kanji in ${lesson.required_data.vocabulary} has`;

	$: zipped = zip([lesson.required_data.vocabulary.split(''), lesson.required_data.string_map]) as [
		string,
		typeof lesson.required_data.string_map[number]
	][];

	const reading_type_map: Record<ReadingType, string> = {
		KUNYOMI: 'Kunyomi',
		ONYOMI: 'Onyomi',
		NANORI: 'Nanori'
	};

	let selected_readings: (ReadingType | "NONE")[] = [];

	$: selected_readings = selected_readings.concat(
		(range(selected_readings.length, zipped.length) as number[]).map((i) => zipped[i][1] === "NONE" ? "NONE" : "KUNYOMI")
	);

	$: correct = selected_readings.every((reading, index) => reading === zipped[index][1]);
</script>

<div class="relative">
	<h2 class=" text-white text-5xl flex">
		{#each zipped as [char, type], i}
			{#if type === 'NONE'}
				{char}
			{:else}
				<span class="flex flex-col items-center cursor-pointer gap-2">
					<div>{char}</div>
					<div>
						{#each typed_keys(reading_type_map) as reading_type}
							<div
								on:click={() => {
									selected_readings[i] = reading_type;
								}}
								class="h-8 flex items-center justify-center p-1"
								class:correct={show_correct && reading_type === zipped[i][1]}
								class:selected={selected_readings[i] === reading_type}
								class:wrong={show_correct && reading_type !== zipped[i][1]}
							>
								<p class="text-sm">
									{reading_type_map[reading_type]}
								</p>
							</div>
						{/each}
					</div>
				</span>
			{/if}
		{/each}
	</h2>
</div>

<style>
	.correct {
		background-color: green;
	}
	.selected {
		background-color: blue;
	}
	.wrong.selected {
		background-color: red;
	}
</style>
