<script lang="ts">
	import AuthPage from './auth_page.svelte';
	import { logged_in } from '$lib/scripts/frontend/auth/auth_state';
	import '../global.scss';
	import { check_token_and_login } from '$lib/scripts/frontend/auth/token_login';

	check_token_and_login();
</script>

{#if $logged_in}
	<slot />
{:else}
	<AuthPage />
{/if}
