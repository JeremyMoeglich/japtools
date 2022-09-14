<script lang="ts">
	import { get_subject_type, type SubjectDataType } from '$lib/scripts/universal/datatypes';
	import TextRenderer from './text-renderer/text_renderer.svelte';

	export let subject: SubjectDataType | undefined;
	$: subject_type = subject ? get_subject_type(subject) : undefined;
	$: title = subject
		? [
				subject.meanings.find((meaning) => meaning.primary)?.meaning,
				subject.characters,
				subject_type?.toLowerCase()
		  ].filter((x) => x).join(' - ')
		: 'Loading...';
</script>

<div>
	<div>
		<h3>{title}</h3>
	</div>
	<div>
		{#if subject}
			<div>
				<h4>{subject_type === 'RADICAL' ? 'Names' : 'Meanings'}</h4>
				<ul>
					{#each subject.meanings as meaning}
						<li>{meaning.meaning}</li>
					{/each}
				</ul>
				<p>
					<TextRenderer html={subject.meaning_mnemonic} />
				</p>
			</div>
		{/if}
	</div>
</div>
