<script lang="ts">
	import type { NewSubject } from '$lib/scripts/universal/lesson_type';
	import { toWordUpperCase } from '$lib/scripts/universal/word_uppercase';
	import TextRender from './text_render.svelte';

	export let lesson: NewSubject<number>;
	export let question: string;

	$: question =
		'text' in lesson.required_data
			? `New ${toWordUpperCase(lesson.subject_type)}: ${lesson.required_data.text}`
			: `New ${toWordUpperCase(lesson.subject_type)}`;
</script>

<TextRender
	type={'text' in lesson.required_data ? 'text' : 'url'}
	value={'text' in lesson.required_data
		? lesson.required_data.text
		: lesson.required_data.image_url}
/>
