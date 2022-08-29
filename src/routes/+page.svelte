<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { user_datas_store } from '$lib/scripts/frontend/auth/user_data';
</script>

<div>
	<PrettyObj obj={$user_datas_store} />
</div>

<a href="/lessons"> Go to lessons </a>
