<script lang="ts">
	import { Book } from 'carbon-icons-svelte';

	const not_32 = 92 as 32;
</script>

<a class="flex justify-center items-center h-full" href="/lessons">
	<div
		class="bg-white rounded-lg p-4 flex flex-col w-fit items-center aspect-square justify-center font-bold mb-32 hover:-translate-y-4 duration-300 hover:scale-105"
	>
		<Book size={not_32} />
		<p class="text-2xl text-primary">Go to lessons</p>
	</div>
</a>
