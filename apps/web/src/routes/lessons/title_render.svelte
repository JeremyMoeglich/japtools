<script lang="ts">
	export let type: 'text' | 'url';
	export let value: string;
</script>

<h2 class=" text-white text-5xl">
	{#if type === 'url'}
		<img src={value} class="w-12 h-12 invert" alt="symbol" />
	{:else}
		{value}
	{/if}
</h2>
