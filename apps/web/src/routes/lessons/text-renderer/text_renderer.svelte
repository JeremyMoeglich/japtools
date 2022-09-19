<script lang="ts">
	import { error } from 'functional-utilities';
	import { z } from 'zod';

	export let html: string;

	const tag_schema = z.union([
		z.literal('ja'),
		z.literal('en'),
		z.literal('vocabulary'),
		z.literal('kanji'),
		z.literal('radical'),
		z.literal('reading')
	]);

	type Tag = z.infer<typeof tag_schema>;

	let sections: {
		type: 'none' | Tag;
		content: string;
	}[];

	$: sections = ((html) => {
		const domParser = new DOMParser();
		const doc = domParser.parseFromString(`<body>${html}</html>`, 'text/html');
		const children = Array.from(doc.body.childNodes);
		return children.map((child) => {
			if (child.nodeType === Node.TEXT_NODE) {
				return {
					type: 'none',
					content: child.textContent ?? ''
				};
			}
			return {
				type: tag_schema.parse(child.nodeName.toLowerCase()),
				content: child.textContent ?? ''
			};
		});
	})(html);
</script>

<div>
	{#each sections as section}
		{#if section.type === 'none'}
			<span>{section.content}</span>
		{:else if section.type === 'ja'}
			<span class="ja">{section.content}</span>
		{:else if section.type === 'en'}
			<span class="en">{section.content}</span>
		{:else if section.type === 'vocabulary'}
			<span class="vocabulary">{section.content}</span>
		{:else if section.type === 'kanji'}
			<span class="kanji">{section.content}</span>
		{:else if section.type === 'radical'}
			<span class="radical">{section.content}</span>
		{:else if section.type === 'reading'}
			<span class="reading">{section.content}</span>
		{:else}
			{error('Unreachable')}
		{/if}
	{/each}
</div>

<style>
	.ja {
		color: rgb(113, 113, 255);
	}
	.en {
		color: rgb(255, 113, 113);
	}
	.vocabulary {
		color: rgb(113, 255, 113);
	}
	.kanji {
		color: rgb(255, 255, 113);
	}
	.radical {
		color: rgb(210, 113, 255);
	}
</style>
