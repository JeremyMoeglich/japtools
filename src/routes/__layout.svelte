<script lang="ts">
	import AuthPage from '$lib/components/auth_page.svelte';
	import { logged_in } from '$lib/scripts/frontend/auth/auth_state';
	import '../global.scss';
</script>

{#if $logged_in}
	<slot />
{:else}
	<AuthPage />
{/if}
