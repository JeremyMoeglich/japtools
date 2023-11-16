<script lang="ts">
	import type { VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
	import type { ReadingType } from '@prisma/client/edge';
	import { typed_keys, zip, range } from 'functional-utilities';
	import { onDestroy } from 'svelte';
	import { onMount } from 'svelte';

	export let lesson: VocabularyKunOnYomi<number>;
	export let correct: boolean;
	export let question: string;
	export let show_correct: boolean;

	$: question = `Chose what kind of reading each kanji in ${lesson.required_data.vocabulary} has`;

	$: zipped = zip([lesson.required_data.vocabulary.split(''), lesson.required_data.string_map]) as [
		string,
		(typeof lesson.required_data.string_map)[number]
	][];

	const reading_type_map: Record<ReadingType, string> = {
		KUNYOMI: 'Kunyomi',
		ONYOMI: 'Onyomi',
		NANORI: 'Nanori'
	};

	let chosen_readings: (ReadingType | 'NONE')[] = [];

	$: chosen_readings = chosen_readings.concat(
		(range(chosen_readings.length, zipped.length) as number[]).map((i) =>
			(zipped[i]?.[1] ?? 'NONE') === 'NONE' ? 'NONE' : 'KUNYOMI'
		)
	);

	$: correct = chosen_readings.every(
		(reading, index) => reading === (zipped[index]?.[1] ?? 'NONE')
	);

	let element: HTMLElement | undefined;

	let selected_element: [number, number] = [0, 0];

	$: lesson, element?.focus(), (selected_element = [0, 0]);

	function column_active(index: number) {
		return zipped[index]?.[1] !== 'NONE';
	}

	function keypress(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			selected_element[1] = Math.min(selected_element[1] + 1, 2);
		} else if (event.key === 'ArrowUp') {
			selected_element[1] = Math.max(selected_element[1] - 1, 0);
		} else if (event.key === 'ArrowLeft') {
			for (let i = selected_element[0] - 1; i >= 0; i--) {
				selected_element[0] = i;
				if (column_active(i)) break;
			}
		} else if (event.key === 'ArrowRight') {
			for (let i = selected_element[0] + 1; i < zipped.length; i++) {
				selected_element[0] = i;
				if (column_active(i)) break;
			}
		}
		if (selected_element[1] === 0) {
			chosen_readings[selected_element[0]] = 'KUNYOMI';
		} else if (selected_element[1] === 1) {
			chosen_readings[selected_element[0]] = 'ONYOMI';
		} else if (selected_element[1] === 2) {
			chosen_readings[selected_element[0]] = 'NANORI';
		}
	}

	onMount(() => {
		window.addEventListener('keydown', keypress);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', keypress);
	});
</script>

{selected_element}

<div class="relative">
	<h2 class=" text-white text-5xl flex" bind:this={element}>
		{#each zipped as [char, type], i}
			{#if type === 'NONE'}
				{char}
			{:else}
				<span class="flex flex-col items-center cursor-pointer gap-2">
					<div>{char}</div>
					<div>
						{#each typed_keys(reading_type_map) as reading_type, i2}
							<div
								on:click={() => {
									chosen_readings[i] = reading_type;
								}}
								class="h-8 flex items-center justify-center p-1"
								class:correct={show_correct && reading_type === zipped[i][1]}
								class:chosen={chosen_readings[i] === reading_type}
								class:wrong={show_correct && reading_type !== zipped[i][1]}
								class:selected={selected_element[0] === i && selected_element[1] === i2}
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
	.chosen {
		background-color: blue;
	}
	.wrong.chosen {
		background-color: red;
	}

	.selected {
		border: 2px solid white;
	}
</style>
