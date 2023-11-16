/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check

import staticAdapter from '@sveltejs/adapter-static';
import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { optimizeImports } from 'carbon-preprocess-svelte';

const adapt = process.env.ADAPTER;

// @ts-ignore: implicit any
const getAdapters = (adapt) => {
	switch (adapt) {
		case 'node':
			return nodeAdapter();
		case 'static':
			process.env.PUBLIC_URL = 'https://japtools.moeglich.dev';
			return staticAdapter({
				fallback: 'index.html'
			});
		case 'vercel':
			return vercelAdapter({
				runtime: "edge",
				split: true
			});
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
		}),
		optimizeImports()
	],

	kit: {
		adapter: adapter
	}
};

export default config;
