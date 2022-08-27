<script lang="ts">
	// show an object in a pretty way
	export let obj: unknown;
</script>

{#if obj instanceof Date}
	<p>{obj.toDateString()}</p>
{:else if typeof obj === 'object'}
	{#if obj === null}
		<p>Null</p>
	{:else}
		{'{'}
		<ul>
			{#each Object.entries(obj) as [str, sub_obj]}
				<li>
					{str}: <svelte:self obj={sub_obj} />
				</li>
			{/each}
		</ul>
		{'}'}
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
		margin: 3px;
		margin-left: 20px;
		padding: 0px;
		list-style-type: none;
	}
	p {
		display: inline-block;
		margin: 0px;
	}
</style>
