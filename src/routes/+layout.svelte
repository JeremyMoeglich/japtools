<script lang="ts">
	import '../app.postcss';
	import AuthPage from './auth_page.svelte';
	import { logged_in } from '$lib/scripts/frontend/auth/auth_state';
	import { check_token_and_login } from '$lib/scripts/frontend/auth/token_login';
	import IoMdHome from 'svelte-icons/io/IoMdHome.svelte';
	import IoIosBook from 'svelte-icons/io/IoIosBook.svelte';

	check_token_and_login();
</script>

<div class="flex flex-col h-screen">
	<div class="navbar pl-5 gap-5 border-b-2 border-accent">
		<a class="text-3xl text-white" href="/">Japtools</a>
		{#if $logged_in}
			<a href="/">
				<div class="flex flex-col items-center">
					<div class="w-7 h-7">
						<IoMdHome />
					</div>
					Home
				</div>
			</a>
			<a href="/lessons">
				<div class="flex flex-col items-center">
					<div class="w-7 h-7">
						<IoIosBook />
					</div>
					Lessons
				</div>
			</a>
		{/if}
	</div>
	<div class="content h-full">
		{#if $logged_in}
			<slot />
		{:else}
			<AuthPage />
		{/if}
	</div>
</div>
