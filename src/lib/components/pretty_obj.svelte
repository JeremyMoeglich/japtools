<script lang="ts">
	// show an object in a pretty way
	export let obj: unknown;
</script>

{#if typeof obj === 'object'}
	{#if obj === null}
		<p>Null</p>
	{:else}
		<ul>
			{#each Object.entries(obj) as [str, sub_obj]}
				{'{'}
				<li>
					{str}: <svelte:self obj={sub_obj} />
				</li>
				{'}'}
			{/each}
		</ul>
	{/if}
{:else if typeof obj === 'string'}
	<p>{obj}</p>
{:else if typeof obj === 'number'}
	<p>{obj}</p>
{:else if typeof obj === 'boolean'}
	<p>{obj}</p>
{:else if typeof obj === 'symbol'}
	<p>{obj}</p>
{:else if typeof obj === 'function'}
	<p>{obj}</p>
{:else if typeof obj === 'undefined'}
	<p>Undefined</p>
{:else}
	<p>JSON: {JSON.stringify(obj)}</p>
{/if}

<style>
	ul {
		display: block;
		margin-left: 20px;
	}
	p {
		display: inline-block;
	}
</style>
