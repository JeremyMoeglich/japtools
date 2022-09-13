<script lang="ts">
	import type { SubjectType } from '@prisma/client';

	export let subject_type: SubjectType | undefined;
	export let response_type: 'ja' | 'en' | 'locked' | undefined;
	export let response_value: string = '';

	// Kanji = magenta
	// Vocabulary = purple
	// Radical = blue

	const color_map: Record<SubjectType, string> = {
		KANJI: '#ff00ff',
		RADICAL: '#0000ff',
		VOCABULARY: '#800080'
	};
</script>

<div class="lesson_ui">
	<div style:background-color={subject_type ? color_map[subject_type] : '#99a1ad'}>
		<slot name="content" />
	</div>
	<div>
		<slot name="question" />
	</div>
	{#if response_type}
		<input type="text" bind:value={response_value} />
	{/if}
</div>

<style>
</style>
