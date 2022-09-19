import { prerendering } from '$app/environment';
import { PUBLIC_URL } from '$env/static/public';

export const domain = prerendering ? '' : PUBLIC_URL;
