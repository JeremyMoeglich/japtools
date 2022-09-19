import { dev, prerendering } from '$app/environment';

export const domain = prerendering || dev ? '' : 'https://japtools.moeglich.dev';
