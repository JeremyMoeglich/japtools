/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	interface Platform {
		env: {
			YOUR_KV_NAMESPACE: KVNamespace;
			YOUR_DURABLE_OBJECT_NAMESPACE: DurableObjectNamespace;
			DATABASE_URL: string;
		};
	}
	// interface Session {}
	// interface Stuff {}
}
