<script lang="ts">
	import { TypingStateMachine } from '@keyfox/pochi';
	import type { MaybePromise } from '@sveltejs/kit';

	export let response_type: 'ja' | 'en' | 'locked';
	export let response_value: string;
	export let submit_callback: () => MaybePromise<boolean>;
	export let input_element: HTMLInputElement | undefined;

	let last_value: string;

	async function submit() {
		if (response_type === 'ja') {
			const stateMachine = new TypingStateMachine();
			stateMachine.supplyKeystrokes(response_value);
			const pending = stateMachine.pendingKeystrokes;
			if (pending.length > 0) {
				return;
			}
		}

		if (await submit_callback()) {
			response_value = '';
		}
	}

	function update_response_value(value: string) {
		if (response_type === 'ja') {
			const stateMachine = new TypingStateMachine();
			stateMachine.supplyKeystrokes(value);
			const text = stateMachine.text;
			last_value = response_value;
			response_value = text;
		} else if (response_type === 'en') {
			response_value = value;
		}
	}

	$: response_value !== last_value && update_response_value(response_value);
</script>

<div class="flex gap-4">
	<div>
		<input
			on:keypress={(e) => {
				if (e.key === 'Enter') {
					submit();
					e.preventDefault();
				}
				if (response_type === 'locked') {
					e.preventDefault();
				}
			}}
			type="text"
			bind:value={response_value}
			class="input-primary text-black bg-white"
			bind:this={input_element}
		/>
	</div>
	<button class="btn btn-secondary" on:click={submit}>Confirm</button>
</div>
