<script lang="ts">
	import type { VocabularyKunOnYomi } from '$lib/scripts/universal/lesson_type';
	import type { ReadingType } from '@prisma/client';
	import { typed_keys, zip } from 'functional-utilities';

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
</script>

<div class="relative">
	<h2 class=" text-white text-5xl">
		{#each zipped as [char, type]}
			{#if type !== 'NONE'}
				{char}
			{:else}
				<span>
					<div>{char}</div>
					{#each typed_keys(reading_type_map) as reading_type}
						<div>
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
