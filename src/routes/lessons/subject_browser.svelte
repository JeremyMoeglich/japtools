<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { get_subject_type, type SubjectDataType } from '$lib/scripts/universal/datatypes';
	import type { SubjectType } from '@prisma/client';
	import { sortBy } from 'lodash-es';
	import TextRenderer from './text-renderer/text_renderer.svelte';

	export let subject: SubjectDataType | undefined;
	$: subject_type = subject ? get_subject_type(subject) : undefined;
	$: title = subject
		? [
				subject.meanings.find((meaning) => meaning.primary)?.meaning,
				subject.characters,
				subject_type?.toLowerCase()
		  ]
				.filter((x) => x)
				.join(' - ')
		: 'Loading...';

	const tabs: Record<SubjectType | 'NONE', string[]> = {
		RADICAL: ['Meanings'],
		KANJI: ['Meanings', 'Readings'],
		VOCABULARY: ['Meanings', 'Readings'],
		NONE: []
	};
	$: active_tab = subject_type ? tabs[subject_type][0] : undefined;
</script>

<div class="bg-slate-700">
	<div>
		<h3>{title}</h3>
	</div>
	<div>
		{#if subject}
			<div>
				<div class="tabs">
					{#each tabs[subject_type ?? 'NONE'] as tab}
						<button
							class="tab tab-bordered clear "
							class:tab-active={active_tab === tab}
							on:click={() => {
								active_tab = tab;
							}}
						>
							{tab}
						</button>
					{/each}
				</div>
				<div>
					{#if active_tab === 'Meanings'}
						<ul class="p-4 pl-8 list-disc">
							{#each sortBy(subject.meanings, (v) => (v.primary ? 0 : 1)) as meaning}
								<li class:font-bold={meaning.primary}>{meaning.meaning}</li>
							{/each}
						</ul>
					{:else if active_tab === 'Readings' && 'reading_hint' in subject}
						<p>Onyomi:</p>
						<ul class="p-4 pl-8 list-disc">
							{#each sortBy( subject.readings.filter((v) => v.reading_type === 'ONYOMI'), (v) => (v.primary ? 0 : 1) ) as reading}
								<li class:font-bold={reading.primary}>{reading.reading}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
