import { dev, building } from '$app/environment';

export const domain =
	building || dev || import.meta.env.VITE_STATIC_URL !== 1 ? '' : 'https://japtools.moeglich.dev';
