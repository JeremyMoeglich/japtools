<script lang="ts">
	import '../app.postcss';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import AuthPage from './auth_page.svelte';
	import { Book } from 'carbon-icons-svelte';
	import { is_loading_store } from '$lib/scripts/frontend/is_loading';
	import { Circle2 } from 'svelte-loading-spinners';
	import type { user_data_type } from '$lib/scripts/universal/datatypes';
	import { user_data_store } from '$lib/scripts/frontend/auth/user_data';
	import { get } from 'svelte/store';

	export let data: { user_data: user_data_type | undefined };

	$: user_data_store.set(data.user_data ?? get(user_data_store));
</script>


<div class="flex flex-col h-screen">
	<div class="navbar pl-5 gap-5 border-b-2 border-accent">
		<a class="text-3xl text-white" href="/">Japtools</a>
		{#if $user_data_store}
			<a href="/lessons">
				<div class="flex flex-col items-center">
					<Book size={24} />
					Lessons
				</div>
			</a>
		{/if}
	</div>
	<div class="content h-full">
		{#if $user_data_store}
			<slot />
		{:else}
			<AuthPage />
		{/if}
	</div>
</div>

{#if $is_loading_store}
	<div class="loading">
		<div class="spinner">
			<Circle2 />
		</div>
	</div>
{/if}

<SvelteToast />

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		position: fixed;
		width: 100vw;
		height: 100vh;
		top: 0px;
		left: 0px;
		z-index: 9999;
		background-color: rgba(128, 128, 128, 0.308);
	}
</style>
