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
	<div>
		<h2>Sign in</h2>
		<p>Sign in to your account</p>
		<form
			on:submit|preventDefault={async () => {
				console.log('login');
				try {
					await login(email, password);
				} catch (error) {
					login_error = error;
				}
			}}
		>
			<div>
				<label for="email">Email</label>
				<input type="email" name="email" bind:value={email} />
			</div>
			<div>
				<label for="password">Password</label>
				<input type="password" name="password" bind:value={password} />
			</div>
			<button type="submit">Sign in</button>
		</form>
		<PrettyObj obj={login_error} />
	</div>
	<div>
		<h2>Sign up</h2>
		<p>Sign up for a new account</p>
		<form
			on:submit|preventDefault={async () => {
				try {
					await register(name, email, password);
				} catch (error) {
					register_error = error;
				}
			}}
		>
			<div>
				<label for="name">Name</label>
				<input type="text" name="name" bind:value={name} />
			</div>
			<div>
				<label for="email">Email</label>
				<input type="email" name="email" bind:value={email} />
			</div>
			<div>
				<label for="password">Password</label>
				<input type="password" name="password" bind:value={password} />
			</div>
			<button type="submit">Sign up</button>
		</form>
		<PrettyObj obj={register_error} />
	</div>
</div>

<style lang="scss">
	.side_alignment {
		display: flex;
		justify-content: space-evenly;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		& > * {
			display: flex;
			gap: 10px;
			justify-content: space-between;
		}
	}
	button {
		align-self: center;
		padding: 5px 10px;
	}
</style>
