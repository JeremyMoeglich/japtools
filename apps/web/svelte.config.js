/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check

import staticAdapter from '@sveltejs/adapter-static';
import nodeAdapter from '@sveltejs/adapter-node';
import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import preprocess from 'svelte-preprocess';

const adapt = process.env.ADAPTER;
process.env.PUBLIC_URL = '';


// @ts-ignore
const getAdapters = (adapt) => {
	switch (adapt) {
		case 'node':
			return nodeAdapter();
		case 'static':
			process.env.PUBLIC_URL = 'https://japtools.moeglich.dev';
			return staticAdapter({
				fallback: 'index.html'
			});
		case 'cloudflare':
			return cloudflareAdapter();
		default:
			console.log('unknown adapter, using node');
			return nodeAdapter();
	}
};

const adapter = getAdapters(adapt);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true
		})
	],

	kit: {
		adapter: adapter
	}
};

export default config;
