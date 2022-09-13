<script lang="ts">
	import PrettyObj from '$lib/components/pretty_obj.svelte';
	import { login } from '$lib/scripts/frontend/auth/login';
	import { register } from '$lib/scripts/frontend/auth/register';

	let name = '';
	let email = '';
	let password = '';

	let login_error: unknown = '';
	let register_error: unknown = '';
</script>

<div class="side_alignment">
	<div class="form_outer">
		<h2>Sign in</h2>
		<p>Sign in to your account</p>
		<form
			on:submit|preventDefault={async () => {
				const login_result = await login(email, password);
				if (login_result !== undefined) {
					login_error = login_result.message;
				}
			}}
			class="form-control gap-3"
		>
			<label for="email" class="input-group">
				<span class="label-text">Email</span>
				<input type="email" name="email" bind:value={email} />
			</label>
			<label for="password" class="input-group">
				<span class="label-text">Password</span>
				<input type="password" name="password" bind:value={password} />
			</label>
			<button class="btn-primary" type="submit">Sign in</button>
		</form>
		<PrettyObj obj={login_error} />
	</div>
	<div class="form_outer">
		<h2>Sign up</h2>
		<p>Sign up for a new account</p>
		<form
			on:submit|preventDefault={async () => {
				const register_result = await register(name, email, password);
				if (register_result !== undefined) {
					register_error = register_result.message;
				}
			}}
		>
			<label for="name" class="input-group">
				<span class="label-text">Name</span>
				<input type="text" name="name" bind:value={name} />
			</label>
			<label for="email" class="input-group">
				<span class="label-text">Email</span>
				<input type="email" name="email" bind:value={email} />
			</label>
			<label for="password" class="input-group">
				<span class="label-text">Password</span>
				<input type="password" name="password" bind:value={password} />
			</label>
			<button class="btn-primary" type="submit">Sign up</button>
		</form>
		<PrettyObj obj={register_error} />
	</div>
</div>

<style lang="postcss">
	.side_alignment {
		display: flex;
		justify-content: space-evenly;
		height: 100%;
	}
</style>
