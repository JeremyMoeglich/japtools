import { dev, prerendering } from '$app/environment';

export const domain =
	prerendering || dev || import.meta.env.VITE_STATIC_URL !== 1
		? ''
		: 'https://japtools.moeglich.dev';
