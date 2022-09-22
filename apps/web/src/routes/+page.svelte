<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { user_data_store } from '$lib/scripts/frontend/auth/user_data';
</script>

<div>
	<PrettyObj obj={$user_data_store} />
</div>

<a href="/lessons"> Go to lessons </a>
