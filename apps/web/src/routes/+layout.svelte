<script lang="ts">
	import '../app.postcss';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import AuthPage from './auth_page.svelte';
	import { logged_in } from '$lib/scripts/frontend/auth/auth_state';
	import { check_token_and_login } from '$lib/scripts/frontend/auth/token_login';
	import { Home, Book } from 'carbon-icons-svelte';
	import { is_loading_store } from '$lib/scripts/frontend/is_loading';
	import { Circle2 } from 'svelte-loading-spinners';

	check_token_and_login();

	let testv: string = 'Nothing yet';
	(async () => {
		try {
			const res = await fetch('/api/test', {
				method: 'POST',
				body: JSON.stringify({ test: 'test' }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const data = await res.json();
			testv = JSON.stringify(data);
		} catch (e) {
			testv = 'Error';
		}
	})();
</script>

<div class="flex flex-col h-screen">
	<div class="navbar pl-5 gap-5 border-b-2 border-accent">
		<a class="text-3xl text-white" href="/">Japtools</a>
		{#if $logged_in}
			<a href="/">
				<div class="flex flex-col items-center">
					<div class="w-7 h-7">
						<Home />
					</div>
					Home
				</div>
			</a>
			<a href="/lessons">
				<div class="flex flex-col items-center">
					<div class="w-7 h-7">
						<Book />
					</div>
					Lessons
				</div>
			</a>
		{/if}
	</div>
	<p>
		{testv}
	</p>
	<div class="content h-full">
		{#if $logged_in}
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
