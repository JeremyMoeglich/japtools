<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { get_subject_type, type SubjectDataType } from '$lib/scripts/universal/datatypes';
	import type { SubjectType } from '@prisma/client';
	import { sortBy } from 'lodash-es';

	export let subject: SubjectDataType | undefined;
	export let active_tab: string | undefined = undefined;
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

	const primary_sort: (v: { primary: boolean }) => number = (v) => (v.primary ? 0 : 1);
</script>

<div class="bg-slate-700 w-full h-full">
	<div>
		<h3 class="text-xl text-white p-2 font-bold">{title}</h3>
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
							{#each sortBy(subject.meanings, primary_sort) as meaning}
								<li class:font-bold={meaning.primary}>{meaning.meaning}</li>
							{/each}
						</ul>
					{:else if active_tab === 'Readings' && 'reading_hint' in subject}
						<h5>Onyomi:</h5>
						<ul class="p-4 pl-8 list-disc">
							{#each sortBy( subject.readings.filter((v) => v.reading_type === 'ONYOMI'), primary_sort ) as reading}
								<li class:font-bold={reading.primary}>{reading.reading}</li>
							{/each}
						</ul>
						<h5>Kunyomi:</h5>
						<ul class="p-4 pl-8 list-disc">
							{#each sortBy( subject.readings.filter((v) => v.reading_type === 'KUNYOMI'), primary_sort ) as reading}
								<li class:font-bold={reading.primary}>{reading.reading}</li>
							{/each}
						</ul>
						{#if subject.readings.find((v) => v.reading_type === 'NANORI')}
							<h5>Nanori:</h5>
							<ul class="p-4 pl-8 list-disc">
								{#each sortBy( subject.readings.filter((v) => v.reading_type === 'NANORI'), primary_sort ) as reading}
									<li class:font-bold={reading.primary}>{reading.reading}</li>
								{/each}
							</ul>
						{/if}
					{:else if active_tab === 'Readings' && 'context_sentences' in subject}
						<div>
							<ul class="p-4 pl-8 list-disc">
								{#each sortBy(subject.readings, primary_sort) as reading}
									<li class:font-bold={reading.primary}>{reading.reading}</li>
								{/each}
							</ul>
							<p>
								<h5>Mnemonic:</h5>
								{subject?.mmneonic}
							</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
