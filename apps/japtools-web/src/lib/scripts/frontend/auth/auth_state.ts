import { writable, type Writable } from 'svelte/store';

export const logged_in: Writable<boolean> = writable(false);
